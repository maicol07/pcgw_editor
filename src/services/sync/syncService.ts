import { reactive } from 'vue';
import { watchDebounced, useEventListener } from '@vueuse/core';
import { useWorkspaceStore, type Page } from '../../stores/workspace';
import { useUiStore } from '../../stores/ui';
import { aiConfig, PROVIDERS } from '../ai/aiConfig';
import { db } from '../../db';
import { GOOGLE_CLIENT_ID } from '../../config/api';
import { deriveKey, encrypt, decrypt, randomSalt } from './crypto';
import { driveProvider, PreconditionFailedError } from './GoogleDriveProvider';
import { snapshotSchema, MIN_PASSPHRASE_LENGTH } from './snapshotSchema';

const AUTH_KEY = 'pcgw_auth_data_v2';
const PRUNE_MS = 30 * 24 * 3600 * 1000; // drop tombstones after 30 days

type Status = 'idle' | 'syncing' | 'error' | 'disconnected';

export const syncState = reactive({
    available: !!GOOGLE_CLIENT_ID && typeof window !== 'undefined',
    connected: false, // token valid this session
    unlocked: false, // crypto key present (configured on this device)
    status: 'disconnected' as Status,
    lastSyncedAt: 0,
    error: '',
});

// Per-device state, persisted in db.syncMeta.
let cachedKey: CryptoKey | null = null;
let cachedSalt: string | null = null;
let cachedDeviceId = '';
let cachedKnownIds: string[] = [];
let cachedTombstones: Record<string, number> = {};

let applying = false; // suppress the push watcher while applying a pulled snapshot
let watchersStarted = false;

// ---- syncMeta helpers ----
async function getMeta<T>(key: string): Promise<T | undefined> {
    return (await db.syncMeta.get(key))?.value as T | undefined;
}

async function persistState() {
    await db.syncMeta.bulkPut([
        { key: 'cryptoKey', value: cachedKey },
        { key: 'salt', value: cachedSalt },
        { key: 'unlocked', value: syncState.unlocked },
        { key: 'deviceId', value: cachedDeviceId },
        { key: 'knownIds', value: cachedKnownIds },
        { key: 'tombstones', value: cachedTombstones },
        { key: 'lastSyncedAt', value: syncState.lastSyncedAt },
    ]);
}

