import { GameData, initialGameData, CloudSync, SystemRequirementsOS, RatingValue, GalleryImage, Issue } from '../models/GameData';
import 'wikiparser-node/bundle/bundle-lsp.min.js';
import type Parser from 'wikiparser-node';
import type { AstNodes as ASTNode } from 'wikiparser-node';

let wiki = (globalThis as any).Parser as Parser;

export function parseRaw(text: string) {
    return wiki.parse(text);
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

    const findAllTemplates = (nodes: readonly ASTNode[], name: string): readonly ASTNode[] => {
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

    const getTextContent = (nodes: readonly ASTNode[]): string => {
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
    const getWikitextContent = (nodes: readonly ASTNode[]): string => {
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

    const getParamValueNodes = (templateNode: ASTNode, paramName: string): readonly ASTNode[] => {
        if (!templateNode || !templateNode.childNodes) return [];

        const paramNode = templateNode.childNodes.find(child => {
            // debug
            // if (paramName === '7') console.log('Checking child', child.name, 'against', paramName);
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
        const valNodes = getParamValueNodes(templateNode, paramName);
        return getWikitextContent(valNodes).trim();
    };

    // --- Parse Article State ---
    const rootNodes = ast.childNodes || [];
    const findTemplateGlobal = (name: string) => findTemplate(rootNodes, name);

    data.articleState.stub = !!findTemplateGlobal('stub');

    const cleanup = findTemplateGlobal('cleanup');
    if (cleanup) {
        data.articleState.cleanup = true;
        const p1 = getParam(cleanup, '1');
        const p2 = getParam(cleanup, '2');
        const reason = getParam(cleanup, 'reason');

        if (p2) {
            // If param 2 exists, param 1 is the section
            data.articleState.cleanupDescription = `${p1}|${p2}`;
        } else {
            // Otherwise param 1 checks for reason or uses named reason
            data.articleState.cleanupDescription = p1 || reason;
        }
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
        const dParams: string[] = [];
        let i = 1;
        while (true) {
            const val = getParam(disambig, i.toString());
            if (!val) break;
            dParams.push(val);
            i++;
        }
        data.articleState.disambig = dParams;
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
        data.infobox.engines = engRows.map(r => {
            const rawName = getParam(r, '1');
            let name = rawName;
            let displayName = '';

            // Handle piped links: [[Engine|Engine 2]]
            if (rawName.startsWith('[[') && rawName.endsWith(']]')) {
                const inner = rawName.substring(2, rawName.length - 2);
                if (inner.includes('|')) {
                    const parts = inner.split('|');
                    name = parts[0];
                    displayName = parts[1];
                    name = inner;
                }
            }

            // Allow name param to override or set displayName
            const nameParam = getParam(r, 'name');
            if (nameParam) displayName = nameParam;

            return {
                name,
                displayName: displayName || undefined,
                build: getParam(r, 'build'),
                note: getParam(r, 'note'),
                ref: getParam(r, 'ref'),
                extra: getParam(r, '2') // Used For
            };
        });

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
        data.infobox.links.gogComIdSide = getParam(infobox, 'gogcom id side');
        data.infobox.links.officialSite = getParam(infobox, 'official site');
        data.infobox.links.hltb = getParam(infobox, 'hltb');
        data.infobox.links.igdb = getParam(infobox, 'igdb');
        data.infobox.links.lutris = getParam(infobox, 'lutris');
        data.infobox.links.mobygames = getParam(infobox, 'mobygames');
        data.infobox.links.vndb = getParam(infobox, 'vndb');
        data.infobox.links.strategyWiki = getParam(infobox, 'strategywiki');
        data.infobox.links.wikipedia = getParam(infobox, 'wikipedia');
        data.infobox.links.wineHq = getParam(infobox, 'winehq');

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
                    // Just try to get params 1 through 7 directly.
                    // getParam handles unnamed params by index if they are standard.
                    // If wikiparser-node parses them as unnamed, getParam(node, '1') should work.

                    let state = getParam(child, '7');

                    if (!state) {
                        // Fallback: Parsing the full wikitext of the row to find the state at the end
                        // This avoids issues with AST node structure for mixed/unnamed params
                        const fullText = getWikitextContent([child]);

                        const lower = fullText.toLowerCase();
                        // Simple includes check as a robust fallback
                        // We expect unavailable or upcoming to be present if they are meaningful states here
                        if (lower.includes('unavailable')) {
                            state = 'unavailable';
                        } else if (lower.includes('upcoming')) {
                            state = 'upcoming';
                        }
                    }

                    rows.push({
                        distribution: getParam(child, '1'),
                        id: getParam(child, '2'),
                        drm: getParam(child, '3'),
                        notes: getParam(child, '4'),
                        keys: getParam(child, '5'),
                        os: getParam(child, '6'),
                        state: state
                    });
                }
            }
        });

        if (rows.length > 0) data.availability = rows;
    }

    // --- Parse DLC ---
    const dlc = findTemplateGlobal('DLC');
    if (dlc) {
        const rows: any[] = [];
        const nodes = getParamValueNodes(dlc, '1');

        nodes.forEach((child: any) => {
            if (child.name) {
                if (cleanTemplateName(child.name) === 'dlc/row') {
                    rows.push({
                        name: getParam(child, '1'),
                        notes: getParam(child, '2'),
                        os: getParam(child, '3')
                    });
                }
            }
        });

        if (rows.length > 0) data.dlc = rows;
    }

    // --- Game Data ---
    const getNodesInSection = (headingPattern: string | RegExp): ASTNode[] => {
        const nodesInSec: ASTNode[] = [];
        let capture = false;

        for (let i = 0; i < rootNodes.length; i++) {
            const node = rootNodes[i];
            let isHeading = false;
            let title = '';

            // Check standard headings
            if (node.name === 'Heading' || (node as any).type === 'heading') {
                title = getTextContent(node.childNodes || []).trim();
                isHeading = true;
            } else {
                // Check for custom headers.
                const raw = getWikitextContent([node]).trim();

                // Case 1: Single node containing ''' Header '''
                if (/^'''\s*.*\s*'''$/.test(raw)) {
                    title = raw.replace(/^'''\s*|\s*'''$/g, '');
                    isHeading = true;
                }
                // Case 2: Fragmented nodes: ''' + Text + '''
                else if (raw === "'''") {
                    const nextNode = i + 1 < rootNodes.length ? rootNodes[i + 1] : null;
                    const nextNextNode = i + 2 < rootNodes.length ? rootNodes[i + 2] : null;

                    if (nextNode && nextNextNode) {
                        const nextRaw = getWikitextContent([nextNode]).trim();
                        const nextNextRaw = getWikitextContent([nextNextNode]).trim();

                        if (nextNextRaw === "'''") {
                            title = nextRaw.trim();
                            isHeading = true;
                        }
                    }
                }
            }

            if (isHeading) {
                let isMatch = false;
                if (typeof headingPattern === 'string') {
                    isMatch = title.toLowerCase().includes(headingPattern.toLowerCase());
                } else {
                    isMatch = headingPattern.test(title);
                }

                if (isMatch) {
                    capture = true;
                    // If fragmented and matched, skip the other parts of the header
                    if (getWikitextContent([node]).trim() === "'''") {
                        i += 2;
                    }
                } else {
                    // Stop capturing if we hit a NEW heading
                    if (capture) {
                        if (node.name === 'Heading' || (node as any).type === 'heading') {
                            if ((node as any).level <= 2) capture = false;
                        } else {
                            capture = false;
                            // Also skip fragmented parts of non-matching header
                            if (getWikitextContent([node]).trim() === "'''") {
                                i += 2;
                            }
                        }
                    }
                }
            } else if (capture) {
                nodesInSec.push(node);
            }
        }
        return nodesInSec;
    };

    // --- General Information ---
    const genInfoNodes = getNodesInSection('General information');
    if (genInfoNodes.length > 0) {
        data.introduction.generalInfo = getWikitextContent(genInfoNodes).trim();
    }

    // Helper to extract rows from either a direct list of nodes OR a nested {{Game data|...}} template
    const extractGameDataRows = (sectionNodes: readonly ASTNode[], rowTemplateNames: string[]): any[] => {
        let candidateNodes: readonly ASTNode[] = sectionNodes;

        // Note: We deliberately do NOT look for a wrapper first, because {{Game data|config|...}}
        // can appear as a single template in the section, and we want to iterate IT, not its content (which is just 'config').
        // If it's a wrapper {{Game data | {{Game data/config}} }}, the recursion logic inside the loop handles it.

        // 2. Iterate candidates to find rows
        const foundRows: any[] = [];

        candidateNodes.forEach(node => {
            if (node.name) {
                const n = cleanTemplateName(node.name).toLowerCase();
                // console.log('Checking node:', n);
                let isMatch = false;
                let platform = '';
                let pathStartIdx = 2;

                // Check for {{Game data|...}} wrapper
                if (n === 'game data') {
                    // Case A: Wrapper mode {{Game data| {{Game data/config...}} }}
                    // OR named: {{Game data| config = {{Game data/config...}} }}

                    const targetType = rowTemplateNames[0].split('/')[1]; // config or saves

                    // Try unnamed param '1' OR named param 'config' / 'saves'
                    let contentValues = getParamValueNodes(node, '1');
                    if (!contentValues || contentValues.length === 0) {
                        contentValues = getParamValueNodes(node, targetType);
                    }

                    if (contentValues && contentValues.length > 0) {
                        // Recursively extract from these nodes
                        const childRows = extractGameDataRows(contentValues, rowTemplateNames);
                        foundRows.push(...childRows);
                    }

                    // Case B: Inline mode {{Game data|config|Platform|Path}}
                    const typeParam = getParam(node, '1');
                    if (typeParam) {
                        const typeParamLower = typeParam.toLowerCase();
                        // Map 'config' -> matches 'game data/config'
                        // We check if any of rowTemplateNames ends with /typeParam
                        if (rowTemplateNames.some(rt => rt.endsWith('/' + typeParamLower))) {
                            isMatch = true;
                            // Check if '2' is platform (Case B)
                            // But if we are in Case A (wrapper), param '1' matched 'config', so it IS inline?
                            // Wait, if it has content nodes (Case A), we recurse.
                            // If it has NO content nodes but has param '1' as 'config' (Case B), we treat as inline.
                            // But {{Game data | ... }} where '...' starts with {{Game data/config...}}
                            // Param '1' is the *entire* inner content.
                            // getParam(node, '1') would be "{{Game data/config...}}".
                            // It won't match "config".
                            // So Case B only triggers if param '1' is literally "config" or similar.

                            // Debug logging
                            // console.log(`Checking Game data inline: typeParam='${typeParam}'`);

                            isMatch = true;
                            platform = getParam(node, '2');
                            pathStartIdx = 3;
                        }
                    }
                }
                // Check for direct {{Game data/config}} etc.
                else if (rowTemplateNames.includes(n)) {
                    isMatch = true;
                    platform = getParam(node, '1');
                    pathStartIdx = 2;
                }

                if (isMatch) {
                    const paths: string[] = [];
                    // Support multi-arg paths
                    let i = pathStartIdx;
                    while (true) {
                        const p = getParam(node, i.toString());
                        if (!p) break;
                        paths.push(p);
                        i++;
                    }
                    // console.log(`Found row: platform='${platform}', paths=${JSON.stringify(paths)}`);
                    foundRows.push({
                        platform: platform,
                        paths: paths
                    });
                }
            }
        });

        return foundRows;
    };

    // Config
    let configSectionNodes = getNodesInSection(/Configuration file(s|\(s\))? location|Game data/i);

    // Fallback: If no section found, look for {{Game data}} in root nodes
    if (configSectionNodes.length === 0) {
        const globalGameData = findTemplateGlobal('Game data');
        if (globalGameData) {
            configSectionNodes = [globalGameData];
        }
    }

    const configRows = extractGameDataRows(configSectionNodes.length > 0 ? configSectionNodes : rootNodes, ['game data/config', 'game data/config tv', 'game data/config mac', 'game data/config linux']);
    data.config.configFiles = configRows;

    // Save Data
    let saveSectionNodes = getNodesInSection(/Save game data location|Game data/i);

    // Fallback: If no section found, look for {{Game data}} in root nodes
    if (saveSectionNodes.length === 0) {
        const globalGameData = findTemplateGlobal('Game data');
        if (globalGameData) {
            saveSectionNodes = [globalGameData];
        }
    }

    const saveRows = extractGameDataRows(saveSectionNodes.length > 0 ? saveSectionNodes : rootNodes, ['game data/saves', 'game data/saves mac', 'game data/saves linux']);
    data.config.saveData = saveRows;

    // Cloud Sync
    const cloud = findTemplateGlobal('Save game cloud syncing');
    if (cloud) {
        const mapCloud = (key: string, field: keyof CloudSync) => {
            // @ts-ignore
            data.config.cloudSync[field] = getParam(cloud, key) as any;
            // @ts-ignore
            data.config.cloudSync[field + 'Notes'] = getParam(cloud, key + ' notes');
        };
        mapCloud('discord', 'discord');
        mapCloud('epic games launcher', 'epicGamesLauncher');
        mapCloud('steam cloud', 'steamCloud');
        mapCloud('ubisoft connect', 'ubisoftConnect');
        mapCloud('gog galaxy', 'gogGalaxy');
        mapCloud('ea app', 'eaApp');
        mapCloud('xbox cloud', 'xboxCloud');
        mapCloud('status', 'status');
        data.config.cloudSync.notes = getParam(cloud, 'notes') || '';
    }

    // Essential Improvements
    const essentialNodes = getNodesInSection('Essential improvements');
    if (essentialNodes.length > 0) {
        data.essentialImprovements = getWikitextContent(essentialNodes).trim();
    }

    // --- Video ---
    const video = findTemplateGlobal('Video');
    if (video) {
        data.video.wsgfLink = getParam(video, 'wsgf link');
        data.video.widescreenWsgfAward = getParam(video, 'widescreen wsgf award');
        data.video.multiMonitorWsgfAward = getParam(video, 'multimonitor wsgf award');
        data.video.ultraWidescreenWsgfAward = getParam(video, 'ultrawidescreen wsgf award');
        data.video.fourKUltraHdWsgfAward = getParam(video, '4k ultra hd wsgf award');
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
        data.input.controllerSensitivity = getParam(input, 'controller sensitivity') as any;
        data.input.controllerSensitivityNotes = getParam(input, 'controller sensitivity notes');
        data.input.invertControllerY = getParam(input, 'invert controller y-axis') as any;
        data.input.invertControllerYNotes = getParam(input, 'invert controller y-axis notes');
        data.input.controllerHotplug = getParam(input, 'controller hotplug') as any;
        data.input.controllerHotplugNotes = getParam(input, 'controller hotplug notes');
        data.input.hapticFeedback = getParam(input, 'haptic feedback') as any;
        data.input.hapticFeedbackNotes = getParam(input, 'haptic feedback notes');
        // ... missing fields can be mapped here as needed

        data.input.glightBar = getParam(input, 'light bar support') as any;
        data.input.glightBarNotes = getParam(input, 'light bar support notes');
        data.input.playstationControllers = getParam(input, 'playstation controllers') as any;
        data.input.playstationControllersNotes = getParam(input, 'playstation controllers notes');
        data.input.trackedMotionControllers = getParam(input, 'tracked motion controllers') as any;
        data.input.trackedMotionControllersNotes = getParam(input, 'tracked motion controllers notes');

        data.input.keyboardMousePrompts = getParam(input, 'keyboard and mouse prompts') as any;
        data.input.keyboardMousePromptsNotes = getParam(input, 'keyboard and mouse prompts notes');
        data.input.touchscreen = getParam(input, 'touchscreen') as any;
        data.input.touchscreenNotes = getParam(input, 'touchscreen notes');

        // New Input Mappings
        data.input.accelerationOption = getParam(input, 'acceleration option') as any;
        data.input.accelerationOptionNotes = getParam(input, 'acceleration option notes');
        data.input.xinputControllers = getParam(input, 'xinput controllers') as any;
        data.input.xinputControllersNotes = getParam(input, 'xinput controllers notes');
        data.input.xboxPrompts = getParam(input, 'xbox prompts') as any;
        data.input.xboxPromptsNotes = getParam(input, 'xbox prompts notes');
        data.input.impulseTriggers = getParam(input, 'impulse triggers') as any;
        data.input.impulseTriggersNotes = getParam(input, 'impulse triggers notes');

        data.input.playstationPrompts = getParam(input, 'playstation prompts') as any;
        data.input.playstationPromptsNotes = getParam(input, 'playstation prompts notes');
        data.input.playstationControllerModels = getParam(input, 'playstation controller models');
        data.input.playstationConnectionModes = getParam(input, 'playstation connection modes');
        data.input.playstationConnectionModesNotes = getParam(input, 'playstation connection modes notes');
        data.input.playstationMotionSensors = getParam(input, 'playstation motion sensors') as any;
        data.input.playstationMotionSensorsNotes = getParam(input, 'playstation motion sensors notes');
        data.input.playstationMotionSensorsModes = getParam(input, 'playstation motion sensors modes');

        data.input.dualSenseAdaptiveTrigger = getParam(input, 'dualsense adaptive trigger support') as any;
        data.input.dualSenseAdaptiveTriggerNotes = getParam(input, 'dualsense adaptive trigger support notes');
        data.input.dualSenseHaptics = getParam(input, 'dualsense haptics support') as any;
        data.input.dualSenseHapticsNotes = getParam(input, 'dualsense haptics support notes');

        data.input.nintendoControllers = getParam(input, 'nintendo controllers') as any;
        data.input.nintendoControllersNotes = getParam(input, 'nintendo controllers notes');
        data.input.nintendoControllerModels = getParam(input, 'nintendo controller models');
        data.input.nintendoPrompts = getParam(input, 'nintendo prompts') as any;
        data.input.nintendoPromptsNotes = getParam(input, 'nintendo prompts notes');
        data.input.nintendoButtonLayout = getParam(input, 'nintendo button layout') as any;
        data.input.nintendoButtonLayoutNotes = getParam(input, 'nintendo button layout notes');
        data.input.nintendoMotionSensors = getParam(input, 'nintendo motion sensors') as any;
        data.input.nintendoMotionSensorsNotes = getParam(input, 'nintendo motion sensors notes');
        data.input.nintendoMotionSensorsModes = getParam(input, 'nintendo motion sensors modes');
        data.input.nintendoConnectionModes = getParam(input, 'nintendo connection modes');
        data.input.nintendoConnectionModesNotes = getParam(input, 'nintendo connection modes notes');

        data.input.steamInputApi = getParam(input, 'steam input api') as any;
        data.input.steamInputApiNotes = getParam(input, 'steam input api notes');
        data.input.steamHookInput = getParam(input, 'steam hook input') as any;
        data.input.steamHookInputNotes = getParam(input, 'steam hook input notes');
        data.input.steamInputPrompts = getParam(input, 'steam input prompts') as any;
        data.input.steamInputPromptsNotes = getParam(input, 'steam input prompts notes');
        data.input.steamInputPromptsIcons = getParam(input, 'steam input prompts icons');
        data.input.steamInputPromptsStyles = getParam(input, 'steam input prompts styles');
        data.input.steamInputPresets = getParam(input, 'steam input presets') as any;
        data.input.steamInputPresetsNotes = getParam(input, 'steam input presets notes');
        data.input.steamDeckPrompts = getParam(input, 'steam deck prompts') as any;
        data.input.steamDeckPromptsNotes = getParam(input, 'steam deck prompts notes');
        data.input.steamControllerPrompts = getParam(input, 'steam controller prompts') as any;
        data.input.steamControllerPromptsNotes = getParam(input, 'steam controller prompts notes');
        data.input.steamInputMotionSensors = getParam(input, 'steam input motion sensors') as any;
        data.input.steamInputMotionSensorsNotes = getParam(input, 'steam input motion sensors notes');
        data.input.steamInputMotionSensorsModes = getParam(input, 'steam input motion sensors modes');
        data.input.steamCursorDetection = getParam(input, 'steam cursor detection') as any;
        data.input.steamCursorDetectionNotes = getParam(input, 'steam cursor detection notes');

        data.input.directInputControllers = getParam(input, 'directinput controllers') as any;
        data.input.directInputControllersNotes = getParam(input, 'directinput controllers notes');
        data.input.directInputPrompts = getParam(input, 'directinput prompts') as any;
        data.input.directInputPromptsNotes = getParam(input, 'directinput prompts notes');

        data.input.trackedMotionPrompts = getParam(input, 'tracked motion prompts') as any;
        data.input.trackedMotionPromptsNotes = getParam(input, 'tracked motion prompts notes');
        data.input.peripheralDevices = getParam(input, 'peripheral devices') as any;
        data.input.peripheralDevicesNotes = getParam(input, 'peripheral devices notes');
        data.input.peripheralDeviceTypes = getParam(input, 'peripheral device types');
        data.input.inputPromptOverride = getParam(input, 'input prompt override') as any;
        data.input.inputPromptOverrideNotes = getParam(input, 'input prompt override notes');
        data.input.hapticFeedbackHd = getParam(input, 'haptic feedback hd') as any;
        data.input.hapticFeedbackHdNotes = getParam(input, 'haptic feedback hd notes');
        data.input.hapticFeedbackHdControllerModels = getParam(input, 'haptic feedback hd controller models');
        data.input.digitalMovementSupported = getParam(input, 'digital movement supported') as any;
        data.input.digitalMovementSupportedNotes = getParam(input, 'digital movement supported notes');

        data.input.otherControllers = getParam(input, 'other controllers') as any;
        data.input.otherControllersNotes = getParam(input, 'other controllers notes');
        data.input.otherButtonPrompts = getParam(input, 'other button prompts');
        data.input.otherButtonPromptsNotes = getParam(input, 'other button prompts notes');

        data.input.simultaneousInput = getParam(input, 'simultaneous input') as any;
        data.input.simultaneousInputNotes = getParam(input, 'simultaneous input notes');

    }

    // --- Audio ---
    const audio = findTemplateGlobal('Audio');
    if (audio) {
        data.audio.separateVolume = getParam(audio, 'separate volume') as any;
        data.audio.separateVolumeNotes = getParam(audio, 'separate volume notes');
        data.audio.surroundSound = getParam(audio, 'surround sound') as any;
        data.audio.surroundSoundNotes = getParam(audio, 'surround sound notes');
        data.audio.subtitles = getParam(audio, 'subtitles') as any;
        data.audio.subtitlesNotes = getParam(audio, 'subtitles notes');
        data.audio.closedCaptions = getParam(audio, 'closed captions') as any;
        data.audio.closedCaptionsNotes = getParam(audio, 'closed captions notes');
        data.audio.muteOnFocusLost = getParam(audio, 'mute on focus lost') as any;
        data.audio.muteOnFocusLostNotes = getParam(audio, 'mute on focus lost notes');
        data.audio.royaltyFree = getParam(audio, 'royalty free audio') as any;
        data.audio.royaltyFreeNotes = getParam(audio, 'royalty free audio notes');

        data.audio.eaxSupport = getParam(audio, 'eax support') as any;
        data.audio.eaxSupportNotes = getParam(audio, 'eax support notes');

        data.audio.redBookCdAudio = getParam(audio, 'red book cd audio') as any;
        data.audio.redBookCdAudioNotes = getParam(audio, 'red book cd audio notes');

        data.audio.generalMidiAudio = getParam(audio, 'general midi audio') as any;
        data.audio.generalMidiAudioNotes = getParam(audio, 'general midi audio notes');
    }

    // --- Network ---
    const netMulti = findTemplateGlobal('Network/Multiplayer');
    if (netMulti) {
        data.network.localPlay = getParam(netMulti, 'local play') as any;
        data.network.localPlayPlayers = getParam(netMulti, 'local play players');
        data.network.localPlayModes = getParam(netMulti, 'local play modes');
        data.network.localPlayNotes = getParam(netMulti, 'local play notes');

        data.network.lanPlay = getParam(netMulti, 'lan play') as any;
        data.network.lanPlayPlayers = getParam(netMulti, 'lan play players');
        data.network.lanPlayModes = getParam(netMulti, 'lan play modes');
        data.network.lanPlayNotes = getParam(netMulti, 'lan play notes');

        data.network.onlinePlay = getParam(netMulti, 'online play') as any;
        data.network.onlinePlayPlayers = getParam(netMulti, 'online play players');
        data.network.onlinePlayModes = getParam(netMulti, 'online play modes');
        data.network.onlinePlayNotes = getParam(netMulti, 'online play notes');

        data.network.asynchronous = getParam(netMulti, 'asynchronous') as any;
        data.network.asynchronousNotes = getParam(netMulti, 'asynchronous notes');

        data.network.crossplay = getParam(netMulti, 'crossplay') as any;
        data.network.crossplayPlatforms = getParam(netMulti, 'crossplay platforms');
        data.network.crossplayNotes = getParam(netMulti, 'crossplay notes');
    }

    const netConn = findTemplateGlobal('Network/Connections');
    if (netConn) {
        data.network.matchmaking = getParam(netConn, 'matchmaking') as any;
        data.network.matchmakingNotes = getParam(netConn, 'matchmaking notes');

        data.network.p2p = getParam(netConn, 'p2p') as any;
        data.network.p2pNotes = getParam(netConn, 'p2p notes');

        data.network.dedicated = getParam(netConn, 'dedicated') as any;
        data.network.dedicatedNotes = getParam(netConn, 'dedicated notes');

        data.network.selfHosting = getParam(netConn, 'self-hosting') as any;
        data.network.selfHostingNotes = getParam(netConn, 'self-hosting notes');

        data.network.directIp = getParam(netConn, 'direct ip') as any;
        data.network.directIpNotes = getParam(netConn, 'direct ip notes');
    }

    const netPorts = findTemplateGlobal('Network/Ports');
    if (netPorts) {
        data.network.tcpPorts = getParam(netPorts, 'tcp');
        data.network.udpPorts = getParam(netPorts, 'udp');
        data.network.upnp = getParam(netPorts, 'upnp') as any;
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
        data.vr.oculusVr = getParam(vr, 'oculusvr') as any;
        data.vr.oculusVrNotes = getParam(vr, 'oculusvr notes');
        data.vr.windowsMixedReality = getParam(vr, 'windows mixed reality') as any;
        data.vr.windowsMixedRealityNotes = getParam(vr, 'windows mixed reality notes');
        data.vr.osvr = getParam(vr, 'osvr') as any;
        data.vr.osvrNotes = getParam(vr, 'osvr notes');
        data.vr.forteNsx1 = getParam(vr, 'forte vfx1') as any;
        data.vr.forteNsx1Notes = getParam(vr, 'forte vfx1 notes');
        data.vr.keyboardMouse = getParam(vr, 'keyboard-mouse') as any;
        data.vr.keyboardMouseNotes = getParam(vr, 'keyboard-mouse notes');
        data.vr.handTracking = getParam(vr, 'hand tracking') as any;
        data.vr.handTrackingNotes = getParam(vr, 'hand tracking notes');
        data.vr.bodyTracking = getParam(vr, 'body tracking') as any;
        data.vr.bodyTrackingNotes = getParam(vr, 'body tracking notes');

        data.vr.faceTracking = getParam(vr, 'face tracking') as any;
        data.vr.faceTrackingNotes = getParam(vr, 'face tracking notes');

        data.vr.eyeTracking = getParam(vr, 'eye tracking') as any;
        data.vr.eyeTrackingNotes = getParam(vr, 'eye tracking notes');

        data.vr.tobiiEyeTracking = getParam(vr, 'tobii eye tracking') as any;
        data.vr.tobiiEyeTrackingNotes = getParam(vr, 'tobii eye tracking notes');

        data.vr.trackIr = getParam(vr, 'trackir') as any;
        data.vr.trackIrNotes = getParam(vr, 'trackir notes');

        data.vr.thirdSpaceGamingVest = getParam(vr, '3rd space gaming vest') as any;
        data.vr.thirdSpaceGamingVestNotes = getParam(vr, '3rd space gaming vest notes');

        data.vr.novintFalcon = getParam(vr, 'novint falcon') as any;
        data.vr.novintFalconNotes = getParam(vr, 'novint falcon notes');

        data.vr.playAreaSeated = getParam(vr, 'play area seated') as any;
        data.vr.playAreaSeatedNotes = getParam(vr, 'play area seated notes');
        data.vr.playAreaStanding = getParam(vr, 'play area standing') as any;
        data.vr.playAreaStandingNotes = getParam(vr, 'play area standing notes');
        data.vr.playAreaRoomScale = getParam(vr, 'play area room-scale') as any;
        data.vr.playAreaRoomScaleNotes = getParam(vr, 'play area room-scale notes');
        data.vr.trackIrNotes = getParam(vr, 'trackir notes');
    }

    // --- API ---
    const api = findTemplateGlobal('API');
    if (api) {
        data.api.dxVersion = getParam(api, 'direct3d versions');
        data.api.dxNotes = getParam(api, 'direct3d notes');

        data.api.directDrawVersion = getParam(api, 'directdraw versions');
        data.api.directDrawNotes = getParam(api, 'directdraw notes');

        data.api.openGlVersion = getParam(api, 'opengl versions');
        data.api.openGlNotes = getParam(api, 'opengl notes');

        data.api.vulkanVersion = getParam(api, 'vulkan versions');
        data.api.vulkanNotes = getParam(api, 'vulkan notes');

        data.api.glideVersion = getParam(api, 'glide versions');
        data.api.glideNotes = getParam(api, 'glide notes');

        data.api.wing = getParam(api, 'wing') as any;
        data.api.wingNotes = getParam(api, 'wing notes');

        data.api.softwareMode = getParam(api, 'software mode') as any;
        data.api.softwareModeNotes = getParam(api, 'software mode notes');

        data.api.mantle = getParam(api, 'mantle support') as any;
        data.api.mantleNotes = getParam(api, 'mantle support notes');

        data.api.metal = getParam(api, 'metal support') as any;
        data.api.metalNotes = getParam(api, 'metal support notes');

        data.api.dosModes = getParam(api, 'dos modes') as any;
        data.api.dosModesNotes = getParam(api, 'dos modes notes');

        data.api.windows32 = getParam(api, 'windows 32-bit exe') as any;
        data.api.windows64 = getParam(api, 'windows 64-bit exe') as any;
        data.api.windowsArm = getParam(api, 'windows arm app') as any;
        data.api.windowsNotes = getParam(api, 'windows exe notes');

        data.api.macOsXPowerPc = getParam(api, 'mac os x powerpc app') as any;
        data.api.macOsIntel32 = getParam(api, 'macos intel 32-bit app') as any;
        data.api.macOsIntel64 = getParam(api, 'macos intel 64-bit app') as any;
        data.api.macOsArm = getParam(api, 'macos arm app') as any;
        data.api.macOs68k = getParam(api, 'mac os 68k app') as any;
        data.api.macOsPowerPc = getParam(api, 'mac os powerpc app') as any;
        data.api.macOsNotes = getParam(api, 'mac os executable notes');
        data.api.macOsAppNotes = getParam(api, 'macos app notes');

        data.api.linux32 = getParam(api, 'linux 32-bit executable') as any;
        data.api.linux64 = getParam(api, 'linux 64-bit executable') as any;
        data.api.linuxArm = getParam(api, 'linux arm app') as any;
        data.api.linuxPowerPc = getParam(api, 'linux powerpc app') as any;
        data.api.linux68k = getParam(api, 'linux 68k app') as any;
        data.api.linuxNotes = getParam(api, 'linux executable notes');
    }

    // --- System Requirements ---
    const sysReqs = findAllTemplates(rootNodes, 'System requirements');
    sysReqs.forEach(req => {
        // Try to get OS from 'OSfamily' parameter (legacy 'OS' support removed)
        let os = getParam(req, 'OSfamily');
        // console.log(`SysReqs: Parsing OSfamily=${os}`);
        if (req.childNodes) {
            // console.log('SysReqs children:', req.childNodes.map(c => c.name).join(', '));
        }

        let target: SystemRequirementsOS;

        if (os.match(/windows/i)) target = data.requirements.windows;
        else if (os.match(/mac/i) || os.match(/os x/i)) target = data.requirements.mac;
        else if (os.match(/linux/i)) target = data.requirements.linux;
        else return;

        target.notes = getParam(req, 'notes');

        // Use minOS and recOS for the OS version, not OSfamily
        target.minimum.target = getParam(req, 'minTGT');
        target.minimum.os = getParam(req, 'minOS');
        target.minimum.cpu = getParam(req, 'minCPU');
        target.minimum.cpu2 = getParam(req, 'minCPU2');
        target.minimum.ram = getParam(req, 'minRAM');
        target.minimum.hdd = getParam(req, 'minHD');
        target.minimum.gpu = getParam(req, 'minGPU');
        target.minimum.gpu2 = getParam(req, 'minGPU2');
        target.minimum.gpu3 = getParam(req, 'minGPU3');
        target.minimum.vram = getParam(req, 'minVRAM');
        target.minimum.ogl = getParam(req, 'minOGL');
        target.minimum.dx = getParam(req, 'minDX');
        target.minimum.sm = getParam(req, 'minSM');
        target.minimum.audio = getParam(req, 'minaudio');
        target.minimum.cont = getParam(req, 'mincont');
        target.minimum.other = getParam(req, 'minother');

        target.recommended.target = getParam(req, 'recTGT');
        target.recommended.os = getParam(req, 'recOS');
        target.recommended.cpu = getParam(req, 'recCPU');
        target.recommended.cpu2 = getParam(req, 'recCPU2');
        target.recommended.ram = getParam(req, 'recRAM');
        target.recommended.hdd = getParam(req, 'recHD');
        target.recommended.gpu = getParam(req, 'recGPU');
        target.recommended.gpu2 = getParam(req, 'recGPU2');
        target.recommended.gpu3 = getParam(req, 'recGPU3');
        target.recommended.vram = getParam(req, 'recVRAM');
        target.recommended.ogl = getParam(req, 'recOGL');
        target.recommended.dx = getParam(req, 'recDX');
        target.recommended.sm = getParam(req, 'recSM');
        target.recommended.audio = getParam(req, 'recaudio');
        target.recommended.cont = getParam(req, 'reccont');
        target.recommended.other = getParam(req, 'recother');

        // Alternatives
        const parseAlt = (prefix: string): any => ({
            title: getParam(req, `${prefix}Title`),
            target: getParam(req, `${prefix}TGT`),
            os: getParam(req, `${prefix}OS`),
            cpu: getParam(req, `${prefix}CPU`),
            cpu2: getParam(req, `${prefix}CPU2`),
            ram: getParam(req, `${prefix}RAM`),
            hdd: getParam(req, `${prefix}HD`),
            gpu: getParam(req, `${prefix}GPU`),
            gpu2: getParam(req, `${prefix}GPU2`),
            gpu3: getParam(req, `${prefix}GPU3`),
            vram: getParam(req, `${prefix}VRAM`),
            ogl: getParam(req, `${prefix}OGL`),
            dx: getParam(req, `${prefix}DX`),
            sm: getParam(req, `${prefix}SM`),
            audio: getParam(req, `${prefix}audio`),
            cont: getParam(req, `${prefix}cont`),
            other: getParam(req, `${prefix}other`),
        });

        if (getParam(req, 'alt1OS') || getParam(req, 'alt1Title')) target.alt1 = parseAlt('alt1');
        if (getParam(req, 'alt2OS') || getParam(req, 'alt2Title')) target.alt2 = parseAlt('alt2');
    });

    // --- Middleware ---
    const middleware = findTemplateGlobal('Middleware');
    if (middleware) {


        data.middleware.physics = getParam(middleware, 'physics') as any;
        data.middleware.physicsNotes = getParam(middleware, 'physics notes');
        data.middleware.audio = getParam(middleware, 'audio') as any;
        data.middleware.audioNotes = getParam(middleware, 'audio notes');
        data.middleware.interface = getParam(middleware, 'interface') as any;
        data.middleware.interfaceNotes = getParam(middleware, 'interface notes');
        data.middleware.input = getParam(middleware, 'input') as any;
        data.middleware.inputNotes = getParam(middleware, 'input notes');
        data.middleware.cutscenes = getParam(middleware, 'cutscenes') as any;
        data.middleware.cutscenesNotes = getParam(middleware, 'cutscenes notes');
        data.middleware.multiplayer = getParam(middleware, 'multiplayer') as any;
        data.middleware.multiplayerNotes = getParam(middleware, 'multiplayer notes');
        data.middleware.anticheat = getParam(middleware, 'anticheat') as any;
        data.middleware.anticheatNotes = getParam(middleware, 'anticheat notes');
    }
    // Helper for RatingValues
    const getRatingParam = (node: ASTNode, paramName: string): RatingValue => {
        const val = getParam(node, paramName);
        if (!val || val.trim() === '') return 'unknown';
        // Basic normalization if needed
        return val.toLowerCase() as RatingValue;
    };


    // --- Monetization ---
    const monetization = findTemplateGlobal('Monetization');
    if (monetization) {
        data.monetization.adSupported = getParam(monetization, 'ad-supported') as any;
        data.monetization.dlc = getParam(monetization, 'dlc') as any;
        data.monetization.expansionPack = getParam(monetization, 'expansion pack') as any;
        data.monetization.freeware = getParam(monetization, 'freeware') as any;
        data.monetization.freeToPlay = getParam(monetization, 'free-to-play') as any;
        data.monetization.oneTimePurchase = getParam(monetization, 'one-time game purchase') as any;
        data.monetization.subscription = getParam(monetization, 'subscription') as any;
        data.monetization.subscriptionGamingService = getParam(monetization, 'subscription gaming service') as any;
        data.monetization.crossGameBonus = getParam(monetization, 'cross-game bonus') as any;
    }

    // --- Microtransactions ---
    const mtx = findTemplateGlobal('Microtransactions');
    if (mtx) {
        data.microtransactions.boost = getParam(mtx, 'boost') as any;
        data.microtransactions.cosmetic = getParam(mtx, 'cosmetic') as any;
        data.microtransactions.currency = getParam(mtx, 'currency') as any;
        data.microtransactions.finiteSpend = getParam(mtx, 'finite spend') as any;
        data.microtransactions.infiniteSpend = getParam(mtx, 'infinite spend') as any;
        data.microtransactions.freeToGrind = getParam(mtx, 'free-to-grind') as any;
        data.microtransactions.lootBox = getParam(mtx, 'loot box') as any;
        data.microtransactions.none = getParam(mtx, 'none') as any;
        data.microtransactions.playerTrading = getParam(mtx, 'player trading') as any;
        data.microtransactions.timeLimited = getParam(mtx, 'time-limited') as any;
        data.microtransactions.unlock = getParam(mtx, 'unlock') as any;
    }

    // --- Localizations ---
    const l10n = findTemplateGlobal('L10n');
    if (l10n) {
        const rows: any[] = [];
        const contentParam = getParamValueNodes(l10n, 'content'); // L10n takes content param with rows
        // We need to find L10n/row or L10n/switch templates INSIDE the content param
        if (contentParam) {
            const switchRowNodes = findAllTemplates(contentParam, 'L10n/switch');
            switchRowNodes.forEach(node => {
                rows.push({
                    language: getParam(node, 'language'),
                    interface: getRatingParam(node, 'interface'),
                    audio: getRatingParam(node, 'audio'),
                    subtitles: getRatingParam(node, 'subtitles'),
                    notes: getParam(node, 'notes'),
                    fan: getParam(node, 'fan') === 'true',
                    ref: getParam(node, 'ref')
                });
            });
        }
        data.localizations = rows;
    }




    // --- Issues ---
    const parseIssues = (sectionName: string): Omit<Issue, 'fixed'>[] => {
        // Regex to find the section and its content
        // Matches ==Title== ... (until next ==Header== (Level 2) or end)
        // ensure we don't stop at === (Level 3)
        const sectionRegex = new RegExp(`==\\s*${sectionName}\\s*==([\\s\\S]*?)(?=\\n+==(?!=)|$)\\n*`, 'i');
        const match = wikitext.match(sectionRegex);
        if (!match) return [];



        const content = match[1];
        const issues: Omit<Issue, 'fixed'>[] = [];

        // Split by ===Title===
        // Matches ===Title=== content
        const issueMatches = content.matchAll(/===\s*(.*?)\s*===([\s\S]*?)(?=\n===|$)/g);
        for (const m of issueMatches) {
            issues.push({
                title: m[1].trim(),
                body: m[2].trim()
            });
        }
        return issues;
    };

    const unresolved = parseIssues('Issues unresolved').map((i: Omit<Issue, 'fixed'>) => ({ ...i, fixed: false }));
    const fixed = parseIssues('Issues fixed').map((i: Omit<Issue, 'fixed'>) => ({ ...i, fixed: true }));
    data.issues = [...unresolved, ...fixed];

    // --- Galleries ---
    const extractGalleryImages = (content: string): GalleryImage[] => {
        // First, handle lines (standard for <gallery> and {{Gallery|content=...}})
        const lines = content.split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0 && !l.startsWith('<') && !l.startsWith('{'));

        const results: GalleryImage[] = [];

        lines.forEach(line => {
            // Strip parameter names if present (e.g. "content=File:..." or "1=File:...")
            const cleanLine = line.replace(/^\s*[\w\s-]+\s*=\s*/, '');
            if (!cleanLine) return;

            const parts = cleanLine.split('|');
            // Check if it looks like a file (PCGW uses File: prefix often)
            if (parts[0].toLowerCase().includes('.jpg') ||
                parts[0].toLowerCase().includes('.png') ||
                parts[0].toLowerCase().includes('.jpeg') ||
                parts[0].toLowerCase().startsWith('file:')) {
                results.push({
                    name: parts[0].trim().replace(/^File:/i, ''),
                    caption: parts.slice(1).join('|').trim()
                });
            }
        });

        // If no lines matched, it might be a single-line pipe-separated template
        if (results.length === 0 && content.includes('|')) {
            const parts = content.split('|').map(p => p.trim());
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i].replace(/^\s*[\w\s-]+\s*=\s*/, '');
                if (part.toLowerCase().includes('.jpg') || part.toLowerCase().includes('.png') || part.toLowerCase().startsWith('file:')) {
                    const name = part.replace(/^File:/i, '');
                    let caption = '';
                    // If next part isn't another image, it's likely the caption
                    if (i + 1 < parts.length) {
                        const next = parts[i + 1].toLowerCase();
                        if (!next.includes('.jpg') && !next.includes('.png') && !next.startsWith('file:')) {
                            caption = parts[i + 1];
                            i++; // Skip caption
                        }
                    }
                    results.push({ name, caption });
                }
            }
        }

        return results;
    };

    const getSectionContent = (name: string): string => {
        // More robust regex to match section content
        const regex = new RegExp(`==\\s*${name}\\s*==([\\s\\S]*?)(?=\\n+==(?!=)|$)`, 'i');
        const match = wikitext.match(regex);
        return match ? match[1] : '';
    };

    const gallerySections: Record<string, string> = {
        'Video': 'video',
        'Input': 'input',
        'Audio': 'audio',
        'Network': 'network',
        'VR support': 'vr',
        'API': 'api',
        'Middleware': 'middleware',
        'System requirements': 'system_requirements'
    };

    for (const [section, key] of Object.entries(gallerySections)) {
        const content = getSectionContent(section);
        if (content) {
            // We need to parse:
            // 1. {{Image...}} templates
            // 2. <gallery> tags
            // 3. {{Gallery}} templates
            // 4. [[File:...]] links

            const images: GalleryImage[] = [];
            const allMatches: { index: number, type: 'gallery' | 'template_gallery' | 'template_image' | 'link', match: RegExpMatchArray }[] = [];

            // 1. <gallery> tags
            for (const m of content.matchAll(/<gallery[^>]*>([\s\S]*?)<\/gallery>/gi)) {
                if (m.index !== undefined) allMatches.push({ index: m.index, type: 'gallery', match: m });
            }

            // 2. {{Gallery}} templates
            for (const m of content.matchAll(/\{\{Gallery\s*\|([\s\S]*?)\}\}/gi)) {
                if (m.index !== undefined) allMatches.push({ index: m.index, type: 'template_gallery', match: m });
            }

            // 3. {{Image}} templates
            for (const m of content.matchAll(/\{\{Image\s*\|([^|}]*)\|?([^}]*)\}\}/gi)) {
                if (m.index !== undefined) allMatches.push({ index: m.index, type: 'template_image', match: m });
            }

            // 4. [[File:...]] links
            for (const m of content.matchAll(/\[\[File:\s*([^|\]\n]+)(?:\|([^\]\n]*))?\]\]/gi)) {
                if (m.index !== undefined) allMatches.push({ index: m.index, type: 'link', match: m });
            }

            // Sort by occurrence in text
            allMatches.sort((a, b) => a.index - b.index);

            const knownFileExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];

            for (const item of allMatches) {
                if (item.type === 'gallery' || item.type === 'template_gallery') {
                    // extractGalleryImages returns array, we need to check dupes for each
                    const extracted = extractGalleryImages(item.match[1]);
                    for (const img of extracted) {
                        if (img.name && !images.some(existing => existing.name.toLowerCase() === img.name.toLowerCase())) {
                            img.position = 'gallery';
                            images.push(img);
                        }
                    }
                } else if (item.type === 'template_image') {
                    const m = item.match;
                    const name = m[1].trim().replace(/^File:/i, '');
                    const caption = (m[2] || '').trim();
                    if (name && !images.some(img => img.name.toLowerCase() === name.toLowerCase())) {
                        images.push({ name, caption, position: 'lateral' });
                    }
                } else if (item.type === 'link') {
                    const m = item.match;
                    const name = m[1].trim();
                    const params = m[2] || '';
                    const hasExtension = knownFileExtensions.some(ext => name.toLowerCase().endsWith(ext));
                    if (!hasExtension) continue;
                    if (name.toLowerCase().includes('icon')) continue;

                    const parts = params.split('|').map(p => p.trim());
                    const knownAttributes = ['thumb', 'thumbnail', 'left', 'right', 'center', 'none', 'frame', 'framed', 'frameless', 'border'];
                    let caption = '';

                    if (parts.length > 0) {
                        const lastPart = parts[parts.length - 1];
                        if (!knownAttributes.includes(lastPart.toLowerCase()) && !/^\d+px$/.test(lastPart)) {
                            caption = lastPart;
                        }
                    }

                    if (!images.some(img => img.name.toLowerCase() === name.toLowerCase())) {
                        images.push({ name, caption, position: 'lateral' });
                    }
                }
            }

            if (images.length > 0) {
                data.galleries[key] = images;
            }
        }
    }


    return data;
}

