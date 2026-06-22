import { GOOGLE_CLIENT_ID } from '../../config/api';
import type { SyncProvider } from './SyncProvider';

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

class GoogleDriveProvider implements SyncProvider {
    private tokenClient: any = null;
    private accessToken = '';
    private tokenExpiry = 0;
    private fileId: string | null = null; // re-located each session; not persisted
    private refreshTimer: ReturnType<typeof setTimeout> | null = null;

    constructor() {
        try {
            const saved = JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');
            if (saved && Date.now() < saved.expiry) {
                this.accessToken = saved.token;
                this.tokenExpiry = saved.expiry;
            }
        } catch { /* ignore corrupt entry */ }
    }

    // Renew silently a bit before expiry so the token never lapses while the
    // Google session is alive — keeps the consent popup from ever reappearing.
    private scheduleRefresh() {
        if (this.refreshTimer) clearTimeout(this.refreshTimer);
        const delay = Math.max(this.tokenExpiry - Date.now() - 5 * 60_000, 1000);
        this.refreshTimer = setTimeout(() => {
            this.requestToken('').catch(() => {/* session gone; ensureToken will surface it */});
        }, delay);
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
        return new Promise((resolve, reject) => {
            this.tokenClient.callback = (resp: any) => {
                if (resp.error) return reject(new Error(resp.error));
                this.accessToken = resp.access_token;
                this.tokenExpiry = Date.now() + (resp.expires_in ? resp.expires_in * 1000 : 3600_000) - 60_000;
                localStorage.setItem(TOKEN_KEY, JSON.stringify({ token: this.accessToken, expiry: this.tokenExpiry }));
                this.scheduleRefresh();
                resolve(this.accessToken);
            };
            try {
                this.tokenClient.requestAccessToken({ prompt });
            } catch (e) {
                reject(e);
            }
        });
    }

    async connect(): Promise<void> {
        await this.initClient();
        await this.requestToken('consent');
    }

    async ensureToken(): Promise<string> {
        await this.initClient();
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            if (!this.refreshTimer) this.scheduleRefresh(); // arm refresh for a token restored from storage
            return this.accessToken;
        }
        return this.requestToken(''); // silent; rejects if consent is required
    }

    private async locate(token: string): Promise<void> {
        const q = encodeURIComponent(`name='${FILE_NAME}'`);
        const res = await fetch(
            `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id)`,
            { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) throw new Error(`Drive list failed: ${res.status}`);
        const data = await res.json();
        this.fileId = data.files?.[0]?.id ?? null;
    }

    async readBlob(): Promise<string | null> {
        const token = await this.ensureToken();
        if (this.fileId === null) await this.locate(token);
        if (!this.fileId) return null;
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${this.fileId}?alt=media`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 404) {
            this.fileId = null;
            return null;
        }
        if (!res.ok) throw new Error(`Drive download failed: ${res.status}`);
        return res.text();
    }

    async writeBlob(data: string): Promise<void> {
        const token = await this.ensureToken();
        if (this.fileId === null) await this.locate(token); // avoid creating duplicate files
        const metadata = this.fileId ? {} : { name: FILE_NAME, parents: ['appDataFolder'] };
        const body =
            `--${BOUNDARY}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
            `--${BOUNDARY}\r\nContent-Type: application/octet-stream\r\n\r\n${data}\r\n` +
            `--${BOUNDARY}--`;
        const url = this.fileId
            ? `https://www.googleapis.com/upload/drive/v3/files/${this.fileId}?uploadType=multipart&fields=id`
            : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id`;
        const res = await fetch(url, {
            // ponytail: Drive's upload endpoint CORS rejects PATCH preflight; POST + override is the supported path
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': `multipart/related; boundary=${BOUNDARY}`,
                ...(this.fileId ? { 'X-HTTP-Method-Override': 'PATCH' } : {}),
            },
            body,
        });
        if (!res.ok) throw new Error(`Drive upload failed: ${res.status}`);
        const out = await res.json();
        if (out.id) this.fileId = out.id;
    }

    disconnect(): void {
        const token = this.accessToken;
        if (token && (window as any).google?.accounts?.oauth2) {
            try {
                (window as any).google.accounts.oauth2.revoke(token);
            } catch { /* best effort */ }
        }
        if (this.refreshTimer) { clearTimeout(this.refreshTimer); this.refreshTimer = null; }
        this.accessToken = '';
        this.tokenExpiry = 0;
        this.fileId = null;
        localStorage.removeItem(TOKEN_KEY);
    }
}

export const driveProvider: SyncProvider = new GoogleDriveProvider();
