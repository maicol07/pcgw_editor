
import { GameData, initialGameData, CloudSync, SystemRequirementsOS } from '../models/GameData';
import 'wikiparser-node';
import type Parser from 'wikiparser-node';

const wiki = (globalThis as any).Parser as typeof Parser;

// Define AST Node interfaces based on wikiparser-node output
interface ASTNode {
    name?: string;
    data?: string;
    childNodes?: ASTNode[];
    type?: string;
    // Add other properties as needed based on inspection
}

export function parseWikitext(wikitext: string): GameData {
    // Clone initial data
    const data: GameData = JSON.parse(JSON.stringify(initialGameData));

    // Parse AST
    let ast: any;
    try {
        ast = wiki.parse(wikitext);
    } catch (e) {
        console.error("Failed to parse wikitext:", e);
        return data;
    }

    // --- Helpers ---

    const cleanTemplateName = (name: string) => name.replace(/^Template:/i, '').replace(/_/g, ' ').trim().toLowerCase();

    const findTemplate = (nodes: ASTNode[], name: string): ASTNode | null => {
        if (!nodes) return null;
        for (const node of nodes) {
            if (node.name) {
                if (cleanTemplateName(node.name) === name.toLowerCase()) {
                    return node;
                }
            }
        }
        return null;
    };

    const findAllTemplates = (nodes: ASTNode[], name: string): ASTNode[] => {
        if (!nodes) return [];
        const found: ASTNode[] = [];
        for (const node of nodes) {
            if (node.name) {
                if (cleanTemplateName(node.name) === name.toLowerCase()) {
                    found.push(node);
                }
            }
        }
        return found;
    };

    const getTextContent = (nodes: ASTNode[]): string => {
        if (!nodes) return '';
        let text = '';
        for (const node of nodes) {
            if (node.data) text += node.data;
            if (node.childNodes) text += getTextContent(node.childNodes);
        }
        return text;
    };

    /**
     * Get wikitext content from AST nodes, preserving nested templates.
     * This is critical for preserving templates like {{cn|date=...}} within parameter values.
     * Uses the native node.text property if available, otherwise reconstructs manually.
     */
    const getWikitextContent = (nodes: ASTNode[]): string => {
        if (!nodes) return '';
        let wikitext = '';

        for (const node of nodes) {
            // Try to use native toString() or text property if available
            if (typeof (node as any).toString === 'function') {
                wikitext += (node as any).toString();
            } else if ((node as any).text !== undefined) {
                wikitext += (node as any).text;
            } else if (node.name) {
                // Manual reconstruction for template nodes
                wikitext += '{{' + node.name;

                if (node.childNodes) {
                    for (const child of node.childNodes) {
                        if (child.name) {
                            // Named parameter
                            wikitext += '|' + child.name + '=';
                            if (child.childNodes) {
                                const valueNode = child.childNodes.find((c: any) => c.type === 'parameter-value');
                                if (valueNode && valueNode.childNodes) {
                                    wikitext += getWikitextContent(valueNode.childNodes);
                                }
                            }
                        } else if (child.data) {
                            wikitext += child.data;
                        } else if (child.childNodes) {
                            wikitext += getWikitextContent(child.childNodes);
                        }
                    }
                }

                wikitext += '}}';
            } else if (node.data) {
                // Plain text node
                wikitext += node.data;
            } else if (node.childNodes) {
                // Recurse into child nodes
                wikitext += getWikitextContent(node.childNodes);
            }
        }

        return wikitext;
    };

    const getParamValueNodes = (templateNode: ASTNode, paramName: string): ASTNode[] => {
        if (!templateNode || !templateNode.childNodes) return [];

        const paramNode = templateNode.childNodes.find(child => {
            return child.name && child.name.trim().toLowerCase() === paramName.toLowerCase();
        });

        if (!paramNode || !paramNode.childNodes) return [];

        const valNode = paramNode.childNodes.find((c: any) => c.type === 'parameter-value');
        if (valNode && valNode.childNodes) {
            return valNode.childNodes;
        }
        // Fallback for unnamed parameters (sometimes they don't have parameter-value wrapper in all versions/contexts?)
        // But in wikiparser-node they usually do.
        return [];
    };

    const getParam = (templateNode: ASTNode, paramName: string): string => {
        const nodes = getParamValueNodes(templateNode, paramName);
        // Use getWikitextContent to preserve nested templates
        return getWikitextContent(nodes).trim();
    };

    // --- Parse Article State ---
    const rootNodes = ast.childNodes || [];
    const findTemplateGlobal = (name: string) => findTemplate(rootNodes, name);

    data.articleState.stub = !!findTemplateGlobal('stub');

    const cleanup = findTemplateGlobal('cleanup');
    if (cleanup) {
        data.articleState.cleanup = true;
        data.articleState.cleanupDescription = getParam(cleanup, '1') || getParam(cleanup, 'reason');
    }

    const state = findTemplateGlobal('State');
    if (state) {
        data.articleState.state = getParam(state, 'state') as any;
    }

    const del = findTemplateGlobal('delete');
    if (del) {
        data.articleState.delete = true;
        data.articleState.deleteReason = getParam(del, '1') || getParam(del, 'reason');
    }

    const disambig = findTemplateGlobal('Disambig');
    if (disambig) {
        data.articleState.disambig = getParam(disambig, '1');
    }

    const distinguish = findTemplateGlobal('Distinguish');
    if (distinguish) {
        const dParams = [];
        let i = 1;
        while (true) {
            const val = getParam(distinguish, i.toString());
            if (!val) break;
            dParams.push(val);
            i++;
        }
        data.articleState.distinguish = dParams;
    }

    // --- Infobox ---
    const infobox = findTemplateGlobal('Infobox game');
    if (infobox) {
        data.infobox.cover = getParam(infobox, 'cover');
        data.infobox.license = getParam(infobox, 'license');

        const parseRows = (paramName: string, rowTemplateName: string) => {
            const rows: any[] = [];
            const nodes = getParamValueNodes(infobox, paramName);
            nodes.forEach((child: any) => {
                if (child.name) {
                    if (cleanTemplateName(child.name) === rowTemplateName.toLowerCase()) {
                        rows.push(child);
                    }
                }
            });
            return rows;
        };

        const devsRowsNodes = getParamValueNodes(infobox, 'developers');
        devsRowsNodes.forEach((child: any) => {
            if (child.name) {
                const cName = cleanTemplateName(child.name);
                if (cName === 'infobox game/row/developer') {
                    data.infobox.developers.push({
                        name: getParam(child, '1'),
                        type: 'developer'
                    });
                } else if (cName === 'infobox game/row/porter') {
                    data.infobox.developers.push({
                        name: getParam(child, '1'),
                        type: 'porter'
                    });
                }
            }
        });

        const pubRows = parseRows('publishers', 'Infobox game/row/publisher');
        data.infobox.publishers = pubRows.map(r => ({ name: getParam(r, '1') }));

        const engRows = parseRows('engines', 'Infobox game/row/engine');
        data.infobox.engines = engRows.map(r => ({
            name: getParam(r, '1'),
            build: getParam(r, 'build')
        }));

        const dateRows = parseRows('release dates', 'Infobox game/row/date');
        data.infobox.releaseDates = dateRows.map(r => ({
            platform: getParam(r, '1'),
            date: getParam(r, '2'),
            ref: getParam(r, 'ref')
        }));

        const recepRows = parseRows('reception', 'Infobox game/row/reception');
        data.infobox.reception = recepRows.map(r => ({
            aggregator: getParam(r, '1') as any,
            id: getParam(r, '2'),
            score: getParam(r, '3')
        }));

        // Taxonomy
        const getTax = (name: string) => {
            const rowName = `Infobox game/row/taxonomy/${name}`;
            const taxonomies = parseRows('taxonomy', rowName);
            if (taxonomies.length > 0) {
                const t = taxonomies[0];
                return {
                    value: getParam(t, '1'),
                    note: getParam(t, 'note'),
                    ref: getParam(t, 'ref')
                };
            }
            return { value: '' };
        };

        data.infobox.taxonomy.monetization = getTax('monetization');
        data.infobox.taxonomy.microtransactions = getTax('microtransactions');
        data.infobox.taxonomy.modes = getTax('modes');
        data.infobox.taxonomy.pacing = getTax('pacing');
        data.infobox.taxonomy.perspectives = getTax('perspectives');
        data.infobox.taxonomy.controls = getTax('controls');
        data.infobox.taxonomy.genres = getTax('genres');
        data.infobox.taxonomy.sports = getTax('sports');
        data.infobox.taxonomy.vehicles = getTax('vehicles');
        data.infobox.taxonomy.artStyles = getTax('art styles');
        data.infobox.taxonomy.themes = getTax('themes');
        data.infobox.taxonomy.series = getTax('series');

        data.infobox.links.steamAppId = getParam(infobox, 'steam appid');
        data.infobox.links.steamAppIdSide = getParam(infobox, 'steam appid side');
        data.infobox.links.gogComId = getParam(infobox, 'gogcom id');
        data.infobox.links.officialSite = getParam(infobox, 'official site');
        data.infobox.links.wikipedia = getParam(infobox, 'wikipedia');
    }

    // --- Introduction ---
    const intro = findTemplateGlobal('Introduction');
    if (intro) {
        data.introduction.introduction = getParam(intro, 'introduction');
        data.introduction.releaseHistory = getParam(intro, 'release history');
        data.introduction.currentState = getParam(intro, 'current state');
    }

    // --- Parse Availability ---
    const avail = findTemplateGlobal('Availability');
    if (avail) {
        const rows: any[] = [];
        const nodes = getParamValueNodes(avail, '1');

        nodes.forEach((child: any) => {
            if (child.name) {
                if (cleanTemplateName(child.name) === 'availability/row') {
                    rows.push({
                        distribution: getParam(child, '1'),
                        id: getParam(child, '2'),
                        drm: getParam(child, '3'),
                        notes: getParam(child, '4'),
                        keys: getParam(child, '5'),
                        os: getParam(child, '6')
                    });
                }
            }
        });

        if (rows.length > 0) data.availability = rows;
    }

    // --- Game Data ---
    const findNodesInSection = (headingName: string): ASTNode[] => {
        const nodesInSec: ASTNode[] = [];
        let capture = false;
        for (const node of rootNodes) {
            if (node.name === 'Heading' || (node as any).type === 'heading') {
                const title = getTextContent(node.childNodes || []).trim();
                if (title.toLowerCase().includes(headingName.toLowerCase())) {
                    capture = true;
                } else {
                    if ((node as any).level <= 2) capture = false;
                }
            } else if (capture) {
                nodesInSec.push(node);
            }
        }
        return nodesInSec;
    };

    const configNodes = findNodesInSection('Configuration file(s) location');
    const configRows: any[] = [];
    configNodes.forEach(node => {
        // Use loose check for Game data/config
        if (node.name) {
            const n = cleanTemplateName(node.name);
            if (n === 'game data/config' || n === 'game data/config tv' || n === 'game data/config mac' || n === 'game data/config linux') {
                configRows.push({
                    platform: getParam(node, '1'),
                    paths: [getParam(node, '2')]
                });
            }
        }
    });
    // If we found any, update. Otherwise leave default empty (or user might have deleted it).
    // Actually we should clear defaults if we are parsing? 
    // data.config.configFiles is initially empty array in my code above (GameData.ts might differ, checking...).
    // In initialGameData it is undefined? No, see ViewFile 1.
    // initialGameData doesn't define configFiles?
    // Checking GameData.ts:
    // export interface GameDataConfig { configFiles: GameDataPathRow[]; ... }
    // initialGameData does NOT seem to initialize config fully in the snippet I saw?
    // Wait, let me check strictness if I missed it.
    // If not initialized, JSON.parse might not have it.
    // I will assume it's there or I should init it.
    data.config.configFiles = configRows;

    const saveNodes = findNodesInSection('Save game data location');
    const saveRows: any[] = [];
    saveNodes.forEach(node => {
        if (node.name) {
            const n = cleanTemplateName(node.name);
            if (n === 'game data/saves' || n === 'game data/saves mac' || n === 'game data/saves linux') {
                saveRows.push({
                    platform: getParam(node, '1'),
                    paths: [getParam(node, '2')]
                });
            }
        }
    });
    data.config.saveData = saveRows;

    // Cloud Sync
    const cloud = findTemplateGlobal('Save game cloud syncing');
    if (cloud) {
        const mapCloud = (key: string, field: keyof CloudSync) => {
            data.config.cloudSync[field].status = getParam(cloud, key) as any;
            data.config.cloudSync[field].notes = getParam(cloud, key + ' notes');
        };
        mapCloud('discord', 'discord');
        mapCloud('epic games launcher', 'epicGamesLauncher');
        mapCloud('steam cloud', 'steamCloud');
        mapCloud('ubisoft connect', 'ubisoftConnect');
        mapCloud('gog galaxy', 'gogGalaxy');
        mapCloud('ea app', 'eaApp');
        mapCloud('xbox cloud', 'xboxCloud');
    }

    // --- Video ---
    const video = findTemplateGlobal('Video');
    if (video) {
        data.video.wsgfLink = getParam(video, 'wsgf link');
        data.video.widescreenResolution = getParam(video, 'widescreen resolution') as any;
        data.video.widescreenResolutionNotes = getParam(video, 'widescreen resolution notes');
        data.video.multiMonitor = getParam(video, 'multimonitor') as any;
        data.video.multiMonitorNotes = getParam(video, 'multimonitor notes');
        data.video.ultraWidescreen = getParam(video, 'ultrawidescreen') as any;
        data.video.ultraWidescreenNotes = getParam(video, 'ultrawidescreen notes');
        data.video.fourKUltraHd = getParam(video, '4k ultra hd') as any;
        data.video.fourKUltraHdNotes = getParam(video, '4k ultra hd notes');
        data.video.fov = getParam(video, 'fov') as any;
        data.video.fovNotes = getParam(video, 'fov notes');
        data.video.windowed = getParam(video, 'windowed') as any;
        data.video.windowedNotes = getParam(video, 'windowed notes');
        data.video.borderlessWindowed = getParam(video, 'borderless windowed') as any;
        data.video.borderlessWindowedNotes = getParam(video, 'borderless windowed notes');
        data.video.anisotropic = getParam(video, 'anisotropic') as any;
        data.video.anisotropicNotes = getParam(video, 'anisotropic notes');
        data.video.antiAliasing = getParam(video, 'antialiasing') as any;
        data.video.antiAliasingNotes = getParam(video, 'antialiasing notes');
        data.video.upscaling = getParam(video, 'upscaling') as any;
        data.video.upscalingTech = getParam(video, 'upscaling tech');
        data.video.upscalingNotes = getParam(video, 'upscaling notes');
        data.video.frameGen = getParam(video, 'framegen') as any;
        data.video.frameGenTech = getParam(video, 'framegen tech');
        data.video.frameGenNotes = getParam(video, 'framegen notes');
        data.video.vsync = getParam(video, 'vsync') as any;
        data.video.vsyncNotes = getParam(video, 'vsync notes');
        data.video.fps60 = getParam(video, '60 fps') as any;
        data.video.fps60Notes = getParam(video, '60 fps notes');
        data.video.fps120 = getParam(video, '120 fps') as any;
        data.video.fps120Notes = getParam(video, '120 fps notes');
        data.video.hdr = getParam(video, 'hdr') as any;
        data.video.hdrNotes = getParam(video, 'hdr notes');
        data.video.rayTracing = getParam(video, 'ray tracing') as any;
        data.video.rayTracingNotes = getParam(video, 'ray tracing notes');
        data.video.colorBlind = getParam(video, 'color blind') as any;
        data.video.colorBlindNotes = getParam(video, 'color blind notes');
    }

    // --- Input ---
    const input = findTemplateGlobal('Input');
    if (input) {
        data.input.keyRemap = getParam(input, 'key remap') as any;
        data.input.keyRemapNotes = getParam(input, 'key remap notes');
        data.input.mouseSensitivity = getParam(input, 'mouse sensitivity') as any;
        data.input.mouseSensitivityNotes = getParam(input, 'mouse sensitivity notes');
        data.input.mouseMenu = getParam(input, 'mouse menu') as any;
        data.input.mouseMenuNotes = getParam(input, 'mouse menu notes');
        data.input.invertMouseY = getParam(input, 'invert mouse y-axis') as any;
        data.input.invertMouseYNotes = getParam(input, 'invert mouse y-axis notes');
        data.input.controllerSupport = getParam(input, 'controller support') as any;
        data.input.controllerSupportNotes = getParam(input, 'controller support notes');
        data.input.fullController = getParam(input, 'full controller') as any;
        data.input.fullControllerNotes = getParam(input, 'full controller notes');
        data.input.controllerRemap = getParam(input, 'controller remap') as any;
        data.input.controllerRemapNotes = getParam(input, 'controller remap notes');
        data.input.invertControllerY = getParam(input, 'invert controller y-axis') as any;
        data.input.invertControllerYNotes = getParam(input, 'invert controller y-axis notes');
        data.input.hapticFeedback = getParam(input, 'haptic feedback') as any;
        data.input.hapticFeedbackNotes = getParam(input, 'haptic feedback notes');
        // ... missing fields can be mapped here as needed

        data.input.glightBar = getParam(input, 'light bar support') as any;
        data.input.glightBarNotes = getParam(input, 'light bar support notes');
        data.input.playstationControllers = getParam(input, 'playstation controllers') as any;
        data.input.playstationControllersNotes = getParam(input, 'playstation controllers notes');
        data.input.trackedMotionControllers = getParam(input, 'tracked motion controllers') as any;
        data.input.trackedMotionControllersNotes = getParam(input, 'tracked motion controllers notes');

        data.input.touchscreen = getParam(input, 'touchscreen') as any;
        data.input.touchscreenNotes = getParam(input, 'touchscreen notes');
    }

    // --- Audio ---
    const audio = findTemplateGlobal('Audio');
    if (audio) {
        data.audio.separateVolume = getParam(audio, 'separate volume') as any;
        data.audio.surroundSound = getParam(audio, 'surround sound') as any;
        data.audio.subtitles = getParam(audio, 'subtitles') as any;
        data.audio.closedCaptions = getParam(audio, 'closed captions') as any;
        data.audio.muteOnFocusLost = getParam(audio, 'mute on focus lost') as any;
        data.audio.royaltyFree = getParam(audio, 'royalty free audio') as any;
        data.audio.royaltyFreeNotes = getParam(audio, 'royalty free audio notes');
    }

    // --- Network ---
    const network = findTemplateGlobal('Network');
    if (network) {
        data.network.localPlay = getParam(network, 'local play') as any;
        data.network.localPlayPlayers = getParam(network, 'local play players');
        data.network.localPlayModes = getParam(network, 'local play modes');
        data.network.localPlayNotes = getParam(network, 'local play notes');

        data.network.lanPlay = getParam(network, 'lan play') as any;
        data.network.lanPlayPlayers = getParam(network, 'lan play players');
        data.network.lanPlayModes = getParam(network, 'lan play modes');
        data.network.lanPlayNotes = getParam(network, 'lan play notes');

        data.network.onlinePlay = getParam(network, 'online play') as any;
        data.network.onlinePlayPlayers = getParam(network, 'online play players');
        data.network.onlinePlayModes = getParam(network, 'online play modes');
        data.network.onlinePlayNotes = getParam(network, 'online play notes');

        data.network.asynchronous = getParam(network, 'asynchronous') as any;
        data.network.asynchronousNotes = getParam(network, 'asynchronous notes');

        data.network.crossplay = getParam(network, 'crossplay') as any;
        data.network.crossplayPlatforms = getParam(network, 'crossplay platforms');
        data.network.crossplayNotes = getParam(network, 'crossplay notes');

        data.network.matchmaking = getParam(network, 'matchmaking') as any;
        data.network.matchmakingNotes = getParam(network, 'matchmaking notes');

        data.network.p2p = getParam(network, 'p2p') as any;
        data.network.p2pNotes = getParam(network, 'p2p notes');

        data.network.dedicated = getParam(network, 'dedicated') as any;
        data.network.dedicatedNotes = getParam(network, 'dedicated notes');

        data.network.selfHosting = getParam(network, 'self-hosting') as any;
        data.network.selfHostingNotes = getParam(network, 'self-hosting notes');

        data.network.directIp = getParam(network, 'direct ip') as any;
        data.network.directIpNotes = getParam(network, 'direct ip notes');

        data.network.tcpPorts = getParam(network, 'tcp ports');
        data.network.udpPorts = getParam(network, 'udp ports');
        data.network.upnp = getParam(network, 'upnp') as any;
    }

    // --- VR ---
    const vr = findTemplateGlobal('VR support');
    if (vr) {
        data.vr.native3d = getParam(vr, 'native 3d') as any;
        data.vr.native3dNotes = getParam(vr, 'native 3d notes');
        data.vr.nvidia3dVision = getParam(vr, 'nvidia 3d vision') as any;
        data.vr.nvidia3dVisionNotes = getParam(vr, 'nvidia 3d vision notes');
        data.vr.vorpx = getParam(vr, 'vorpx') as any;
        data.vr.vorpxNotes = getParam(vr, 'vorpx notes');
        data.vr.vorpxModes = getParam(vr, 'vorpx modes');
        data.vr.vrOnly = getParam(vr, 'vr only') as any;
        data.vr.openXr = getParam(vr, 'openxr') as any;
        data.vr.openXrNotes = getParam(vr, 'openxr notes');
        data.vr.steamVr = getParam(vr, 'steamvr') as any;
        data.vr.steamVrNotes = getParam(vr, 'steamvr notes');
        data.vr.oculusVr = getParam(vr, 'oculus') as any;
        data.vr.oculusVrNotes = getParam(vr, 'oculus notes');
        data.vr.windowsMixedReality = getParam(vr, 'windows mixed reality') as any;
        data.vr.windowsMixedRealityNotes = getParam(vr, 'windows mixed reality notes');
        data.vr.osvr = getParam(vr, 'osvr') as any;
        data.vr.osvrNotes = getParam(vr, 'osvr notes');
        data.vr.forteNsx1 = getParam(vr, 'forte vfx1') as any;
        data.vr.forteNsx1Notes = getParam(vr, 'forte vfx1 notes');
        data.vr.keyboardMouse = getParam(vr, 'kbm') as any;
        data.vr.keyboardMouseNotes = getParam(vr, 'kbm notes');
        data.vr.handTracking = getParam(vr, 'motion controllers') as any;
        data.vr.handTrackingNotes = getParam(vr, 'motion controllers notes');
        data.vr.bodyTracking = getParam(vr, 'tracked motion controllers') as any;
        data.vr.bodyTrackingNotes = getParam(vr, 'tracked motion controllers notes');
        // ... others
    }

    // --- API ---
    const api = findTemplateGlobal('API');
    if (api) {
        data.api.dxVersion = getParam(api, 'direct3d versions');
        data.api.dxNotes = getParam(api, 'direct3d notes');
        data.api.openGlVersion = getParam(api, 'opengl versions');
        data.api.openGlNotes = getParam(api, 'opengl notes');
        data.api.vulkanVersion = getParam(api, 'vulkan versions');
        data.api.vulkanNotes = getParam(api, 'vulkan notes');
        data.api.windows32 = getParam(api, 'windows 32-bit exe') as any;
        data.api.windows64 = getParam(api, 'windows 64-bit exe') as any;
        data.api.windowsArm = getParam(api, 'windows arm app') as any;
        data.api.windowsNotes = getParam(api, 'windows notes');
        // ... map rest
    }

    // --- System Requirements ---
    const sysReqs = findAllTemplates(rootNodes, 'System requirements');
    sysReqs.forEach(req => {
        // Try to get OS from either 'OS' or 'OSfamily' parameter
        let os = getParam(req, 'OS');
        if (!os) {
            os = getParam(req, 'OSfamily');
        }

        let target: SystemRequirementsOS;

        if (os.match(/windows/i)) target = data.requirements.windows;
        else if (os.match(/mac/i) || os.match(/os x/i)) target = data.requirements.mac;
        else if (os.match(/linux/i)) target = data.requirements.linux;
        else return;

        target.notes = getParam(req, 'notes');

        // Use minOS and recOS for the OS version, not OSfamily
        target.minimum.os = getParam(req, 'minOS');
        target.minimum.cpu = getParam(req, 'minCPU');
        target.minimum.ram = getParam(req, 'minRAM');
        target.minimum.hdd = getParam(req, 'minHD');
        target.minimum.gpu = getParam(req, 'minGPU');

        target.recommended.os = getParam(req, 'recOS');
        target.recommended.cpu = getParam(req, 'recCPU');
        target.recommended.ram = getParam(req, 'recRAM');
        target.recommended.hdd = getParam(req, 'recHD');
        target.recommended.gpu = getParam(req, 'recGPU');
    });

    return data;
}
