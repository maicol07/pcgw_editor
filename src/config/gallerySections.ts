import type { Component } from 'vue';
import {
    Monitor, Keyboard, Volume2, Save, Wifi, Eye, Settings, Cpu
} from '@lucide/vue';

export interface GallerySectionConfig {
    key: string;
    label: string;
    aliases: string[];
    icon: Component;
}

export const GALLERY_SECTIONS: GallerySectionConfig[] = [
    { key: 'video', label: 'Video', aliases: ['video', 'Video'], icon: Monitor },
    { key: 'input', label: 'Input', aliases: ['input', 'Input'], icon: Keyboard },
    { key: 'audio', label: 'Audio', aliases: ['audio', 'Audio'], icon: Volume2 },
    { key: 'game_data', label: 'Game Data', aliases: ['game_data', 'gameData', 'Game Data', 'Game data'], icon: Save },
    { key: 'network', label: 'Network', aliases: ['network', 'Network'], icon: Wifi },
    { key: 'vr', label: 'VR Support', aliases: ['vr', 'VR', 'VR support', 'VR Support'], icon: Eye },
    { key: 'other', label: 'API Support', aliases: ['other', 'api', 'API', 'Other', 'Other Info'], icon: Settings },
    { key: 'systemReq', label: 'System Requirements', aliases: ['systemReq', 'system_requirements', 'System requirements', 'System Requirements'], icon: Cpu },
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

export function getGallerySectionIcon(sectionKeyOrName: string): Component | undefined {
    const key = resolveGallerySectionKey(sectionKeyOrName);
    const match = GALLERY_SECTIONS.find(s => s.key === key);
    return match?.icon;
}
