export interface GallerySectionConfig {
    key: string;
    label: string;
    aliases: string[];
}

export const GALLERY_SECTIONS: GallerySectionConfig[] = [
    { key: 'video', label: 'Video', aliases: ['video', 'Video'] },
    { key: 'input', label: 'Input', aliases: ['input', 'Input'] },
    { key: 'audio', label: 'Audio', aliases: ['audio', 'Audio'] },
    { key: 'game_data', label: 'Game Data', aliases: ['game_data', 'gameData', 'Game Data', 'Game data'] },
    { key: 'network', label: 'Network', aliases: ['network', 'Network'] },
    { key: 'vr', label: 'VR Support', aliases: ['vr', 'VR', 'VR support', 'VR Support'] },
    { key: 'other', label: 'API Support', aliases: ['other', 'api', 'API', 'Other', 'Other Info'] },
    { key: 'systemReq', label: 'System Requirements', aliases: ['systemReq', 'system_requirements', 'System requirements', 'System Requirements'] },
];

export function resolveGallerySectionKey(sectionName: string): string {
    if (!sectionName) return 'video';
    const normalized = sectionName.trim().toLowerCase();
    const match = GALLERY_SECTIONS.find(
        s => s.key.toLowerCase() === normalized || s.aliases.some(a => a.toLowerCase() === normalized)
    );
    return match ? match.key : sectionName;
}

export function getGallerySectionLabel(sectionKeyOrName: string): string {
    const key = resolveGallerySectionKey(sectionKeyOrName);
    const match = GALLERY_SECTIONS.find(s => s.key === key);
    return match ? match.label : sectionKeyOrName;
}
