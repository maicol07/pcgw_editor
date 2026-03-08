import Dexie, { type Table } from 'dexie';

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
}

export class AppDatabase extends Dexie {
    localFiles!: Table<LocalFile>;

    constructor() {
        super('PCGWEditorDB');
        this.version(1).stores({
            localFiles: '++id, name, status, lastModified'
        });
    }
}

export const db = new AppDatabase();
