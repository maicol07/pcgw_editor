export type ReferenceType = 'Refcheck' | 'Refurl' | 'cn' | 'text' | 'key' | 'ilink' | 'wlink' | 'ulink' | 'tlink';

export interface ReferenceItem {
    id: string; // internal id for unique keys
    type: ReferenceType;
    params: Record<string, string>;
    content?: string; // for 'text' type nodes
    wrapInRef?: boolean; // for wrapping in <ref> tags
}
