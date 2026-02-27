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
            f('introduction.introduction', h.wysiwyg('Introduction', {
                placeholder: "'''''Title''''' is a..."
            }, {
                description: "The first instance of the game title in introduction should be written as '''''Title'''''",
                colSpan: 2
            })),
            f('introduction.generalInfo', h.wysiwyg('General information', {
                placeholder: "Links and other general details."
            }, {
                description: "General informational links like official forums, etc.",
                colSpan: 2
            })),
            f('introduction.releaseHistory', h.wysiwyg('Release History', {
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
    {
        id: 'monetization',
        title: 'Monetization',
        icon: DollarSign,
        iconClass: 'text-accent-orange-500',
        order: 4,
        gridCols: 3,
        fields: [
            f('monetization.oneTimePurchase', h.text('One-time Game Purchase', {}, { description: 'Requires upfront purchase to access.' })),
            f('monetization.freeToPlay', h.text('Free-to-play', {}, { description: 'Access significant portion without paying.' })),
            f('monetization.freeware', h.text('Freeware', {}, { description: 'Completely free in its entirety.' })),
            f('monetization.adSupported', h.text('Ad-supported', {}, { description: 'Ads that are not part of gameplay.' })),
            f('monetization.subscription', h.text('Subscription', {}, { description: 'Game-specific periodic payment.' })),
            f('monetization.subscriptionGamingService', h.text('Subscription Gaming Service', {}, { description: 'Part of a collection/service (Game Pass).' })),
            f('monetization.dlc', h.text('DLC', {}, { description: 'Additional maps, levels, quests.' })),
            f('monetization.expansionPack', h.text('Expansion Pack', {}, { description: 'Large campaigns, significant new content.' })),
            f('monetization.crossGameBonus', h.text('Cross-game Bonus', {}, { description: 'Bonuses for owning/playing other games.' })),
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
            f('microtransactions.none', h.text('None', {}, { description: 'Standard: No microtransactions present.' })),
            f('microtransactions.cosmetic', h.text('Cosmetic', {}, { description: 'Items that do not affect gameplay.' })),
            f('microtransactions.currency', h.text('Currency', {}, { description: 'Bought with real money.' })),
            f('microtransactions.lootBox', h.text('Loot Box', {}, { description: 'Randomized purchase for items.' })),
            f('microtransactions.unlock', h.text('Unlock', {}, { description: 'Content that affects gameplay.' })),
            f('microtransactions.boost', h.text('Boost', {}, { description: 'Accelerate speed, levelling, or skips.' })),
            f('microtransactions.freeToGrind', h.text('Free-to-grind', {}, { description: 'Can unlock everything by playing.' })),
            f('microtransactions.finiteSpend', h.text('Finite Spend', {}, { description: 'Fixed number of items to buy.' })),
            f('microtransactions.infiniteSpend', h.text('Infinite Spend', {}, { description: 'Can be bought over and over.' })),
            f('microtransactions.playerTrading', h.text('Player Trading', {}, { description: 'Trading items/currency between players.' })),
            f('microtransactions.timeLimited', h.text('Time-limited', {}, { description: 'Exclusive to a specific time/promo.' }))
        ]
    },
    {
        id: 'dlc',
        title: 'DLC & Expansions',
        icon: PlusCircle,
        iconClass: 'text-primary-600',
        order: 6,
        // Custom section wrapping DLCForm
        isCustomSection: true,
        templateName: 'DLC',
        fields: [
            f('dlc', h.custom('DLC', 'DLCForm'))
        ]
    },
    {
        id: 'essentialImprovements',
        title: 'Essential Improvements',
        icon: Star,
        iconClass: 'text-yellow-500',
        order: 7,
        fields: [
            f('essentialImprovements', h.wysiwyg('Essential Improvements', { editorStyle: 'height: 250px' }, {
                description: 'Patches, intro skip methods, major community mods, game-specific utilities.'
            }))
        ]
    },
    {
        id: 'audio',
        title: 'Audio',
        icon: Volume2,
        order: 10,
        fields: [
            h.gallery('Gallery', { section: 'Audio' }, { key: 'galleries.audio', wikitextParam: '' }) as FieldDefinition
        ],
        groups: [
            {
                title: 'Audio Settings',
                fields: [
                    f('audio.separateVolume', h.rating('Separate Volume Controls', { field: 'separateVolume', label: 'Separate Volume Controls', icon: SlidersHorizontal }, { key: 'audio', description: 'Can audio types be adjusted individually?' })),
                    f('audio.surroundSound', h.rating('Surround Sound', { field: 'surroundSound', label: 'Surround Sound', icon: Volume2 }, { key: 'audio', description: 'Surround sound support (5.1, 7.1, etc.)' })),
                    f('audio.subtitles', h.rating('Subtitles', { field: 'subtitles', label: 'Subtitles', icon: AlignCenter }, { key: 'audio', description: 'Subtitle support for dialogue/cutscenes.' })),
                    f('audio.closedCaptions', h.rating('Closed Captions', { field: 'closedCaptions', label: 'Closed Captions', icon: Captions }, { key: 'audio', description: 'Support for closed captions (sound effects text).' })),
                    f('audio.muteOnFocusLost', h.rating('Mute on Focus Lost', { field: 'muteOnFocusLost', label: 'Mute on Focus Lost', icon: VolumeX }, { key: 'audio', description: 'Does game mute when alt-tabbed?' })),
                    f('audio.royaltyFree', h.rating('Royalty Free Audio', { field: 'royaltyFree', label: 'Royalty Free Audio', icon: CheckCircle }, { key: 'audio', description: 'Is the audio safe for streaming/recording?' })),
                ]
            },
            {
                title: 'API',
                fields: [
                    f('audio.eaxSupport', h.rating('EAX Support', { field: 'eaxSupport', label: 'EAX Support' }, { key: 'audio' })),
                    f('audio.redBookCdAudio', h.rating('Red Book CD Audio', { field: 'redBookCdAudio', label: 'Red Book CD Audio' }, { key: 'audio' })),
                    f('audio.generalMidiAudio', h.rating('General MIDI Audio', { field: 'generalMidiAudio', label: 'General MIDI Audio' }, { key: 'audio' })),
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
                    f('config', h.custom('Configuration', 'GameDataForm'))
                ]
            },
            {
                title: 'Save Game Cloud Syncing',
                fields: [
                    f('config.cloudSync.steamCloud', h.rating('Steam Cloud', { field: 'steamCloud', icon: Server }, { key: 'config.cloudSync' })),
                    f('config.cloudSync.discord', h.rating('Discord', { field: 'discord', icon: MessageCircle }, { key: 'config.cloudSync' })),
                    f('config.cloudSync.epicGamesLauncher', h.rating('Epic Games Launcher', { field: 'epicGamesLauncher', icon: Box }, { key: 'config.cloudSync' })),
                    f('config.cloudSync.gogGalaxy', h.rating('GOG Galaxy', { field: 'gogGalaxy', icon: Box }, { key: 'config.cloudSync' })),
                    f('config.cloudSync.eaApp', h.rating('EA App', { field: 'eaApp', icon: Box }, { key: 'config.cloudSync' })),
                    f('config.cloudSync.ubisoftConnect', h.rating('Ubisoft Connect', { field: 'ubisoftConnect', icon: Box }, { key: 'config.cloudSync' })),
                    f('config.cloudSync.xboxCloud', h.rating('Xbox Cloud', { field: 'xboxCloud', icon: AppWindow }, { key: 'config.cloudSync' })),
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
            h.videoAnalysis('AI Analysis', { key: 'video', description: 'Analyze screenshots to auto-fill settings.', wikitextParam: '' }) as FieldDefinition,
            h.gallery('Gallery', { section: 'video' }, { key: 'galleries.video', wikitextParam: '' }) as FieldDefinition
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
                    f('video.wsgfLink', h.text('WSGF Link', {}, { description: 'Link to WSGF report' })),
                    f('video.widescreenWsgfAward', h.text('Widescreen Award', {}, { description: 'Gold, Silver, etc.' })),
                    f('video.multiMonitorWsgfAward', h.text('Multi-monitor Award', {}, { description: 'Gold, Silver, etc.' })),
                    f('video.ultraWidescreenWsgfAward', h.text('Ultra-widescreen Award', {}, { description: 'Gold, Silver, etc.' })),
                    f('video.fourKUltraHdWsgfAward', h.text('4K Ultra HD Award', {}, { description: 'Gold, Silver, etc.' }))
                ]
            },
            {
                title: 'Resolution & Display',
                fields: [
                    f('video.widescreenResolution', h.rating('Widescreen Resolution', { field: 'widescreenResolution', icon: Monitor }, { key: 'video' })),
                    f('video.multiMonitor', h.rating('Multi-monitor', { field: 'multiMonitor', icon: Grid2X2 }, { key: 'video' })),
                    f('video.ultraWidescreen', h.rating('Ultra-widescreen', { field: 'ultraWidescreen', icon: Maximize }, { key: 'video' })),
                    f('video.fourKUltraHd', h.rating('4K Ultra HD', { field: 'fourKUltraHd', icon: Star }, { key: 'video' })),
                    f('video.fov', h.rating('Field of View (FOV)', { field: 'fov', icon: Eye }, { key: 'video' })),
                    f('video.windowed', h.rating('Windowed', { field: 'windowed', icon: Minimize }, { key: 'video' })),
                    f('video.borderlessWindowed', h.rating('Borderless Windowed', { field: 'borderlessWindowed', icon: Image }, { key: 'video' })),
                ]
            },
            {
                title: 'Graphics Settings',
                fields: [
                    f('video.anisotropic', h.rating('Anisotropic Filtering (AF)', { field: 'anisotropic', icon: ScanLine }, { key: 'video' })),
                    f('video.antiAliasing', h.rating('Anti-aliasing (AA)', { field: 'antiAliasing', icon: LineChart }, { key: 'video' })),

                    f('video.upscaling', h.rating('Upscaling', { field: 'upscaling', icon: ArrowUpRight }, { key: 'video' })),
                    f('video.upscalingTech', h.text('Upscaling Tech', { placeholder: 'Tech (e.g. DLSS 2, FSR 2)' }, {
                        showIf: (m: any) => m.video?.upscaling && m.video.upscaling.value !== 'false' && m.video.upscaling.value !== 'unknown' && m.video.upscaling.value !== 'n/a'
                    })),

                    f('video.frameGen', h.rating('Frame Generation', { field: 'frameGen', icon: FastForward }, { key: 'video' })),
                    f('video.frameGenTech', h.text('Frame Gen Tech', { placeholder: 'Tech (e.g. DLSS 3, FSR 3)' }, {
                        showIf: (m: any) => m.video?.frameGen && m.video.frameGen.value !== 'false' && m.video.frameGen.value !== 'unknown' && m.video.frameGen.value !== 'n/a'
                    })),

                    f('video.vsync', h.rating('VSync', { field: 'vsync', icon: RefreshCcw }, { key: 'video' })),
                    f('video.fps60', h.rating('60 FPS', { field: 'fps60', icon: Clock }, { key: 'video' })),
                    f('video.fps120', h.rating('120+ FPS', { field: 'fps120', icon: Zap }, { key: 'video' })),
                    f('video.hdr', h.rating('HDR', { field: 'hdr', icon: Sun }, { key: 'video' })),
                    f('video.rayTracing', h.rating('Ray Tracing', { field: 'rayTracing', icon: Sparkles }, { key: 'video' })),
                    f('video.colorBlind', h.rating('Color Blind Mode', { field: 'colorBlind', icon: Palette }, { key: 'video' })),
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
        fields: [
            h.gallery('Gallery', { section: 'Input' }, { key: 'galleries.input', wikitextParam: '' }) as FieldDefinition
        ],
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
                    f('input.controllerSupport', h.rating('Controller Support', { field: 'controllerSupport', icon: Gamepad2 }, { key: 'input' })),
                    f('input.fullController', h.rating('Full Controller Support', { field: 'fullController', icon: CheckCircle }, { key: 'input' })),
                    f('input.controllerRemap', h.rating('Controller Remapping', { field: 'controllerRemap', icon: Settings }, { key: 'input' })),
                    f('input.controllerSensitivity', h.rating('Controller Sensitivity', { field: 'controllerSensitivity', icon: SlidersHorizontal }, { key: 'input' })),
                    f('input.invertControllerY', h.rating('Invert Controller Y-Axis', { field: 'invertControllerY', icon: ArrowUpDown }, { key: 'input' })),
                    f('input.controllerHotplug', h.rating('Controller Hotplugging', { field: 'controllerHotplug', icon: Plug }, { key: 'input' })),
                    f('input.hapticFeedback', h.rating('Haptic Feedback', { field: 'hapticFeedback', icon: Smartphone }, { key: 'input' })),

                    f('input.hapticFeedbackHd', h.rating('Haptic Feedback HD', { field: 'hapticFeedbackHd', icon: Smartphone }, { key: 'input' })),
                    f('input.hapticFeedbackHdControllerModels', h.multiselect('HD Haptics Models', {
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
                    }, { description: 'Select supported models' })),

                    f('input.simultaneousInput', { key: 'input', label: 'Simultaneous Input', component: 'CompoundRatingField', componentProps: { field: 'simultaneousInput', icon: Users } }),
                    f('input.accelerationOption', { key: 'input', label: 'Acceleration Option', component: 'CompoundRatingField', componentProps: { field: 'accelerationOption', icon: Zap } }),
                ]
            },
            {
                title: 'XInput / DirectInput',
                fields: [
                    f('input.xinputControllers', h.rating('XInput Controllers', { field: 'xinputControllers', icon: Gamepad2 }, { key: 'input' })),
                    f('input.xboxPrompts', h.rating('Xbox Prompts', { field: 'xboxPrompts', icon: Box }, { key: 'input' })),
                    f('input.impulseTriggers', h.rating('Impulse Triggers', { field: 'impulseTriggers', icon: Zap }, { key: 'input' })),
                    f('input.directInputControllers', h.rating('DirectInput Controllers', { field: 'directInputControllers', icon: Gamepad2 }, { key: 'input' })),
                    f('input.directInputPrompts', h.rating('DirectInput Prompts', { field: 'directInputPrompts', icon: Box }, { key: 'input' })),
                ]
            },
            {
                title: 'PlayStation',
                fields: [
                    f('input.playstationControllers', h.rating('PlayStation Controllers', { field: 'playstationControllers', icon: Gamepad2 }, { key: 'input' })),
                    f('input.playstationControllerModels', h.multiselect('Controller Models', {
                        placeholder: 'Select models...',
                        options: [
                            'DualShock 3',
                            'DualShock 4',
                            'DualShock 4 (launch model only)',
                            'DualShock 4 (V2 model only)',
                            'DualSense',
                            'DualSense Edge'
                        ]
                    })),
                    f('input.playstationPrompts', h.rating('PlayStation Prompts', { field: 'playstationPrompts', icon: Box }, { key: 'input' })),
                    f('input.playstationMotionSensors', h.rating('Motion Sensors', { field: 'playstationMotionSensors', icon: Move }, { key: 'input' })),
                    f('input.playstationMotionSensorsModes', h.multiselect('Motion Sensor Modes', {
                        placeholder: 'Select modes...',
                        options: ['Camera', 'Cursor', 'Gesture']
                    })),

                    f('input.playstationLightBar', h.rating('Light Bar Support', { field: 'glightBar', icon: Zap }, { key: 'input' })),
                    f('input.playstationAdaptiveTriggers', h.rating('Adaptive Triggers', { field: 'dualSenseAdaptiveTrigger', icon: Zap }, { key: 'input' })),
                    f('input.playstationHaptics', h.rating('DualSense Haptics', { field: 'dualSenseHaptics', icon: Smartphone }, { key: 'input' })),

                    f('input.playstationConnectionModes', h.rating('Connection Modes', {
                        field: 'playstationConnectionModes',
                        icon: Plug,
                        multiple: true,
                        options: [
                            'Wired',
                            'Wireless (Bluetooth)',
                            'Wireless (DualShock 4 USB Wireless Adapter)'
                        ]
                    }, { key: 'input' })),
                ]
            },
            {
                title: 'Nintendo',
                fields: [
                    f('input.nintendoControllers', h.rating('Nintendo Controllers', { field: 'nintendoControllers', icon: Gamepad2 }, { key: 'input' })),
                    f('input.nintendoControllerModels', h.multiselect('Controller Models', {
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
                    })),
                    f('input.nintendoPrompts', h.rating('Nintendo Prompts', { field: 'nintendoPrompts', icon: Box }, { key: 'input' })),
                    f('input.nintendoButtonLayout', h.rating('Button Layout', { field: 'nintendoButtonLayout', icon: Settings }, { key: 'input' })),
                    f('input.nintendoMotionSensors', h.rating('Motion Sensors', { field: 'nintendoMotionSensors', icon: Move }, { key: 'input' })),
                    f('input.nintendoMotionSensorsModes', h.multiselect('Motion Sensor Modes', {
                        placeholder: 'Select modes...',
                        options: ['Camera', 'Cursor', 'Gesture']
                    })),

                    f('input.nintendoConnectionModes', h.rating('Connection Modes', {
                        field: 'nintendoConnectionModes',
                        icon: Plug,
                        multiple: true,
                        options: [
                            'Wired',
                            'Wireless (Bluetooth)',
                            'Wired (GameCube Controller USB Adapter)'
                        ]
                    }, { key: 'input' })),
                ]
            },
            {
                title: 'Steam Input',
                fields: [
                    f('input.steamInputApi', h.rating('Steam Input API', { field: 'steamInputApi', icon: Box }, { key: 'input' })),
                    f('input.steamHookInput', h.rating('Steam Hook Input', { field: 'steamHookInput', icon: Box }, { key: 'input' })),
                    f('input.steamInputPrompts', h.rating('Steam Input Prompts', { field: 'steamInputPrompts', icon: Box }, { key: 'input' })),
                    f('input.steamInputPromptsIcons', h.multiselect('Prompts Icons', {
                        placeholder: 'Select icons...',
                        options: ['Xbox', 'PlayStation', 'Nintendo', 'Steam', 'Generic', 'Universal', 'False', 'Unknown']
                    })),
                    f('input.steamInputPromptsStyles', h.multiselect('Prompts Styles', {
                        placeholder: 'Select styles...',
                        options: ['SIAPI Button Icons', 'In-Game Button Icons']
                    })),

                    f('input.steamDeckPrompts', h.rating('Steam Deck Prompts', { field: 'steamDeckPrompts', icon: Tablet }, { key: 'input' })),
                    f('input.steamControllerPrompts', h.rating('Steam Controller Prompts', { field: 'steamControllerPrompts', icon: Gamepad2 }, { key: 'input' })),
                    f('input.steamInputMotionSensors', h.rating('Motion Sensors', { field: 'steamInputMotionSensors', icon: Move }, { key: 'input' })),
                    f('input.steamInputMotionSensorsModes', h.multiselect('Motion Sensor Modes', {
                        placeholder: 'Select modes...',
                        options: ['Camera (SIAPI Game Action)', 'Cursor (SIAPI Game Action)']
                    })),
                    f('input.steamInputPresets', h.rating('Steam Input Presets', { field: 'steamInputPresets', icon: Settings }, { key: 'input' })),
                    f('input.steamCursorDetection', h.rating('Cursor Detection', { field: 'steamCursorDetection', icon: Search }, { key: 'input' })),
                ]
            },
            {
                title: 'Other / Misc',
                fields: [
                    f('input.trackedMotionControllers', h.rating('Tracked Motion', { field: 'trackedMotionControllers', icon: Hand }, { key: 'input' })),
                    f('input.trackedMotionPrompts', h.rating('Tracked Motion Prompts', { field: 'trackedMotionPrompts', icon: Box }, { key: 'input' })),
                    f('input.otherControllers', h.rating('Other Controllers', { field: 'otherControllers', icon: Gamepad2 }, { key: 'input' })),
                    f('input.otherButtonPrompts', h.rating('Other Button Prompts', { field: 'otherButtonPrompts', icon: Box, multiple: true, options: ['Xbox', 'PlayStation', 'Nintendo', 'Steam', 'Generic', 'Universal', 'False', 'Unknown'] }, { key: 'input' })),
                    f('input.digitalMovementSupported', h.rating('Digital Movement', { field: 'digitalMovementSupported', icon: Monitor }, { key: 'input' })),

                    f('input.peripheralDevices', h.rating('Peripheral Devices', { field: 'peripheralDevices', icon: Settings }, { key: 'input' })),
                    f('input.peripheralDeviceTypes', h.multiselect('Peripheral Types', {
                        placeholder: 'Select types...',
                        options: ['Arcade Controller', 'Flight Stick', 'Instruments Controller', 'Racing Wheels']
                    }, { icon: Settings })),

                    f('input.inputPromptOverride', h.rating('Input Prompt Override', { field: 'inputPromptOverride', icon: Zap }, { key: 'input' })),
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
        fields: [
            h.gallery('Gallery', { section: 'Network' }, { key: 'galleries.network', wikitextParam: '' }) as FieldDefinition
        ],
        groups: [
            {
                title: 'Local Play',
                fields: [
                    f('network.localPlay', h.rating('Local Play', { field: 'localPlay', icon: Users }, { key: 'network' })),
                    f('network.localPlayPlayers', h.text('Players', {}, { description: 'Number of players' })),
                    f('network.localPlayModes', h.multiselect('Modes', {
                        options: ['Co-op', 'Hot-seat', 'Versus']
                    }, { description: 'e.g. Co-op, Versus' })),
                ]
            },
            {
                title: 'LAN Play',
                fields: [
                    f('network.lanPlay', h.rating('LAN Play', { field: 'lanPlay', icon: Users }, { key: 'network' })),
                    f('network.lanPlayPlayers', h.text('Players', {}, { description: 'Number of players' })),
                    f('network.lanPlayModes', h.multiselect('Modes', {
                        options: ['Co-op', 'Hot-seat', 'Versus']
                    }, { description: 'e.g. Co-op, Versus' })),
                ]
            },
            {
                title: 'Online Play',
                fields: [
                    f('network.onlinePlay', h.rating('Online Play', { field: 'onlinePlay', icon: Globe }, { key: 'network' })),
                    f('network.onlinePlayPlayers', h.text('Players', {}, { description: 'Number of players' })),
                    f('network.onlinePlayModes', h.multiselect('Modes', {
                        options: ['Co-op', 'Hot-seat', 'Versus']
                    }, { description: 'e.g. Co-op, Versus' })),
                ]
            },
            {
                title: 'Misc & Crossplay',
                fields: [
                    f('network.asynchronous', h.rating('Asynchronous', { field: 'asynchronous', icon: Clock }, { key: 'network' })),
                    f('network.crossplay', h.rating('Crossplay', { field: 'crossplay', icon: GitFork }, { key: 'network' })),
                    f('network.crossplayPlatforms', h.multiselect('Crossplay Platforms', {
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
                    }, { description: 'e.g. Windows, PS5, Xbox Series X' })),
                ]
            },
            {
                title: 'Connection Types',
                fields: [
                    f('network.matchmaking', h.rating('Matchmaking', { field: 'matchmaking', icon: Users }, { key: 'network' })),
                    f('network.p2p', h.rating('Peer-to-Peer', { field: 'p2p', icon: RefreshCcw }, { key: 'network' })),
                    f('network.dedicated', h.rating('Dedicated', { field: 'dedicated', icon: Monitor }, { key: 'network' })),
                    f('network.selfHosting', h.rating('Self-hosting', { field: 'selfHosting', icon: Monitor }, { key: 'network' })),
                    f('network.directIp', h.rating('Direct IP', { field: 'directIp', icon: Globe }, { key: 'network' })),
                ]
            },
            {
                title: 'Ports',
                fields: [
                    f('network.tcpPorts', h.text('TCP Ports', {}, { description: 'Comma separated ports' })),
                    f('network.udpPorts', h.text('UDP Ports', {}, { description: 'Comma separated ports' })),
                    f('network.upnp', h.rating('UPnP', { field: 'upnp', icon: Plug }, { key: 'network' })),
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
        fields: [
            h.gallery('Gallery', { section: 'VR support' }, { key: 'galleries.vr', wikitextParam: '' }) as FieldDefinition
        ],
        groups: [
            {
                title: '3D Modes',
                fields: [
                    f('vr.native3d', h.rating('Native 3D', { field: 'native3d', icon: Box }, { key: 'vr' })),
                    f('vr.nvidia3dVision', h.rating('Nvidia 3D Vision', { field: 'nvidia3dVision', icon: Monitor }, { key: 'vr' })),
                    f('vr.vorpx', h.rating('vorpX', { field: 'vorpx', icon: Monitor }, { key: 'vr' })),
                    f('vr.vorpxModes', h.text('vorpX Modes', { placeholder: 'e.g. Z3D, G3D' }, {
                        description: 'Supported modes',
                        showIf: (m: any) => m.vr?.vorpx && m.vr.vorpx.value === 'true'
                    })),
                    f('vr.vrOnly', h.rating('VR Only', { field: 'vrOnly', icon: Headset }, { key: 'vr' })),
                ]
            },
            {
                title: 'Headsets',
                fields: [
                    f('vr.openXr', h.rating('OpenXR', { field: 'openXr', icon: Headset }, { key: 'vr' })),
                    f('vr.steamVr', h.rating('SteamVR', { field: 'steamVr', icon: Headset }, { key: 'vr' })),
                    f('vr.oculusVr', h.rating('Oculus', { field: 'oculusVr', icon: Headset }, { key: 'vr' })),
                    f('vr.windowsMixedReality', h.rating('Windows Mixed Reality', { field: 'windowsMixedReality', icon: Headset }, { key: 'vr' })),
                    f('vr.osvr', h.rating('OSVR', { field: 'osvr', icon: Headset }, { key: 'vr' })),
                    f('vr.forteNsx1', h.rating('Forte VFX1', { field: 'forteNsx1', icon: Headset }, { key: 'vr' })),
                ]
            },
            {
                title: 'Input',
                fields: [
                    f('vr.keyboardMouse', h.rating('Keyboard & Mouse', { field: 'keyboardMouse', icon: Keyboard }, { key: 'vr' })),
                    f('vr.bodyTracking', h.rating('Body Tracking', { field: 'bodyTracking', icon: Users }, { key: 'vr' })),
                    f('vr.handTracking', h.rating('Hand Tracking', { field: 'handTracking', icon: Move }, { key: 'vr' })),
                    f('vr.faceTracking', h.rating('Face Tracking', { field: 'faceTracking', icon: Eye }, { key: 'vr' })),
                    f('vr.eyeTracking', h.rating('Eye Tracking', { field: 'eyeTracking', icon: Eye }, { key: 'vr' })),
                    f('vr.tobiiEyeTracking', h.rating('Tobii Eye Tracking', { field: 'tobiiEyeTracking', icon: Eye }, { key: 'vr' })),
                    f('vr.trackIr', h.rating('TrackIR', { field: 'trackIr', icon: Eye }, { key: 'vr' })),
                    f('vr.thirdSpaceGamingVest', h.rating('3rd Space Gaming Vest', { field: 'thirdSpaceGamingVest', icon: Zap }, { key: 'vr' })),
                    f('vr.novintFalcon', h.rating('Novint Falcon', { field: 'novintFalcon', icon: Gamepad2 }, { key: 'vr' })),
                ]
            },
            {
                title: 'Play Area',
                fields: [
                    f('vr.playAreaSeated', h.rating('Seated', { field: 'playAreaSeated', icon: CheckCircle }, { key: 'vr' })),
                    f('vr.playAreaStanding', h.rating('Standing', { field: 'playAreaStanding', icon: CheckCircle }, { key: 'vr' })),
                    f('vr.playAreaRoomScale', h.rating('Room-scale', { field: 'playAreaRoomScale', icon: Box }, { key: 'vr' })),
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
        fields: [
            h.gallery('Gallery', { section: 'API' }, { key: 'galleries.api', wikitextParam: '' }) as FieldDefinition
        ],
        groups: [
            {
                title: 'Graphics Support',
                fields: [
                    f('api.dxVersion', { key: 'api', label: 'Direct3D', component: 'CompoundRatingField', componentProps: { field: 'dxVersion', notesField: 'dxNotes', icon: Monitor, freeText: true } }),
                    f('api.directDrawVersion', { key: 'api', label: 'DirectDraw', component: 'CompoundRatingField', componentProps: { field: 'directDrawVersion', notesField: 'directDrawNotes', icon: Pencil, freeText: true } }),
                    f('api.wing', { key: 'api', label: 'WinG', component: 'CompoundRatingField', componentProps: { field: 'wing', icon: AppWindow } }),
                    f('api.openGlVersion', { key: 'api', label: 'OpenGL', component: 'CompoundRatingField', componentProps: { field: 'openGlVersion', notesField: 'openGlNotes', icon: Globe, freeText: true } }),
                    f('api.glideVersion', { key: 'api', label: 'Glide', component: 'CompoundRatingField', componentProps: { field: 'glideVersion', notesField: 'glideNotes', icon: Send, freeText: true } }),
                    f('api.softwareMode', { key: 'api', label: 'Software Mode', component: 'CompoundRatingField', componentProps: { field: 'softwareMode', icon: Cpu } }),
                    f('api.mantle', { key: 'api', label: 'Mantle', component: 'CompoundRatingField', componentProps: { field: 'mantle', icon: Box } }),
                    f('api.vulkanVersion', { key: 'api', label: 'Vulkan', component: 'CompoundRatingField', componentProps: { field: 'vulkanVersion', notesField: 'vulkanNotes', icon: Zap, freeText: true } }),
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
        fields: [
            h.gallery('Gallery', { section: 'Middleware' }, { key: 'galleries.middleware', wikitextParam: '' }) as FieldDefinition
        ],
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
            h.gallery('Gallery', { section: 'System requirements' }, { key: 'galleries.system_requirements', wikitextParam: '' }) as FieldDefinition,
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
    },
    {
        id: 'issues',
        title: 'Issues',
        icon: AlertCircle,
        iconClass: 'text-red-500',
        order: 17,
        isCustomSection: true,
        templateName: 'Issues', // Faux template to hook into our logic easily
        fields: [
            f('issues', h.custom('Issues', 'IssuesForm'))
        ]
    }
];
