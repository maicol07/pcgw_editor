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

export interface VideoAnalysisRecord {
    pageId: string;
    imageBase64: string;
    fileName?: string;
    result: any;
    timestamp: number;
}

export interface SectionAnalysisRecord {
    pageId: string;
    section: string;
    imageBase64: string;
    fileName?: string;
    result: any;
    timestamp: number;
}

export class AppDatabase extends Dexie {
    localFiles!: Table<LocalFile>;
    syncMeta!: Table<SyncMeta, string>;
    revisions!: Table<RevisionText, number>;
    videoAnalyses!: Table<VideoAnalysisRecord, string>;
    sectionAnalyses!: Table<SectionAnalysisRecord, [string, string]>;

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
        this.version(4).stores({
            localFiles: '++id, name, status, lastModified',
            syncMeta: 'key',
            revisions: 'revid, fetchedAt',
            videoAnalyses: 'pageId, timestamp'
        });
        this.version(5).stores({
            localFiles: '++id, name, status, lastModified',
            syncMeta: 'key',
            revisions: 'revid, fetchedAt',
            videoAnalyses: 'pageId, timestamp',
            sectionAnalyses: '[pageId+section], pageId, section, timestamp'
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

export async function getSavedSectionAnalysis(pageId: string, section: string): Promise<SectionAnalysisRecord | null> {
    try {
        const item = await db.sectionAnalyses.get([pageId, section]);
        if (item) return item;
        // Fallback for legacy video analyses if section is video
        if (section === 'video') {
            const legacy = await db.videoAnalyses.get(pageId);
            if (legacy) {
                return {
                    pageId: legacy.pageId,
                    section: 'video',
                    imageBase64: legacy.imageBase64,
                    fileName: legacy.fileName,
                    result: legacy.result,
                    timestamp: legacy.timestamp
                };
            }
        }
        return null;
    } catch {
        return null;
    }
}

export async function saveSectionAnalysisRecord(record: SectionAnalysisRecord): Promise<void> {
    try {
        await db.sectionAnalyses.put(record);
    } catch (e) {
        console.error('Failed to save section analysis record:', e);
    }
}

export async function deleteSavedSectionAnalysis(pageId: string, section: string): Promise<void> {
    try {
        await db.sectionAnalyses.delete([pageId, section]);
        if (section === 'video') {
            await db.videoAnalyses.delete(pageId);
        }
    } catch (e) {
        console.error('Failed to delete section analysis record:', e);
    }
}

// Backward-compatibility aliases
export async function getSavedVideoAnalysis(pageId: string): Promise<VideoAnalysisRecord | null> {
    const res = await getSavedSectionAnalysis(pageId, 'video');
    return res ? { pageId: res.pageId, imageBase64: res.imageBase64, fileName: res.fileName, result: res.result, timestamp: res.timestamp } : null;
}

export async function saveVideoAnalysisRecord(record: VideoAnalysisRecord): Promise<void> {
    await saveSectionAnalysisRecord({ ...record, section: 'video' });
}

export async function deleteSavedVideoAnalysis(pageId: string): Promise<void> {
    await deleteSavedSectionAnalysis(pageId, 'video');
}


