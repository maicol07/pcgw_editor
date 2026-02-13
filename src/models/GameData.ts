export interface InfoboxField {
    value: string;
    note?: string;
    ref?: string;
}

export interface InfoboxListItem {
    name: string;
    displayName?: string; // name= argument for engines
    build?: string;       // build= argument for engines
    type?: 'developer' | 'porter';
    extra?: string;
    note?: string;
    ref?: string;
}

export interface ReleaseDateItem {
    platform: string;
    date: string;
    ref?: string;
}

export interface ReceptionRow {
    aggregator: 'Metacritic' | 'OpenCritic' | 'IGDB';
    id: string;
    score: string;
}

export interface GameInfobox {
    cover?: string;
    developers: InfoboxListItem[];
    publishers: InfoboxListItem[];
    engines: InfoboxListItem[];
    releaseDates: ReleaseDateItem[];
    reception: ReceptionRow[];
    taxonomy: {
        monetization: InfoboxField;
        microtransactions: InfoboxField;
        modes: InfoboxField;
        pacing: InfoboxField;
        perspectives: InfoboxField;
        controls: InfoboxField;
        genres: InfoboxField;
        sports: InfoboxField;
        vehicles: InfoboxField;
        artStyles: InfoboxField;
        themes: InfoboxField;
        series: InfoboxField;
    };
    links: {
        steamAppId: string;
        steamAppIdSide: string;
        gogComId: string;
        gogComIdSide: string;
        officialSite: string;
        hltb: string;
        igdb: string;
        lutris: string;
        mobygames: string;
        vndb: string;
        strategyWiki: string;
        wikipedia: string;
        wineHq: string;
        wineHqSide: string;
    };
    license: string;
}

export interface GameIntroduction {
    introduction: string;
    releaseHistory: string;
    currentState: string;
}

export interface GeneralInfoRow {
    type: 'link' | 'gog' | 'steam' | 'pcgw';
    label: string;
    url?: string;
    id?: string;
    forumsId?: string;
    note?: string;
}

export interface AvailabilityRow {
    distribution: string; // This is the 'source' in PCGW template (e.g. Steam, GOG.com)
    id: string;           // Product ID
    drm: string;
    notes: string;
    keys: string;
    os: string;
    state?: 'normal' | 'unavailable' | 'upcoming';
}

export interface GameMonetization {
    adSupported: string;
    crossGameBonus: string;
    dlc: string;
    expansionPack: string;
    freeware: string;
    freeToPlay: string;
    oneTimePurchase: string;
    subscription: string;
    subscriptionGamingService: string;
}

export interface GameMicrotransactions {
    boost: string;
    cosmetic: string;
    currency: string;
    finiteSpend: string;
    infiniteSpend: string;
    freeToGrind: string;
    lootBox: string;
    none: string;
    playerTrading: string;
    timeLimited: string;
    unlock: string;
}

export interface DLCRow {
    name: string;
    notes: string;
    os: string;
}

export interface SettingsVideo {
    wsgfLink?: string;
    widescreenWsgfAward?: string;
    multiMonitorWsgfAward?: string;
    ultraWidescreenWsgfAward?: string;
    fourKUltraHdWsgfAward?: string;

