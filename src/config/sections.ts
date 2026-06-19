import {
    File, Info, AlignLeft, ShoppingCart, DollarSign, PlusCircle,
    Star, Save, Monitor, Keyboard, Volume2, Wifi, Eye, Settings, Cpu, Globe, AlertCircle,
    type Icon,
} from 'lucide-vue-next';

export interface SectionItem {
    key: string;       // matches uiStore.panelState key + DOM anchor id `sec-<key>`
    label: string;
    icon: Icon;
}

export interface SectionGroup {
    label: string;
    items: SectionItem[];
}

// Single source of truth for the section navigation rail + scroll-spy.
// Order/keys mirror the ModernPanels rendered in App.vue.
export const sectionGroups: SectionGroup[] = [
    {
        label: 'Overview',
        items: [
            { key: 'articleState', label: 'Article State', icon: File },
            { key: 'infobox', label: 'Infobox', icon: Info },
            { key: 'introduction', label: 'Introduction', icon: AlignLeft },
        ],
    },
    {
        label: 'Store & Pricing',
        items: [
            { key: 'availability', label: 'Availability', icon: ShoppingCart },
            { key: 'monetization', label: 'Monetization', icon: DollarSign },
            { key: 'dlc', label: 'DLC & Expansions', icon: PlusCircle },
        ],
    },
    {
        label: 'Gameplay',
        items: [
            { key: 'essentialImprovements', label: 'Essential Improvements', icon: Star },
            { key: 'gameData', label: 'Game Data', icon: Save },
        ],
    },
    {
        label: 'Technical',
        items: [
            { key: 'video', label: 'Video', icon: Monitor },
            { key: 'input', label: 'Input', icon: Keyboard },
            { key: 'audio', label: 'Audio', icon: Volume2 },
            { key: 'network', label: 'Network', icon: Wifi },
            { key: 'vr', label: 'VR Support', icon: Eye },
            { key: 'systemReq', label: 'System Requirements', icon: Cpu },
        ],
    },
    {
        label: 'More',
        items: [
            { key: 'issues', label: 'Issues', icon: AlertCircle },
            { key: 'other', label: 'Other Info', icon: Settings },
            { key: 'l10n', label: 'Localizations', icon: Globe },
        ],
    },
];

export const sectionKeysInOrder = sectionGroups.flatMap(g => g.items.map(i => i.key));
