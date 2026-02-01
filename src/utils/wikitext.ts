import { GameData, GameInfobox, SettingsVideo, SettingsInput, SettingsAudio, SettingsNetwork, SettingsVR, SettingsAPI, GameMiddleware, SystemRequirements, LocalizationRow, GameIssues, Issue } from '../models/GameData';
import { WikitextParser } from './WikitextParser';

export class PCGWEditor {
    private parser: WikitextParser;

    constructor(wikitext: string) {
        this.parser = new WikitextParser(wikitext || '');
    }

    getText(): string {
        return this.parser.getText();
    }

    /**
     * Find and replace a value in a standard Key=Value template.
     * e.g. {{Video |ultrawidescreen = true }}
     * Now uses robust depth-aware parsing instead of greedy regex.
     */
    setTemplateParam(templateName: string, paramName: string, newValue: string | boolean | number | undefined | null) {
        if (newValue === undefined || newValue === null) return;
        this.parser.setParameter(templateName, paramName, String(newValue));
    }

    /**
     * Gestisce i template riga specifici di PCGW come {{Infobox game/row/developer|Nome}}
     * Now uses depth-aware parsing to handle nested structures properly.
     */
    setRowValue(rowType: string, newValue: string) {
        // Find the specific row template
        const templateName = `Infobox game/row/${rowType}`;
        const template = this.parser.findTemplate(templateName);

        if (template) {
            // Extract the content after the pipe |
            const match = template.content.match(/\{\{[^|]+\|(.*)\}\}/);
            if (match) {
                const oldValue = match[1];
                const newContent = template.content.replace(oldValue, newValue);
                const wikitext = this.parser.getText();
                this.parser = new WikitextParser(
                    wikitext.substring(0, template.start) + newContent + wikitext.substring(template.end)
                );
            }
        }
    }

    /**
     * Updates simple boolean flags/tags typically found at the top
     */
    setFlag(tagName: string, active: boolean, description?: string) {
        // Check if exists using the parser
        const template = this.parser.findTemplate(tagName);
        const exists = template !== null;

        if (active) {
            let tagContent = `{{${tagName}`;
            if (description) tagContent += `|${description}`;
            tagContent += `}}`;

            if (exists && template) {
                // Replace
                const wikitext = this.parser.getText();
                this.parser = new WikitextParser(
                    wikitext.substring(0, template.start) + tagContent + wikitext.substring(template.end)
                );
            } else {
                // Prepend to file (standard for flags like Stub, Cleanup)
                const wikitext = this.parser.getText();
                this.parser = new WikitextParser(tagContent + '\n' + wikitext);
            }
        } else {
            if (exists && template) {
                // Remove
                const wikitext = this.parser.getText();
                this.parser = new WikitextParser(
                    wikitext.substring(0, template.start) + wikitext.substring(template.end)
                );
            }
        }
    }

    // --- Utils for Lists ---

    replaceSectionContent(header: string, newContent: string) {
        // Use the new parser's section handling
        this.parser.replaceSection(header, newContent);
    }

    // --- Dynamic Update Helper ---

    /**
     * Updates a section template using a mapping object.
     * @param templateName The name of the template (e.g. "Video")
     * @param data The data object containing the values
     * @param mapping A map where Key = Data Field Name, Value = Template Parameter Name
     */
    updateSection(templateName: string, data: any, mapping: Record<string, string>) {
        if (!data) return;

        for (const [dataKey, paramName] of Object.entries(mapping)) {
            const value = data[dataKey];
            this.setTemplateParam(templateName, paramName, value);
        }
    }

    // --- Section Specific Updaters ---

    updateArticleState(state: GameData['articleState']) {
        this.setFlag('stub', !!state.stub);
        this.setFlag('cleanup', !!state.cleanup, state.cleanupDescription);
        this.setFlag('delete', !!state.delete, state.deleteReason);
        this.setTemplateParam('State', 'state', state.state);

        if (state.disambig) {
            const template = this.parser.findTemplate('Disambig');
            const newDisambig = `{{Disambig|${state.disambig}}}`;

            if (template) {
                const wikitext = this.parser.getText();
                this.parser = new WikitextParser(
                    wikitext.substring(0, template.start) + newDisambig + wikitext.substring(template.end)
                );
            } else {
                const wikitext = this.parser.getText();
                this.parser = new WikitextParser(newDisambig + '\n' + wikitext);
            }
        }
    }