    widescreenResolution: RatingValue;
    widescreenResolutionNotes?: string;
    widescreenResolutionRef?: string;
    multiMonitor: RatingValue;
    multiMonitorNotes?: string;
    multiMonitorRef?: string;
    ultraWidescreen: RatingValue;
    ultraWidescreenNotes?: string;
    ultraWidescreenRef?: string;
    fourKUltraHd: RatingValue;
    fourKUltraHdNotes?: string;
    fourKUltraHdRef?: string;
    fov: RatingValue;
    fovNotes?: string;
    fovRef?: string;
    windowed: RatingValue;
    windowedNotes?: string;
    windowedRef?: string;
    borderlessWindowed: RatingValue;
    borderlessWindowedNotes?: string;
    borderlessWindowedRef?: string;
    anisotropic: RatingValue;
    anisotropicNotes?: string;
    anisotropicRef?: string;
    antiAliasing: RatingValue;
    antiAliasingNotes?: string;
    antiAliasingRef?: string;
    upscaling: RatingValue;
    upscalingTech?: string;
    upscalingNotes?: string;
    upscalingRef?: string;
    frameGen: RatingValue;
    frameGenTech?: string;
    frameGenNotes?: string;
    frameGenRef?: string;
    vsync: RatingValue;
    vsyncNotes?: string;
    vsyncRef?: string;
    fps60: RatingValue;
    fps60Notes?: string;
    fps60Ref?: string;
    fps120: RatingValue;
    fps120Notes?: string;
    fps120Ref?: string;
    hdr: RatingValue;
    hdrNotes?: string;
    hdrRef?: string;
    rayTracing: RatingValue;
    rayTracingNotes?: string;
    rayTracingRef?: string;
    colorBlind: RatingValue;
    colorBlindNotes?: string;
    colorBlindRef?: string;
}

