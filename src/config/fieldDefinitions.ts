import { InfoboxListItem } from '../models/GameData';

export interface FieldMetadata {
    wikitextParam: string;
    defaultValue?: any;
    parser?: (wikitext: string) => any;
    formatter?: (value: any) => string;
    writer?: (wikitext: string, value: any) => string;
    template?: string;
}

// Helpers
export const infoboxListParser = (_wikitext: string): InfoboxListItem[] => {
    // Basic parser placeholder - relies on WikitextParser usually
    return [];
};

export const infoboxListFormatter = (values: InfoboxListItem[]): string => {
    if (!Array.isArray(values) || values.length === 0) return '';
    return values.map(item => `{{Infobox game/row/${item.type || 'developer'}|${item.name}}}`).join('\n');
};

export const gameDataConfigParser = (wikitext: string): any => {
    return { detected: true, raw: wikitext };
};

export const FIELD_DEFINITIONS: Record<string, FieldMetadata> = {
    // Basic Info
    'cover': { wikitextParam: 'cover', defaultValue: 'GAME TITLE cover.jpg' },
    'license': { wikitextParam: 'license', defaultValue: 'commercial' },
    'developers': { wikitextParam: 'developers', defaultValue: [], parser: infoboxListParser, formatter: infoboxListFormatter },
    'publishers': { wikitextParam: 'publishers', defaultValue: [], parser: infoboxListParser, formatter: infoboxListFormatter },
    'engines': { wikitextParam: 'engines', defaultValue: [] },
    'releaseDates': { wikitextParam: 'release_dates', defaultValue: [] },

    // Reception
    'reception': { wikitextParam: 'reception', defaultValue: [] },

    // Taxonomy
    'taxonomy.monetization': { wikitextParam: 'monetization', defaultValue: { value: '' } },
    'taxonomy.microtransactions': { wikitextParam: 'microtransactions', defaultValue: { value: '' } },
    'taxonomy.modes': { wikitextParam: 'modes', defaultValue: { value: '' } },
    'taxonomy.pacing': { wikitextParam: 'pacing', defaultValue: { value: '' } },
    'taxonomy.perspectives': { wikitextParam: 'perspectives', defaultValue: { value: '' } },
    'taxonomy.controls': { wikitextParam: 'controls', defaultValue: { value: '' } },
    'taxonomy.genres': { wikitextParam: 'genres', defaultValue: { value: '' } },
    'taxonomy.sports': { wikitextParam: 'sports', defaultValue: { value: '' } },
    'taxonomy.vehicles': { wikitextParam: 'vehicles', defaultValue: { value: '' } },
    'taxonomy.artStyles': { wikitextParam: 'art_styles', defaultValue: { value: '' } },
    'taxonomy.themes': { wikitextParam: 'themes', defaultValue: { value: '' } },
    'taxonomy.series': { wikitextParam: 'series', defaultValue: { value: '' } },

    // External Links
    'links.steamAppId': { wikitextParam: 'steam_appid' },
    'links.steamAppIdSide': { wikitextParam: 'steam_appid_side' },
    'links.officialSite': { wikitextParam: 'official_site' },
    'links.gogComId': { wikitextParam: 'gogcom_id' },
    'links.gogComIdSide': { wikitextParam: 'gogcom_id_side' },
    'links.hltb': { wikitextParam: 'hltb' },
    'links.igdb': { wikitextParam: 'igdb' },
    'links.mobygames': { wikitextParam: 'mobygames' },
    'links.strategyWiki': { wikitextParam: 'strategywiki' },
    'links.wikipedia': { wikitextParam: 'wikipedia' },
    'links.vndb': { wikitextParam: 'vndb' },
    'links.lutris': { wikitextParam: 'lutris' },
    'links.wineHq': { wikitextParam: 'winehq' },

    // Article State
    'articleState.disambig': { wikitextParam: 'disambig' },
    'articleState.distinguish': { wikitextParam: 'distinguish' },
    'articleState.stub': { wikitextParam: '' }, // Special handling in UI or internal logic? wikitextParam empty in original
    'articleState.cleanup': { wikitextParam: '' },
    'articleState.cleanupDescription': { wikitextParam: '' },
    'articleState.delete': { wikitextParam: '' },
    'articleState.deleteReason': { wikitextParam: '' },
    'articleState.state': { wikitextParam: '', defaultValue: '' },

    // Introduction
    'introduction.introduction': { wikitextParam: 'introduction' },
    'introduction.generalInfo': { wikitextParam: '' }, // No wikitext representation, used for general links
    'introduction.releaseHistory': { wikitextParam: 'release_history' },
    'introduction.currentState': { wikitextParam: 'current_state' },

    // Availability
    'availability': { wikitextParam: 'availability', defaultValue: [] },

    // Monetization
    'monetization.oneTimePurchase': { wikitextParam: 'monetization', defaultValue: 'The game requires an upfront purchase to access.' },
    'monetization.freeToPlay': { wikitextParam: 'monetization', defaultValue: '' },
    'monetization.freeware': { wikitextParam: 'monetization', defaultValue: '' },
    'monetization.adSupported': { wikitextParam: 'monetization', defaultValue: '' },
    'monetization.subscription': { wikitextParam: 'monetization', defaultValue: '' },
    'monetization.subscriptionGamingService': { wikitextParam: 'monetization', defaultValue: '' },
    'monetization.dlc': { wikitextParam: 'monetization', defaultValue: '' },
    'monetization.expansionPack': { wikitextParam: 'monetization', defaultValue: '' },
    'monetization.crossGameBonus': { wikitextParam: 'monetization', defaultValue: '' },

    // Microtransactions
    'microtransactions.none': { wikitextParam: 'microtransactions', defaultValue: 'The game does not contain microtransactions.' },
    'microtransactions.cosmetic': { wikitextParam: 'microtransactions', defaultValue: '' },
    'microtransactions.currency': { wikitextParam: 'microtransactions', defaultValue: '' },
    'microtransactions.lootBox': { wikitextParam: 'microtransactions', defaultValue: '' },
    'microtransactions.unlock': { wikitextParam: 'microtransactions', defaultValue: '' },
    'microtransactions.boost': { wikitextParam: 'microtransactions', defaultValue: '' },
    'microtransactions.freeToGrind': { wikitextParam: 'microtransactions', defaultValue: '' },
    'microtransactions.finiteSpend': { wikitextParam: 'microtransactions', defaultValue: '' },
    'microtransactions.infiniteSpend': { wikitextParam: 'microtransactions', defaultValue: '' },
    'microtransactions.playerTrading': { wikitextParam: 'microtransactions', defaultValue: '' },
    'microtransactions.timeLimited': { wikitextParam: 'microtransactions', defaultValue: '' },

    // DLC
    'dlc': { wikitextParam: 'dlc', defaultValue: [] },

    // Essential Improvements
    'essentialImprovements': { wikitextParam: 'essential_improvements' },

    // Audio
    'audio': { wikitextParam: '' }, // Placeholder for compound fields? No, the original has wikitextParam for each key.
    // Wait, in the original fields.ts, 'audio' key is reused many times with DIFFERENT wikitextParams.
    // This structure relies on 'key' property.
    // In definitions, I should use valid unique keys or map by the specific ID if possible.
    // The 'key' in fields.ts generally maps to the data model path.
    // 'audio' is the key in the model.
    // E.g. { key: 'audio', label: 'Separate Volume Controls', wikitextParam: 'separate_volume' }
    // The wikitextParam is unique.
    // I can map by wikitextParam OR use a composite key OR just listing them.
    // But the request says "Non voglio riferimenti a un field doppi/duplicati".
    // Using the 'key' (model path) is ambiguous for 'audio', 'video', 'input' because they are CompoundRatingFields or similar where multiple UI fields map to one object but different properties.
    // Actually, look at 'componentProps': { field: 'separateVolume' ... }
    // The 'key' is 'audio', but the actual property modified is inside 'audio'.
    // Maybe I should define them by the full path "audio.separateVolume"?
    // But the 'key' in FieldDefinition is used for "Internal unique identifier for the field (matches logic model key)".
    // If multiple fields share the same 'key', they bind to the same object?
    // Let's look closer at `CompoundRatingField`. It likely uses `componentProps.field` to identify the specific property.
    // So 'audio' is the parent object.

    // To centralize, I probably want to key by a unique string.
    // Let's use "audio.separateVolume" etc. for these specific ones.

    'audio.separateVolume': { wikitextParam: 'separate_volume' },
    'audio.surroundSound': { wikitextParam: 'surround_sound' },
    'audio.subtitles': { wikitextParam: 'subtitles' },
    'audio.closedCaptions': { wikitextParam: 'closed_captions' },
    'audio.muteOnFocusLost': { wikitextParam: 'mute_on_focus_lost' },
    'audio.royaltyFree': { wikitextParam: 'royalty_free' },
    'audio.eaxSupport': { wikitextParam: 'eax_support' },
    'audio.redBookCdAudio': { wikitextParam: 'red_book_cd_audio' },
    'audio.generalMidiAudio': { wikitextParam: 'general_midi_audio' },

    // Game Data
    'config': { wikitextParam: 'config', defaultValue: {}, parser: gameDataConfigParser },
    'config.cloudSync.steamCloud': { wikitextParam: 'steam_cloud' },
    'config.cloudSync.discord': { wikitextParam: 'discord' },
    'config.cloudSync.epicGamesLauncher': { wikitextParam: 'epic_games_launcher' },
    'config.cloudSync.gogGalaxy': { wikitextParam: 'gog_galaxy' },
    'config.cloudSync.eaApp': { wikitextParam: 'ea_app' },
    'config.cloudSync.ubisoftConnect': { wikitextParam: 'ubisoft_connect' },
    'config.cloudSync.xboxCloud': { wikitextParam: 'xbox_cloud' },

    // Video
    'video.analysis': { wikitextParam: '' }, // Special
    'video.gallery': { wikitextParam: '' }, // Special
    'video.wsgfLink': { wikitextParam: 'wsgf_link' },
    'video.widescreenWsgfAward': { wikitextParam: 'widescreen_award' },
    'video.multiMonitorWsgfAward': { wikitextParam: 'multimonitor_award' },
    'video.ultraWidescreenWsgfAward': { wikitextParam: 'ultrawidescreen_award' },
    'video.fourKUltraHdWsgfAward': { wikitextParam: '4k_award' },

    'video.widescreenResolution': { wikitextParam: 'widescreen_resolution' },
    'video.multiMonitor': { wikitextParam: 'multimonitor' },
    'video.ultraWidescreen': { wikitextParam: 'ultrawidescreen' },
    'video.fourKUltraHd': { wikitextParam: '4k_ultra_hd' },
    'video.fov': { wikitextParam: 'fov' },
    'video.windowed': { wikitextParam: 'windowed' },
    'video.borderlessWindowed': { wikitextParam: 'borderless_windowed' },

    'video.anisotropic': { wikitextParam: 'anisotropic' },
    'video.antiAliasing': { wikitextParam: 'antialiasing' },
    'video.upscaling': { wikitextParam: 'upscaling' },
    'video.upscalingTech': { wikitextParam: 'upscaling_tech' },
    'video.frameGen': { wikitextParam: 'frame_gen' },
    'video.frameGenTech': { wikitextParam: 'frame_gen_tech' },
    'video.vsync': { wikitextParam: 'vsync' },
    'video.fps60': { wikitextParam: '60_fps' },
    'video.fps120': { wikitextParam: '120_fps' },
    'video.hdr': { wikitextParam: 'hdr' },
    'video.rayTracing': { wikitextParam: 'ray_tracing' },
    'video.colorBlind': { wikitextParam: 'color_blind' },

    // Input
    'input.keyRemap': { wikitextParam: 'key_remap' },
    'input.keyboardMousePrompts': { wikitextParam: 'prompts_keyboard_mouse' },
    'input.mouseSensitivity': { wikitextParam: 'mouse_sensitivity' },
    'input.mouseMenu': { wikitextParam: 'mouse_menu' },
    'input.invertMouseY': { wikitextParam: 'invert_mouse_y' },
    'input.touchscreen': { wikitextParam: 'touchscreen' },
    'input.controllerSupport': { wikitextParam: 'controller_support' },
    'input.fullController': { wikitextParam: 'controller_support_full' },
    'input.controllerRemap': { wikitextParam: 'controller_remap' },
    'input.controllerSensitivity': { wikitextParam: 'controller_sensitivity' },
    'input.invertControllerY': { wikitextParam: 'invert_controller_y' },
    'input.controllerHotplug': { wikitextParam: 'controller_hotplug' },
    'input.hapticFeedback': { wikitextParam: 'haptic_feedback' },
    'input.hapticFeedbackHd': { wikitextParam: 'haptic_feedback_hd' },
    'input.hapticFeedbackHdControllerModels': { wikitextParam: 'haptic_feedback_hd_models' },
    'input.simultaneousInput': { wikitextParam: 'simultaneous input' },
    'input.accelerationOption': { wikitextParam: 'acceleration_option' },
    'input.xinputControllers': { wikitextParam: 'xinput_controllers' },
    'input.xboxPrompts': { wikitextParam: 'prompts_xbox' },
    'input.impulseTriggers': { wikitextParam: 'impulse_triggers' },
    'input.directInputControllers': { wikitextParam: 'directinput_controllers' },
    'input.directInputPrompts': { wikitextParam: 'prompts_directinput' },
    'input.playstationControllers': { wikitextParam: 'playstation_controllers' },
    'input.playstationControllerModels': { wikitextParam: 'playstation_controllers_models' },
    'input.playstationPrompts': { wikitextParam: 'prompts_playstation' },
    'input.playstationMotionSensors': { wikitextParam: 'playstation_motion_sensors' },
    'input.playstationMotionSensorsModes': { wikitextParam: 'playstation_motion_sensors_modes' },
    'input.playstationLightBar': { wikitextParam: 'playstation_light_bar' },
    'input.playstationAdaptiveTriggers': { wikitextParam: 'playstation_adaptive_triggers' },
    'input.playstationHaptics': { wikitextParam: 'playstation_haptics' },
    'input.glightBar': { wikitextParam: 'playstation_light_bar' },
    'input.dualSenseAdaptiveTrigger': { wikitextParam: 'playstation_adaptive_triggers' },
    'input.dualSenseHaptics': { wikitextParam: 'playstation_haptics' },
    'input.playstationConnectionModes': { wikitextParam: 'playstation_connection_modes' },
    'input.nintendoControllers': { wikitextParam: 'nintendo_controllers' },
    'input.nintendoControllerModels': { wikitextParam: 'nintendo_controllers_models' },
    'input.nintendoPrompts': { wikitextParam: 'prompts_nintendo' },
    'input.nintendoButtonLayout': { wikitextParam: 'nintendo_button_layout' },
    'input.nintendoMotionSensors': { wikitextParam: 'nintendo_motion_sensors' },
    'input.nintendoMotionSensorsModes': { wikitextParam: 'nintendo_motion_sensors_modes' },
    'input.nintendoConnectionModes': { wikitextParam: 'nintendo_connection_modes' },
    'input.steamInputApi': { wikitextParam: 'steam_input_api' },
    'input.steamHookInput': { wikitextParam: 'steam_hook_input' },
    'input.steamInputPrompts': { wikitextParam: 'prompts_steam_input' },
    'input.steamInputPromptsIcons': { wikitextParam: 'prompts_steam_input_icons' },
    'input.steamInputPromptsStyles': { wikitextParam: 'prompts_steam_input_styles' },
    'input.steamDeckPrompts': { wikitextParam: 'prompts_steam_deck' },
    'input.steamControllerPrompts': { wikitextParam: 'prompts_steam_controller' },
    'input.steamInputMotionSensors': { wikitextParam: 'steam_input_motion_sensors' },
    'input.steamInputMotionSensorsModes': { wikitextParam: 'steam_input_motion_sensors_modes' },
    'input.steamInputPresets': { wikitextParam: 'steam_input_presets' },
    'input.steamCursorDetection': { wikitextParam: 'steam_cursor_detection' },

    'input.trackedMotionControllers': { wikitextParam: 'tracked_motion_controllers' },
    'input.trackedMotionPrompts': { wikitextParam: 'prompts_tracked_motion' },
    'input.otherControllers': { wikitextParam: 'other_controllers' },
    'input.otherButtonPrompts': { wikitextParam: 'other_button_prompts' },
    'input.digitalMovementSupported': { wikitextParam: 'digital_movement_supported' },
    'input.peripheralDevices': { wikitextParam: 'peripheral_devices' },
    'input.peripheralDeviceTypes': { wikitextParam: 'peripheral_devices_types' },
    'input.inputPromptOverride': { wikitextParam: 'input_prompt_override' },

    // Network
    'network.localPlay': { wikitextParam: 'local_play' },
    'network.localPlayPlayers': { wikitextParam: 'local_play_players' },
    'network.localPlayModes': { wikitextParam: 'local_play_modes' },
    'network.lanPlay': { wikitextParam: 'lan_play' },
    'network.lanPlayPlayers': { wikitextParam: 'lan_play_players' },
    'network.lanPlayModes': { wikitextParam: 'lan_play_modes' },
    'network.onlinePlay': { wikitextParam: 'online_play' },
    'network.onlinePlayPlayers': { wikitextParam: 'online_play_players' },
    'network.onlinePlayModes': { wikitextParam: 'online_play_modes' },
    'network.asynchronous': { wikitextParam: 'asynchronous' },
    'network.crossplay': { wikitextParam: 'crossplay' },
    'network.crossplayPlatforms': { wikitextParam: 'crossplay_platforms' },
    'network.matchmaking': { wikitextParam: 'matchmaking' },
    'network.p2p': { wikitextParam: 'p2p' },
    'network.dedicated': { wikitextParam: 'dedicated' },
    'network.selfHosting': { wikitextParam: 'self_hosting' },
    'network.directIp': { wikitextParam: 'direct_ip' },
    'network.tcpPorts': { wikitextParam: 'tcp_ports' },
    'network.udpPorts': { wikitextParam: 'udp_ports' },
    'network.upnp': { wikitextParam: 'upnp' },

    // VR
    'vr.native3d': { wikitextParam: 'native 3d' },
    'vr.nvidia3dVision': { wikitextParam: 'nvidia 3d vision' },
    'vr.vorpx': { wikitextParam: 'vorpx' },
    'vr.vorpxModes': { wikitextParam: 'vorpx modes' },
    'vr.vrOnly': { wikitextParam: 'vr only' },
    'vr.openXr': { wikitextParam: 'openxr' },
    'vr.steamVr': { wikitextParam: 'steamvr' },
    'vr.oculusVr': { wikitextParam: 'oculusvr' },
    'vr.windowsMixedReality': { wikitextParam: 'windows mixed reality' },
    'vr.osvr': { wikitextParam: 'osvr' },
    'vr.forteNsx1': { wikitextParam: 'forte vfx1' },
    'vr.keyboardMouse': { wikitextParam: 'keyboard-mouse' },
    'vr.bodyTracking': { wikitextParam: 'body tracking' },
    'vr.handTracking': { wikitextParam: 'hand tracking' },
    'vr.faceTracking': { wikitextParam: 'face tracking' },
    'vr.eyeTracking': { wikitextParam: 'eye tracking' },
    'vr.tobiiEyeTracking': { wikitextParam: 'tobii eye tracking' },
    'vr.trackIr': { wikitextParam: 'trackir' },
    'vr.thirdSpaceGamingVest': { wikitextParam: '3rd space gaming vest' },
    'vr.novintFalcon': { wikitextParam: 'novint falcon' },
    'vr.playAreaSeated': { wikitextParam: 'play area seated' },
    'vr.playAreaStanding': { wikitextParam: 'play area standing' },
    'vr.playAreaRoomScale': { wikitextParam: 'play area room-scale' },

    // API
    'api.dxVersion': { wikitextParam: 'dx' },
    'api.directDrawVersion': { wikitextParam: 'directdraw versions' },
    'api.wing': { wikitextParam: 'wing' },
    'api.openGlVersion': { wikitextParam: 'opengl' },
    'api.glideVersion': { wikitextParam: 'glide versions' },
    'api.softwareMode': { wikitextParam: 'software mode' },
    'api.mantle': { wikitextParam: 'mantle support' },
    'api.vulkanVersion': { wikitextParam: 'vulkan' },
    'api.metal': { wikitextParam: 'metal support' },
    'api.dosModes': { wikitextParam: 'dos modes' },

    // Operating System
    // 'requirements' - handled by special form

    // Middleware
    'middleware.physics': { wikitextParam: 'physics' },
    'middleware.audio': { wikitextParam: 'audio' },
    'middleware.interface': { wikitextParam: 'interface' },
    'middleware.input': { wikitextParam: 'input' },
    'middleware.cutscenes': { wikitextParam: 'cutscenes' },
    'middleware.multiplayer': { wikitextParam: 'multiplayer' },
    'middleware.anticheat': { wikitextParam: 'anticheat' },

    // System Requirements
    'requirements': { wikitextParam: 'system_requirements', defaultValue: {} },

    // Localizations
    'localizations': { wikitextParam: 'localizations', defaultValue: [] },

    // Issues
    'issues': { wikitextParam: 'issues', defaultValue: [] },
};
