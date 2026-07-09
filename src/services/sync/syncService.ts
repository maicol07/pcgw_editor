import { reactive } from 'vue';
import { watchDebounced, useEventListener } from '@vueuse/core';
import { useWorkspaceStore, type Page } from '../../stores/workspace';
import { useUiStore } from '../../stores/ui';
import { aiConfig, PROVIDERS } from '../ai/aiConfig';
import { db } from '../../db';
import { GOOGLE_CLIENT_ID } from '../../config/api';
import { deriveKey, encrypt, decrypt, randomSalt } from './crypto';
import { driveProvider } from './GoogleDriveProvider';

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
    return {
        v: 1,
        updatedAt: Date.now(),
        deviceId: cachedDeviceId,
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

function applySnapshot(remote: any) {
    applying = true;
    try {
        const ws = useWorkspaceStore();
        const ui = useUiStore();

        // Merge pages by id (newer lastModified wins).
        const byId = new Map<string, Page>();
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
            ws.activePageId = remoteActive ? remote.activePageId : merged[0].id;
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
export async function push() {
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
        if (e?.message === 'Token expired') {
            syncState.connected = false;
            syncState.status = 'disconnected';
            syncState.error = 'Reconnect needed';
        } else {
            syncState.status = 'error';
            syncState.error = e?.message || String(e);
        }
    }
}

export async function pull() {
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
        if (e?.message === 'Token expired') {
            syncState.connected = false;
            syncState.status = 'disconnected';
            syncState.error = 'Reconnect needed';
        } else {
            syncState.status = 'error';
            syncState.error = e?.message || String(e);
        }
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
    watchDebounced(
        () => [
            ws.pages, ws.activePageId,
            ui.theme, ui.densityMode, ui.fontFamily,
            ui.autoUploadDescription, ui.autoReLogin, ui.navRailCollapsed,
            aiConfig.provider, aiConfig.model, { ...aiConfig.keys },
        ],
        () => { if (!applying) push(); },
        { debounce: 8000, deep: true },
    );
    const pullOnFocus = () => { if (syncState.unlocked && !document.hidden) pull(); };
    useEventListener(window, 'focus', pullOnFocus);
    useEventListener(document, 'visibilitychange', pullOnFocus);
}

// ---- public lifecycle ----

/** First connect on a device (or a new device): OAuth, then unlock with the passphrase. */
export async function connectAndUnlock(passphrase: string) {
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
    try {
        await driveProvider.ensureToken(); // silent
        syncState.connected = true;
        await pull();
        startWatchers();
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
