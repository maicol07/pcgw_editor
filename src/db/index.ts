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

export class AppDatabase extends Dexie {
    localFiles!: Table<LocalFile>;
    syncMeta!: Table<SyncMeta, string>;

    constructor() {
        super('PCGWEditorDB');
        this.version(1).stores({
            localFiles: '++id, name, status, lastModified'
        });
        this.version(2).stores({
            localFiles: '++id, name, status, lastModified',
            syncMeta: 'key'
        });
    }
}

export const db = new AppDatabase();