    updateInfobox(infobox: GameInfobox) {
        this.setTemplateParam('Infobox game', 'cover', infobox.cover);
        this.setTemplateParam('Infobox game', 'license', infobox.license);

        const linkMap: Record<string, string> = {
            steamAppId: 'steam appid',
            steamAppIdSide: 'steam appid side',
            gogComId: 'gogcom id',
            officialSite: 'official site',
            wikipedia: 'wikipedia',
            // Add others provided in GameInfobox interface if needed
            // gogComIdSide, hltb, igdb, lutris, mobygames, vndb, strategyWiki, wineHq, wineHqSide
        };
        this.updateSection('Infobox game', infobox.links, linkMap);

        this.updateInfoboxList('developers', infobox.developers);
        this.updateInfoboxList('publishers', infobox.publishers);
    }

    // ... private updateInfoboxList ... (kept as is, but needing to be preserved)
    private updateInfoboxList(paramName: string, items: any[]) {
        if (!items || items.length === 0) return;

        // Format the nested row templates
        const formattedItems = items.map(item => {
            let type = 'developer';
            if (paramName === 'publishers') type = 'publisher';
            if (item.type) type = item.type;
            return { type, name: item.name };
        });

        const listContent = this.parser.formatNestedRows(formattedItems);

        // Use the robust parameter content replacement
        this.parser.replaceParameterContent('Infobox game', paramName, listContent);
    }

    updateIntroduction(data: GameData['introduction']) {
        this.updateSection('Introduction', data, {
            introduction: 'introduction',
            releaseHistory: 'release history',
            currentState: 'current state'
        });
    }

    updateAvailability(data: GameData['availability']) {
        if (!data || data.length === 0) return;

        const rows = data.map(row => {
            const state = row.state && row.state !== 'normal' ? `| ${row.state} ` : '';
            return `{{Availability/row| ${row.distribution} | ${row.id} | ${row.drm} | ${row.notes} | ${row.keys} | ${row.os} ${state}}}`;
        }).join('\n');

        // Use depth-aware template finding
        const template = this.parser.findTemplate('Availability');
        if (template) {
            // Replace content between {{ and }}, preserving structure
            const wikitext = this.parser.getText();
            const newTemplate = `{{Availability|
${rows}
}}`;
            this.parser = new WikitextParser(
                wikitext.substring(0, template.start) + newTemplate + wikitext.substring(template.end)
            );
        }
    }

    updateMonetization(data: GameData['monetization']) {
        this.updateSection('Monetization', data, {
            adSupported: 'ad-supported',
            dlc: 'dlc',
            expansionPack: 'expansion pack',
            freeware: 'freeware',
            freeToPlay: 'free-to-play',
            oneTimePurchase: 'one-time game purchase',
            subscription: 'subscription'
        });
    }

    updateMicrotransactions(data: GameData['microtransactions']) {
        this.updateSection('Microtransactions', data, {
            boost: 'boost',
            cosmetic: 'cosmetic',
            currency: 'currency',
            finiteSpend: 'finite spend',
            infiniteSpend: 'infinite spend',
            freeToGrind: 'free-to-grind',
            lootBox: 'loot box',
            none: 'none',
            playerTrading: 'player trading',
            timeLimited: 'time-limited',
            unlock: 'unlock'
        });
    }

