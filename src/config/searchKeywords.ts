export const searchKeywords: Record<string, string[]> = {
    articleState: ['stub', 'cleanup', 'delete', 'state', 'disambig'],
    infobox: ['cover', 'developer', 'publisher', 'engine', 'genre', 'taxonomy', 'release'],
    introduction: ['introduction', 'release history', 'current state', 'title'],
    availability: ['store', 'drm', 'launcher', 'steam', 'gog', 'notes'],
    monetization: ['ad', 'dlc', 'microtransactions', 'loot'],
    dlc: ['dlc', 'expansions'],
    essentialImprovements: ['patch', 'mod'],
    gameData: ['config', 'save', 'cloud', 'path'],
    video: ['res', 'fps', 'hdr', 'ray tracing', 'fov', 'upscaling'],
    input: ['mouse', 'keyboard', 'controller', 'bind', 'touch'],
    audio: ['surround', 'volume', 'voice', 'mute', 'subtitles'],
    network: ['multiplayer', 'server', 'p2p', 'crossplay', 'lan'],
    vr: ['hmd', 'trackir', 'oculus', 'vive', 'steamvr'],
    other: ['api', 'middleware', 'directx', 'vulkan'],
    systemReq: ['requirement', 'ram', 'gpu', 'cpu', 'os'],
    l10n: ['lang', 'dub', 'sub', 'ui'],
    general: ['info']
};

export const panelKeys = Object.keys(searchKeywords);