export interface SettingsInput {
    keyRemap: RatingValue;
    keyRemapNotes?: string;
    keyRemapRef?: string;
    mouseSensitivity: RatingValue;
    mouseSensitivityNotes?: string;
    mouseSensitivityRef?: string;
    mouseMenu: RatingValue;
    mouseMenuNotes?: string;
    mouseMenuRef?: string;
    keyboardMousePrompts: RatingValue;
    keyboardMousePromptsNotes?: string;
    keyboardMousePromptsRef?: string;
    invertMouseY: RatingValue;
    invertMouseYNotes?: string;
    invertMouseYRef?: string;
    touchscreen: RatingValue;
    touchscreenNotes?: string;
    touchscreenRef?: string;
    controllerSupport: RatingValue;
    controllerSupportNotes?: string;
    controllerSupportRef?: string;
    fullController: RatingValue;
    fullControllerNotes?: string;
    fullControllerRef?: string;
    controllerRemap: RatingValue;
    controllerRemapNotes?: string;
    controllerRemapRef?: string;
    controllerSensitivity: RatingValue;
    controllerSensitivityNotes?: string;
    controllerSensitivityRef?: string;
    invertControllerY: RatingValue;
    invertControllerYNotes?: string;
    invertControllerYRef?: string;
    steamInputApi: RatingValue;
    steamInputApiNotes?: string;
    steamInputApiRef?: string;
    steamDeckPrompts: RatingValue;
    steamDeckPromptsNotes?: string;
    steamDeckPromptsRef?: string;
    // Expanded fields
    accelerationOption?: RatingValue;
    accelerationOptionNotes?: string;
    accelerationOptionRef?: string;
    xinputControllers?: RatingValue;
    xinputControllersNotes?: string;
    xinputControllersRef?: string;
    xboxPrompts?: RatingValue;
    xboxPromptsNotes?: string;
    xboxPromptsRef?: string;
    impulseTriggers?: RatingValue;
    impulseTriggersNotes?: string;
    impulseTriggersRef?: string;
    playstationControllers?: RatingValue;
    playstationControllersNotes?: string;
    playstationControllersRef?: string;
    playstationControllerModels?: string; // comma separated
    playstationPrompts?: RatingValue;
    playstationPromptsNotes?: string;
    playstationPromptsRef?: string;
    playstationMotionSensors?: RatingValue;
    playstationMotionSensorsNotes?: string;
    playstationMotionSensorsRef?: string;
    playstationMotionSensorsModes?: string;
    dualSenseAdaptiveTrigger?: RatingValue;
    dualSenseAdaptiveTriggerNotes?: string;
    dualSenseAdaptiveTriggerRef?: string;
    dualSenseHaptics?: RatingValue;
    dualSenseHapticsNotes?: string;
    dualSenseHapticsRef?: string;
    playstationConnectionModes?: string;
    playstationConnectionModesNotes?: string;
    playstationConnectionModesRef?: string;
    glightBar?: RatingValue; // light bar support
    glightBarNotes?: string;
    glightBarRef?: string;
    trackedMotionControllers?: RatingValue;
    trackedMotionControllersNotes?: string;
    trackedMotionControllersRef?: string;
    otherControllers?: RatingValue;
    otherControllersNotes?: string;
    otherControllersRef?: string;
    otherButtonPrompts?: string;
    otherButtonPromptsNotes?: string;
    otherButtonPromptsRef?: string;
    controllerHotplug?: RatingValue;
    controllerHotplugNotes?: string;
    controllerHotplugRef?: string;
    hapticFeedback?: RatingValue;
    hapticFeedbackNotes?: string;
    hapticFeedbackRef?: string;
    simultaneousInput?: RatingValue;
    simultaneousInputNotes?: string;
    simultaneousInputRef?: string;
    steamInput: RatingValue;
    steamInputNotes?: string;
    steamInputRef?: string;
    steamInputPrompts?: RatingValue;
    steamInputPromptsNotes?: string;
    steamInputPromptsRef?: string;
    steamControllerPrompts?: RatingValue;
    steamControllerPromptsNotes?: string;
    steamControllerPromptsRef?: string;
    steamInputMotionSensors?: string; // comma separated
    steamInputMotionSensorsNotes?: string;
    steamInputMotionSensorsRef?: string;
    steamInputMotionSensorsModes?: string; // comma separated
    steamCursorDetection?: RatingValue;
    steamCursorDetectionNotes?: string;
    steamCursorDetectionRef?: string;
    // New fields
    directInputControllers?: RatingValue;
    directInputControllersNotes?: string;
    directInputControllersRef?: string;
    directInputPrompts?: RatingValue;
    directInputPromptsNotes?: string;
    directInputPromptsRef?: string;
    nintendoControllers?: RatingValue;
    nintendoControllersNotes?: string;
    nintendoControllersRef?: string;
    nintendoControllerModels?: string;
    nintendoPrompts?: RatingValue;
    nintendoPromptsNotes?: string;
    nintendoPromptsRef?: string;
    nintendoButtonLayout?: RatingValue;
    nintendoButtonLayoutNotes?: string;
    nintendoButtonLayoutRef?: string;
    nintendoMotionSensors?: RatingValue;
    nintendoMotionSensorsNotes?: string;
    nintendoMotionSensorsRef?: string;
    nintendoMotionSensorsModes?: string;
    nintendoConnectionModes?: string;
    nintendoConnectionModesNotes?: string;
    nintendoConnectionModesRef?: string;
    trackedMotionPrompts?: RatingValue;
    trackedMotionPromptsNotes?: string;
    trackedMotionPromptsRef?: string;
    peripheralDevices?: RatingValue;
    peripheralDevicesNotes?: string;
    peripheralDevicesRef?: string;
    peripheralDeviceTypes?: string;
    inputPromptOverride?: RatingValue;
    inputPromptOverrideNotes?: string;
    inputPromptOverrideRef?: string;
    hapticFeedbackHd?: RatingValue;
    hapticFeedbackHdNotes?: string;
    hapticFeedbackHdRef?: string;
    hapticFeedbackHdControllerModels?: string;
    digitalMovementSupported?: RatingValue;
    digitalMovementSupportedNotes?: string;
    digitalMovementSupportedRef?: string;
    steamHookInput?: RatingValue;
    steamHookInputNotes?: string;
    steamHookInputRef?: string;
    steamInputPromptsIcons?: string;
    steamInputPromptsStyles?: string;
    steamInputPresets?: RatingValue;
    steamInputPresetsNotes?: string;
    steamInputPresetsRef?: string;
}

