export type ReferenceType = 'Refcheck' | 'Refurl' | 'cn' | 'text' | 'key' | 'ilink' | 'wlink' | 'ulink' | 'tlink';

export interface ReferenceItem {
    id: string; // internal id for unique keys
    type: ReferenceType;
    params: Record<string, string>;
    content?: string; // for 'text' type nodes
    wrapInRef?: boolean; // for wrapping in <ref> tags
}

export interface RefcheckParams {
    user?: string;
    date?: string;
    comment?: string;
    [key: string]: string | undefined;
}

export interface RefurlParams {
    url?: string;
    title?: string;
    date?: string;
    snippet?: string;
    [key: string]: string | undefined;
}

export interface CnParams {
    date?: string;
    reason?: string;
    [key: string]: string | undefined;
}