    updateVideo(data: SettingsVideo) {
        // Map GameData fields to PCGW Template fields
        const map: Record<string, string> = {
            wsgfLink: 'wsgf link',
            widescreenResolution: 'widescreen resolution',
            widescreenResolutionNotes: 'widescreen resolution notes',
            multiMonitor: 'multimonitor',
            multiMonitorNotes: 'multimonitor notes',
            ultraWidescreen: 'ultrawidescreen',
            ultraWidescreenNotes: 'ultrawidescreen notes',
            fourKUltraHd: '4k ultra hd',
            fourKUltraHdNotes: '4k ultra hd notes',
            fov: 'fov',
            fovNotes: 'fov notes',
            windowed: 'windowed',
            windowedNotes: 'windowed notes',
            borderlessWindowed: 'borderless windowed',
            borderlessWindowedNotes: 'borderless windowed notes',
            anisotropic: 'anisotropic',
            anisotropicNotes: 'anisotropic notes',
            antiAliasing: 'antialiasing',
            antiAliasingNotes: 'antialiasing notes',
            upscaling: 'upscaling',
            upscalingTech: 'upscaling tech',
            upscalingNotes: 'upscaling notes',
            frameGen: 'framegen',
            frameGenTech: 'framegen tech',
            frameGenNotes: 'framegen notes',
            vsync: 'vsync',
            vsyncNotes: 'vsync notes',
            fps60: '60 fps',
            fps60Notes: '60 fps notes',
            fps120: '120 fps',
            fps120Notes: '120 fps notes',
            hdr: 'hdr',
            hdrNotes: 'hdr notes',
            rayTracing: 'ray tracing',
            rayTracingNotes: 'ray tracing notes',
            colorBlind: 'color blind',
            colorBlindNotes: 'color blind notes'
        };
        this.updateSection('Video', data, map);
    }

    updateInput(data: SettingsInput) {
        const map: Record<string, string> = {
            keyRemap: 'key remap',
            keyRemapNotes: 'key remap notes',
            mouseSensitivity: 'mouse sensitivity',
            mouseSensitivityNotes: 'mouse sensitivity notes',
            mouseMenu: 'mouse menu',
            mouseMenuNotes: 'mouse menu notes',
            invertMouseY: 'invert mouse y-axis',
            invertMouseYNotes: 'invert mouse y-axis notes',
            controllerSupport: 'controller support',
            controllerSupportNotes: 'controller support notes',
            fullController: 'full controller',
            fullControllerNotes: 'full controller notes',
            controllerRemap: 'controller remap',
            controllerRemapNotes: 'controller remap notes',
            controllerSensitivity: 'controller sensitivity',
            controllerSensitivityNotes: 'controller sensitivity notes',
            invertControllerY: 'invert controller y-axis',
            invertControllerYNotes: 'invert controller y-axis notes',
            hapticFeedback: 'haptic feedback',
            hapticFeedbackNotes: 'haptic feedback notes',
            simultaneousInput: 'simultaneous input',
            simultaneousInputNotes: 'simultaneous input notes',
            steamInputApi: 'steam input api',
            steamInputApiNotes: 'steam input api notes'
        };
        this.updateSection('Input', data, map);
    }

    updateAudio(data: SettingsAudio) {
        const map: Record<string, string> = {
            separateVolume: 'separate volume',
            surroundSound: 'surround sound',
            subtitles: 'subtitles',
            closedCaptions: 'closed captions',
            muteOnFocusLost: 'mute on focus lost',
            royaltyFree: 'royalty free audio'
        };
        this.updateSection('Audio', data, map);
    }

    updateNetwork(data: SettingsNetwork) {
        const map: Record<string, string> = {
            localPlay: 'local play',
            localPlayPlayers: 'local play players',
            lanPlay: 'lan play',
            lanPlayPlayers: 'lan play players',
            onlinePlay: 'online play',
            onlinePlayPlayers: 'online play players',
            asynchronous: 'asynchronous',
            crossplay: 'crossplay',
            matchmaking: 'matchmaking',
            p2p: 'p2p',
            dedicated: 'dedicated',
            selfHosting: 'self-hosting',
            directIp: 'direct ip'
        };
        this.updateSection('Network', data, map);
    }

    updateVR(data: SettingsVR) {
        const map: Record<string, string> = {
            native3d: 'native 3d',
            native3dNotes: 'native 3d notes',
            nvidia3dVision: 'nvidia 3d vision',
            vorpx: 'vorpx',
            openXr: 'openxr',
            steamVr: 'steamvr',
            oculusVr: 'oculus',
            windowsMixedReality: 'windows mixed reality'
        };
        this.updateSection('VR support', data, map);
    }