export interface SettingsAudio {
    separateVolume: RatingValue;
    separateVolumeNotes?: string;
    separateVolumeRef?: string;
    surroundSound: RatingValue;
    surroundSoundNotes?: string;
    surroundSoundRef?: string;
    subtitles: RatingValue;
    subtitlesNotes?: string;
    subtitlesRef?: string;
    closedCaptions: RatingValue;
    closedCaptionsNotes?: string;
    closedCaptionsRef?: string;
    muteOnFocusLost: RatingValue;
    muteOnFocusLostNotes?: string;
    muteOnFocusLostRef?: string;
    royaltyFree: RatingValue;
    royaltyFreeNotes?: string;
    royaltyFreeRef?: string;
    // API specific
    eaxSupport?: RatingValue;
    eaxSupportNotes?: string;
    eaxSupportRef?: string;
    redBookCdAudio?: RatingValue;
    redBookCdAudioNotes?: string;
    redBookCdAudioRef?: string;
    generalMidiAudio?: RatingValue;
    generalMidiAudioNotes?: string;
    generalMidiAudioRef?: string;
}

export interface SettingsNetwork {
    // Multiplayer
    localPlay: RatingValue;
    localPlayPlayers?: string;
    localPlayModes?: string;
    localPlayNotes?: string;
    localPlayRef?: string;
    lanPlay: RatingValue;
    lanPlayPlayers?: string;
    lanPlayModes?: string;
    lanPlayNotes?: string;
    lanPlayRef?: string;
    onlinePlay: RatingValue;
    onlinePlayPlayers?: string;
    onlinePlayModes?: string;
    onlinePlayNotes?: string;
    onlinePlayRef?: string;
    asynchronous?: RatingValue;
    asynchronousNotes?: string;
    asynchronousRef?: string;
    crossplay?: RatingValue;
    crossplayPlatforms?: string;
    crossplayNotes?: string;
    crossplayRef?: string;
    // Connections
    matchmaking: RatingValue;
    matchmakingNotes?: string;
    matchmakingRef?: string;
    p2p: RatingValue;
    p2pNotes?: string;
    p2pRef?: string;
    dedicated: RatingValue;
    dedicatedNotes?: string;
    dedicatedRef?: string;
    selfHosting: RatingValue;
    selfHostingNotes?: string;
    selfHostingRef?: string;
    directIp: RatingValue;
    directIpNotes?: string;
    directIpRef?: string;
    // Ports
    tcpPorts?: string;
    udpPorts?: string;
    upnp?: RatingValue;
}

export interface SettingsVR {
    native3d: RatingValue;
    native3dNotes?: string;
    native3dRef?: string;
    nvidia3dVision: RatingValue;
    nvidia3dVisionNotes?: string;
    nvidia3dVisionRef?: string;
    vorpx: RatingValue;
    vorpxModes?: string;
    vorpxNotes?: string;
    vorpxRef?: string;
    vrOnly?: RatingValue;
    openXr: RatingValue;
    openXrNotes?: string;
    openXrRef?: string;
    steamVr: RatingValue;
    steamVrNotes?: string;
    steamVrRef?: string;
    oculusVr: RatingValue;
    oculusVrNotes?: string;
    oculusVrRef?: string;
    windowsMixedReality: RatingValue;
    windowsMixedRealityNotes?: string;
    windowsMixedRealityRef?: string;
    osvr: RatingValue;
    osvrNotes?: string;
    osvrRef?: string;
    forteNsx1?: RatingValue;
    forteNsx1Notes?: string;
    forteNsx1Ref?: string;
    keyboardMouse: RatingValue;
    keyboardMouseNotes?: string;
    keyboardMouseRef?: string;
    bodyTracking: RatingValue;
    bodyTrackingNotes?: string;
    bodyTrackingRef?: string;
    handTracking: RatingValue;
    handTrackingNotes?: string;
    handTrackingRef?: string;
    faceTracking: RatingValue;
    faceTrackingNotes?: string;
    faceTrackingRef?: string;
    eyeTracking: RatingValue;
    eyeTrackingNotes?: string;
    eyeTrackingRef?: string;
    tobiiEyeTracking: RatingValue;
    tobiiEyeTrackingNotes?: string;
    tobiiEyeTrackingRef?: string;
    trackIr: RatingValue;
    trackIrNotes?: string;
    trackIrRef?: string;
    thirdSpaceGamingVest?: RatingValue;
    thirdSpaceGamingVestNotes?: string;
    thirdSpaceGamingVestRef?: string;
    novintFalcon?: RatingValue;
    novintFalconNotes?: string;
    novintFalconRef?: string;
    playAreaSeated: RatingValue;
    playAreaSeatedNotes?: string;
    playAreaSeatedRef?: string;
    playAreaStanding: RatingValue;
    playAreaStandingNotes?: string;
    playAreaStandingRef?: string;
    playAreaRoomScale: RatingValue;
    playAreaRoomScaleNotes?: string;
    playAreaRoomScaleRef?: string;
}