// ---- snapshot gather / apply ----
function gatherSnapshot() {
    const ws = useWorkspaceStore();
    const ui = useUiStore();
    let auth: any = null;
    try { auth = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch { /* ignore */ }
    // Never let the PCGW password leave the device, even inside the encrypted envelope: the blob
    // lands in Google Drive and gets decrypted onto every other device the user syncs.
    if (auth && typeof auth === 'object') { auth = { ...auth }; delete auth.password; }
    return {
        v: 1,
        updatedAt: Date.now(),
        deviceId: cachedDeviceId,
        // NB: JSON round-trip, not structuredClone — ws.pages is a Vue reactive proxy and
        // structuredClone throws DataCloneError on it. It also drops undefined optional
        // fields exactly as the encrypted JSON payload would, so it is the right primitive here.
        pages: JSON.parse(JSON.stringify(ws.pages)) as Page[],
        activePageId: ws.activePageId,
        settings: {
            theme: ui.theme,
            densityMode: ui.densityMode,
            fontFamily: ui.fontFamily,
            autoUploadDescription: ui.autoUploadDescription,
            autoReLogin: ui.autoReLogin,
            navRailCollapsed: ui.navRailCollapsed,
        },
        ai: { provider: aiConfig.provider, model: aiConfig.model, keys: { ...aiConfig.keys } },
        auth,
        tombstones: cachedTombstones,
    };
}

function applySnapshot(rawRemote: unknown) {
    // Decryption proves possession of the passphrase, not that the payload is well-formed.
    // Validate before writing any of it into stores, aiConfig or localStorage.
    const parsed = snapshotSchema.safeParse(rawRemote);
    if (!parsed.success) {
        syncState.error = 'Remote snapshot is malformed and was ignored';
        console.error('Rejected malformed sync snapshot:', parsed.error.issues);
        return;
    }
    const remote = parsed.data;

    applying = true;
    try {
        const ws = useWorkspaceStore();
        const ui = useUiStore();

        // Merge pages by id (newer lastModified wins).
        const byId = new Map<string, Page>();
        // JSON round-trip for the same reason as in gatherSnapshot: reactive proxy.
        for (const p of JSON.parse(JSON.stringify(ws.pages)) as Page[]) byId.set(p.id, p);
        for (const rp of (remote.pages || []) as Page[]) {
            const ex = byId.get(rp.id);
            if (!ex || (rp.lastModified || 0) > (ex.lastModified || 0)) byId.set(rp.id, rp);
        }

        // Merge tombstones (keep newest ts per id) and drop pages they bury.
        const tomb: Record<string, number> = { ...cachedTombstones };
        for (const [id, ts] of Object.entries(remote.tombstones || {})) {
            tomb[id] = Math.max(tomb[id] || 0, ts as number);
        }
        for (const [id, ts] of Object.entries(tomb)) {
            const p = byId.get(id);
            if (p && (p.lastModified || 0) <= ts) byId.delete(id);
        }
        cachedTombstones = tomb;

        const merged = [...byId.values()];
        ws.pages = merged;
        if (merged.length && (!ws.activePageId || !merged.find(p => p.id === ws.activePageId))) {
            const remoteActive = merged.find(p => p.id === remote.activePageId);
            ws.activePageId = remoteActive ? remoteActive.id : merged[0].id;
        }
        cachedKnownIds = merged.map(p => p.id);

        // Settings/keys/auth: whole-object last-write-wins, only if remote is newer.
        if ((remote.updatedAt || 0) > syncState.lastSyncedAt) {
            const s = remote.settings || {};
            if (s.theme) ui.theme = s.theme;
            if (s.densityMode) ui.densityMode = s.densityMode;
            if (s.fontFamily) ui.fontFamily = s.fontFamily;
            if (typeof s.autoUploadDescription === 'boolean') ui.autoUploadDescription = s.autoUploadDescription;
            if (typeof s.autoReLogin === 'boolean') ui.autoReLogin = s.autoReLogin;
            if (typeof s.navRailCollapsed === 'boolean') ui.navRailCollapsed = s.navRailCollapsed;
            if (remote.ai) {
                if (remote.ai.keys) for (const p of PROVIDERS) if (remote.ai.keys[p] != null) aiConfig.keys[p] = remote.ai.keys[p];
                if (remote.ai.provider) aiConfig.provider = remote.ai.provider;
                if (remote.ai.model) aiConfig.model = remote.ai.model;
            }
            // Auth takes effect on next reload (pcgwAuth reads this key at startup).
            if (remote.auth) localStorage.setItem(AUTH_KEY, JSON.stringify(remote.auth));
        }
    } finally {
        applying = false;
    }
}

// Record deletions (ids known last push but gone now) and prune old tombstones.
function refreshTombstones(currentIds: string[]) {
    const now = Date.now();
    const present = new Set(currentIds);
    for (const id of cachedKnownIds) if (!present.has(id)) cachedTombstones[id] = now;
    cachedKnownIds = currentIds;
    for (const [id, ts] of Object.entries(cachedTombstones)) if (now - ts > PRUNE_MS) delete cachedTombstones[id];
}

// ---- push / pull ----

// Single-file promise chain. pull() and push() both read-modify-write the whole snapshot, and they
// are triggered from several places at once (an 8s debounced watcher, syncNow, window activity), so
// running two concurrently meant one could overwrite the other's merge result.
let queue: Promise<unknown> = Promise.resolve();
function serialize<T>(task: () => Promise<T>): Promise<T> {
    // `.then(task, task)` would hand the *previous* task's resolved value to this one as its first
    // argument — harmless while everything resolves to undefined, but pushNow(allowMergeRetry) would
    // silently receive it and disable the merge retry. Wrap so the task is always called with none.
    const run = queue.then(() => task(), () => task());
    queue = run.catch(() => {}); // a failed task must not poison the chain
    return run;
}

function reportSyncError(e: any) {
    if (e?.message === 'Token expired') {
        syncState.connected = false;
        syncState.status = 'disconnected';
        syncState.error = 'Reconnect needed';
    } else {
        syncState.status = 'error';
        syncState.error = e?.message || String(e);
    }
}

export function push() {
    return serialize(pushNow);
}

async function pushNow(allowMergeRetry = true): Promise<void> {
    if (!syncState.unlocked || !cachedKey || applying) return;
    syncState.status = 'syncing';
    try {
        const ws = useWorkspaceStore();
        refreshTombstones((ws.pages as Page[]).map(p => p.id));
        const snap = gatherSnapshot();
        const { iv, ct } = await encrypt(cachedKey, JSON.stringify(snap));
        await driveProvider.writeBlob(JSON.stringify({ v: 1, salt: cachedSalt, iv, ct }));
        syncState.lastSyncedAt = snap.updatedAt;
        syncState.connected = true;
        await persistState();
        syncState.status = 'idle';
        syncState.error = '';
    } catch (e: any) {
        if (e instanceof PreconditionFailedError && allowMergeRetry) {
            // Another device wrote first. Merge its snapshot in, then publish the union — rather
            // than overwriting their work or dropping ours. Once only: if the second attempt also
            // collides we surface the error instead of looping against a busy peer.
            try {
                await pullNow();
                await pushNow(false);
                return;
            } catch (retryError: any) {
                reportSyncError(retryError);
                return;
            }
        }
        reportSyncError(e);
    }
}

export function pull() {
    return serialize(pullNow);
}

async function pullNow(): Promise<void> {
    if (!syncState.unlocked || !cachedKey || applying) return;
    syncState.status = 'syncing';
    try {
        const raw = await driveProvider.readBlob();
        if (raw) {
            const env = JSON.parse(raw);
            const remote = JSON.parse(await decrypt(cachedKey, env.iv, env.ct));
            applySnapshot(remote);
            syncState.lastSyncedAt = Math.max(syncState.lastSyncedAt, remote.updatedAt || 0);
            await persistState();
        }
        syncState.connected = true;
        syncState.status = 'idle';
        syncState.error = '';
    } catch (e: any) {
        reportSyncError(e);
    }
}

export async function syncNow() {
    await pull();
    await push();
}

export async function reconnectSync() {
    syncState.status = 'syncing';
    syncState.error = '';
    try {
        await driveProvider.reconnect();
        syncState.connected = true;
        syncState.status = 'idle';
        await pull();
    } catch (e: any) {
        syncState.connected = false;
        syncState.status = 'error';
        syncState.error = e?.message || String(e);
        throw e;
    }
}

function startWatchers() {
    if (watchersStarted) return;
    watchersStarted = true;
    const ws = useWorkspaceStore();
    const ui = useUiStore();
    // A cheap fingerprint instead of `deep: true` over ws.pages. The deep watcher walked the full
    // wikitext of every page on every keystroke, before the debounce had a chance to help; page
    // identity plus lastModified is all the push actually keys off.
    watchDebounced(
        () => [
            ws.pages.map((p: Page) => `${p.id}:${p.lastModified}`).join('|'),
            ws.activePageId,
            ui.theme, ui.densityMode, ui.fontFamily,
            ui.autoUploadDescription, ui.autoReLogin, ui.navRailCollapsed,
            aiConfig.provider, aiConfig.model,
            // Key *values*, not just presence: editing an existing key must still trigger a push.
            PROVIDERS.map(p => aiConfig.keys[p] || '').join(' '),
        ].join(' '),
        () => { if (!applying) push(); },
        { debounce: 8000 },
    );
    const pullOnFocus = () => { if (syncState.unlocked && !document.hidden) pull(); };
    useEventListener(window, 'focus', pullOnFocus);
    useEventListener(document, 'visibilitychange', pullOnFocus);

    // Reconnect attempt on user activity, throttled. This used to fire a Drive request plus an
    // AES decrypt on *every* click while disconnected, with the error swallowed so the user saw
    // nothing. pointerdown+throttle keeps the retry without the storm.
    let lastReconnectAttempt = 0;
    const RECONNECT_THROTTLE_MS = 30_000;
    const pullOnActivity = () => {
        if (!syncState.unlocked || syncState.connected || syncState.status === 'syncing') return;
        const now = Date.now();
        if (now - lastReconnectAttempt < RECONNECT_THROTTLE_MS) return;
        lastReconnectAttempt = now;
        pull();
    };
    useEventListener(window, 'pointerdown', pullOnActivity);
}

// ---- public lifecycle ----

/** First connect on a device (or a new device): OAuth, then unlock with the passphrase. */
export async function connectAndUnlock(passphrase: string) {
    // PBKDF2 at 200k iterations buys nothing against a guessable passphrase, and this one protects
    // the wiki session plus all three AI keys.
    if (passphrase.length < MIN_PASSPHRASE_LENGTH) {
        syncState.status = 'error';
        syncState.error = `Passphrase must be at least ${MIN_PASSPHRASE_LENGTH} characters`;
        throw new Error(syncState.error);
    }
    syncState.status = 'syncing';
    syncState.error = '';
    try {
        await driveProvider.connect();
        syncState.connected = true;
        const raw = await driveProvider.readBlob();
        if (raw) {
            const env = JSON.parse(raw);
            const key = await deriveKey(passphrase, env.salt);
            const remote = JSON.parse(await decrypt(key, env.iv, env.ct)); // throws on wrong passphrase
            cachedKey = key;
            cachedSalt = env.salt;
            applySnapshot(remote);
            syncState.lastSyncedAt = remote.updatedAt || 0;
        } else {
            cachedSalt = randomSalt();
            cachedKey = await deriveKey(passphrase, cachedSalt);
        }
        syncState.unlocked = true;
        await persistState();
        if (!raw) await push(); // seed the cloud with local state
        startWatchers();
        syncState.status = 'idle';
    } catch (e: any) {
        const wrongKey = e?.name === 'OperationError';
        syncState.status = 'error';
        syncState.error = wrongKey ? 'Wrong passphrase or corrupted data.' : (e?.message || String(e));
        throw e;
    }
}

/** Called once on app start: silently resume if this device was already configured. */
export async function start() {
    if (!syncState.available) return;
    cachedDeviceId = (await getMeta<string>('deviceId')) || crypto.randomUUID();
    cachedKey = (await getMeta<CryptoKey>('cryptoKey')) || null;
    cachedSalt = (await getMeta<string>('salt')) || null;
    cachedKnownIds = (await getMeta<string[]>('knownIds')) || [];
    cachedTombstones = (await getMeta<Record<string, number>>('tombstones')) || {};
    syncState.lastSyncedAt = (await getMeta<number>('lastSyncedAt')) || 0;
    syncState.unlocked = !!(await getMeta<boolean>('unlocked')) && !!cachedKey;
    await db.syncMeta.put({ key: 'deviceId', value: cachedDeviceId });

    if (!syncState.unlocked) {
        syncState.status = 'disconnected';
        return;
    }
    startWatchers();
    try {
        await driveProvider.ensureToken(); // silent
        syncState.connected = true;
        await pull();
    } catch {
        // Token expired/revoked: stay configured but ask the user to reconnect.
        syncState.connected = false;
        syncState.status = 'disconnected';
        syncState.error = 'Reconnect needed';
    }
}

export async function disconnect() {
    driveProvider.disconnect();
    cachedKey = null;
    cachedSalt = null;
    syncState.unlocked = false;
    syncState.connected = false;
    syncState.status = 'disconnected';
    syncState.error = '';
    await db.syncMeta.bulkDelete(['cryptoKey', 'salt', 'unlocked', 'knownIds', 'tombstones', 'lastSyncedAt']);
}
