import { GOOGLE_CLIENT_ID } from '../../config/api';

// Google Drive appDataFolder: a per-app hidden folder, invisible in the user's Drive file list.
// Auth is browser-only via Google Identity Services (token flow, no client secret, no backend).
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const FILE_NAME = 'pcgw-editor-sync.enc';
const GIS_SRC = 'https://accounts.google.com/gsi/client';
const BOUNDARY = 'pcgw-sync-boundary'; // safe: payload is base64+JSON, never contains this

let gisLoaded: Promise<void> | null = null;
function loadGis(): Promise<void> {
    if (gisLoaded) return gisLoaded;
    gisLoaded = new Promise((resolve, reject) => {
        if ((window as any).google?.accounts?.oauth2) return resolve();
        const s = document.createElement('script');
        s.src = GIS_SRC;
        s.async = true;
        s.defer = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load Google Identity Services'));
        document.head.appendChild(s);
    });
    return gisLoaded;
}

const TOKEN_KEY = 'pcgw-gdrive-token'; // {token, expiry}; access tokens are short-lived (~1h)

/** Thrown when the remote blob moved on since our last read (Drive answered 412 to If-Match). */
export class PreconditionFailedError extends Error {
    constructor() {
        super('Remote sync data changed since it was last read');
        this.name = 'PreconditionFailedError';
    }
}

// The storage backend for the encrypted sync blob. If a second backend is ever needed,
// extract an interface then — not before.
class GoogleDriveProvider {
    private tokenClient: any = null;
    private accessToken = '';
    private tokenExpiry = 0;
    private fileId: string | null = null; // re-located each session; not persisted
    private tokenPromise: Promise<string> | null = null;
    // Drive's revision of the blob we last read. Sent back as If-Match on write so a concurrent
    // edit from another device is rejected with 412 instead of being silently overwritten.
    private headRevisionId: string | null = null;

    constructor() {
        try {
            const saved = JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');
            if (saved && Date.now() < saved.expiry) {
                this.accessToken = saved.token;
                this.tokenExpiry = saved.expiry;
            }
        } catch { /* ignore corrupt entry */ }
    }