export interface LocalizationRow {
    language: string;
    interface: RatingValue;
    audio: RatingValue;
    subtitles: RatingValue;
    notes?: string;
    fan?: boolean;
    ref?: string;
}

export type RatingValue = 'true' | 'limited' | 'always on' | 'false' | 'hackable' | 'n/a' | 'unknown';

export type StateType = 'none' | 'stub' | 'cleanup' | 'state' | 'delete';
export type GameStateValue = 'prototype' | 'dev' | 'postdev' | 'unknown' | 'abandoned' | 'unplayable';

export interface ArticleState {
    stub?: boolean;
    cleanup?: boolean;
    cleanupDescription?: string;
    state?: 'dev' | 'retired' | 'unknown' | null;
    delete?: boolean;
    deleteReason?: string;
    // Phase 7 refinements
    disambig?: string[];
    distinguish?: string[];
}

export interface CloudSyncService {
    status: RatingValue;
    notes: string;
}

export interface CloudSync {
    discord: RatingValue;
    discordNotes?: string;
    epicGamesLauncher: RatingValue;
    epicGamesLauncherNotes?: string;
    gogGalaxy: RatingValue;
    gogGalaxyNotes?: string;
    eaApp: RatingValue;
    eaAppNotes?: string;
    steamCloud: RatingValue;
    steamCloudNotes?: string;
    ubisoftConnect: RatingValue;
    ubisoftConnectNotes?: string;
    xboxCloud: RatingValue;
    xboxCloudNotes?: string;
    status?: RatingValue;
    notes?: string;
}

export interface GameDataPathRow {
    platform: string;
    paths: string[];
}

export interface GameDataConfig {
    configFiles: GameDataPathRow[];
    saveData: GameDataPathRow[];
    xdg: boolean | null;
    cloudSync: CloudSync;
}

export interface SystemSpecs {
    target?: string;
    os: string;
    cpu: string;
    cpu2?: string;
    ram: string;
    hdd: string;
    gpu: string;
    gpu2?: string;
    gpu3?: string;
    vram?: string;
    ogl?: string;
    dx?: string;
    sm?: string;
    audio?: string;
    cont?: string;
    other?: string;
}

export interface SystemRequirementsOS {
    minimum: SystemSpecs;
    recommended: SystemSpecs;
    alt1?: SystemSpecs & { title?: string };
    alt2?: SystemSpecs & { title?: string };
    notes?: string;
}

export interface SystemRequirements {
    windows: SystemRequirementsOS;
    mac: SystemRequirementsOS;
    linux: SystemRequirementsOS;
}

