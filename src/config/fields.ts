import { SectionDefinition } from '../types/schema';
import { InfoboxListItem } from '../models/GameData';
import {
    Info, Save, Image, IdCard, Users, Building, Calendar,
    ShoppingCart, ShoppingBag, Globe, Terminal, Box,
    File, AlignLeft, SlidersHorizontal, AlignCenter, Captions, VolumeX, CheckCircle, Volume2,
    GitFork, Tags, AlertCircle, Brush, Trash2, Gamepad2, DollarSign, PlusCircle, Star,
    Monitor, Grid2X2, Maximize, Minimize, ScanLine, LineChart, ArrowUpRight, FastForward, RefreshCcw, Clock, Zap, Sun, Sparkles, Palette, Eye,
    Keyboard, Move, MousePointerClick, ArrowUpDown, Tablet, Settings, Plug, Smartphone, Search, Hand, Wifi, Headset,
    Pencil, Send, AppWindow, Cpu, Shield, Layout, Film, Server, MessageCircle
} from 'lucide-vue-next';

// Helper for formatting Infobox Lists
const infoboxListParser = (_wikitext: string): InfoboxListItem[] => {
    // Basic parser placeholder - relies on WikitextParser usually
    return [];
};

const infoboxListFormatter = (values: InfoboxListItem[]): string => {
    if (!Array.isArray(values) || values.length === 0) return '';
    return values.map(item => `{{Infobox game/row/${item.type || 'developer'}|${item.name}}}`).join('\n');
};

const gameDataConfigParser = (wikitext: string): any => {
    return { detected: true, raw: wikitext };
};

