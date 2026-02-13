import { SectionDefinition, FieldDefinition } from '../types/schema';
import { FieldComponent } from '../types/components';
import {
    Info, Save, Image, IdCard, Users, Building, Calendar,
    ShoppingCart, ShoppingBag, Globe, Terminal, Box,
    File, AlignLeft, SlidersHorizontal, AlignCenter, Captions, VolumeX, CheckCircle, Volume2,
    GitFork, Tags, AlertCircle, Brush, Trash2, Gamepad2, DollarSign, PlusCircle, Star,
    Monitor, Grid2X2, Maximize, Minimize, ScanLine, LineChart, ArrowUpRight, FastForward, RefreshCcw, Clock, Zap, Sun, Sparkles, Palette, Eye,
    Keyboard, Move, MousePointerClick, ArrowUpDown, Tablet, Settings, Plug, Smartphone, Search, Hand, Wifi, Headset,
    Pencil, Send, AppWindow, Cpu, Shield, Layout, Film, Server, MessageCircle
} from 'lucide-vue-next';
import { FIELD_DEFINITIONS } from './fieldDefinitions';
import * as h from './fieldHelpers';

// Helper to merge metadata with UI options
// e.g. f('cover', { component: 'CoverImageField', label: 'Cover' })
const f = <C extends FieldComponent>(
    id: string,
    uiOptions: C & Omit<Partial<FieldDefinition>, 'component' | 'componentProps'>
): FieldDefinition => {
    const meta = FIELD_DEFINITIONS[id];
    if (!meta) {
        console.warn(`Missing metadata for field: ${id}`);
        // Return uiOptions as fallback, assuming it has required props if metadata is missing
        return { key: id, ...uiOptions } as FieldDefinition;
    }
    // Metadata takes precedence for data logic, UI options for display
    return {
        key: id,
        ...uiOptions,
        wikitextParam: meta.wikitextParam,
        defaultValue: meta.defaultValue,
        parser: meta.parser,
        formatter: meta.formatter,
        writer: meta.writer
    } as FieldDefinition;
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
                    f('cover', h.cover('Cover Image Filename', {
                        placeholder: 'e.g. GAME TITLE cover.jpg'
                    }, {
                        icon: Image,
                        description: "Search PCGW files or enter name. Click Upload to add new."
                    })),
                    f('license', h.select('License', {
                        placeholder: 'Select license',
                        options: [
                            { label: 'Commercial', value: 'commercial', description: 'Proprietary software sold commercially' },
                            { label: 'Freeware', value: 'freeware', description: 'Free to use but proprietary' },
                            { label: 'Open Source / Free Software', value: 'open source', description: 'Free and open source licensed' },
                            { label: 'Abandonware', value: 'abandonware', description: 'No longer supported or sold' },
                            { label: 'Donationware', value: 'donationware', description: 'Free with optional donations' },
                            { label: 'Shareware', value: 'shareware', description: 'Try before you buy' },
                        ]
                    }, {
                        icon: IdCard,
                        iconClass: 'text-orange-500',
                        description: "The licensing model of the game."
                    })),
                    f('developers', h.developers('Developers', {
                        dataSource: 'companies',
                        placeholder: 'Search for developers...'
                    }, {
                        icon: Users,
                        description: 'The entity that created the game.'
                    })),
                    f('publishers', h.publishers('Publishers', {
                        dataSource: 'companies',
                        placeholder: 'Search for publishers...'
                    }, {
                        icon: Building,
                        description: 'The entity that published the game.'
                    })),
                    f('engines', h.engines('Engines', {
                        placeholder: 'Search for engines...'
                    }, {
                        description: 'The game engine used.',
                        colSpan: 2
                    })),
                    f('releaseDates', h.releaseDates('Release Dates', {
                        icon: Calendar,
                        description: 'Original release dates for each platform.',
                        colSpan: 2
                    }))
                ]
            },
            {
                title: 'Reception',
                fields: [
                    f('reception', h.reception('Reception', {
                        description: 'Review scores from various aggregators.'
                    }))
                ]
            },
            {
                title: 'Taxonomy',
                gridCols: 'repeat(auto-fill, minmax(350px, 1fr))',
                fields: [
                    f('taxonomy.monetization', h.taxonomy('Monetization', { dataSource: 'monetization', placeholder: 'Select...' }, { description: 'Primary business model(s)' })),
                    f('taxonomy.microtransactions', h.taxonomy('Microtransactions', { dataSource: 'microtransactions', placeholder: 'Select...' }, { description: 'Type of in-game purchases' })),
                    f('taxonomy.modes', h.taxonomy('Modes', { dataSource: 'modes', placeholder: 'Select...' }, { description: 'Available game modes' })),
                    f('taxonomy.pacing', h.taxonomy('Pacing', { dataSource: 'pacing', placeholder: 'Select...' }, { description: 'Game pacing type' })),
                    f('taxonomy.perspectives', h.taxonomy('Perspectives', { dataSource: 'perspectives', placeholder: 'Select...' }, { description: 'Camera perspectives' })),
                    f('taxonomy.controls', h.taxonomy('Controls', { dataSource: 'controls', placeholder: 'Select...' }, { description: 'Control scheme type' })),
                    f('taxonomy.genres', h.taxonomy('Genres', { dataSource: 'genres', placeholder: 'Select...' }, { description: 'Game genre(s)' })),
                    f('taxonomy.sports', h.taxonomy('Sports', { dataSource: 'sports', placeholder: 'Select...' }, { description: 'Sports category' })),
                    f('taxonomy.vehicles', h.taxonomy('Vehicles', { dataSource: 'vehicles', placeholder: 'Select...' }, { description: 'Vehicle types' })),
                    f('taxonomy.artStyles', h.taxonomy('Art Styles', { dataSource: 'artStyles', placeholder: 'Select...' }, { description: 'Visual art style' })),
                    f('taxonomy.themes', h.taxonomy('Themes', { dataSource: 'themes', placeholder: 'Select...' }, { description: 'Story/setting themes' })),
                    f('taxonomy.series', h.taxonomy('Series', { dataSource: 'series', placeholder: 'Select...' }, { description: 'Game series/franchise' })),
                ]
            },
            {
                title: 'External Links',
                gridCols: 3,
                fields: [
                    f('links.steamAppId', h.text('Steam App ID', { placeholder: 'e.g. 220' }, { icon: ShoppingCart, iconClass: 'text-blue-500', description: 'Numeric ID from URL' })),
                    f('links.steamAppIdSide', h.text('Steam Side Param', { placeholder: 'e.g. sub/123' }, { description: 'Optional side parameter' })),
                    f('links.officialSite', h.text('Official Site', { placeholder: 'https://...' }, { icon: Globe, iconClass: 'text-green-500', description: 'URL to official website' })),

                    f('links.gogComId', h.text('GOG.com ID', { placeholder: 'e.g. game_title' }, { icon: ShoppingBag, iconClass: 'text-purple-500', description: 'Slug from URL' })),
                    f('links.gogComIdSide', h.text('GOG Side Param', { placeholder: '' }, { description: 'Optional side parameter' })),
                    f('links.hltb', h.text('HLTB ID', { placeholder: 'e.g. 12345' }, { description: 'HowLongToBeat ID' })),

                    f('links.igdb', h.text('IGDB Slug', { placeholder: 'e.g. game-title' }, { description: 'Slug from IGDB URL' })),
                    f('links.mobygames', h.text('MobyGames Slug', { placeholder: 'e.g. game-title' }, { description: 'Slug from MobyGames URL' })),
                    f('links.strategyWiki', h.text('StrategyWiki', { placeholder: 'e.g. Game_Title' }, { description: 'Slug from StrategyWiki' })),

                    f('links.wikipedia', h.text('Wikipedia', { placeholder: 'e.g. Game Title' }, { description: 'Article title' })),
                    f('links.vndb', h.text('VNDB ID', { placeholder: 'e.g. v123' }, { description: 'ID starting with v' })),
                    f('links.lutris', h.text('Lutris Slug', { placeholder: 'e.g. game-title' }, { icon: Terminal, iconClass: 'text-orange-500', description: 'Slug from Lutris' })),

                    f('links.wineHq', h.text('WineHQ Slug', { placeholder: 'e.g. 1234' }, { icon: Box, iconClass: 'text-red-500', description: 'ID from WineHQ AppDB' })),
                    f('links.wineHqSide', h.text('WineHQ Side Param', { placeholder: '' }, { description: 'Optional side parameter' }))
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
                    f('articleState.disambig', h.text('Disambiguation', { placeholder: 'e.g. the original game' }, { icon: GitFork, description: 'Used to distinguish movies/books or other games with the same name.' })),
                    f('articleState.distinguish', h.chips('Distinguish', { placeholder: 'Type page name and press enter' }, { icon: Tags, description: 'List closely related but not identical titles.' })),
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
                    f('articleState.stub', h.checkbox('Stub', { binary: true }, { icon: AlertCircle, iconClass: 'text-yellow-500', description: 'Missing minimum requirements.' })),
                    f('articleState.cleanup', h.checkbox('Needs Cleanup', { binary: true }, { icon: Brush, iconClass: 'text-orange-500', description: 'Formatting or outdated content.' })),
                    f('articleState.cleanupDescription', h.textarea('Cleanup Reason', { rows: 2, autoResize: true, placeholder: 'Reason for cleanup...' }, { showIf: (m: any) => m.articleState?.cleanup, colSpan: 2 })),
                    f('articleState.delete', h.checkbox('Delete Request', { binary: true }, { icon: Trash2, iconClass: 'text-red-500', description: 'Remove this page from wiki.' })),
                    f('articleState.deleteReason', h.textarea('Deletion Reason', { rows: 2, autoResize: true, placeholder: 'Reason for deletion...' }, { showIf: (m: any) => m.articleState?.delete, colSpan: 2 }))
                ]
            },
            {
                title: 'Development State',
                fields: [
                    f('articleState.state', h.select('Game State', {
                        options: [
                            { label: 'None', value: '', icon: '⚪', description: 'No development status' },
                            { label: 'Prototype', value: 'prototype', icon: '🔬', description: 'Prototype version' },
                            { label: 'Development / Early Access', value: 'dev', icon: '🚧', description: 'Active development or EA' },
                            { label: 'Post-Development', value: 'postdev', icon: '🔄', description: 'Continued development post-release' },
                            { label: 'Unknown', value: 'unknown', icon: '❓', description: 'No updates, unlikely' },
                            { label: 'Abandoned', value: 'abandoned', icon: '💀', description: 'Officially cancelled' },
                            { label: 'Unplayable', value: 'unplayable', icon: '🚫', description: 'Servers shut down' },
                        ]
                    }, {
                        icon: Gamepad2
                    }))
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
            f('introduction.introduction', h.textarea('Introduction', {
                rows: 4,
                autoResize: true,
                placeholder: "'''''Title''''' is a..."
            }, {
                description: "The first instance of the game title in introduction should be written as '''''Title'''''",
                colSpan: 2
            })),
            f('introduction.releaseHistory', h.textarea('Release History', {
                rows: 4,
                autoResize: true,
                placeholder: "'''Title''' was released on..."
            }, {
                description: "Notes about the original release, re-releases, and ports.",
                colSpan: 2
            }))
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
            f('availability', h.custom('Availability', 'AvailabilityForm'))
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
            f('monetization.oneTimePurchase', { label: 'One-time Game Purchase', component: 'InputText', description: 'Requires upfront purchase to access.' }),
            f('monetization.freeToPlay', { label: 'Free-to-play', component: 'InputText', description: 'Access significant portion without paying.' }),
            f('monetization.freeware', { label: 'Freeware', component: 'InputText', description: 'Completely free in its entirety.' }),
            f('monetization.adSupported', { label: 'Ad-supported', component: 'InputText', description: 'Ads that are not part of gameplay.' }),
            f('monetization.subscription', { label: 'Subscription', component: 'InputText', description: 'Game-specific periodic payment.' }),
            f('monetization.subscriptionGamingService', { label: 'Subscription Gaming Service', component: 'InputText', description: 'Part of a collection/service (Game Pass).' }),
            f('monetization.dlc', { label: 'DLC', component: 'InputText', description: 'Additional maps, levels, quests.' }),
            f('monetization.expansionPack', { label: 'Expansion Pack', component: 'InputText', description: 'Large campaigns, significant new content.' }),
            f('monetization.crossGameBonus', { label: 'Cross-game Bonus', component: 'InputText', description: 'Bonuses for owning/playing other games.' }),
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
            f('microtransactions.none', { label: 'None', component: 'InputText', description: 'Standard: No microtransactions present.' }),
            f('microtransactions.cosmetic', { label: 'Cosmetic', component: 'InputText', description: 'Items that do not affect gameplay.' }),
            f('microtransactions.currency', { label: 'Currency', component: 'InputText', description: 'Bought with real money.' }),
            f('microtransactions.lootBox', { label: 'Loot Box', component: 'InputText', description: 'Randomized purchase for items.' }),
            f('microtransactions.unlock', { label: 'Unlock', component: 'InputText', description: 'Content that affects gameplay.' }),
            f('microtransactions.boost', { label: 'Boost', component: 'InputText', description: 'Accelerate speed, levelling, or skips.' }),
            f('microtransactions.freeToGrind', { label: 'Free-to-grind', component: 'InputText', description: 'Can unlock everything by playing.' }),
            f('microtransactions.finiteSpend', { label: 'Finite Spend', component: 'InputText', description: 'Fixed number of items to buy.' }),
            f('microtransactions.infiniteSpend', { label: 'Infinite Spend', component: 'InputText', description: 'Can be bought over and over.' }),
            f('microtransactions.playerTrading', { label: 'Player Trading', component: 'InputText', description: 'Trading items/currency between players.' }),
            f('microtransactions.timeLimited', { label: 'Time-limited', component: 'InputText', description: 'Exclusive to a specific time/promo.' }),
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
            f('dlc', {
                label: 'DLC',
                component: 'DLCForm'
            })
        ]
    },
    {
        id: 'essentialImprovements',
        title: 'Essential Improvements',
        icon: Star,
        iconClass: 'text-yellow-500',
        order: 7,
        fields: [
            f('essentialImprovements', {
                label: 'Essential Improvements',
                component: 'WikitextEditor',
                description: 'Patches, intro skip methods, major community mods, game-specific utilities.',
                componentProps: {
                    rows: 10,
                }
            })
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
                    f('audio.separateVolume', { key: 'audio', label: 'Separate Volume Controls', component: 'CompoundRatingField', description: 'Can audio types be adjusted individually?', componentProps: { field: 'separateVolume', label: 'Separate Volume Controls', icon: SlidersHorizontal } }),
                    f('audio.surroundSound', { key: 'audio', label: 'Surround Sound', component: 'CompoundRatingField', description: 'Surround sound support (5.1, 7.1, etc.)', componentProps: { field: 'surroundSound', label: 'Surround Sound', icon: Volume2 } }),
                    f('audio.subtitles', { key: 'audio', label: 'Subtitles', component: 'CompoundRatingField', description: 'Subtitle support for dialogue/cutscenes.', componentProps: { field: 'subtitles', label: 'Subtitles', icon: AlignCenter } }),
                    f('audio.closedCaptions', { key: 'audio', label: 'Closed Captions', component: 'CompoundRatingField', description: 'Support for closed captions (sound effects text).', componentProps: { field: 'closedCaptions', label: 'Closed Captions', icon: Captions } }),
                    f('audio.muteOnFocusLost', { key: 'audio', label: 'Mute on Focus Lost', component: 'CompoundRatingField', description: 'Does game mute when alt-tabbed?', componentProps: { field: 'muteOnFocusLost', label: 'Mute on Focus Lost', icon: VolumeX } }),
                    f('audio.royaltyFree', { key: 'audio', label: 'Royalty Free Audio', component: 'CompoundRatingField', description: 'Is the audio safe for streaming/recording?', componentProps: { field: 'royaltyFree', label: 'Royalty Free Audio', icon: CheckCircle } }),
                ]
            },
            {
                title: 'API',
                fields: [
                    f('audio.eaxSupport', { key: 'audio', label: 'EAX Support', component: 'CompoundRatingField', componentProps: { field: 'eaxSupport', label: 'EAX Support' } }),
                    f('audio.redBookCdAudio', { key: 'audio', label: 'Red Book CD Audio', component: 'CompoundRatingField', componentProps: { field: 'redBookCdAudio', label: 'Red Book CD Audio' } }),
                    f('audio.generalMidiAudio', { key: 'audio', label: 'General MIDI Audio', component: 'CompoundRatingField', componentProps: { field: 'generalMidiAudio', label: 'General MIDI Audio' } }),
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
                    f('config', {
                        label: 'Configuration',
                        component: 'GameDataForm'
                    })
                ]
            },
            {
                title: 'Save Game Cloud Syncing',
                fields: [
                    f('config.cloudSync.steamCloud', { key: 'config.cloudSync', label: 'Steam Cloud', component: 'CompoundRatingField', componentProps: { field: 'steamCloud', icon: Server } }),
                    f('config.cloudSync.discord', { key: 'config.cloudSync', label: 'Discord', component: 'CompoundRatingField', componentProps: { field: 'discord', icon: MessageCircle } }),
                    f('config.cloudSync.epicGamesLauncher', { key: 'config.cloudSync', label: 'Epic Games Launcher', component: 'CompoundRatingField', componentProps: { field: 'epicGamesLauncher', icon: Box } }),
                    f('config.cloudSync.gogGalaxy', { key: 'config.cloudSync', label: 'GOG Galaxy', component: 'CompoundRatingField', componentProps: { field: 'gogGalaxy', icon: Box } }),
                    f('config.cloudSync.eaApp', { key: 'config.cloudSync', label: 'EA App', component: 'CompoundRatingField', componentProps: { field: 'eaApp', icon: Box } }),
                    f('config.cloudSync.ubisoftConnect', { key: 'config.cloudSync', label: 'Ubisoft Connect', component: 'CompoundRatingField', componentProps: { field: 'ubisoftConnect', icon: Box } }),
                    f('config.cloudSync.xboxCloud', { key: 'config.cloudSync', label: 'Xbox Cloud', component: 'CompoundRatingField', componentProps: { field: 'xboxCloud', icon: AppWindow } }),
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
                    f('video.wsgfLink', { label: 'WSGF Link', component: 'InputText', description: 'Link to WSGF report' }),
                    f('video.widescreenWsgfAward', { label: 'Widescreen Award', component: 'InputText', description: 'Gold, Silver, etc.' }),
                    f('video.multiMonitorWsgfAward', { label: 'Multi-monitor Award', component: 'InputText', description: 'Gold, Silver, etc.' }),
                    f('video.ultraWidescreenWsgfAward', { label: 'Ultra-widescreen Award', component: 'InputText', description: 'Gold, Silver, etc.' }),
                    f('video.fourKUltraHdWsgfAward', { label: '4K Ultra HD Award', component: 'InputText', description: 'Gold, Silver, etc.' })
                ]
            },
            {
                title: 'Resolution & Display',
                fields: [
                    f('video.widescreenResolution', { key: 'video', label: 'Widescreen Resolution', component: 'CompoundRatingField', componentProps: { field: 'widescreenResolution', icon: Monitor } }),
                    f('video.multiMonitor', { key: 'video', label: 'Multi-monitor', component: 'CompoundRatingField', componentProps: { field: 'multiMonitor', icon: Grid2X2 } }),
                    f('video.ultraWidescreen', { key: 'video', label: 'Ultra-widescreen', component: 'CompoundRatingField', componentProps: { field: 'ultraWidescreen', icon: Maximize } }),
                    f('video.fourKUltraHd', { key: 'video', label: '4K Ultra HD', component: 'CompoundRatingField', componentProps: { field: 'fourKUltraHd', icon: Star } }),
                    f('video.fov', { key: 'video', label: 'Field of View (FOV)', component: 'CompoundRatingField', componentProps: { field: 'fov', icon: Eye } }),
                    f('video.windowed', { key: 'video', label: 'Windowed', component: 'CompoundRatingField', componentProps: { field: 'windowed', icon: Minimize } }),
                    f('video.borderlessWindowed', { key: 'video', label: 'Borderless Windowed', component: 'CompoundRatingField', componentProps: { field: 'borderlessWindowed', icon: Image } }),
                ]
            },
            {
                title: 'Graphics Settings',
                fields: [
                    f('video.anisotropic', { key: 'video', label: 'Anisotropic Filtering (AF)', component: 'CompoundRatingField', componentProps: { field: 'anisotropic', icon: ScanLine } }),
                    f('video.antiAliasing', { key: 'video', label: 'Anti-aliasing (AA)', component: 'CompoundRatingField', componentProps: { field: 'antiAliasing', icon: LineChart } }),

                    f('video.upscaling', { key: 'video', label: 'Upscaling', component: 'CompoundRatingField', componentProps: { field: 'upscaling', icon: ArrowUpRight } }),
                    f('video.upscalingTech', {
                        label: 'Upscaling Tech',
                        component: 'InputText',
                        showIf: (m: any) => m.video?.upscaling && m.video.upscaling.value !== 'false' && m.video.upscaling.value !== 'unknown' && m.video.upscaling.value !== 'n/a',
                        componentProps: { placeholder: 'Tech (e.g. DLSS 2, FSR 2)' }
                    }),

                    f('video.frameGen', { key: 'video', label: 'Frame Generation', component: 'CompoundRatingField', componentProps: { field: 'frameGen', icon: FastForward } }),
                    f('video.frameGenTech', {
                        label: 'Frame Gen Tech',
                        component: 'InputText',
                        showIf: (m: any) => m.video?.frameGen && m.video.frameGen.value !== 'false' && m.video.frameGen.value !== 'unknown' && m.video.frameGen.value !== 'n/a',
                        componentProps: { placeholder: 'Tech (e.g. DLSS 3, FSR 3)' }
                    }),

                    f('video.vsync', { key: 'video', label: 'VSync', component: 'CompoundRatingField', componentProps: { field: 'vsync', icon: RefreshCcw } }),
                    f('video.fps60', { key: 'video', label: '60 FPS', component: 'CompoundRatingField', componentProps: { field: 'fps60', icon: Clock } }),
                    f('video.fps120', { key: 'video', label: '120+ FPS', component: 'CompoundRatingField', componentProps: { field: 'fps120', icon: Zap } }),
                    f('video.hdr', { key: 'video', label: 'HDR', component: 'CompoundRatingField', componentProps: { field: 'hdr', icon: Sun } }),
                    f('video.rayTracing', { key: 'video', label: 'Ray Tracing', component: 'CompoundRatingField', componentProps: { field: 'rayTracing', icon: Sparkles } }),
                    f('video.colorBlind', { key: 'video', label: 'Color Blind Mode', component: 'CompoundRatingField', componentProps: { field: 'colorBlind', icon: Palette } }),
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
                    f('input.keyRemap', { key: 'input', label: 'Key Remapping', component: 'CompoundRatingField', componentProps: { field: 'keyRemap', icon: Keyboard } }),
                    f('input.keyboardMousePrompts', { key: 'input', label: 'Keyboard/Mouse Prompts', component: 'CompoundRatingField', componentProps: { field: 'keyboardMousePrompts', icon: Keyboard } }),
                    f('input.mouseSensitivity', { key: 'input', label: 'Mouse Sensitivity', component: 'CompoundRatingField', componentProps: { field: 'mouseSensitivity', icon: Move } }),
                    f('input.mouseMenu', { key: 'input', label: 'Mouse Menu', component: 'CompoundRatingField', componentProps: { field: 'mouseMenu', icon: MousePointerClick } }),
                    f('input.invertMouseY', { key: 'input', label: 'Invert Mouse Y-Axis', component: 'CompoundRatingField', componentProps: { field: 'invertMouseY', icon: ArrowUpDown } }),
                    f('input.touchscreen', { key: 'input', label: 'Touchscreen', component: 'CompoundRatingField', componentProps: { field: 'touchscreen', icon: Tablet } }),
                ]
            },
            {
                title: 'General Controller',
                fields: [
                    f('input.controllerSupport', { key: 'input', label: 'Controller Support', component: 'CompoundRatingField', componentProps: { field: 'controllerSupport', icon: Gamepad2 } }),
                    f('input.fullController', { key: 'input', label: 'Full Controller Support', component: 'CompoundRatingField', componentProps: { field: 'fullController', icon: CheckCircle } }),
                    f('input.controllerRemap', { key: 'input', label: 'Controller Remapping', component: 'CompoundRatingField', componentProps: { field: 'controllerRemap', icon: Settings } }),
                    f('input.controllerSensitivity', { key: 'input', label: 'Controller Sensitivity', component: 'CompoundRatingField', componentProps: { field: 'controllerSensitivity', icon: SlidersHorizontal } }),
                    f('input.invertControllerY', { key: 'input', label: 'Invert Controller Y-Axis', component: 'CompoundRatingField', componentProps: { field: 'invertControllerY', icon: ArrowUpDown } }),
                    f('input.controllerHotplug', { key: 'input', label: 'Controller Hotplugging', component: 'CompoundRatingField', componentProps: { field: 'controllerHotplug', icon: Plug } }),
                    f('input.hapticFeedback', { key: 'input', label: 'Haptic Feedback', component: 'CompoundRatingField', componentProps: { field: 'hapticFeedback', icon: Smartphone } }),

                    f('input.hapticFeedbackHd', { key: 'input', label: 'Haptic Feedback HD', component: 'CompoundRatingField', componentProps: { field: 'hapticFeedbackHd', icon: Smartphone } }),
                    f('input.hapticFeedbackHdControllerModels', {
                        label: 'HD Haptics Models',
                        component: 'MultiSelect',
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
                    }),

                    f('input.simultaneousInput', { key: 'input', label: 'Simultaneous Input', component: 'CompoundRatingField', componentProps: { field: 'simultaneousInput', icon: Users } }),
                    f('input.accelerationOption', { key: 'input', label: 'Acceleration Option', component: 'CompoundRatingField', componentProps: { field: 'accelerationOption', icon: Zap } }),
                ]
            },
            {
                title: 'XInput / DirectInput',
                fields: [
                    f('input.xinputControllers', { key: 'input', label: 'XInput Controllers', component: 'CompoundRatingField', componentProps: { field: 'xinputControllers', icon: Gamepad2 } }),
                    f('input.xboxPrompts', { key: 'input', label: 'Xbox Prompts', component: 'CompoundRatingField', componentProps: { field: 'xboxPrompts', icon: Box } }),
                    f('input.impulseTriggers', { key: 'input', label: 'Impulse Triggers', component: 'CompoundRatingField', componentProps: { field: 'impulseTriggers', icon: Zap } }),
                    f('input.directInputControllers', { key: 'input', label: 'DirectInput Controllers', component: 'CompoundRatingField', componentProps: { field: 'directInputControllers', icon: Gamepad2 } }),
                    f('input.directInputPrompts', { key: 'input', label: 'DirectInput Prompts', component: 'CompoundRatingField', componentProps: { field: 'directInputPrompts', icon: Box } }),
                ]
            },
            {
                title: 'PlayStation',
                fields: [
                    f('input.playstationControllers', { key: 'input', label: 'PlayStation Controllers', component: 'CompoundRatingField', componentProps: { field: 'playstationControllers', icon: Gamepad2 } }),
                    f('input.playstationControllerModels', {
                        label: 'Controller Models',
                        component: 'MultiSelect',
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
                    }),
                    f('input.playstationPrompts', { key: 'input', label: 'PlayStation Prompts', component: 'CompoundRatingField', componentProps: { field: 'playstationPrompts', icon: Box } }),
                    f('input.playstationMotionSensors', { key: 'input', label: 'Motion Sensors', component: 'CompoundRatingField', componentProps: { field: 'playstationMotionSensors', icon: Move } }),
                    f('input.playstationMotionSensorsModes', {
                        label: 'Motion Sensor Modes',
                        component: 'MultiSelect',
                        componentProps: {
                            placeholder: 'Select modes...',
                            options: ['Camera', 'Cursor', 'Gesture']
                        }
                    }),

                    f('input.playstationLightBar', { key: 'input', label: 'Light Bar Support', component: 'CompoundRatingField', componentProps: { field: 'glightBar', icon: Zap } }),
                    f('input.playstationAdaptiveTriggers', { key: 'input', label: 'Adaptive Triggers', component: 'CompoundRatingField', componentProps: { field: 'dualSenseAdaptiveTrigger', icon: Zap } }),
                    f('input.playstationHaptics', { key: 'input', label: 'DualSense Haptics', component: 'CompoundRatingField', componentProps: { field: 'dualSenseHaptics', icon: Smartphone } }),

                    f('input.playstationConnectionModes', {
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
                        }
                    }),
                ]
            },
            {
                title: 'Nintendo',
                fields: [
                    f('input.nintendoControllers', { key: 'input', label: 'Nintendo Controllers', component: 'CompoundRatingField', componentProps: { field: 'nintendoControllers', icon: Gamepad2 } }),
                    f('input.nintendoControllerModels', {
                        label: 'Controller Models',
                        component: 'MultiSelect',
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
                    }),
                    f('input.nintendoPrompts', { key: 'input', label: 'Nintendo Prompts', component: 'CompoundRatingField', componentProps: { field: 'nintendoPrompts', icon: Box } }),
                    f('input.nintendoButtonLayout', { key: 'input', label: 'Button Layout', component: 'CompoundRatingField', componentProps: { field: 'nintendoButtonLayout', icon: Settings } }),
                    f('input.nintendoMotionSensors', { key: 'input', label: 'Motion Sensors', component: 'CompoundRatingField', componentProps: { field: 'nintendoMotionSensors', icon: Move } }),
                    f('input.nintendoMotionSensorsModes', {
                        label: 'Motion Sensor Modes',
                        component: 'MultiSelect',
                        componentProps: {
                            placeholder: 'Select modes...',
                            options: ['Camera', 'Cursor', 'Gesture']
                        }
                    }),

                    f('input.nintendoConnectionModes', {
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
                        }
                    }),
                ]
            },
            {
                title: 'Steam Input',
                fields: [
                    f('input.steamInputApi', { key: 'input', label: 'Steam Input API', component: 'CompoundRatingField', componentProps: { field: 'steamInputApi', icon: Box } }),
                    f('input.steamHookInput', { key: 'input', label: 'Steam Hook Input', component: 'CompoundRatingField', componentProps: { field: 'steamHookInput', icon: Box } }),
                    f('input.steamInputPrompts', { key: 'input', label: 'Steam Input Prompts', component: 'CompoundRatingField', componentProps: { field: 'steamInputPrompts', icon: Box } }),
                    f('input.steamInputPromptsIcons', {
                        label: 'Prompts Icons',
                        component: 'MultiSelect',
                        componentProps: {
                            placeholder: 'Select icons...',
                            showIcons: true,
                            options: ['Xbox', 'PlayStation', 'Nintendo', 'Steam', 'Generic', 'Universal', 'False', 'Unknown']
                        }
                    }),
                    f('input.steamInputPromptsStyles', {
                        label: 'Prompts Styles',
                        component: 'MultiSelect',
                        componentProps: {
                            placeholder: 'Select styles...',
                            options: ['SIAPI Button Icons', 'In-Game Button Icons']
                        }
                    }),

                    f('input.steamDeckPrompts', { key: 'input', label: 'Steam Deck Prompts', component: 'CompoundRatingField', componentProps: { field: 'steamDeckPrompts', icon: Tablet } }),
                    f('input.steamControllerPrompts', { key: 'input', label: 'Steam Controller Prompts', component: 'CompoundRatingField', componentProps: { field: 'steamControllerPrompts', icon: Gamepad2 } }),
                    f('input.steamInputMotionSensors', {
                        key: 'input',
                        label: 'Motion Sensors',
                        component: 'CompoundRatingField',
                        componentProps: {
                            field: 'steamInputMotionSensors',
                            icon: Move
                        }
                    }),
                    f('input.steamInputMotionSensorsModes', {
                        label: 'Motion Sensor Modes',
                        component: 'MultiSelect',
                        componentProps: {
                            placeholder: 'Select modes...',
                            options: ['Camera (SIAPI Game Action)', 'Cursor (SIAPI Game Action)']
                        }
                    }),
                    f('input.steamInputPresets', { key: 'input', label: 'Steam Input Presets', component: 'CompoundRatingField', componentProps: { field: 'steamInputPresets', icon: Settings } }),
                    f('input.steamCursorDetection', { key: 'input', label: 'Cursor Detection', component: 'CompoundRatingField', componentProps: { field: 'steamCursorDetection', icon: Search } }),
                ]
            },
            {
                title: 'Other / Misc',
                fields: [
                    f('input.trackedMotionControllers', { key: 'input', label: 'Tracked Motion', component: 'CompoundRatingField', componentProps: { field: 'trackedMotionControllers', icon: Hand } }),
                    f('input.trackedMotionPrompts', { key: 'input', label: 'Tracked Motion Prompts', component: 'CompoundRatingField', componentProps: { field: 'trackedMotionPrompts', icon: Box } }),
                    f('input.otherControllers', { key: 'input', label: 'Other Controllers', component: 'CompoundRatingField', componentProps: { field: 'otherControllers', icon: Gamepad2 } }),
                    f('input.otherButtonPrompts', { key: 'input', label: 'Other Button Prompts', component: 'CompoundRatingField', componentProps: { field: 'otherButtonPrompts', icon: Box, multiple: true, options: ['Xbox', 'PlayStation', 'Nintendo', 'Steam', 'Generic', 'Universal', 'False', 'Unknown'] } }),
                    f('input.digitalMovementSupported', { key: 'input', label: 'Digital Movement', component: 'CompoundRatingField', componentProps: { field: 'digitalMovementSupported', icon: Monitor } }),

                    f('input.peripheralDevices', { key: 'input', label: 'Peripheral Devices', component: 'CompoundRatingField', componentProps: { field: 'peripheralDevices', icon: Settings } }),
                    f('input.peripheralDeviceTypes', {
                        label: 'Peripheral Types',
                        component: 'MultiSelect',
                        icon: Settings,
                        componentProps: {
                            placeholder: 'Select types...',
                            options: ['Arcade Controller', 'Flight Stick', 'Instruments Controller', 'Racing Wheels'],
                            showIcons: true
                        }
                    }),

                    f('input.inputPromptOverride', { key: 'input', label: 'Input Prompt Override', component: 'CompoundRatingField', componentProps: { field: 'inputPromptOverride', icon: Zap } }),
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
                    f('network.localPlay', { key: 'network', label: 'Local Play', component: 'CompoundRatingField', componentProps: { field: 'localPlay', icon: Users } }),
                    f('network.localPlayPlayers', { label: 'Players', component: 'InputText', description: 'Number of players' }),
                    f('network.localPlayModes', {
                        label: 'Modes',
                        component: 'MultiSelect',
                        description: 'e.g. Co-op, Versus',
                        componentProps: { options: ['Co-op', 'Hot-seat', 'Versus'] }
                    }),
                ]
            },
            {
                title: 'LAN Play',
                fields: [
                    f('network.lanPlay', { key: 'network', label: 'LAN Play', component: 'CompoundRatingField', componentProps: { field: 'lanPlay', icon: Users } }),
                    f('network.lanPlayPlayers', { label: 'Players', component: 'InputText', description: 'Number of players' }),
                    f('network.lanPlayModes', {
                        label: 'Modes',
                        component: 'MultiSelect',
                        description: 'e.g. Co-op, Versus',
                        componentProps: { options: ['Co-op', 'Hot-seat', 'Versus'] }
                    }),
                ]
            },
            {
                title: 'Online Play',
                fields: [
                    f('network.onlinePlay', { key: 'network', label: 'Online Play', component: 'CompoundRatingField', componentProps: { field: 'onlinePlay', icon: Globe } }),
                    f('network.onlinePlayPlayers', { label: 'Players', component: 'InputText', description: 'Number of players' }),
                    f('network.onlinePlayModes', {
                        label: 'Modes',
                        component: 'MultiSelect',
                        description: 'e.g. Co-op, Versus',
                        componentProps: { options: ['Co-op', 'Hot-seat', 'Versus'] }
                    }),
                ]
            },
            {
                title: 'Misc & Crossplay',
                fields: [
                    f('network.asynchronous', { key: 'network', label: 'Asynchronous', component: 'CompoundRatingField', componentProps: { field: 'asynchronous', icon: Clock } }),
                    f('network.crossplay', { key: 'network', label: 'Crossplay', component: 'CompoundRatingField', componentProps: { field: 'crossplay', icon: GitFork } }),
                    f('network.crossplayPlatforms', {
                        label: 'Crossplay Platforms',
                        component: 'MultiSelect',
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
                    }),
                ]
            },
            {
                title: 'Connection Types',
                fields: [
                    f('network.matchmaking', { key: 'network', label: 'Matchmaking', component: 'CompoundRatingField', componentProps: { field: 'matchmaking', icon: Users } }),
                    f('network.p2p', { key: 'network', label: 'Peer-to-Peer', component: 'CompoundRatingField', componentProps: { field: 'p2p', icon: RefreshCcw } }),
                    f('network.dedicated', { key: 'network', label: 'Dedicated', component: 'CompoundRatingField', componentProps: { field: 'dedicated', icon: Monitor } }),
                    f('network.selfHosting', { key: 'network', label: 'Self-hosting', component: 'CompoundRatingField', componentProps: { field: 'selfHosting', icon: Monitor } }),
                    f('network.directIp', { key: 'network', label: 'Direct IP', component: 'CompoundRatingField', componentProps: { field: 'directIp', icon: Globe } }),
                ]
            },
            {
                title: 'Ports',
                fields: [
                    f('network.tcpPorts', { label: 'TCP Ports', component: 'InputText', description: 'Comma separated ports' }),
                    f('network.udpPorts', { label: 'UDP Ports', component: 'InputText', description: 'Comma separated ports' }),
                    f('network.upnp', { key: 'network', label: 'UPnP', component: 'CompoundRatingField', componentProps: { field: 'upnp', icon: Plug } }),
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
                    f('vr.native3d', { key: 'vr', label: 'Native 3D', component: 'CompoundRatingField', componentProps: { field: 'native3d', icon: Box } }),
                    f('vr.nvidia3dVision', { key: 'vr', label: 'Nvidia 3D Vision', component: 'CompoundRatingField', componentProps: { field: 'nvidia3dVision', icon: Monitor } }),
                    f('vr.vorpx', { key: 'vr', label: 'vorpX', component: 'CompoundRatingField', componentProps: { field: 'vorpx', icon: Monitor } }),
                    f('vr.vorpxModes', {
                        label: 'vorpX Modes',
                        component: 'InputText',
                        description: 'Supported modes',
                        showIf: (m: any) => m.vr?.vorpx && m.vr.vorpx.value === 'true',
                        componentProps: { placeholder: 'e.g. Z3D, G3D' }
                    }),
                    f('vr.vrOnly', { key: 'vr', label: 'VR Only', component: 'CompoundRatingField', componentProps: { field: 'vrOnly', icon: Headset } }),
                ]
            },
            {
                title: 'Headsets',
                fields: [
                    f('vr.openXr', { key: 'vr', label: 'OpenXR', component: 'CompoundRatingField', componentProps: { field: 'openXr', icon: Headset } }),
                    f('vr.steamVr', { key: 'vr', label: 'SteamVR', component: 'CompoundRatingField', componentProps: { field: 'steamVr', icon: Headset } }),
                    f('vr.oculusVr', { key: 'vr', label: 'Oculus', component: 'CompoundRatingField', componentProps: { field: 'oculusVr', icon: Headset } }),
                    f('vr.windowsMixedReality', { key: 'vr', label: 'Windows Mixed Reality', component: 'CompoundRatingField', componentProps: { field: 'windowsMixedReality', icon: Headset } }),
                    f('vr.osvr', { key: 'vr', label: 'OSVR', component: 'CompoundRatingField', componentProps: { field: 'osvr', icon: Headset } }),
                    f('vr.forteNsx1', { key: 'vr', label: 'Forte VFX1', component: 'CompoundRatingField', componentProps: { field: 'forteNsx1', icon: Headset } }),
                ]
            },
            {
                title: 'Input',
                fields: [
                    f('vr.keyboardMouse', { key: 'vr', label: 'Keyboard & Mouse', component: 'CompoundRatingField', componentProps: { field: 'keyboardMouse', icon: Keyboard } }),
                    f('vr.bodyTracking', { key: 'vr', label: 'Body Tracking', component: 'CompoundRatingField', componentProps: { field: 'bodyTracking', icon: Users } }),
                    f('vr.handTracking', { key: 'vr', label: 'Hand Tracking', component: 'CompoundRatingField', componentProps: { field: 'handTracking', icon: Move } }),
                    f('vr.faceTracking', { key: 'vr', label: 'Face Tracking', component: 'CompoundRatingField', componentProps: { field: 'faceTracking', icon: Eye } }),
                    f('vr.eyeTracking', { key: 'vr', label: 'Eye Tracking', component: 'CompoundRatingField', componentProps: { field: 'eyeTracking', icon: Eye } }),
                    f('vr.tobiiEyeTracking', { key: 'vr', label: 'Tobii Eye Tracking', component: 'CompoundRatingField', componentProps: { field: 'tobiiEyeTracking', icon: Eye } }),
                    f('vr.trackIr', { key: 'vr', label: 'TrackIR', component: 'CompoundRatingField', componentProps: { field: 'trackIr', icon: Eye } }),
                    f('vr.thirdSpaceGamingVest', { key: 'vr', label: '3rd Space Gaming Vest', component: 'CompoundRatingField', componentProps: { field: 'thirdSpaceGamingVest', icon: Zap } }),
                    f('vr.novintFalcon', { key: 'vr', label: 'Novint Falcon', component: 'CompoundRatingField', componentProps: { field: 'novintFalcon', icon: Gamepad2 } }),
                ]
            },
            {
                title: 'Play Area',
                fields: [
                    f('vr.playAreaSeated', { key: 'vr', label: 'Seated', component: 'CompoundRatingField', componentProps: { field: 'playAreaSeated', icon: CheckCircle } }),
                    f('vr.playAreaStanding', { key: 'vr', label: 'Standing', component: 'CompoundRatingField', componentProps: { field: 'playAreaStanding', icon: CheckCircle } }),
                    f('vr.playAreaRoomScale', { key: 'vr', label: 'Room-scale', component: 'CompoundRatingField', componentProps: { field: 'playAreaRoomScale', icon: Box } }),
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
                    f('api.dxVersion', { key: 'api', label: 'Direct3D', component: 'CompoundRatingField', componentProps: { field: 'dxVersion', notesField: 'dxNotes', refField: 'dxRef', icon: Monitor, freeText: true } }),
                    f('api.directDrawVersion', { key: 'api', label: 'DirectDraw', component: 'CompoundRatingField', componentProps: { field: 'directDrawVersion', notesField: 'directDrawNotes', refField: 'directDrawRef', icon: Pencil, freeText: true } }),
                    f('api.wing', { key: 'api', label: 'WinG', component: 'CompoundRatingField', componentProps: { field: 'wing', icon: AppWindow } }),
                    f('api.openGlVersion', { key: 'api', label: 'OpenGL', component: 'CompoundRatingField', componentProps: { field: 'openGlVersion', notesField: 'openGlNotes', refField: 'openGlRef', icon: Globe, freeText: true } }),
                    f('api.glideVersion', { key: 'api', label: 'Glide', component: 'CompoundRatingField', componentProps: { field: 'glideVersion', notesField: 'glideNotes', refField: 'glideRef', icon: Send, freeText: true } }),
                    f('api.softwareMode', { key: 'api', label: 'Software Mode', component: 'CompoundRatingField', componentProps: { field: 'softwareMode', icon: Cpu } }),
                    f('api.mantle', { key: 'api', label: 'Mantle', component: 'CompoundRatingField', componentProps: { field: 'mantle', icon: Box } }),
                    f('api.vulkanVersion', { key: 'api', label: 'Vulkan', component: 'CompoundRatingField', componentProps: { field: 'vulkanVersion', notesField: 'vulkanNotes', refField: 'vulkanRef', icon: Zap, freeText: true } }),
                    f('api.metal', { key: 'api', label: 'Metal', component: 'CompoundRatingField', componentProps: { field: 'metal', icon: AppWindow } }),

                    f('api.dosModes', { key: 'api', label: 'DOS Modes', component: 'CompoundRatingField', componentProps: { field: 'dosModes', icon: Terminal, freeText: true } }),
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
                    f('middleware.physics', { key: 'middleware', label: 'Physics', component: 'CompoundRatingField', componentProps: { field: 'physics', icon: Zap, freeText: true } }),
                    f('middleware.audio', { key: 'middleware', label: 'Audio', component: 'CompoundRatingField', componentProps: { field: 'audio', icon: Volume2, freeText: true } }),
                    f('middleware.interface', { key: 'middleware', label: 'Interface', component: 'CompoundRatingField', componentProps: { field: 'interface', icon: Layout, freeText: true } }),
                    f('middleware.input', { key: 'middleware', label: 'Input', component: 'CompoundRatingField', componentProps: { field: 'input', icon: Gamepad2, freeText: true } }),
                    f('middleware.cutscenes', { key: 'middleware', label: 'Cutscenes', component: 'CompoundRatingField', componentProps: { field: 'cutscenes', icon: Film, freeText: true } }),
                    f('middleware.multiplayer', { key: 'middleware', label: 'Multiplayer', component: 'CompoundRatingField', componentProps: { field: 'multiplayer', icon: Users, freeText: true } }),
                    f('middleware.anticheat', { key: 'middleware', label: 'Anticheat', component: 'CompoundRatingField', componentProps: { field: 'anticheat', icon: Shield, freeText: true } }),
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
            f('requirements', {
                label: 'System Requirements',
                component: 'SystemRequirementsForm',
            })
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
            f('localizations', {
                label: 'Localizations',
                component: 'LocalizationsForm',
            })
        ]
    }
];