export interface SettingsAPI {
    // Graphics APIs
    dxVersion: string; // direct3d versions
    dxNotes?: string;
    dxRef?: string;
    directDrawVersion?: string;
    directDrawNotes?: string;
    directDrawRef?: string;
    wing: RatingValue;
    wingNotes?: string;
    wingRef?: string;
    openGlVersion: string;
    openGlNotes?: string;
    openGlRef?: string;
    glideVersion?: string;
    glideNotes?: string;
    glideRef?: string;
    softwareMode: RatingValue;
    softwareModeNotes?: string;
    softwareModeRef?: string;
    mantle: RatingValue;
    mantleNotes?: string;
    mantleRef?: string;
    metal: RatingValue;
    metalNotes?: string;
    metalRef?: string;
    vulkanVersion: string;
    vulkanNotes?: string;
    vulkanRef?: string;
    dosModes?: string;
    dosModesNotes?: string;
    dosModesRef?: string;

    // Windows
    windows32: RatingValue;
    windows64: RatingValue;
    windowsArm: RatingValue;
    windowsNotes?: string;
    windowsRef?: string;

    // Mac OS / macOS
    macOsPowerPc: RatingValue;
    macOs68k: RatingValue;
    macOsNotes?: string;
    macOsRef?: string;

    macOsXPowerPc: RatingValue;
    macOsIntel32: RatingValue;
    macOsIntel64: RatingValue;
    macOsArm: RatingValue;
    macOsAppNotes?: string;
    macOsAppRef?: string;

    // Linux
    linuxPowerPc: RatingValue;
    linux32: RatingValue;
    linux64: RatingValue;
    linuxArm: RatingValue;
    linux68k: RatingValue;
    linuxNotes?: string;
    linuxRef?: string;
}

export interface MiddlewareRow {
    name: string;
    notes?: string;
}

// Simplified Middleware (Value + Notes)
export interface GameMiddleware {
    physics: string;
    physicsNotes?: string;
    audio: string;
    audioNotes?: string;
    interface: string;
    interfaceNotes?: string;
    input: string;
    inputNotes?: string;
    cutscenes: string;
    cutscenesNotes?: string;
    multiplayer: string;
    multiplayerNotes?: string;
    anticheat: string;
    anticheatNotes?: string;
}

export interface GalleryImage {
    name: string;
    caption?: string;
}

export interface Issue {
    title: string;
    body: string;
}

export interface GameData {
    issuesFixed: Issue[];
    issuesUnresolved: Issue[];
    articleState: ArticleState;
    infobox: GameInfobox;
    introduction: GameIntroduction;
    essentialImprovements: string;
    generalInformation: GeneralInfoRow[];
    availability: AvailabilityRow[];
    monetization: GameMonetization;
    microtransactions: GameMicrotransactions;
    video: SettingsVideo;
    input: SettingsInput;
    audio: SettingsAudio;
    network: SettingsNetwork;
    vr: SettingsVR;
    localizations: LocalizationRow[];
    api: SettingsAPI;
    middleware: GameMiddleware;

    // General Info
    generalInfo: GeneralInfoRow[];

    // Configuration & Save Data
    config: GameDataConfig;
    requirements: SystemRequirements;
    dlc: DLCRow[];
    galleries: Record<string, GalleryImage[]>;
}