    updateAPI(data: SettingsAPI) {
        const map: Record<string, string> = {
            dxVersion: 'direct3d versions',
            dxNotes: 'direct3d notes',
            openGlVersion: 'opengl versions',
            openGlNotes: 'opengl notes',
            vulkanVersion: 'vulkan versions',
            vulkanNotes: 'vulkan notes',
            windows32: 'windows 32-bit exe',
            windows64: 'windows 64-bit exe',
            windowsArm: 'windows arm app'
        };
        this.updateSection('API', data, map);
    }

    updateMiddleware(data: GameData['middleware']) {
        // ... custom logic for generic rows per category ...
        const updateMWCat = (param: string, items: any[]) => {
            if (!items || items.length === 0) return;
            const content = items.map(i => `{{Middleware/row|${i.name}|${i.notes || ''}}}`).join('\n');
            this.setTemplateParam('Middleware', param, '\n' + content + '\n');
        };

        updateMWCat('physics', data.physics);
        updateMWCat('audio', data.audio);
        updateMWCat('interface', data.interface);
        updateMWCat('input', data.input);
        updateMWCat('cutscenes', data.cutscenes);
        updateMWCat('multiplayer', data.multiplayer);
        updateMWCat('anticheat', data.anticheat);
    }

    updateLocalizations(data: GameData['localizations']) {
        if (!data || data.length === 0) return;
        const content = data.map(row => {
            const ui = row.interface ? 'true' : 'false';
            const fan = row.fan ? 'true' : '';
            return `{{L10n/row|${row.language}|${ui}|${row.audio}|${row.subtitles}|${row.notes || ''}|${fan}|${row.ref || ''}}}`;
        }).join('\n');

        this.setTemplateParam('L10n', 'content', '\n' + content + '\n');
    }

    updateIssues(issues: GameData['issues']) {
        if (issues.unresolved.length > 0) {
            const content = issues.unresolved.map(i => {
                let s = `{{Fixbox|description=${i.description}`;
                if (i.ref) s += `|ref=${i.ref}`;
                if (i.os && i.os !== 'All') s += `|os=${i.os}`;
                s += '}}';
                return s;
            }).join('\n');
            this.replaceSectionContent('Issues unresolved', content);
        }

        if (issues.fixed.length > 0) {
            const content = issues.fixed.map(i => {
                let s = `{{Fixbox|description=${i.description}`;
                if (i.fix) s += `|fix=${i.fix}`;
                if (i.ref) s += `|ref=${i.ref}`;
                if (i.os && i.os !== 'All') s += `|os=${i.os}`;
                s += '}}';
                return s;
            }).join('\n');
            this.replaceSectionContent('Issues fixed', content);
        }
    }

    updateSystemRequirements(data: SystemRequirements) {
        // System requirements are multiple templates: {{System requirements|OS=Windows...}}
        // We use depth-aware parsing to find and update each OS block.

        const updateOSReq = (os: string, reqs: any) => {
            if (!reqs) return;

            // Find all System requirements templates
            const wikitext = this.parser.getText();
            const osRegex = new RegExp(`\\{\\{System requirements[^}]*\\|\\s*OS\\s*=\\s*${os}`, 'i');
            const match = wikitext.match(osRegex);

            if (!match || match.index === undefined) return;

            // Create a temporary parser for this specific template block
            const tempStart = match.index;
            let depth = 0;
            let i = tempStart;
            let tempEnd = tempStart;

            // Find the matching closing }}
            while (i < wikitext.length) {
                const char = wikitext[i];
                const nextChar = i + 1 < wikitext.length ? wikitext[i + 1] : '';

                if (char === '{' && nextChar === '{') {
                    depth++;
                    i += 2;
                    continue;
                }

                if (char === '}' && nextChar === '}') {
                    depth--;
                    if (depth === 0) {
                        tempEnd = i + 2;
                        break;
                    }
                    i += 2;
                    continue;
                }

                i++;
            }

            // Create a mini parser for just this template
            const blockContent = wikitext.substring(tempStart, tempEnd);
            const blockParser = new WikitextParser(blockContent);

            // Update parameters using the robust parser
            if (reqs.minimum) {
                blockParser.setParameter('System requirements', 'OSfamily', reqs.minimum.os);
                blockParser.setParameter('System requirements', 'minCPU', reqs.minimum.cpu);
                blockParser.setParameter('System requirements', 'minRAM', reqs.minimum.ram);
                blockParser.setParameter('System requirements', 'minHD', reqs.minimum.hdd);
                blockParser.setParameter('System requirements', 'minGPU', reqs.minimum.gpu);
            }

            if (reqs.recommended) {
                blockParser.setParameter('System requirements', 'recOSfamily', reqs.recommended.os);
                blockParser.setParameter('System requirements', 'recCPU', reqs.recommended.cpu);
                blockParser.setParameter('System requirements', 'recRAM', reqs.recommended.ram);
                blockParser.setParameter('System requirements', 'recHD', reqs.recommended.hdd);
                blockParser.setParameter('System requirements', 'recGPU', reqs.recommended.gpu);
            }

            if (reqs.notes) {
                blockParser.setParameter('System requirements', 'notes', reqs.notes);
            }

            // Replace the block in the main wikitext
            this.parser = new WikitextParser(
                wikitext.substring(0, tempStart) + blockParser.getText() + wikitext.substring(tempEnd)
            );
        };

        updateOSReq('Windows', data.windows);
        updateOSReq('Mac', data.mac);
        updateOSReq('Linux', data.linux);
    }
}
// Keep DEFAULT_TEMPLATE and generateWikitext at the end


