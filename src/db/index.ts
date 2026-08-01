import Dexie, { type Table } from 'dexie';
import type { CombineConfig } from '../models/GameData';

export interface LocalFile {
    id?: number;
    name: string;
    blob: Blob;
    size: number;
    type: string;
    status: 'local' | 'uploading' | 'uploaded' | 'error';
    description?: string;
    error?: string;
    pcgwUrl?: string;
    lastModified: number;
    combineConfig?: CombineConfig;
    originalBlob?: Blob;
    croppedBlob?: Blob;
}

// Key/value store for cloud-sync per-device state (crypto key, salt, tombstones, ...).
export interface SyncMeta {
    key: string;
    value: any;
}

// Wikitext of a specific PCGW revision. A revision never changes, so this is kept verbatim and never
// expires — it's what the 3-way merge uses as the common ancestor.
export interface RevisionText {
    revid: number;
    wikitext: string;
    fetchedAt: number;
}

export class AppDatabase extends Dexie {
    localFiles!: Table<LocalFile>;
    syncMeta!: Table<SyncMeta, string>;
    revisions!: Table<RevisionText, number>;

    constructor() {
        super('PCGWEditorDB');
        this.version(1).stores({
            localFiles: '++id, name, status, lastModified'
        });
        this.version(2).stores({
            localFiles: '++id, name, status, lastModified',
            syncMeta: 'key'
        });
        this.version(3).stores({
            localFiles: '++id, name, status, lastModified',
            syncMeta: 'key',
            revisions: 'revid, fetchedAt'
        });
    }
}

export const db = new AppDatabase();

const REVISION_KEEP = 50; // ponytail: plain count cap; switch to a size budget if pages get huge

export async function getRevisionText(revid: number): Promise<string | null> {
    try {
        return (await db.revisions.get(revid))?.wikitext ?? null;
    } catch {
        return null; // IndexedDB unavailable (private mode, quota) — callers fall back to the network
    }
}

export async function putRevisionText(revid: number, wikitext: string): Promise<void> {
    try {
        await db.revisions.put({ revid, wikitext, fetchedAt: Date.now() });
        const excess = (await db.revisions.count()) - REVISION_KEEP;
        if (excess > 0) {
            const stale = await db.revisions.orderBy('fetchedAt').limit(excess).primaryKeys();
            await db.revisions.bulkDelete(stale);
        }
    } catch {
        // best effort: losing the cache only costs one refetch
    }
}