export const initialGameData: GameData = {
    articleState: {
        stub: true,
    },
    infobox: {
        cover: 'GAME TITLE cover.jpg',
        developers: [],
        publishers: [],
        engines: [],
        releaseDates: [],
        reception: [],
        taxonomy: {
            monetization: { value: 'One-time game purchase' },
            microtransactions: { value: '' },
            modes: { value: 'Singleplayer' },
            pacing: { value: '' },
            perspectives: { value: '' },
            controls: { value: '' },
            genres: { value: '' },
            sports: { value: '' },
            vehicles: { value: '' },
            artStyles: { value: '' },
            themes: { value: '' },
            series: { value: 'PCGW Templates' },
        },
        links: {
            steamAppId: '',
            steamAppIdSide: '',
            gogComId: '',
            gogComIdSide: '',
            officialSite: '',
            hltb: '',
            igdb: '',
            lutris: '',
            mobygames: '',
            vndb: '',
            strategyWiki: '',
            wikipedia: '',
            wineHq: '',
            wineHqSide: '',
        },
        license: 'commercial',
    },
    introduction: {
        introduction: '',
        releaseHistory: '',
        currentState: '',
    },
    essentialImprovements: '',
    generalInformation: [],
    availability: [
        { distribution: 'Steam', id: '', drm: 'Steam', notes: '', keys: '', os: 'Windows', state: 'normal' }
    ],
    monetization: {
        adSupported: '',
        crossGameBonus: '',
        dlc: '',
        expansionPack: '',
        freeware: '',
        freeToPlay: '',
        oneTimePurchase: 'The game requires an upfront purchase to access.',
        subscription: '',
        subscriptionGamingService: '',
    },
    microtransactions: {
        boost: '',
        cosmetic: '',
        currency: '',
        finiteSpend: '',
        infiniteSpend: '',
        freeToGrind: '',
        lootBox: '',
        none: 'The game does not contain microtransactions.',
        playerTrading: '',
        timeLimited: '',
        unlock: '',
    },
    video: {
        widescreenResolution: 'unknown',
        multiMonitor: 'unknown',
        ultraWidescreen: 'unknown',
        fourKUltraHd: 'unknown',
        fov: 'unknown',
        windowed: 'unknown',
        borderlessWindowed: 'unknown',
        anisotropic: 'unknown',
        antiAliasing: 'unknown',
        upscaling: 'unknown',
        frameGen: 'unknown',
        vsync: 'unknown',
        fps60: 'unknown',
        fps120: 'unknown',
        hdr: 'unknown',
        rayTracing: 'unknown',
        colorBlind: 'unknown',
    },
    input: {
        keyRemap: 'unknown',
        mouseSensitivity: 'unknown',
        mouseMenu: 'unknown',
        keyboardMousePrompts: 'unknown',
        invertMouseY: 'unknown',
        touchscreen: 'unknown',
        controllerSupport: 'unknown',
        fullController: 'unknown',
        controllerRemap: 'unknown',
        controllerSensitivity: 'unknown',
        invertControllerY: 'unknown',
        steamInputApi: 'unknown',
        steamDeckPrompts: 'unknown',
        controllerHotplug: 'unknown',
        hapticFeedback: 'unknown',
        otherButtonPrompts: '',
        simultaneousInput: 'unknown',
        steamHookInput: 'unknown',
        steamInput: 'unknown', // legacy or alias? Keeping for now but steamHookInput is the new one
        steamInputPromptsIcons: '',
        steamInputPromptsStyles: '',
        steamInputPresets: 'unknown',
        nintendoControllers: 'unknown',
        nintendoPrompts: 'unknown',
        nintendoButtonLayout: 'unknown',
        nintendoMotionSensors: 'unknown',
        trackedMotionPrompts: 'unknown',
        peripheralDevices: 'unknown',
        inputPromptOverride: 'unknown',
        hapticFeedbackHd: 'unknown',
        digitalMovementSupported: 'unknown',
        directInputControllers: 'unknown',
        directInputPrompts: 'unknown',
    },
    audio: {
        separateVolume: 'unknown',
        surroundSound: 'unknown',
        subtitles: 'unknown',
        closedCaptions: 'unknown',
        muteOnFocusLost: 'unknown',
        royaltyFree: 'unknown',
        eaxSupport: 'unknown',
        redBookCdAudio: 'unknown',
        generalMidiAudio: 'unknown',
    },
    network: {
        localPlay: 'unknown',
        lanPlay: 'unknown',
        onlinePlay: 'unknown',
        matchmaking: 'unknown',
        p2p: 'unknown',
        dedicated: 'unknown',
        selfHosting: 'unknown',
        directIp: 'unknown',
    },
    vr: {
        native3d: 'unknown',
        nvidia3dVision: 'unknown',
        vorpx: 'unknown',
        openXr: 'unknown',
        steamVr: 'unknown',
        oculusVr: 'unknown',
        windowsMixedReality: 'unknown',
        osvr: 'unknown',
        keyboardMouse: 'unknown',
        bodyTracking: 'unknown',
        handTracking: 'unknown',
        faceTracking: 'unknown',
        eyeTracking: 'unknown',
        tobiiEyeTracking: 'unknown',
        trackIr: 'unknown',
        playAreaSeated: 'unknown',
        playAreaStanding: 'unknown',
        playAreaRoomScale: 'unknown',
    },
    localizations: [],
    api: {
        dxVersion: '',
        dxNotes: '',
        directDrawVersion: '',
        directDrawNotes: '',
        wing: 'unknown',
        wingNotes: '',
        openGlVersion: '',
        openGlNotes: '',
        glideVersion: '',
        glideNotes: '',
        softwareMode: 'unknown',
        softwareModeNotes: '',
        mantle: 'unknown',
        mantleNotes: '',
        metal: 'unknown',
        metalNotes: '',
        vulkanVersion: '',
        vulkanNotes: '',
        dosModes: '',
        dosModesNotes: '',

        windows32: 'unknown',
        windows64: 'unknown',
        windowsArm: 'unknown',
        windowsNotes: '',

        macOsPowerPc: 'unknown',
        macOs68k: 'unknown',
        macOsNotes: '',
        macOsXPowerPc: 'unknown',
        macOsIntel32: 'unknown',
        macOsIntel64: 'unknown',
        macOsArm: 'unknown',
        macOsAppNotes: '',

        linuxPowerPc: 'unknown',
        linux32: 'unknown',
        linux64: 'unknown',
        linuxArm: 'unknown',
        linux68k: 'unknown',
        linuxNotes: '',
    },
    middleware: {
        physics: 'unknown',
        audio: 'unknown',
        interface: 'unknown',
        input: 'unknown',
        cutscenes: 'unknown',
        multiplayer: 'unknown',
        anticheat: 'unknown',
    },
    generalInfo: [],
    config: {
        configFiles: [
            { platform: 'Windows', paths: [''] }
        ],
        saveData: [
            { platform: 'Windows', paths: [''] }
        ],
        xdg: null,
        cloudSync: {
            discord: 'unknown',
            discordNotes: '',
            epicGamesLauncher: 'unknown',
            epicGamesLauncherNotes: '',
            gogGalaxy: 'unknown',
            gogGalaxyNotes: '',
            eaApp: 'unknown',
            eaAppNotes: '',
            steamCloud: 'unknown',
            steamCloudNotes: '',
            ubisoftConnect: 'unknown',
            ubisoftConnectNotes: '',
            xboxCloud: 'unknown',
            xboxCloudNotes: '',
        }
    },
    requirements: {
        windows: {
            minimum: { os: '', cpu: '', ram: '', hdd: '', gpu: '' },
            recommended: { os: '', cpu: '', ram: '', hdd: '', gpu: '' },
            notes: '',
        },
        mac: {
            minimum: { os: '', cpu: '', ram: '', hdd: '', gpu: '' },
            recommended: { os: '', cpu: '', ram: '', hdd: '', gpu: '' },
            notes: '',
        },
        linux: {
            minimum: { os: '', cpu: '', ram: '', hdd: '', gpu: '' },
            recommended: { os: '', cpu: '', ram: '', hdd: '', gpu: '' },
            notes: '',
        },
    },
    dlc: [],
    galleries: {
        video: [],
        input: [],
        audio: [],
        vr: [],
        network: [],
        other: [],
        systemReq: [],
        game_data: [],
    },
    issuesFixed: [],
    issuesUnresolved: [],
};