// Default template if file is empty
const DEFAULT_TEMPLATE = `{{Infobox game
|cover        = 
|developers   = 
|publishers   = 
|engines      = 
|release dates= 
|genre        = 
|taxonomy     = 
}}

{{Introduction
|introduction      = 
|release history   = 
|current state     = 
}}

{{Availability}}

{{Monetization
|ad-supported                = 
|dlc                         = 
|expansion pack              = 
|freeware                    = 
|free-to-play                = 
|one-time game purchase      = 
|subscription                = 
}}

{{Microtransactions}}

{{Video
|widescreen resolution      = 
|multimonitor               = 
|ultrawidescreen            = 
|4k ultra hd                = 
|fov                        = 
|windowed                   = 
|borderless windowed        = 
|anisotropic                = 
|antialiasing               = 
|upscaling                  = 
|framegen                   = 
|vsync                      = 
|60 fps                     = 
|120 fps                    = 
|hdr                        = 
|ray tracing                = 
|color blind                = 
}}

{{Input
|key remap                  = 
|mouse sensitivity          = 
|mouse menu                 = 
|keyboard and mouse prompts = 
|controller support         = 
|full controller            = 
|controller remap           = 
|controller sensitivity     = 
}}

{{Audio
|separate volume            = 
|surround sound             = 
|subtitles                  = 
|closed captions            = 
|mute on focus lost         = 
|royalty free audio         = 
}}

{{Network
|local play                 = 
|lan play                   = 
|online play                = 
}}

{{VR support}}

{{API
|direct3d versions      = 
|opengl versions        = 
|vulkan versions        = 
}}

{{Middleware
|physics     = 
|audio       = 
|interface   = 
}}

{{L10n|content=
{{L10n/row|English|true|true|true|||}}
}}

{{System requirements
|OS=Windows
|OSfamily = 
|minCPU   = 
|minRAM   = 
|minHD    = 
|minGPU   = 
}}

{{System requirements
|OS=Mac
}}

{{System requirements
|OS=Linux
}}
`;

export function generateWikitext(data: GameData, originalWikitext: string): string {
    const editor = new PCGWEditor(originalWikitext || DEFAULT_TEMPLATE);

    editor.updateArticleState(data.articleState);
    editor.updateInfobox(data.infobox);
    editor.updateIntroduction(data.introduction);
    editor.updateAvailability(data.availability);
    editor.updateMonetization(data.monetization);
    editor.updateMicrotransactions(data.microtransactions);
    editor.updateVideo(data.video);
    editor.updateInput(data.input);
    editor.updateAudio(data.audio);
    editor.updateNetwork(data.network);
    editor.updateVR(data.vr);
    editor.updateAPI(data.api);
    editor.updateMiddleware(data.middleware);
    editor.updateLocalizations(data.localizations);
    editor.updateIssues(data.issues);
    editor.updateSystemRequirements(data.requirements);

    return editor.getText();
}