    private async initClient() {
        if (!GOOGLE_CLIENT_ID) throw new Error('Google client ID not configured');
        await loadGis();
        if (!this.tokenClient) {
            this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: SCOPE,
                callback: () => {}, // set per request
            });
        }
    }

    private requestToken(prompt: '' | 'consent'): Promise<string> {
        if (this.tokenPromise) return this.tokenPromise;
        this.tokenPromise = new Promise((resolve, reject) => {
            this.tokenClient.callback = (resp: any) => {
                this.tokenPromise = null;
                if (resp.error) return reject(new Error(resp.error));
                this.accessToken = resp.access_token;
                this.tokenExpiry = Date.now() + (resp.expires_in ? resp.expires_in * 1000 : 3600_000) - 60_000;
                localStorage.setItem(TOKEN_KEY, JSON.stringify({ token: this.accessToken, expiry: this.tokenExpiry }));
                resolve(this.accessToken);
            };
            this.tokenClient.error_callback = (err: any) => {
                this.tokenPromise = null;
                reject(new Error(err?.message || err?.type || 'Token request failed'));
            };
            try {
                this.tokenClient.requestAccessToken({ prompt });
            } catch (e) {
                this.tokenPromise = null;
                reject(e);
            }
        });
        return this.tokenPromise;
    }

    async connect(): Promise<void> {
        await this.initClient();
        await this.requestToken('consent');
    }

    async ensureToken(): Promise<string> {
        await this.initClient();
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }
        try {
            // Attempt silent token refresh without interactive prompt
            return await this.requestToken('');
        } catch {
            throw new Error('Token expired');
        }
    }

    async reconnect(): Promise<void> {
        await this.initClient();
        try {
            await this.requestToken('');
        } catch {
            await this.requestToken('consent');
        }
    }

    /**
     * Single place that talks to Drive. Retries once on 401 after forcing a fresh token, which is
     * what the two copies of this logic in readBlob/writeBlob used to do — except writeBlob built
     * its URL and body *before* the retry, so a re-locate that discovered the file mid-retry still
     * POSTed to the "create" endpoint and produced a duplicate.
     *
     * `build` is therefore a callback: it is re-evaluated after the token refresh, so the retried
     * request reflects the current fileId.
     */
    private async authedFetch(build: (token: string) => { url: string; init?: RequestInit }): Promise<Response> {
        let token = await this.ensureToken();
        const first = build(token);
        let res = await fetch(first.url, first.init);
        if (res.status !== 401) return res;

        this.accessToken = '';
        this.tokenExpiry = 0;
        token = await this.ensureToken();
        const retry = build(token);
        return fetch(retry.url, retry.init);
    }

    private async locate(token: string): Promise<void> {
        const q = encodeURIComponent(`name='${FILE_NAME}'`);
        const res = await fetch(
            `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,headRevisionId)`,
            { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) throw new Error(`Drive list failed: ${res.status}`);
        const data = await res.json();
        this.fileId = data.files?.[0]?.id ?? null;
        this.headRevisionId = data.files?.[0]?.headRevisionId ?? null;
    }

    async readBlob(): Promise<string | null> {
        if (this.fileId === null) await this.locate(await this.ensureToken());
        if (!this.fileId) return null;

        const res = await this.authedFetch((token) => ({
            url: `https://www.googleapis.com/drive/v3/files/${this.fileId}?alt=media`,
            init: { headers: { Authorization: `Bearer ${token}` } },
        }));

        if (res.status === 404) {
            this.fileId = null;
            this.headRevisionId = null;
            return null;
        }
        if (!res.ok) throw new Error(`Drive download failed: ${res.status}`);
        return res.text();
    }

    async writeBlob(data: string): Promise<void> {
        if (this.fileId === null) await this.locate(await this.ensureToken()); // avoid duplicate files

        const body = (fileId: string | null) =>
            `--${BOUNDARY}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
            `${JSON.stringify(fileId ? {} : { name: FILE_NAME, parents: ['appDataFolder'] })}\r\n` +
            `--${BOUNDARY}\r\nContent-Type: application/octet-stream\r\n\r\n${data}\r\n` +
            `--${BOUNDARY}--`;

        const res = await this.authedFetch((token) => ({
            // ponytail: Drive's upload endpoint CORS rejects PATCH preflight; POST + override is the supported path
            url: this.fileId
                ? `https://www.googleapis.com/upload/drive/v3/files/${this.fileId}?uploadType=multipart&fields=id,headRevisionId`
                : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,headRevisionId`,
            init: {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': `multipart/related; boundary=${BOUNDARY}`,
                    ...(this.fileId ? { 'X-HTTP-Method-Override': 'PATCH' } : {}),
                    // Reject the write if another device has published a newer revision since our
                    // last read. Without this, sync was a blind last-write-wins over the whole
                    // snapshot: two devices editing in parallel silently discarded each other.
                    ...(this.fileId && this.headRevisionId ? { 'If-Match': this.headRevisionId } : {}),
                },
                body: body(this.fileId),
            },
        }));

        if (res.status === 412) {
            // Stale. Clear fileId as well as the revision: readBlob only refreshes headRevisionId
            // via locate(), so keeping the id would make the next read leave the revision null and
            // the following write would go out with no If-Match at all — silently disabling the
            // guard exactly when it just fired. locate() finds the file by name, so this cannot
            // create a duplicate.
            this.fileId = null;
            this.headRevisionId = null;
            throw new PreconditionFailedError();
        }
        if (!res.ok) throw new Error(`Drive upload failed: ${res.status}`);
        const out = await res.json();
        if (out.id) this.fileId = out.id;
        this.headRevisionId = out.headRevisionId ?? null;
    }

    disconnect(): void {
        const token = this.accessToken;
        if (token && (window as any).google?.accounts?.oauth2) {
            try {
                (window as any).google.accounts.oauth2.revoke(token);
            } catch { /* best effort */ }
        }
        this.accessToken = '';
        this.tokenExpiry = 0;
        this.fileId = null;
        localStorage.removeItem(TOKEN_KEY);
    }
}

export const driveProvider = new GoogleDriveProvider();