export const fieldsConfig: SectionDefinition[] = [
    {
        id: 'infobox',
        title: 'Infobox',
        icon: Info,
        iconClass: 'text-blue-500',
        order: 1,
        templateName: 'Infobox game',
        // We use groups for better organization
        groups: [
            {
                title: 'Basic Information',
                gridCols: 2,
                fields: [
                    {
                        key: 'cover',
                        label: 'Cover Image Filename',
                        icon: Image,
                        component: 'CoverImageField',
                        wikitextParam: 'cover',
                        defaultValue: 'GAME TITLE cover.jpg',
                        description: "Search PCGW files or enter name. Click Upload to add new.",
                        componentProps: {
                            placeholder: 'e.g. GAME TITLE cover.jpg'
                        }
                    },
                    {
                        key: 'license',
                        label: 'License',
                        icon: IdCard,
                        iconClass: 'text-orange-500',
                        component: 'Select',
                        wikitextParam: 'license',
                        defaultValue: 'commercial',
                        description: "The licensing model of the game.",
                        componentProps: {
                            placeholder: 'Select license',
                            options: [
                                { label: 'Commercial', value: 'commercial', description: 'Proprietary software sold commercially' },
                                { label: 'Freeware', value: 'freeware', description: 'Free to use but proprietary' },
                                { label: 'Open Source / Free Software', value: 'open source', description: 'Free and open source licensed' },
                                { label: 'Abandonware', value: 'abandonware', description: 'No longer supported or sold' },
                                { label: 'Donationware', value: 'donationware', description: 'Free with optional donations' },
                                { label: 'Shareware', value: 'shareware', description: 'Try before you buy' },
                            ]
                        }
                    },
                    {
                        key: 'developers',
                        label: 'Developers',
                        icon: Users,
                        component: 'InfoboxDevelopersEditor',
                        wikitextParam: 'developers',
                        defaultValue: [],
                        description: 'The entity that created the game.',
                        componentProps: {
                            dataSource: 'companies',
                            placeholder: 'Search for developers...'
                        },
                        parser: infoboxListParser,
                        formatter: infoboxListFormatter
                    },
                    {
                        key: 'publishers',
                        label: 'Publishers',
                        icon: Building,
                        component: 'InfoboxPublishersEditor',
                        wikitextParam: 'publishers',
                        defaultValue: [],
                        description: 'The entity that published the game.',
                        componentProps: {
                            dataSource: 'companies',
                            placeholder: 'Search for publishers...'
                        },
                        parser: infoboxListParser,
                        formatter: infoboxListFormatter
                    },
                    {
                        key: 'engines',
                        label: 'Engines',
                        // icon: Settings, 
                        component: 'InfoboxEnginesEditor',
                        wikitextParam: 'engines',
                        defaultValue: [],
                        description: 'The game engine used.',
                        colSpan: 2,
                        componentProps: {
                            placeholder: 'Search for engines...'
                        }
                    },
                    {
                        key: 'releaseDates',
                        label: 'Release Dates',
                        icon: Calendar,
                        component: 'InfoboxReleaseDates',
                        wikitextParam: 'release_dates',
                        defaultValue: [],
                        description: 'Original release dates for each platform.',
                        colSpan: 2,
                    }
                ]
            },
            {
                title: 'Reception',
                fields: [
                    {
                        key: 'reception',
                        label: 'Reception',
                        component: 'InfoboxReception',
                        wikitextParam: 'reception',
                        defaultValue: [],
                        description: 'Review scores from various aggregators.'
                    }
                ]
            },
            {
                title: 'Taxonomy',
                gridCols: 3,
                fields: [
                    { key: 'taxonomy.monetization', label: 'Monetization', component: 'TaxonomyField', wikitextParam: 'monetization', defaultValue: { value: '' }, description: 'Primary business model(s)', componentProps: { dataSource: 'monetization', placeholder: 'Select...' } },
                    { key: 'taxonomy.microtransactions', label: 'Microtransactions', component: 'TaxonomyField', wikitextParam: 'microtransactions', defaultValue: { value: '' }, description: 'Type of in-game purchases', componentProps: { dataSource: 'microtransactions', placeholder: 'Select...' } },
                    { key: 'taxonomy.modes', label: 'Modes', component: 'TaxonomyField', wikitextParam: 'modes', defaultValue: { value: '' }, description: 'Available game modes', componentProps: { dataSource: 'modes', placeholder: 'Select...' } },
                    { key: 'taxonomy.pacing', label: 'Pacing', component: 'TaxonomyField', wikitextParam: 'pacing', defaultValue: { value: '' }, description: 'Game pacing type', componentProps: { dataSource: 'pacing', placeholder: 'Select...' } },
                    { key: 'taxonomy.perspectives', label: 'Perspectives', component: 'TaxonomyField', wikitextParam: 'perspectives', defaultValue: { value: '' }, description: 'Camera perspectives', componentProps: { dataSource: 'perspectives', placeholder: 'Select...' } },
                    { key: 'taxonomy.controls', label: 'Controls', component: 'TaxonomyField', wikitextParam: 'controls', defaultValue: { value: '' }, description: 'Control scheme type', componentProps: { dataSource: 'controls', placeholder: 'Select...' } },
                    { key: 'taxonomy.genres', label: 'Genres', component: 'TaxonomyField', wikitextParam: 'genres', defaultValue: { value: '' }, description: 'Game genre(s)', componentProps: { dataSource: 'genres', placeholder: 'Select...' } },
                    { key: 'taxonomy.sports', label: 'Sports', component: 'TaxonomyField', wikitextParam: 'sports', defaultValue: { value: '' }, description: 'Sports category', componentProps: { dataSource: 'sports', placeholder: 'Select...' } },
                    { key: 'taxonomy.vehicles', label: 'Vehicles', component: 'TaxonomyField', wikitextParam: 'vehicles', defaultValue: { value: '' }, description: 'Vehicle types', componentProps: { dataSource: 'vehicles', placeholder: 'Select...' } },
                    { key: 'taxonomy.artStyles', label: 'Art Styles', component: 'TaxonomyField', wikitextParam: 'art_styles', defaultValue: { value: '' }, description: 'Visual art style', componentProps: { dataSource: 'artStyles', placeholder: 'Select...' } },
                    { key: 'taxonomy.themes', label: 'Themes', component: 'TaxonomyField', wikitextParam: 'themes', defaultValue: { value: '' }, description: 'Story/setting themes', componentProps: { dataSource: 'themes', placeholder: 'Select...' } },
                    { key: 'taxonomy.series', label: 'Series', component: 'TaxonomyField', wikitextParam: 'series', defaultValue: { value: '' }, description: 'Game series/franchise', componentProps: { dataSource: 'series', placeholder: 'Select...' } },
                ]
            },
            {
                title: 'External Links',
                gridCols: 3,
                fields: [
                    { key: 'links.steamAppId', label: 'Steam App ID', icon: ShoppingCart, iconClass: 'text-blue-500', component: 'InputText', wikitextParam: 'steam_appid', description: 'Numeric ID from URL', componentProps: { placeholder: 'e.g. 220' } },
                    { key: 'links.steamAppIdSide', label: 'Steam Side Param', component: 'InputText', wikitextParam: 'steam_appid_side', description: 'Optional side parameter', componentProps: { placeholder: 'e.g. sub/123' } },
                    { key: 'links.officialSite', label: 'Official Site', icon: Globe, iconClass: 'text-green-500', component: 'InputText', wikitextParam: 'official_site', description: 'URL to official website', componentProps: { placeholder: 'https://...' } },

                    { key: 'links.gogComId', label: 'GOG.com ID', icon: ShoppingBag, iconClass: 'text-purple-500', component: 'InputText', wikitextParam: 'gogcom_id', description: 'Slug from URL', componentProps: { placeholder: 'e.g. game_title' } },
                    { key: 'links.gogComIdSide', label: 'GOG Side Param', component: 'InputText', wikitextParam: 'gogcom_id_side', description: 'Optional side parameter', componentProps: { placeholder: '' } },
                    { key: 'links.hltb', label: 'HLTB ID', component: 'InputText', wikitextParam: 'hltb', description: 'HowLongToBeat ID', componentProps: { placeholder: 'e.g. 12345' } },

                    { key: 'links.igdb', label: 'IGDB Slug', component: 'InputText', wikitextParam: 'igdb', description: 'Slug from IGDB URL', componentProps: { placeholder: 'e.g. game-title' } },
                    { key: 'links.mobygames', label: 'MobyGames Slug', component: 'InputText', wikitextParam: 'mobygames', description: 'Slug from MobyGames URL', componentProps: { placeholder: 'e.g. game-title' } },
                    { key: 'links.strategyWiki', label: 'StrategyWiki', component: 'InputText', wikitextParam: 'strategywiki', description: 'Slug from StrategyWiki', componentProps: { placeholder: 'e.g. Game_Title' } },

                    { key: 'links.wikipedia', label: 'Wikipedia', component: 'InputText', wikitextParam: 'wikipedia', description: 'Article title', componentProps: { placeholder: 'e.g. Game Title' } },
                    { key: 'links.vndb', label: 'VNDB ID', component: 'InputText', wikitextParam: 'vndb', description: 'ID starting with v', componentProps: { placeholder: 'e.g. v123' } },
                    { key: 'links.lutris', label: 'Lutris Slug', icon: Terminal, iconClass: 'text-orange-500', component: 'InputText', wikitextParam: 'lutris', description: 'Slug from Lutris', componentProps: { placeholder: 'e.g. game-title' } },

                    { key: 'links.wineHq', label: 'WineHQ Slug', icon: Box, iconClass: 'text-red-500', component: 'InputText', wikitextParam: 'winehq', description: 'ID from WineHQ AppDB', componentProps: { placeholder: 'e.g. 1234' } },
                    { key: 'links.wineHqSide', label: 'WineHQ Side Param', component: 'InputText', wikitextParam: 'winehq_side', description: 'Optional side parameter', componentProps: { placeholder: '' } }
                ]
            },

        ]
    },
    {
        id: 'article_state',
        title: 'Article State',
        icon: File,
        iconClass: 'text-primary-500',
        order: 0,
        groups: [
            {
                title: 'Clarification Tags',
                fields: [
                    {
                        key: 'articleState.disambig',
                        label: 'Disambiguation',
                        icon: GitFork,
                        component: 'InputText',
                        wikitextParam: 'disambig',
                        description: 'Used to distinguish movies/books or other games with the same name.',
                        componentProps: { placeholder: 'e.g. the original game' }
                    },
                    {
                        key: 'articleState.distinguish',
                        label: 'Distinguish',
                        icon: Tags,
                        component: 'InputChips',
                        wikitextParam: 'distinguish',
                        description: 'List closely related but not identical titles.',
                        componentProps: { placeholder: 'Type page name and press enter' }
                    }
                ]
            },
            {
                title: 'Flags',
                gridCols: 2,
                fields: [
                    {
                        key: '_stub_validator_inline',
                        label: '',
                        component: 'StubValidator',
                        wikitextParam: '',
                        showIf: (m: any) => m.articleState?.stub,
                        colSpan: 2,
                    },
                    {
                        key: 'articleState.stub',
                        label: 'Stub',
                        icon: AlertCircle,
                        iconClass: 'text-yellow-500',
                        component: 'Checkbox',
                        wikitextParam: '',
                        description: 'Missing minimum requirements.',
                        componentProps: { binary: true }
                    },
                    {
                        key: 'articleState.cleanup',
                        label: 'Needs Cleanup',
                        icon: Brush,
                        iconClass: 'text-orange-500',
                        component: 'Checkbox',
                        wikitextParam: '',
                        description: 'Formatting or outdated content.',
                        componentProps: { binary: true }
                    },
                    {
                        key: 'articleState.cleanupDescription',
                        label: 'Cleanup Reason',
                        component: 'Textarea',
                        wikitextParam: '',
                        showIf: (m: any) => m.articleState?.cleanup,
                        componentProps: { rows: 2, autoResize: true, placeholder: 'Reason for cleanup...' },
                        colSpan: 2
                    },
                    {
                        key: 'articleState.delete',
                        label: 'Delete Request',
                        icon: Trash2,
                        iconClass: 'text-red-500',
                        component: 'Checkbox',
                        wikitextParam: '',
                        description: 'Remove this page from wiki.',
                        componentProps: { binary: true }
                    },
                    {
                        key: 'articleState.deleteReason',
                        label: 'Deletion Reason',
                        component: 'Textarea',
                        wikitextParam: '',
                        showIf: (m: any) => m.articleState?.delete,
                        componentProps: { rows: 2, autoResize: true, placeholder: 'Reason for deletion...' },
                        colSpan: 2
                    }
                ]
            },
            {
                title: 'Development State',
                fields: [
                    {
                        key: 'articleState.state',
                        label: 'Game State',
                        icon: Gamepad2,
                        component: 'Select',
                        wikitextParam: '',
                        defaultValue: '',
                        componentProps: {
                            options: [
                                { label: 'None', value: '', icon: '⚪', description: 'No development status' },
                                { label: 'Prototype', value: 'prototype', icon: '🔬', description: 'Prototype version' },
                                { label: 'Development / Early Access', value: 'dev', icon: '🚧', description: 'Active development or EA' },
                                { label: 'Post-Development', value: 'postdev', icon: '🔄', description: 'Continued development post-release' },
                                { label: 'Unknown', value: 'unknown', icon: '❓', description: 'No updates, unlikely' },
                                { label: 'Abandoned', value: 'abandoned', icon: '💀', description: 'Officially cancelled' },
                                { label: 'Unplayable', value: 'unplayable', icon: '🚫', description: 'Servers shut down' },
                            ]
                        }
                    }
                ]
            }
        ]
    },
    {
        id: 'introduction',
        title: 'Introduction',
        icon: AlignLeft,
        iconClass: 'text-accent-orange-500',
        order: 2,
        gridCols: 2,
        fields: [
            {
                key: 'introduction.introduction',
                label: 'Introduction',
                component: 'Textarea',
                wikitextParam: 'introduction',
                description: "The first instance of the game title in introduction should be written as '''''Title'''''",
                componentProps: {
                    rows: 4,
                    autoResize: true,
                    placeholder: "'''''Title''''' is a..."
                },
                colSpan: 2
            },
            {
                key: 'introduction.releaseHistory',
                label: 'Release History',
                component: 'Textarea',
                wikitextParam: 'release_history',
                componentProps: {
                    rows: 3,
                    autoResize: true,
                    placeholder: "Game was first released on..."
                }
            },
            {
                key: 'introduction.currentState',
                label: 'Current State',
                component: 'Textarea',
                wikitextParam: 'current_state',
                componentProps: {
                    rows: 3,
                    autoResize: true,
                    placeholder: "Current major issues..."
                }
            }
        ]
    },
    {
        id: 'availability',
        title: 'Availability',
        icon: ShoppingCart,
        iconClass: 'text-accent-emerald-500',
        order: 3,
        // Custom section wrapping AvailabilityForm
        isCustomSection: true,
        templateName: 'Availability',
        fields: [
            {
                key: 'availability',
                label: 'Availability',
                component: 'AvailabilityForm',
                wikitextParam: 'availability',
                defaultValue: []
            }
        ]
    },


    // ... (existing code)

    {
        id: 'monetization',
        title: 'Monetization',
        icon: DollarSign,
        iconClass: 'text-accent-orange-500',
        order: 4,
        gridCols: 3,
        fields: [
            { key: 'monetization.oneTimePurchase', label: 'One-time Game Purchase', component: 'InputText', wikitextParam: 'monetization', defaultValue: 'The game requires an upfront purchase to access.', description: 'Requires upfront purchase to access.' },
            { key: 'monetization.freeToPlay', label: 'Free-to-play', component: 'InputText', wikitextParam: 'monetization', defaultValue: '', description: 'Access significant portion without paying.' },
            { key: 'monetization.freeware', label: 'Freeware', component: 'InputText', wikitextParam: 'monetization', defaultValue: '', description: 'Completely free in its entirety.' },
            { key: 'monetization.adSupported', label: 'Ad-supported', component: 'InputText', wikitextParam: 'monetization', defaultValue: '', description: 'Ads that are not part of gameplay.' },
            { key: 'monetization.subscription', label: 'Subscription', component: 'InputText', wikitextParam: 'monetization', defaultValue: '', description: 'Game-specific periodic payment.' },
            { key: 'monetization.subscriptionGamingService', label: 'Subscription Gaming Service', component: 'InputText', wikitextParam: 'monetization', defaultValue: '', description: 'Part of a collection/service (Game Pass).' },
            { key: 'monetization.dlc', label: 'DLC', component: 'InputText', wikitextParam: 'monetization', defaultValue: '', description: 'Additional maps, levels, quests.' },
            { key: 'monetization.expansionPack', label: 'Expansion Pack', component: 'InputText', wikitextParam: 'monetization', defaultValue: '', description: 'Large campaigns, significant new content.' },
            { key: 'monetization.crossGameBonus', label: 'Cross-game Bonus', component: 'InputText', wikitextParam: 'monetization', defaultValue: '', description: 'Bonuses for owning/playing other games.' },
        ]
    },
    {
        id: 'microtransactions',
        title: 'Microtransactions',
        icon: ShoppingCart,
        iconClass: 'text-primary-500',
        order: 5,
        gridCols: 3,
        fields: [
            { key: 'microtransactions.none', label: 'None', component: 'InputText', wikitextParam: 'microtransactions', defaultValue: 'The game does not contain microtransactions.', description: 'Standard: No microtransactions present.' },
            { key: 'microtransactions.cosmetic', label: 'Cosmetic', component: 'InputText', wikitextParam: 'microtransactions', defaultValue: '', description: 'Items that do not affect gameplay.' },
            { key: 'microtransactions.currency', label: 'Currency', component: 'InputText', wikitextParam: 'microtransactions', defaultValue: '', description: 'Bought with real money.' },
            { key: 'microtransactions.lootBox', label: 'Loot Box', component: 'InputText', wikitextParam: 'microtransactions', defaultValue: '', description: 'Randomized purchase for items.' },
            { key: 'microtransactions.unlock', label: 'Unlock', component: 'InputText', wikitextParam: 'microtransactions', defaultValue: '', description: 'Content that affects gameplay.' },
            { key: 'microtransactions.boost', label: 'Boost', component: 'InputText', wikitextParam: 'microtransactions', defaultValue: '', description: 'Accelerate speed, levelling, or skips.' },
            { key: 'microtransactions.freeToGrind', label: 'Free-to-grind', component: 'InputText', wikitextParam: 'microtransactions', defaultValue: '', description: 'Can unlock everything by playing.' },
            { key: 'microtransactions.finiteSpend', label: 'Finite Spend', component: 'InputText', wikitextParam: 'microtransactions', defaultValue: '', description: 'Fixed number of items to buy.' },
            { key: 'microtransactions.infiniteSpend', label: 'Infinite Spend', component: 'InputText', wikitextParam: 'microtransactions', defaultValue: '', description: 'Can be bought over and over.' },
            { key: 'microtransactions.playerTrading', label: 'Player Trading', component: 'InputText', wikitextParam: 'microtransactions', defaultValue: '', description: 'Trading items/currency between players.' },
            { key: 'microtransactions.timeLimited', label: 'Time-limited', component: 'InputText', wikitextParam: 'microtransactions', defaultValue: '', description: 'Exclusive to a specific time/promo.' },
        ]
    },
    {
        id: 'dlc',
        title: 'DLC & Expansions',
        icon: PlusCircle,
        iconClass: 'text-primary-600',
        order: 6,
        isCustomSection: true,
        templateName: 'DLC',
        fields: [
            {
                key: 'dlc',
                label: 'DLC',
                component: 'DLCForm',
                wikitextParam: 'dlc',
                defaultValue: []
            }
        ]
    },
    {
        id: 'essentialImprovements',
        title: 'Essential Improvements',
        icon: Star,
        iconClass: 'text-yellow-500',
        order: 7,
        fields: [
            {
                key: 'essentialImprovements',
                label: 'Essential Improvements',
                component: 'WikitextEditor',
                wikitextParam: 'essential_improvements',
                description: 'Patches, intro skip methods, major community mods, game-specific utilities.',
                componentProps: {
                    rows: 10,
                }
            }
        ]
    },
    {
        id: 'audio',
        title: 'Audio',
        icon: Volume2,
        order: 10,
        groups: [
            {
                title: 'Audio Settings',
                fields: [
                    { key: 'audio', label: 'Separate Volume Controls', component: 'CompoundRatingField', wikitextParam: 'separate_volume', description: 'Can audio types be adjusted individually?', componentProps: { field: 'separateVolume', label: 'Separate Volume Controls', icon: SlidersHorizontal } },
                    { key: 'audio', label: 'Surround Sound', component: 'CompoundRatingField', wikitextParam: 'surround_sound', description: 'Surround sound support (5.1, 7.1, etc.)', componentProps: { field: 'surroundSound', label: 'Surround Sound', icon: Volume2 } },
                    { key: 'audio', label: 'Subtitles', component: 'CompoundRatingField', wikitextParam: 'subtitles', description: 'Subtitle support for dialogue/cutscenes.', componentProps: { field: 'subtitles', label: 'Subtitles', icon: AlignCenter } },
                    { key: 'audio', label: 'Closed Captions', component: 'CompoundRatingField', wikitextParam: 'closed_captions', description: 'Support for closed captions (sound effects text).', componentProps: { field: 'closedCaptions', label: 'Closed Captions', icon: Captions } },
                    { key: 'audio', label: 'Mute on Focus Lost', component: 'CompoundRatingField', wikitextParam: 'mute_on_focus_lost', description: 'Does game mute when alt-tabbed?', componentProps: { field: 'muteOnFocusLost', label: 'Mute on Focus Lost', icon: VolumeX } },
                    { key: 'audio', label: 'Royalty Free Audio', component: 'CompoundRatingField', wikitextParam: 'royalty_free', description: 'Is the audio safe for streaming/recording?', componentProps: { field: 'royaltyFree', label: 'Royalty Free Audio', icon: CheckCircle } },
                ]
            },
            {
                title: 'API',
                fields: [
                    { key: 'audio', label: 'EAX Support', component: 'CompoundRatingField', wikitextParam: 'eax_support', componentProps: { field: 'eaxSupport', label: 'EAX Support' } },
                    { key: 'audio', label: 'Red Book CD Audio', component: 'CompoundRatingField', wikitextParam: 'red_book_cd_audio', componentProps: { field: 'redBookCdAudio', label: 'Red Book CD Audio' } },
                    { key: 'audio', label: 'General MIDI Audio', component: 'CompoundRatingField', wikitextParam: 'general_midi_audio', componentProps: { field: 'generalMidiAudio', label: 'General MIDI Audio' } },
                ]
            }
        ]
    },
    {
        id: 'game_data',
        title: 'Game Data',
        icon: Save,
        iconClass: 'text-green-500',
        order: 2,
        // GameData is complex and has multiple templates (config, saves, cloud)
        // We use a custom section component for now, but we could partially define schema if we wanted.
        isCustomSection: true,
        templateName: 'GameData', // Primary template
        groups: [
            {
                title: 'Configuration & Save Data',
                fields: [
                    {
                        key: 'config',
                        label: 'Configuration',
                        component: 'GameDataForm',
                        wikitextParam: 'config',
                        defaultValue: {},
                        parser: gameDataConfigParser
                    }
                ]
            },
            {
                title: 'Save Game Cloud Syncing',
                fields: [
                    { key: 'config.cloudSync', label: 'Steam Cloud', component: 'CompoundRatingField', wikitextParam: 'steam_cloud', componentProps: { field: 'steamCloud', icon: Server } },
                    { key: 'config.cloudSync', label: 'Discord', component: 'CompoundRatingField', wikitextParam: 'discord', componentProps: { field: 'discord', icon: MessageCircle } },
                    { key: 'config.cloudSync', label: 'Epic Games Launcher', component: 'CompoundRatingField', wikitextParam: 'epic_games_launcher', componentProps: { field: 'epicGamesLauncher', icon: Box } },
                    { key: 'config.cloudSync', label: 'GOG Galaxy', component: 'CompoundRatingField', wikitextParam: 'gog_galaxy', componentProps: { field: 'gogGalaxy', icon: Box } },
                    { key: 'config.cloudSync', label: 'EA App', component: 'CompoundRatingField', wikitextParam: 'ea_app', componentProps: { field: 'eaApp', icon: Box } },
                    { key: 'config.cloudSync', label: 'Ubisoft Connect', component: 'CompoundRatingField', wikitextParam: 'ubisoft_connect', componentProps: { field: 'ubisoftConnect', icon: Box } },
                    { key: 'config.cloudSync', label: 'Xbox Cloud', component: 'CompoundRatingField', wikitextParam: 'xbox_cloud', componentProps: { field: 'xboxCloud', icon: AppWindow } },
                ]
            }
        ]
    },
    {
        id: 'video',
        title: 'Video',
        icon: Monitor,
        iconClass: 'text-blue-500',
        order: 8,
        fields: [
            {
                key: 'video',
                label: 'AI Analysis',
                component: 'VideoAnalysis',
                wikitextParam: '',
                description: 'Analyze screenshots to auto-fill settings.'
            },
            {
                key: 'galleries.video',
                label: 'Gallery',
                component: 'SectionGallery',
                wikitextParam: '',
                componentProps: { section: 'video' }
            }
        ],
        groups: [
            {
                title: 'WSGF Awards & Links',
                gridCols: 2,
                fields: [
                    // These are simple InputTexts, but they are flat on video object.
                    // DynamicField handles 'video.wsgfLink' by passing the string value.
                    // But InputText expects v-model of string. So 'video.wsgfLink' works perfectly for InputText.
                    // Only RatingRow needs CompoundRatingField because of the 'Notes' sibling field.
                    { key: 'video.wsgfLink', label: 'WSGF Link', component: 'InputText', wikitextParam: 'wsgf_link', description: 'Link to WSGF report' },
                    { key: 'video.widescreenWsgfAward', label: 'Widescreen Award', component: 'InputText', wikitextParam: 'widescreen_award', description: 'Gold, Silver, etc.' },
                    { key: 'video.multiMonitorWsgfAward', label: 'Multi-monitor Award', component: 'InputText', wikitextParam: 'multimonitor_award', description: 'Gold, Silver, etc.' },
                    { key: 'video.ultraWidescreenWsgfAward', label: 'Ultra-widescreen Award', component: 'InputText', wikitextParam: 'ultrawidescreen_award', description: 'Gold, Silver, etc.' },
                    { key: 'video.fourKUltraHdWsgfAward', label: '4K Ultra HD Award', component: 'InputText', wikitextParam: '4k_award', description: 'Gold, Silver, etc.' }
                ]
            },
            {
                title: 'Resolution & Display',
                fields: [
                    { key: 'video', label: 'Widescreen Resolution', component: 'CompoundRatingField', wikitextParam: 'widescreen_resolution', componentProps: { field: 'widescreenResolution', icon: Monitor } },
                    { key: 'video', label: 'Multi-monitor', component: 'CompoundRatingField', wikitextParam: 'multimonitor', componentProps: { field: 'multiMonitor', icon: Grid2X2 } },
                    { key: 'video', label: 'Ultra-widescreen', component: 'CompoundRatingField', wikitextParam: 'ultrawidescreen', componentProps: { field: 'ultraWidescreen', icon: Maximize } },
                    { key: 'video', label: '4K Ultra HD', component: 'CompoundRatingField', wikitextParam: '4k_ultra_hd', componentProps: { field: 'fourKUltraHd', icon: Star } },
                    { key: 'video', label: 'Field of View (FOV)', component: 'CompoundRatingField', wikitextParam: 'fov', componentProps: { field: 'fov', icon: Eye } },
                    { key: 'video', label: 'Windowed', component: 'CompoundRatingField', wikitextParam: 'windowed', componentProps: { field: 'windowed', icon: Minimize } },
                    { key: 'video', label: 'Borderless Windowed', component: 'CompoundRatingField', wikitextParam: 'borderless_windowed', componentProps: { field: 'borderlessWindowed', icon: Image } },
                ]
            },
            {
                title: 'Graphics Settings',
                fields: [
                    { key: 'video', label: 'Anisotropic Filtering (AF)', component: 'CompoundRatingField', wikitextParam: 'anisotropic', componentProps: { field: 'anisotropic', icon: ScanLine } },
                    { key: 'video', label: 'Anti-aliasing (AA)', component: 'CompoundRatingField', wikitextParam: 'antialiasing', componentProps: { field: 'antiAliasing', icon: LineChart } },

                    { key: 'video', label: 'Upscaling', component: 'CompoundRatingField', wikitextParam: 'upscaling', componentProps: { field: 'upscaling', icon: ArrowUpRight } },
                    {
                        key: 'video.upscalingTech',
                        label: 'Upscaling Tech',
                        component: 'InputText',
                        wikitextParam: 'upscaling_tech',
                        showIf: (m: any) => m.video?.upscaling && m.video.upscaling.value !== 'false' && m.video.upscaling.value !== 'unknown' && m.video.upscaling.value !== 'n/a',
                        componentProps: { placeholder: 'Tech (e.g. DLSS 2, FSR 2)' }
                    },

                    { key: 'video', label: 'Frame Generation', component: 'CompoundRatingField', wikitextParam: 'frame_gen', componentProps: { field: 'frameGen', icon: FastForward } },
                    {
                        key: 'video.frameGenTech',
                        label: 'Frame Gen Tech',
                        component: 'InputText',
                        wikitextParam: 'frame_gen_tech',
                        showIf: (m: any) => m.video?.frameGen && m.video.frameGen.value !== 'false' && m.video.frameGen.value !== 'unknown' && m.video.frameGen.value !== 'n/a',
                        componentProps: { placeholder: 'Tech (e.g. DLSS 3, FSR 3)' }
                    },

                    { key: 'video', label: 'VSync', component: 'CompoundRatingField', wikitextParam: 'vsync', componentProps: { field: 'vsync', icon: RefreshCcw } },
                    { key: 'video', label: '60 FPS', component: 'CompoundRatingField', wikitextParam: '60_fps', componentProps: { field: 'fps60', icon: Clock } },
                    { key: 'video', label: '120+ FPS', component: 'CompoundRatingField', wikitextParam: '120_fps', componentProps: { field: 'fps120', icon: Zap } },
                    { key: 'video', label: 'HDR', component: 'CompoundRatingField', wikitextParam: 'hdr', componentProps: { field: 'hdr', icon: Sun } },
                    { key: 'video', label: 'Ray Tracing', component: 'CompoundRatingField', wikitextParam: 'ray_tracing', componentProps: { field: 'rayTracing', icon: Sparkles } },
                    { key: 'video', label: 'Color Blind Mode', component: 'CompoundRatingField', wikitextParam: 'color_blind', componentProps: { field: 'colorBlind', icon: Palette } },
                ]
            }
        ]
    },
    {
        id: 'input',
        title: 'Input',
        icon: Keyboard, // Use Keyboard as generic input icon
        iconClass: 'text-purple-500',
        order: 9,
        groups: [
            {
                title: 'Mouse / Keyboard',
                fields: [
                    { key: 'input', label: 'Key Remapping', component: 'CompoundRatingField', componentProps: { field: 'keyRemap', icon: Keyboard }, wikitextParam: 'key_remap' },
                    { key: 'input', label: 'Keyboard/Mouse Prompts', component: 'CompoundRatingField', componentProps: { field: 'keyboardMousePrompts', icon: Keyboard }, wikitextParam: 'prompts_keyboard_mouse' },
                    { key: 'input', label: 'Mouse Sensitivity', component: 'CompoundRatingField', componentProps: { field: 'mouseSensitivity', icon: Move }, wikitextParam: 'mouse_sensitivity' },
                    { key: 'input', label: 'Mouse Menu', component: 'CompoundRatingField', componentProps: { field: 'mouseMenu', icon: MousePointerClick }, wikitextParam: 'mouse_menu' },
                    { key: 'input', label: 'Invert Mouse Y-Axis', component: 'CompoundRatingField', componentProps: { field: 'invertMouseY', icon: ArrowUpDown }, wikitextParam: 'invert_mouse_y' },
                    { key: 'input', label: 'Touchscreen', component: 'CompoundRatingField', componentProps: { field: 'touchscreen', icon: Tablet }, wikitextParam: 'touchscreen' },
                ]
            },
            {
                title: 'General Controller',
                fields: [
                    { key: 'input', label: 'Controller Support', component: 'CompoundRatingField', componentProps: { field: 'controllerSupport', icon: Gamepad2 }, wikitextParam: 'controller_support' },
                    { key: 'input', label: 'Full Controller Support', component: 'CompoundRatingField', componentProps: { field: 'fullController', icon: CheckCircle }, wikitextParam: 'controller_support_full' },
                    { key: 'input', label: 'Controller Remapping', component: 'CompoundRatingField', componentProps: { field: 'controllerRemap', icon: Settings }, wikitextParam: 'controller_remap' },
                    { key: 'input', label: 'Controller Sensitivity', component: 'CompoundRatingField', componentProps: { field: 'controllerSensitivity', icon: SlidersHorizontal }, wikitextParam: 'controller_sensitivity' },
                    { key: 'input', label: 'Invert Controller Y-Axis', component: 'CompoundRatingField', componentProps: { field: 'invertControllerY', icon: ArrowUpDown }, wikitextParam: 'invert_controller_y' },
                    { key: 'input', label: 'Controller Hotplugging', component: 'CompoundRatingField', componentProps: { field: 'controllerHotplug', icon: Plug }, wikitextParam: 'controller_hotplug' },
                    { key: 'input', label: 'Haptic Feedback', component: 'CompoundRatingField', componentProps: { field: 'hapticFeedback', icon: Smartphone }, wikitextParam: 'haptic_feedback' },

                    { key: 'input', label: 'Haptic Feedback HD', component: 'CompoundRatingField', componentProps: { field: 'hapticFeedbackHd', icon: Smartphone }, wikitextParam: 'haptic_feedback_hd' },
                    {
                        key: 'input.hapticFeedbackHdControllerModels',
                        label: 'HD Haptics Models',
                        component: 'MultiSelect',
                        wikitextParam: 'haptic_feedback_hd_models',
                        description: 'Select supported models',
                        componentProps: {
                            placeholder: 'Select models...',
                            options: [
                                'DualSense',
                                'DualSense Edge',
                                'Joy-Con',
                                'Joy-Con 2',
                                'Lenovo Legion Go TrueStrike Controllers',
                                'Mobapad M6',
                                'Nintendo Switch 2 Pro Controller',
                                'Nintendo Switch Pro Controller',
                                'Razer Kishi Ultra',
                                'Razer Wolverine V3',
                                'Steam Controller',
                                'Steam Controller (2nd generation)',
                                'Steam Deck'
                            ]
                        }
                    },

                    { key: 'input', label: 'Simultaneous Input', component: 'CompoundRatingField', componentProps: { field: 'simultaneousInput', icon: Users }, wikitextParam: 'simultaneous input' },
                    { key: 'input', label: 'Acceleration Option', component: 'CompoundRatingField', componentProps: { field: 'accelerationOption', icon: Zap }, wikitextParam: 'acceleration_option' },
                ]
            },
            {
                title: 'XInput / DirectInput',
                fields: [
                    { key: 'input', label: 'XInput Controllers', component: 'CompoundRatingField', componentProps: { field: 'xinputControllers', icon: Gamepad2 }, wikitextParam: 'xinput_controllers' },
                    { key: 'input', label: 'Xbox Prompts', component: 'CompoundRatingField', componentProps: { field: 'xboxPrompts', icon: Box }, wikitextParam: 'prompts_xbox' },
                    { key: 'input', label: 'Impulse Triggers', component: 'CompoundRatingField', componentProps: { field: 'impulseTriggers', icon: Zap }, wikitextParam: 'impulse_triggers' },
                    { key: 'input', label: 'DirectInput Controllers', component: 'CompoundRatingField', componentProps: { field: 'directInputControllers', icon: Gamepad2 }, wikitextParam: 'directinput_controllers' },
                    { key: 'input', label: 'DirectInput Prompts', component: 'CompoundRatingField', componentProps: { field: 'directInputPrompts', icon: Box }, wikitextParam: 'prompts_directinput' },
                ]
            },
            {
                title: 'PlayStation',
                fields: [
                    { key: 'input', label: 'PlayStation Controllers', component: 'CompoundRatingField', componentProps: { field: 'playstationControllers', icon: Gamepad2 }, wikitextParam: 'playstation_controllers' },
                    {
                        key: 'input.playstationControllerModels',
                        label: 'Controller Models',
                        component: 'MultiSelect',
                        wikitextParam: 'playstation_controllers_models',
                        componentProps: {
                            placeholder: 'Select models...',
                            options: [
                                'DualShock 3',
                                'DualShock 4',
                                'DualShock 4 (launch model only)',
                                'DualShock 4 (V2 model only)',
                                'DualSense',
                                'DualSense Edge'
                            ]
                        }
                    },
                    { key: 'input', label: 'PlayStation Prompts', component: 'CompoundRatingField', componentProps: { field: 'playstationPrompts', icon: Box }, wikitextParam: 'prompts_playstation' },
                    { key: 'input', label: 'Motion Sensors', component: 'CompoundRatingField', componentProps: { field: 'playstationMotionSensors', icon: Move }, wikitextParam: 'playstation_motion_sensors' },
                    {
                        key: 'input.playstationMotionSensorsModes',
                        label: 'Motion Sensor Modes',
                        component: 'MultiSelect',
                        wikitextParam: 'playstation_motion_sensors_modes',
                        componentProps: {
                            placeholder: 'Select modes...',
                            options: ['Camera', 'Cursor', 'Gesture']
                        }
                    },

                    { key: 'input', label: 'Light Bar Support', component: 'CompoundRatingField', componentProps: { field: 'glightBar', icon: Zap }, wikitextParam: 'playstation_light_bar' },
                    { key: 'input', label: 'Adaptive Triggers', component: 'CompoundRatingField', componentProps: { field: 'dualSenseAdaptiveTrigger', icon: Zap }, wikitextParam: 'playstation_adaptive_triggers' },
                    { key: 'input', label: 'DualSense Haptics', component: 'CompoundRatingField', componentProps: { field: 'dualSenseHaptics', icon: Smartphone }, wikitextParam: 'playstation_haptics' },

                    {
                        key: 'input',
                        label: 'Connection Modes',
                        component: 'CompoundRatingField',
                        componentProps: {
                            field: 'playstationConnectionModes',
                            icon: Plug,
                            multiple: true,
                            options: [
                                'Wired',
                                'Wireless (Bluetooth)',
                                'Wireless (DualShock 4 USB Wireless Adapter)'
                            ]
                        },
                        wikitextParam: 'playstation_connection_modes'
                    },
                ]
            },
            {
                title: 'Nintendo',
                fields: [
                    { key: 'input', label: 'Nintendo Controllers', component: 'CompoundRatingField', componentProps: { field: 'nintendoControllers', icon: Gamepad2 }, wikitextParam: 'nintendo_controllers' },
                    {
                        key: 'input.nintendoControllerModels',
                        label: 'Controller Models',
                        component: 'MultiSelect',
                        wikitextParam: 'nintendo_controllers_models',
                        componentProps: {
                            placeholder: 'Select models...',
                            options: [
                                'Nintendo Switch 2 Pro Controller',
                                'Joy-Con 2 (Pair)',
                                'Joy-Con 2 (L)',
                                'Joy-Con 2 (R)',
                                'Nintendo Switch Pro Controller',
                                'Joy-Con (Pair)',
                                'Joy-Con (L)',
                                'Joy-Con (R)',
                                'Wii U Pro Controller',
                                'Wii Classic Controller',
                                'Wii Remote',
                                'Wii Remote MotionPlus',
                                'Wii Remote + Nunchuck',
                                'Wii Remote MotionPlus + Nunchuck',
                                'GameCube Controller'
                            ]
                        }
                    },
                    { key: 'input', label: 'Nintendo Prompts', component: 'CompoundRatingField', componentProps: { field: 'nintendoPrompts', icon: Box }, wikitextParam: 'prompts_nintendo' },
                    { key: 'input', label: 'Button Layout', component: 'CompoundRatingField', componentProps: { field: 'nintendoButtonLayout', icon: Settings }, wikitextParam: 'nintendo_button_layout' },
                    { key: 'input', label: 'Motion Sensors', component: 'CompoundRatingField', componentProps: { field: 'nintendoMotionSensors', icon: Move }, wikitextParam: 'nintendo_motion_sensors' },
                    {
                        key: 'input.nintendoMotionSensorsModes',
                        label: 'Motion Sensor Modes',
                        component: 'MultiSelect',
                        wikitextParam: 'nintendo_motion_sensors_modes',
                        componentProps: {
                            placeholder: 'Select modes...',
                            options: ['Camera', 'Cursor', 'Gesture']
                        }
                    },

                    {
                        key: 'input',
                        label: 'Connection Modes',
                        component: 'CompoundRatingField',
                        componentProps: {
                            field: 'nintendoConnectionModes',
                            icon: Plug,
                            multiple: true,
                            options: [
                                'Wired',
                                'Wireless (Bluetooth)',
                                'Wired (GameCube Controller USB Adapter)'
                            ]
                        },
                        wikitextParam: 'nintendo_connection_modes'
                    },
                ]
            },
            {
                title: 'Steam Input',
                fields: [
                    { key: 'input', label: 'Steam Input API', component: 'CompoundRatingField', componentProps: { field: 'steamInputApi', icon: Box }, wikitextParam: 'steam_input_api' },
                    { key: 'input', label: 'Steam Hook Input', component: 'CompoundRatingField', componentProps: { field: 'steamHookInput', icon: Box }, wikitextParam: 'steam_hook_input' },
                    { key: 'input', label: 'Steam Input Prompts', component: 'CompoundRatingField', componentProps: { field: 'steamInputPrompts', icon: Box }, wikitextParam: 'prompts_steam_input' },
                    {
                        key: 'input.steamInputPromptsIcons',
                        label: 'Prompts Icons',
                        component: 'MultiSelect',
                        wikitextParam: 'prompts_steam_input_icons',
                        componentProps: {
                            placeholder: 'Select icons...',
                            showIcons: true,
                            options: ['Xbox', 'PlayStation', 'Nintendo', 'Steam', 'Generic', 'Universal', 'False', 'Unknown']
                        }
                    },
                    {
                        key: 'input.steamInputPromptsStyles',
                        label: 'Prompts Styles',
                        component: 'MultiSelect',
                        wikitextParam: 'prompts_steam_input_styles',
                        componentProps: {
                            placeholder: 'Select styles...',
                            options: ['SIAPI Button Icons', 'In-Game Button Icons']
                        }
                    },

                    { key: 'input', label: 'Steam Deck Prompts', component: 'CompoundRatingField', componentProps: { field: 'steamDeckPrompts', icon: Tablet }, wikitextParam: 'prompts_steam_deck' },
                    { key: 'input', label: 'Steam Controller Prompts', component: 'CompoundRatingField', componentProps: { field: 'steamControllerPrompts', icon: Gamepad2 }, wikitextParam: 'prompts_steam_controller' },
                    {
                        key: 'input',
                        label: 'Motion Sensors',
                        component: 'CompoundRatingField',
                        wikitextParam: 'steam_input_motion_sensors',
                        componentProps: {
                            field: 'steamInputMotionSensors',
                            icon: Move
                        }
                    },
                    {
                        key: 'input.steamInputMotionSensorsModes',
                        label: 'Motion Sensor Modes',
                        component: 'MultiSelect',
                        wikitextParam: 'steam_input_motion_sensors_modes',
                        componentProps: {
                            placeholder: 'Select modes...',
                            options: ['Camera (SIAPI Game Action)', 'Cursor (SIAPI Game Action)']
                        }
                    },
                    { key: 'input', label: 'Steam Input Presets', component: 'CompoundRatingField', componentProps: { field: 'steamInputPresets', icon: Settings }, wikitextParam: 'steam_input_presets' },
                    { key: 'input', label: 'Cursor Detection', component: 'CompoundRatingField', componentProps: { field: 'steamCursorDetection', icon: Search }, wikitextParam: 'steam_cursor_detection' },
                ]
            },
            {
                title: 'Other / Misc',
                fields: [
                    { key: 'input', label: 'Tracked Motion', component: 'CompoundRatingField', componentProps: { field: 'trackedMotionControllers', icon: Hand }, wikitextParam: 'tracked_motion_controllers' },
                    { key: 'input', label: 'Tracked Motion Prompts', component: 'CompoundRatingField', componentProps: { field: 'trackedMotionPrompts', icon: Box }, wikitextParam: 'prompts_tracked_motion' },
                    { key: 'input', label: 'Other Controllers', component: 'CompoundRatingField', componentProps: { field: 'otherControllers', icon: Gamepad2 }, wikitextParam: 'other_controllers' },
                    { key: 'input', label: 'Other Button Prompts', component: 'CompoundRatingField', componentProps: { field: 'otherButtonPrompts', icon: Box, multiple: true, options: ['Xbox', 'PlayStation', 'Nintendo', 'Steam', 'Generic', 'Universal', 'False', 'Unknown'] }, wikitextParam: 'other_button_prompts' },
                    { key: 'input', label: 'Digital Movement', component: 'CompoundRatingField', componentProps: { field: 'digitalMovementSupported', icon: Monitor }, wikitextParam: 'digital_movement_supported' },

                    { key: 'input', label: 'Peripheral Devices', component: 'CompoundRatingField', componentProps: { field: 'peripheralDevices', icon: Settings }, wikitextParam: 'peripheral_devices' },
                    {
                        key: 'input.peripheralDeviceTypes',
                        label: 'Peripheral Types',
                        component: 'MultiSelect',
                        wikitextParam: 'peripheral_devices_types',
                        icon: Settings,
                        componentProps: {
                            placeholder: 'Select types...',
                            options: ['Arcade Controller', 'Flight Stick', 'Instruments Controller', 'Racing Wheels'],
                            showIcons: true
                        }
                    },

                    { key: 'input', label: 'Input Prompt Override', component: 'CompoundRatingField', componentProps: { field: 'inputPromptOverride', icon: Zap }, wikitextParam: 'input_prompt_override' },
                ]
            }
        ]
    },
    {
        id: 'network',
        title: 'Network',
        icon: Wifi,
        iconClass: 'text-purple-500', // Adjust color if needed
        order: 10, // Adjust order
        groups: [
            {
                title: 'Local Play',
                fields: [
                    { key: 'network', label: 'Local Play', component: 'CompoundRatingField', wikitextParam: 'local_play', componentProps: { field: 'localPlay', icon: Users } },
                    { key: 'network.localPlayPlayers', label: 'Players', component: 'InputText', wikitextParam: 'local_play_players', description: 'Number of players' },
                    {
                        key: 'network.localPlayModes',
                        label: 'Modes',
                        component: 'MultiSelect',
                        wikitextParam: 'local_play_modes',
                        description: 'e.g. Co-op, Versus',
                        componentProps: { options: ['Co-op', 'Hot-seat', 'Versus'] }
                    },
                ]
            },
            {
                title: 'LAN Play',
                fields: [
                    { key: 'network', label: 'LAN Play', component: 'CompoundRatingField', wikitextParam: 'lan_play', componentProps: { field: 'lanPlay', icon: Users } },
                    { key: 'network.lanPlayPlayers', label: 'Players', component: 'InputText', wikitextParam: 'lan_play_players', description: 'Number of players' },
                    {
                        key: 'network.lanPlayModes',
                        label: 'Modes',
                        component: 'MultiSelect',
                        wikitextParam: 'lan_play_modes',
                        description: 'e.g. Co-op, Versus',
                        componentProps: { options: ['Co-op', 'Hot-seat', 'Versus'] }
                    },
                ]
            },
            {
                title: 'Online Play',
                fields: [
                    { key: 'network', label: 'Online Play', component: 'CompoundRatingField', wikitextParam: 'online_play', componentProps: { field: 'onlinePlay', icon: Globe } },
                    { key: 'network.onlinePlayPlayers', label: 'Players', component: 'InputText', wikitextParam: 'online_play_players', description: 'Number of players' },
                    {
                        key: 'network.onlinePlayModes',
                        label: 'Modes',
                        component: 'MultiSelect',
                        wikitextParam: 'online_play_modes',
                        description: 'e.g. Co-op, Versus',
                        componentProps: { options: ['Co-op', 'Hot-seat', 'Versus'] }
                    },
                ]
            },
            {
                title: 'Misc & Crossplay',
                fields: [
                    { key: 'network', label: 'Asynchronous', component: 'CompoundRatingField', wikitextParam: 'asynchronous', componentProps: { field: 'asynchronous', icon: Clock } },
                    { key: 'network', label: 'Crossplay', component: 'CompoundRatingField', wikitextParam: 'crossplay', componentProps: { field: 'crossplay', icon: GitFork } },
                    {
                        key: 'network.crossplayPlatforms',
                        label: 'Crossplay Platforms',
                        component: 'MultiSelect',
                        wikitextParam: 'crossplay_platforms',
                        description: 'e.g. Windows, PS5, Xbox Series X',
                        componentProps: {
                            options: [
                                // Microsoft
                                'Xbox 360',
                                'Xbox One',
                                'Xbox Series',
                                'Windows Phone',
                                // Sony
                                'PlayStation 2',
                                'PlayStation 3',
                                'PlayStation 4',
                                'PlayStation 5',
                                'PlayStation Vita',
                                // Nintendo
                                'Wii U',
                                'Nintendo Switch',
                                'Nintendo Switch 2',
                                'Nintendo 3DS',
                                // Apple
                                'iOS',
                                'Apple II',
                                // Google
                                'Android',
                                // Meta
                                'Meta',
                                // SEGA
                                'SEGA Dreamcast',
                                // Misc
                                'Atari ST',
                                'Commodore 64',
                                'Commodore Amiga',
                                'ZX Spectrum'
                            ]
                        }
                    },
                ]
            },
            {
                title: 'Connection Types',
                fields: [
                    { key: 'network', label: 'Matchmaking', component: 'CompoundRatingField', wikitextParam: 'matchmaking', componentProps: { field: 'matchmaking', icon: Users } },
                    { key: 'network', label: 'Peer-to-Peer', component: 'CompoundRatingField', wikitextParam: 'p2p', componentProps: { field: 'p2p', icon: RefreshCcw } },
                    { key: 'network', label: 'Dedicated', component: 'CompoundRatingField', wikitextParam: 'dedicated', componentProps: { field: 'dedicated', icon: Monitor } },
                    { key: 'network', label: 'Self-hosting', component: 'CompoundRatingField', wikitextParam: 'self_hosting', componentProps: { field: 'selfHosting', icon: Monitor } },
                    { key: 'network', label: 'Direct IP', component: 'CompoundRatingField', wikitextParam: 'direct_ip', componentProps: { field: 'directIp', icon: Globe } },
                ]
            },
            {
                title: 'Ports',
                fields: [
                    { key: 'network.tcpPorts', label: 'TCP Ports', component: 'InputText', wikitextParam: 'tcp_ports', description: 'Comma separated ports' },
                    { key: 'network.udpPorts', label: 'UDP Ports', component: 'InputText', wikitextParam: 'udp_ports', description: 'Comma separated ports' },
                    { key: 'network', label: 'UPnP', component: 'CompoundRatingField', wikitextParam: 'upnp', componentProps: { field: 'upnp', icon: Plug } },
                ]
            }
        ]
    },
    {
        id: 'vr',
        title: 'VR Support',
        icon: Eye,
        iconClass: 'text-indigo-500',
        order: 11,
        groups: [
            {
                title: '3D Modes',
                fields: [
                    { key: 'vr', label: 'Native 3D', component: 'CompoundRatingField', wikitextParam: 'native 3d', componentProps: { field: 'native3d', icon: Box } },
                    { key: 'vr', label: 'Nvidia 3D Vision', component: 'CompoundRatingField', wikitextParam: 'nvidia 3d vision', componentProps: { field: 'nvidia3dVision', icon: Monitor } },
                    { key: 'vr', label: 'vorpX', component: 'CompoundRatingField', wikitextParam: 'vorpx', componentProps: { field: 'vorpx', icon: Monitor } },
                    {
                        key: 'vr.vorpxModes',
                        label: 'vorpX Modes',
                        component: 'InputText',
                        wikitextParam: 'vorpx modes',
                        description: 'Supported modes',
                        showIf: (m: any) => m.vr?.vorpx && m.vr.vorpx.value === 'true',
                        componentProps: { placeholder: 'e.g. Z3D, G3D' }
                    },
                    { key: 'vr', label: 'VR Only', component: 'CompoundRatingField', wikitextParam: 'vr only', componentProps: { field: 'vrOnly', icon: Headset } },
                ]
            },
            {
                title: 'Headsets',
                fields: [
                    { key: 'vr', label: 'OpenXR', component: 'CompoundRatingField', wikitextParam: 'openxr', componentProps: { field: 'openXr', icon: Headset } },
                    { key: 'vr', label: 'SteamVR', component: 'CompoundRatingField', wikitextParam: 'steamvr', componentProps: { field: 'steamVr', icon: Headset } },
                    { key: 'vr', label: 'Oculus', component: 'CompoundRatingField', wikitextParam: 'oculusvr', componentProps: { field: 'oculusVr', icon: Headset } },
                    { key: 'vr', label: 'Windows Mixed Reality', component: 'CompoundRatingField', wikitextParam: 'windows mixed reality', componentProps: { field: 'windowsMixedReality', icon: Headset } },
                    { key: 'vr', label: 'OSVR', component: 'CompoundRatingField', wikitextParam: 'osvr', componentProps: { field: 'osvr', icon: Headset } },
                    { key: 'vr', label: 'Forte VFX1', component: 'CompoundRatingField', wikitextParam: 'forte vfx1', componentProps: { field: 'forteNsx1', icon: Headset } },
                ]
            },
            {
                title: 'Input',
                fields: [
                    { key: 'vr', label: 'Keyboard & Mouse', component: 'CompoundRatingField', wikitextParam: 'keyboard-mouse', componentProps: { field: 'keyboardMouse', icon: Keyboard } },
                    { key: 'vr', label: 'Body Tracking', component: 'CompoundRatingField', wikitextParam: 'body tracking', componentProps: { field: 'bodyTracking', icon: Users } },
                    { key: 'vr', label: 'Hand Tracking', component: 'CompoundRatingField', wikitextParam: 'hand tracking', componentProps: { field: 'handTracking', icon: Move } },
                    { key: 'vr', label: 'Face Tracking', component: 'CompoundRatingField', wikitextParam: 'face tracking', componentProps: { field: 'faceTracking', icon: Eye } },
                    { key: 'vr', label: 'Eye Tracking', component: 'CompoundRatingField', wikitextParam: 'eye tracking', componentProps: { field: 'eyeTracking', icon: Eye } },
                    { key: 'vr', label: 'Tobii Eye Tracking', component: 'CompoundRatingField', wikitextParam: 'tobii eye tracking', componentProps: { field: 'tobiiEyeTracking', icon: Eye } },
                    { key: 'vr', label: 'TrackIR', component: 'CompoundRatingField', wikitextParam: 'trackir', componentProps: { field: 'trackIr', icon: Eye } },
                    { key: 'vr', label: '3rd Space Gaming Vest', component: 'CompoundRatingField', wikitextParam: '3rd space gaming vest', componentProps: { field: 'thirdSpaceGamingVest', icon: Zap } },
                    { key: 'vr', label: 'Novint Falcon', component: 'CompoundRatingField', wikitextParam: 'novint falcon', componentProps: { field: 'novintFalcon', icon: Gamepad2 } },
                ]
            },
            {
                title: 'Play Area',
                fields: [
                    { key: 'vr', label: 'Seated', component: 'CompoundRatingField', wikitextParam: 'play area seated', componentProps: { field: 'playAreaSeated', icon: CheckCircle } },
                    { key: 'vr', label: 'Standing', component: 'CompoundRatingField', wikitextParam: 'play area standing', componentProps: { field: 'playAreaStanding', icon: CheckCircle } },
                    { key: 'vr', label: 'Room-scale', component: 'CompoundRatingField', wikitextParam: 'play area room-scale', componentProps: { field: 'playAreaRoomScale', icon: Box } },
                ]
            }
        ]
    },

    {
        id: 'api',
        title: 'API Support',
        icon: Settings,
        iconClass: 'text-gray-500',
        order: 13,
        groups: [
            {
                title: 'Graphics Support',
                fields: [
                    { key: 'api', label: 'Direct3D', component: 'CompoundRatingField', wikitextParam: 'dx', componentProps: { field: 'dxVersion', notesField: 'dxNotes', refField: 'dxRef', icon: Monitor, freeText: true } },
                    { key: 'api', label: 'DirectDraw', component: 'CompoundRatingField', wikitextParam: 'directdraw versions', componentProps: { field: 'directDrawVersion', notesField: 'directDrawNotes', refField: 'directDrawRef', icon: Pencil, freeText: true } },
                    { key: 'api', label: 'WinG', component: 'CompoundRatingField', wikitextParam: 'wing', componentProps: { field: 'wing', icon: AppWindow } },
                    { key: 'api', label: 'OpenGL', component: 'CompoundRatingField', wikitextParam: 'opengl', componentProps: { field: 'openGlVersion', notesField: 'openGlNotes', refField: 'openGlRef', icon: Globe, freeText: true } },
                    { key: 'api', label: 'Glide', component: 'CompoundRatingField', wikitextParam: 'glide versions', componentProps: { field: 'glideVersion', notesField: 'glideNotes', refField: 'glideRef', icon: Send, freeText: true } },
                    { key: 'api', label: 'Software Mode', component: 'CompoundRatingField', wikitextParam: 'software mode', componentProps: { field: 'softwareMode', icon: Cpu } },
                    { key: 'api', label: 'Mantle', component: 'CompoundRatingField', wikitextParam: 'mantle support', componentProps: { field: 'mantle', icon: Box } },
                    { key: 'api', label: 'Vulkan', component: 'CompoundRatingField', wikitextParam: 'vulkan', componentProps: { field: 'vulkanVersion', notesField: 'vulkanNotes', refField: 'vulkanRef', icon: Zap, freeText: true } },
                    { key: 'api', label: 'Metal', component: 'CompoundRatingField', wikitextParam: 'metal support', componentProps: { field: 'metal', icon: AppWindow } },

                    { key: 'api', label: 'DOS Modes', component: 'CompoundRatingField', wikitextParam: 'dos modes', componentProps: { field: 'dosModes', icon: Terminal, freeText: true } },
                ]
            },
            {
                title: 'Operating System Support',
                fields: [
                    {
                        key: 'api',
                        label: '',
                        component: 'OperatingSystemSupportForm',
                        wikitextParam: '', // Managed internally by component/mappings
                    },
                ]
            }
        ]
    },
    {
        id: 'middleware',
        title: 'Middleware',
        icon: Settings, // Or something else
        iconClass: 'text-orange-500',
        order: 14,
        groups: [
            {
                title: 'Middleware',
                fields: [
                    { key: 'middleware', label: 'Physics', component: 'CompoundRatingField', wikitextParam: 'physics', componentProps: { field: 'physics', icon: Zap, freeText: true } },
                    { key: 'middleware', label: 'Audio', component: 'CompoundRatingField', wikitextParam: 'audio', componentProps: { field: 'audio', icon: Volume2, freeText: true } },
                    { key: 'middleware', label: 'Interface', component: 'CompoundRatingField', wikitextParam: 'interface', componentProps: { field: 'interface', icon: Layout, freeText: true } },
                    { key: 'middleware', label: 'Input', component: 'CompoundRatingField', wikitextParam: 'input', componentProps: { field: 'input', icon: Gamepad2, freeText: true } },
                    { key: 'middleware', label: 'Cutscenes', component: 'CompoundRatingField', wikitextParam: 'cutscenes', componentProps: { field: 'cutscenes', icon: Film, freeText: true } },
                    { key: 'middleware', label: 'Multiplayer', component: 'CompoundRatingField', wikitextParam: 'multiplayer', componentProps: { field: 'multiplayer', icon: Users, freeText: true } },
                    { key: 'middleware', label: 'Anticheat', component: 'CompoundRatingField', wikitextParam: 'anticheat', componentProps: { field: 'anticheat', icon: Shield, freeText: true } },
                ]
            }
        ]
    },
    {
        id: 'system_requirements',
        title: 'System Requirements',
        icon: Cpu,
        iconClass: 'text-gray-500',
        order: 15,
        isCustomSection: true,
        templateName: 'SystemRequirements',
        fields: [
            {
                key: 'requirements',
                label: 'System Requirements',
                component: 'SystemRequirementsForm',
                wikitextParam: 'system_requirements',
                defaultValue: {}
            }
        ]
    },
    {
        id: 'localizations',
        title: 'Localizations',
        icon: Globe,
        iconClass: 'text-green-500',
        order: 16,
        isCustomSection: true,
        templateName: 'Localizations',
        fields: [
            {
                key: 'localizations',
                label: 'Localizations',
                component: 'LocalizationsForm',
                wikitextParam: 'localizations',
                defaultValue: []
            }
        ]
    }
];
