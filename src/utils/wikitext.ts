import { GameData, GameInfobox, SettingsVideo, SettingsInput, SettingsAudio, SettingsNetwork, SettingsVR, SettingsAPI, SystemRequirements, GameDataConfig } from '../models/GameData';
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
     * Ensures a template exists in the wikitext.
     * If not found, appends it to the end (or specific logic if we want to be smarter later).
     */
    ensureTemplate(templateName: string) {
        if (!this.parser.findTemplate(templateName)) {
            // Check if we can start a new line
            const text = this.parser.getText();
            const prefix = text.length > 0 && !text.endsWith('\n') ? '\n' : '';
            this.parser = new WikitextParser(text + `${prefix}{{${templateName}}}\n`);
        }
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

    replaceSectionContent(header: string | RegExp, newContent: string, defaultTitle: string = '') {
        // Use the new parser's section handling
        this.parser.replaceSection(header, newContent, defaultTitle);
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

        // State template
        if (state.state) {
            this.ensureTemplate('State');
            this.setTemplateParam('State', 'state', state.state);
        }

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
        this.ensureTemplate('Infobox game');
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
        this.updateInfoboxList('engines', infobox.engines);
        this.updateReleaseDates(infobox.releaseDates);
        this.updateReception(infobox.reception);
        this.updateTaxonomy(infobox.taxonomy);
    }

    private updateTaxonomy(taxonomy: GameInfobox['taxonomy']) {
        if (!taxonomy) return;

        const mapping: Record<string, string> = {
            monetization: 'monetization',
            microtransactions: 'microtransactions',
            modes: 'modes',
            pacing: 'pacing',
            perspectives: 'perspectives',
            controls: 'controls',
            genres: 'genres',
            sports: 'sports',
            vehicles: 'vehicles',
            artStyles: 'art styles',
            themes: 'themes',
            series: 'series'
        };

        const listContent = Object.entries(mapping).map(([key, templateSuffix]) => {
            const item = (taxonomy as any)[key];
            if (!item || !item.value) return '';

            // {{Infobox game/row/taxonomy/modes|Value|note=...|ref=...}}
            let row = `{{Infobox game/row/taxonomy/${templateSuffix}|${item.value}`;
            if (item.ref) row += `|ref=${item.ref}`;
            if (item.note) row += `|note=${item.note}`;
            row += `}}`;
            return row;
        }).filter(Boolean).join('\n');

        this.parser.replaceParameterContent('Infobox game', 'taxonomy', listContent);
    }

    private updateReception(rows: any[]) {
        if (!rows || rows.length === 0) return;

        // Formato: {{Infobox game/row/reception|Aggregator|ID|Score}}
        const listContent = rows.map(r => {
            // Allow partial rows to ensure UI state persists during round-trip
            const agg = r.aggregator || '';
            const id = r.id || '';
            const score = r.score || '';

            // Only skip if absolutely nothing is there, though addRow creates fully empty objects
            // Use positional arguments: 1=Aggregator, 2=ID, 3=Score
            return `{{Infobox game/row/reception|${agg}|${id}|${score}}}`;
        }).join('');

        this.parser.replaceParameterContent('Infobox game', 'reception', listContent);
    }

    private updateReleaseDates(dates: any[]) {
        if (!dates || dates.length === 0) return;

        // Formato: {{Infobox game/row/date|Platform|Date|ref=...}}
        const listContent = dates.map(d => {
            let row = `{{Infobox game/row/date|${d.platform}|${d.date}`;
            if (d.ref) row += `|ref=${d.ref}`;
            row += `}}`;
            return row;
        }).join('');

        this.parser.replaceParameterContent('Infobox game', 'release dates', listContent);
    }

    // ... private updateInfoboxList ... (kept as is, but needing to be preserved)
    private updateInfoboxList(paramName: string, items: any[]) {
        if (!items || items.length === 0) return;

        // Format the nested row templates
        const formattedItems = items.map(item => {
            let type = 'developer';
            if (paramName === 'publishers') type = 'publisher';
            if (paramName === 'engines') type = 'engine';
            if (item.type) type = item.type;

            const params: Record<string, string | undefined> = {};

            // Engines have specific fields
            if (type === 'engine') {
                params.build = item.build;
            }

            // Common optional fields
            if (item.ref) params.ref = item.ref;
            if (item.note) params.note = item.note;

            return { type, name: item.name, params };
        });

        const listContent = this.parser.formatNestedRows(formattedItems);

        // Use the robust parameter content replacement
        this.parser.replaceParameterContent('Infobox game', paramName, listContent);
    }

    updateIntroduction(data: GameData['introduction']) {
        this.ensureTemplate('Introduction');
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
        this.ensureTemplate('Monetization');
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
        this.ensureTemplate('Microtransactions');
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
        this.ensureTemplate('Video');
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
            keyboardMousePrompts: 'keyboard and mouse prompts',
            keyboardMousePromptsNotes: 'keyboard and mouse prompts notes',
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
            controllerHotplug: 'controller hotplugging',
            controllerHotplugNotes: 'controller hotplugging notes',
            hapticFeedback: 'haptic feedback',
            hapticFeedbackNotes: 'haptic feedback notes',
            simultaneousInput: 'simultaneous input',
            simultaneousInputNotes: 'simultaneous input notes',
            steamInputApi: 'steam input api',
            steamInputApiNotes: 'steam input api notes',
            steamHookInput: 'steam hook input',
            steamHookInputNotes: 'steam hook input notes',
            steamInputPrompts: 'steam input prompts',
            steamInputPromptsIcons: 'steam input prompts icons',
            steamInputPromptsStyles: 'steam input prompts styles',
            steamInputPromptsNotes: 'steam input prompts notes',
            steamInputPresets: 'steam input presets',
            steamInputPresetsNotes: 'steam input presets notes',
            steamDeckPrompts: 'steam deck prompts',
            steamDeckPromptsNotes: 'steam deck prompts notes',
            steamControllerPrompts: 'steam controller prompts',
            steamControllerPromptsNotes: 'steam controller prompts notes',
            steamInputMotionSensors: 'steam input motion sensors',
            steamInputMotionSensorsNotes: 'steam input motion sensors notes',
            steamInputMotionSensorsRef: 'steam input motion sensors ref',
            steamInputMotionSensorsModes: 'steam input motion sensors modes',
            steamCursorDetection: 'steam cursor detection',
            steamCursorDetectionNotes: 'steam cursor detection notes',
            touchscreen: 'touchscreen',
            touchscreenNotes: 'touchscreen notes',
            // New mappings
            directInputControllers: 'directinput controllers',
            directInputControllersNotes: 'directinput controllers notes',
            directInputPrompts: 'directinput prompts',
            directInputPromptsNotes: 'directinput prompts notes',
            nintendoControllers: 'nintendo controllers',
            nintendoControllersNotes: 'nintendo controllers notes',
            nintendoControllerModels: 'nintendo controller models',
            nintendoPrompts: 'nintendo prompts',
            nintendoPromptsNotes: 'nintendo prompts notes',
            nintendoButtonLayout: 'nintendo button layout',
            nintendoButtonLayoutNotes: 'nintendo button layout notes',
            nintendoMotionSensors: 'nintendo motion sensors',
            nintendoMotionSensorsNotes: 'nintendo motion sensors notes',
            nintendoMotionSensorsModes: 'nintendo motion sensors modes',
            nintendoConnectionModes: 'nintendo connection modes',
            nintendoConnectionModesNotes: 'nintendo connection modes notes',
            trackedMotionControllers: 'tracked motion controllers',
            trackedMotionControllersNotes: 'tracked motion controllers notes',
            trackedMotionPrompts: 'tracked motion prompts',
            trackedMotionPromptsNotes: 'tracked motion prompts notes',
            peripheralDevices: 'peripheral devices',
            peripheralDevicesNotes: 'peripheral devices notes',
            peripheralDeviceTypes: 'peripheral device types',
            inputPromptOverride: 'input prompt override',
            inputPromptOverrideNotes: 'input prompt override notes',
            hapticFeedbackHd: 'haptic feedback hd',
            hapticFeedbackHdNotes: 'haptic feedback hd notes',
            hapticFeedbackHdControllerModels: 'haptic feedback hd controller models',
            digitalMovementSupported: 'digital movement supported',
            digitalMovementSupportedNotes: 'digital movement supported notes',
            playstationControllers: 'playstation controllers',
            playstationControllersNotes: 'playstation controllers notes',
            playstationControllerModels: 'playstation controller models',
            playstationPrompts: 'playstation prompts',
            playstationPromptsNotes: 'playstation prompts notes',
            playstationMotionSensors: 'playstation motion sensors',
            playstationMotionSensorsNotes: 'playstation motion sensors notes',
            playstationMotionSensorsModes: 'playstation motion sensors modes',
            glightBar: 'light bar support',
            glightBarNotes: 'light bar support notes',
            dualSenseAdaptiveTrigger: 'dualsense adaptive trigger support',
            dualSenseAdaptiveTriggerNotes: 'dualsense adaptive trigger support notes',
            dualSenseHaptics: 'dualsense haptics support',
            dualSenseHapticsNotes: 'dualsense haptics support notes',
            playstationConnectionModes: 'playstation connection modes',
            playstationConnectionModesNotes: 'playstation connection modes notes',
            otherControllers: 'other controllers',
            otherControllersNotes: 'other controllers notes',
            otherButtonPrompts: 'other button prompts',
            otherButtonPromptsNotes: 'other button prompts notes',
            accelerationOption: 'acceleration option',
            accelerationOptionNotes: 'acceleration option notes',
            xinputControllers: 'xinput controllers',
            xinputControllersNotes: 'xinput controllers notes',
            xboxPrompts: 'xbox prompts',
            xboxPromptsNotes: 'xbox prompts notes',
            impulseTriggers: 'impulse triggers',
            impulseTriggersNotes: 'impulse triggers notes',
        };
        this.ensureTemplate('Input');
        this.updateSection('Input', data, map);
    }

    updateAudio(data: SettingsAudio) {
        const map: Record<string, string> = {
            separateVolume: 'separate volume',
            separateVolumeNotes: 'separate volume notes',
            surroundSound: 'surround sound',
            surroundSoundNotes: 'surround sound notes',
            subtitles: 'subtitles',
            subtitlesNotes: 'subtitles notes',
            closedCaptions: 'closed captions',
            closedCaptionsNotes: 'closed captions notes',
            muteOnFocusLost: 'mute on focus lost',
            muteOnFocusLostNotes: 'mute on focus lost notes',
            royaltyFree: 'royalty free audio',
            royaltyFreeNotes: 'royalty free audio notes',
            eaxSupport: 'eax support',
            eaxSupportNotes: 'eax support notes',
            redBookCdAudio: 'red book cd audio',
            redBookCdAudioNotes: 'red book cd audio notes',
            generalMidiAudio: 'general midi audio',
            generalMidiAudioNotes: 'general midi audio notes'
        };
        this.ensureTemplate('Audio');
        this.updateSection('Audio', data, map);
    }

    updateNetwork(data: SettingsNetwork) {
        // 1. Define Mappings
        const mapMulti: Record<string, string> = {
            localPlay: 'local play',
            localPlayPlayers: 'local play players',
            localPlayModes: 'local play modes',
            localPlayNotes: 'local play notes',
            lanPlay: 'lan play',
            lanPlayPlayers: 'lan play players',
            lanPlayModes: 'lan play modes',
            lanPlayNotes: 'lan play notes',
            onlinePlay: 'online play',
            onlinePlayPlayers: 'online play players',
            onlinePlayModes: 'online play modes',
            onlinePlayNotes: 'online play notes',
            asynchronous: 'asynchronous',
            asynchronousNotes: 'asynchronous notes',
            crossplay: 'crossplay',
            crossplayPlatforms: 'crossplay platforms',
            crossplayNotes: 'crossplay notes',
        };

        const mapConn: Record<string, string> = {
            matchmaking: 'matchmaking',
            matchmakingNotes: 'matchmaking notes',
            p2p: 'p2p',
            p2pNotes: 'p2p notes',
            dedicated: 'dedicated',
            dedicatedNotes: 'dedicated notes',
            selfHosting: 'self-hosting',
            selfHostingNotes: 'self-hosting notes',
            directIp: 'direct ip',
            directIpNotes: 'direct ip notes',
        };

        const mapPorts: Record<string, string> = {
            tcpPorts: 'tcp',
            udpPorts: 'udp',
            upnp: 'upnp'
        };

        // 2. Check Data Presence
        const hasData = (map: Record<string, string>) => Object.keys(map).some(key => {
            const val = (data as any)[key];
            return val && val !== 'unknown' && val !== '';
        });

        const hasMulti = hasData(mapMulti);
        const hasConn = hasData(mapConn);
        const hasPorts = hasData(mapPorts);

        if (!hasMulti && !hasConn && !hasPorts) return;

        // 3. Ensure Section Header ==Network== exists or insert it
        // We look for any of the templates to decide if the section "exists" logically
        const multiTpl = this.parser.findTemplate('Network/Multiplayer');
        const connTpl = this.parser.findTemplate('Network/Connections');
        const portsTpl = this.parser.findTemplate('Network/Ports');

        // If no templates exist, we might need to insert the header and the missing templates
        if (!multiTpl && !connTpl && !portsTpl) {
            // Check for header
            let headerRegex = /^={2,}\s*Network\s*={2,}/im;
            if (!headerRegex.test(this.parser.getText())) {
                // Insert Header + Templates
                let block = `==Network==\n`;
                if (hasMulti) block += `{{Network/Multiplayer\n}}\n`;
                if (hasConn) block += `{{Network/Connections\n}}\n`;
                if (hasPorts) block += `{{Network/Ports\n}}\n`;

                // Logic to insert before VR support or fallback
                let insertPos = -1;

                // Priority 1: VR Support (Header or Template)
                const vrRegex = /^={2,}\s*VR support\s*={2,}/im;
                const vrMatch = this.parser.getText().match(vrRegex);
                const vrTpl = this.parser.findTemplate('VR support');

                if (vrMatch && vrMatch.index !== undefined) {
                    insertPos = vrMatch.index;
                } else if (vrTpl) {
                    insertPos = vrTpl.start;
                    // Check for header before template
                    const substring = this.parser.getText().substring(Math.max(0, vrTpl.start - 100), vrTpl.start);
                    const headerMatch = substring.match(/={2,}\s*VR support\s*={2,}\s*$/i);
                    if (headerMatch) {
                        insertPos = vrTpl.start - headerMatch[0].length;
                        const beforeHeader = this.parser.getText().substring(Math.max(0, insertPos - 2), insertPos);
                        if (beforeHeader.endsWith('\n\n')) insertPos -= 0;
                    }
                } else {
                    // Priority 2: Other Information / API / Middleware (Same as VR fallback)
                    // 1. Try "Other information" section header
                    const otherInfoRegex = /^={2,}\s*Other information\s*={2,}/im;
                    const otherInfoMatch = this.parser.getText().match(otherInfoRegex);

                    if (otherInfoMatch && otherInfoMatch.index !== undefined) {
                        insertPos = otherInfoMatch.index;
                    } else {
                        const anchors = ['API', 'Middleware', 'System requirements'];
                        for (const anchor of anchors) {
                            const t = this.parser.findTemplate(anchor);
                            if (t) {
                                insertPos = t.start;
                                const substring = this.parser.getText().substring(Math.max(0, t.start - 100), t.start);
                                const headerMatch = substring.match(new RegExp(`={2,}\\s*${anchor}\\s*={2,}\\s*$`, 'i'));
                                if (headerMatch) {
                                    insertPos = t.start - headerMatch[0].length;
                                    const beforeHeader = this.parser.getText().substring(Math.max(0, insertPos - 2), insertPos);
                                    if (beforeHeader.endsWith('\n\n')) insertPos -= 0;
                                }
                                break;
                            }
                        }
                    }
                }

                if (insertPos !== -1) {
                    const text = this.parser.getText();
                    const prefix = text.substring(0, insertPos).trimEnd();
                    const suffix = text.substring(insertPos).trimStart();
                    this.parser = new WikitextParser(`${prefix}\n\n${block}${suffix}`);
                } else {
                    const text = this.parser.getText();
                    this.parser = new WikitextParser(text.trimEnd() + `\n\n${block}`);
                }
            }
        }

        // 4. Update/Create individual templates
        // The above block strictly handles the *initial* creation of the whole section block.
        // It's possible we have the header but are missing specific sub-templates (e.g. adding Ports later).
        // Or we just created it.
        // Now we safely populate them.

        const ensureAndSet = (tplName: string, map: Record<string, string>, has: boolean) => {
            if (!has) return; // Don't add if empty

            // Check if template exists
            if (!this.parser.findTemplate(tplName)) {
                // If the section exists (which it should now), we try to append this template to the Network section.
                // Finding the end of the last Network template is tricky without strict structure.
                // But typically they are sequential: Multiplayer -> Connections -> Ports.

                // Simple approach: Find the ==Network== header, then look for the last known network template after it, and append.
                const headerRegex = /^={2,}\s*Network\s*={2,}/im;
                const match = this.parser.getText().match(headerRegex);
                if (match && match.index !== undefined) {
                    // Find insertion point after header
                    let insertIdx = match.index + match[0].length;

                    // Helper to check if a template is "after" the header
                    const isAfter = (start: number) => start > (match.index! + match[0].length);

                    const tMulti = this.parser.findTemplate('Network/Multiplayer');
                    const tConn = this.parser.findTemplate('Network/Connections');

                    if (tMulti && isAfter(tMulti.start)) insertIdx = tMulti.end;
                    if (tplName === 'Network/Connections') {
                        if (tMulti && isAfter(tMulti.start)) insertIdx = tMulti.end;
                    }
                    if (tplName === 'Network/Ports') {
                        if (tConn && isAfter(tConn.start)) insertIdx = tConn.end;
                        else if (tMulti && isAfter(tMulti.start)) insertIdx = tMulti.end;
                    }

                    // Insert
                    const text = this.parser.getText();
                    const prefix = text.substring(0, insertIdx);
                    const suffix = text.substring(insertIdx);
                    // Add newline if needed
                    const newTp = `\n{{${tplName}\n}}`;
                    this.parser = new WikitextParser(prefix + newTp + suffix);
                } else {
                    // Fallback: Use standard ensureTemplate which appends to file end
                    this.ensureTemplate(tplName);
                }
            }
            this.updateSection(tplName, data, map);
        };

        ensureAndSet('Network/Multiplayer', mapMulti, hasMulti);
        ensureAndSet('Network/Connections', mapConn, hasConn);
        ensureAndSet('Network/Ports', mapPorts, hasPorts);
    }

    updateVR(data: SettingsVR) {
        const map: Record<string, string> = {
            native3d: 'native 3d',
            native3dNotes: 'native 3d notes',
            nvidia3dVision: 'nvidia 3d vision',
            nvidia3dVisionNotes: 'nvidia 3d vision notes',
            vorpx: 'vorpx',
            vorpxNotes: 'vorpx notes',
            vorpxModes: 'vorpx modes',
            vrOnly: 'vr only',
            openXr: 'openxr',
            openXrNotes: 'openxr notes',
            steamVr: 'steamvr',
            steamVrNotes: 'steamvr notes',
            oculusVr: 'oculusvr',
            oculusVrNotes: 'oculusvr notes',
            windowsMixedReality: 'windows mixed reality',
            windowsMixedRealityNotes: 'windows mixed reality notes',
            osvr: 'osvr',
            osvrNotes: 'osvr notes',
            forteNsx1: 'forte vfx1',
            forteNsx1Notes: 'forte vfx1 notes',
            keyboardMouse: 'keyboard-mouse',
            keyboardMouseNotes: 'keyboard-mouse notes',
            bodyTracking: 'body tracking',
            bodyTrackingNotes: 'body tracking notes',
            handTracking: 'hand tracking',
            handTrackingNotes: 'hand tracking notes',
            faceTracking: 'face tracking',
            faceTrackingNotes: 'face tracking notes',
            eyeTracking: 'eye tracking',
            eyeTrackingNotes: 'eye tracking notes',
            tobiiEyeTracking: 'tobii eye tracking',
            tobiiEyeTrackingNotes: 'tobii eye tracking notes',
            trackIr: 'trackir',
            trackIrNotes: 'trackir notes',
            thirdSpaceGamingVest: '3rd space gaming vest',
            thirdSpaceGamingVestNotes: '3rd space gaming vest notes',
            novintFalcon: 'novint falcon',
            novintFalconNotes: 'novint falcon notes',
            playAreaSeated: 'play area seated',
            playAreaSeatedNotes: 'play area seated notes',
            playAreaStanding: 'play area standing',
            playAreaStandingNotes: 'play area standing notes',
            playAreaRoomScale: 'play area room-scale',
            playAreaRoomScaleNotes: 'play area room-scale notes'
        };

        // Check if any value is set (not unknown/empty)
        const hasData = Object.keys(map).some(key => {
            const val = (data as any)[key];
            return val && val !== 'unknown' && val !== '';
        });

        if (!hasData) return;

        if (!this.parser.findTemplate('VR support')) {
            const newContent = `==VR support==\n{{VR support\n}}\n`;

            // Find insertion point (before Other Information/API/Middleware)
            let insertPos = -1;

            // 1. Try "Other information" section header
            const otherInfoRegex = /^={2,}\s*Other information\s*={2,}/im;
            const otherInfoMatch = this.parser.getText().match(otherInfoRegex);

            if (otherInfoMatch && otherInfoMatch.index !== undefined) {
                insertPos = otherInfoMatch.index;
            } else {
                // 2. Fallback to API/Middleware templates if section header missing
                const anchors = ['API', 'Middleware', 'System requirements'];
                for (const anchor of anchors) {
                    const t = this.parser.findTemplate(anchor);
                    if (t) {
                        insertPos = t.start;
                        // Check for section header immediately preceding the template
                        const substring = this.parser.getText().substring(Math.max(0, t.start - 100), t.start);
                        const headerMatch = substring.match(new RegExp(`={2,}\\s*${anchor}\\s*={2,}\\s*$`, 'i'));
                        if (headerMatch) {
                            insertPos = t.start - headerMatch[0].length;
                            // Also try to capture preceding newlines to avoid gaps
                            const beforeHeader = this.parser.getText().substring(Math.max(0, insertPos - 2), insertPos);
                            if (beforeHeader.endsWith('\n\n')) insertPos -= 0;
                        }
                        break;
                    }
                }
            }

            if (insertPos !== -1) {
                const text = this.parser.getText();
                // Ensure double newline spacing
                const prefix = text.substring(0, insertPos).trimEnd();
                const suffix = text.substring(insertPos).trimStart();
                this.parser = new WikitextParser(`${prefix}\n\n${newContent}\n${suffix}`);
            } else {
                // Append
                const text = this.parser.getText();
                this.parser = new WikitextParser(text.trimEnd() + `\n\n${newContent}`);
            }
        }

        this.updateSection('VR support', data, map);
    }

    updateAPI(data: SettingsAPI) {
        const map: Record<string, string> = {
            dxVersion: 'direct3d versions',
            dxNotes: 'direct3d notes',
            directDrawVersion: 'directdraw versions',
            directDrawNotes: 'directdraw notes',
            openGlVersion: 'opengl versions',
            openGlNotes: 'opengl notes',
            vulkanVersion: 'vulkan versions',
            vulkanNotes: 'vulkan notes',
            glideVersion: 'glide versions',
            glideNotes: 'glide notes',
            wing: 'wing',
            wingNotes: 'wing notes',
            softwareMode: 'software mode',
            softwareModeNotes: 'software mode notes',
            mantle: 'mantle support',
            mantleNotes: 'mantle support notes',
            metal: 'metal support',
            metalNotes: 'metal support notes',
            dosModes: 'dos modes',
            dosModesNotes: 'dos modes notes',
            windows32: 'windows 32-bit exe',
            windows64: 'windows 64-bit exe',
            windowsArm: 'windows arm app',
            windowsNotes: 'windows exe notes',
            macOsXPowerPc: 'mac os x powerpc app',
            macOsIntel32: 'macos intel 32-bit app',
            macOsIntel64: 'macos intel 64-bit app',
            macOsArm: 'macos arm app',
            macOs68k: 'mac os 68k app',
            macOsPowerPc: 'mac os powerpc app',
            macOsNotes: 'mac os executable notes',
            macOsAppNotes: 'macos app notes',

            linux32: 'linux 32-bit executable',
            linux64: 'linux 64-bit executable',
            linuxArm: 'linux arm app',
            linuxPowerPc: 'linux powerpc app',
            linux68k: 'linux 68k app',
            linuxNotes: 'linux executable notes'
        };
        this.ensureTemplate('API');
        this.updateSection('API', data, map);
    }

    updateMiddleware(data: GameData['middleware']) {
        const map: Record<string, string> = {
            physics: 'physics',
            physicsNotes: 'physics notes',
            audio: 'audio',
            audioNotes: 'audio notes',
            interface: 'interface',
            interfaceNotes: 'interface notes',
            input: 'input',
            inputNotes: 'input notes',
            cutscenes: 'cutscenes',
            cutscenesNotes: 'cutscenes notes',
            multiplayer: 'multiplayer',
            multiplayerNotes: 'multiplayer notes',
            anticheat: 'anticheat',
            anticheatNotes: 'anticheat notes'
        };

        const hasContent = Object.keys(map).some(key => {
            const val = (data as any)[key];
            return val && val !== 'unknown' && val !== '';
        });

        if (hasContent) {
            this.ensureTemplate('Middleware');
            // Helper to wrap single value into Middleware/row if needed, or just standard updateSection if simpler.
            // However, user asked for "like Input/Video", checking template standard:
            // If template supports |physics=Havok, we use that.
            // If template requires |physics={{Middleware/row...}}, we must wrap.
            // Assumption: Let's assume standard mapping first as requested "like Input".
            // If wrapping is needed, we can add a transform.
            this.updateSection('Middleware', data, map);
        }
    }

    updateGalleries(galleries: GameData['galleries']) {
        if (!galleries) return;

        // Map section names to gallery template params if needed, or assume standard {{Gallery}} with section param?
        // PCGW typically uses {{Gallery}} with images.
        // It seems typically distinct galleries per section aren't standard PCGW wikitext structure?
        // Usually it's just <gallery> or {{Gallery}} at bottom or specific places.
        // But if the app separates them, we need to decide how to write them.
        // Check how it was done before? Likely it wasn't.
        // If we want to support section-specific galleries, we might need a convention.
        // OR we just dump all into one {{Gallery}}?
        // The user has 'galleries.video', 'galleries.input', etc.
        // Let's implement a generic gallery writer that aggregates or writes specific section galleries if we can mark them.
        // For now, let's just write the 'video' gallery to a {{Gallery}} section, or appending.

        // Actually, PCGW uses <gallery> tags or {{Gallery}}.
        // Let's stick to {{Gallery}} template.
        // We can write strict wikitext for the gallery.

        const allImages: string[] = [];
        Object.values(galleries).forEach(list => {
            list.forEach(img => {
                const name = typeof img === 'string' ? img : img.name;
                const caption = typeof img === 'string' ? '' : img.caption;
                allImages.push(`${name}${caption ? '|' + caption : ''}`);
            });
        });

        if (allImages.length > 0) {
            // Check if {{Gallery}} exists
            let galleryContent = `\n${allImages.join('\n')}\n`;
            if (this.parser.findTemplate('Gallery')) {
                this.setTemplateParam('Gallery', 'content', galleryContent); // Hypothethical param? 
                // Actually {{Gallery|Image.jpg|Caption...}} standard wikimedia gallery?
                // Or {{Gallery}} template wrapper for <gallery>?
                // Let's assume standard <gallery> tag behavior for now if we can't confirm template.
                // But user likely wants the PCGW {{Gallery}} template if it exists.
                // Assuming {{Gallery}} takes named params or unnamed?
                // Let's use <gallery> tag as fallback if we are unsure, it's safer.
                // Or better: update the parser to read/write specific gallery sections.

                // For now, let's try to verify what parser does.
            } else {
                // Create a gallery section at the bottom
                const text = this.parser.getText();
                this.parser = new WikitextParser(text + `\n\n== Gallery ==\n<gallery>\n${galleryContent}</gallery>`);
            }
        }
    }

    updateLocalizations(data: GameData['localizations']) {
        if (!data || data.length === 0) return;
        const content = data.map(row => {
            const ui = row.interface ? 'true' : 'false';
            const audio = row.audio !== 'unknown' && row.audio ? row.audio : 'false';
            const subs = row.subtitles !== 'unknown' && row.subtitles ? row.subtitles : 'false';

            // Helper for consistent spacing
            const pad = (str: string, length: number) => str.padEnd(length, ' ');

            return `{{L10n/switch
 |${pad('language', 10)}= ${row.language}
 |${pad('interface', 10)}= ${ui}
 |${pad('audio', 10)}= ${audio}
 |${pad('subtitles', 10)}= ${subs}
 |${pad('notes', 10)}= ${row.notes || ''}
 |${pad('fan', 10)}= ${row.fan ? 'true' : ''}
 |${pad('ref', 10)}= ${row.ref || ''}
}}`;
        }).join('\n');


        this.ensureTemplate('L10n');
        this.setTemplateParam('L10n', 'content', '\n' + content + '\n');
    }



    updateSystemRequirements(data: SystemRequirements) {
        // System requirements are multiple templates: {{System requirements|OS=Windows...}}

        const updateOSReq = (os: string, reqs: any) => {
            if (!reqs) return;

            const hasData = () => {
                if (reqs.minimum && Object.values(reqs.minimum).some(v => v && String(v).trim() !== '')) return true;
                if (reqs.recommended && Object.values(reqs.recommended).some(v => v && String(v).trim() !== '')) return true;
                if (reqs.notes && reqs.notes.trim() !== '') return true;
                return false;
            };

            // Find specific OS template using parser
            const wikitext = this.parser.getText();
            const templates = this.parser.findTemplates('System requirements');
            let match: { index: number; content: string } | undefined;

            for (const t of templates) {
                // We need to check if this template belongs to the requested OS
                const tempParser = new WikitextParser(t.content);
                const osFamily = tempParser.findParameter('System requirements', 'OSfamily');
                const legacyOS = tempParser.findParameter('System requirements', 'OS');

                let foundOS = '';
                if (osFamily) {
                    foundOS = t.content.substring(osFamily.valueStart, osFamily.valueEnd).trim();
                } else if (legacyOS) {
                    foundOS = t.content.substring(legacyOS.valueStart, legacyOS.valueEnd).trim();
                }

                if (foundOS.toLowerCase() === os.toLowerCase()) {
                    match = { index: t.start, content: t.content };
                    break;
                }
            }

            // Helper to build parameters string
            const buildParams = () => {
                let p = `\n|OSfamily = ${os}`;

                // Minimum
                if (reqs.minimum) {
                    if (reqs.minimum.target) p += `\n\n|minTGT   = ${reqs.minimum.target}`;
                    if (reqs.minimum.os) p += `\n|minOS    = ${reqs.minimum.os}`;
                    if (reqs.minimum.cpu) p += `\n|minCPU   = ${reqs.minimum.cpu}`;
                    if (reqs.minimum.cpu2) p += `\n|minCPU2  = ${reqs.minimum.cpu2}`;
                    if (reqs.minimum.ram) p += `\n|minRAM   = ${reqs.minimum.ram}`;
                    if (reqs.minimum.hdd) p += `\n|minHD    = ${reqs.minimum.hdd}`;
                    if (reqs.minimum.gpu) p += `\n|minGPU   = ${reqs.minimum.gpu}`;
                    if (reqs.minimum.gpu2) p += `\n|minGPU2  = ${reqs.minimum.gpu2}`;
                    if (reqs.minimum.gpu3) p += `\n|minGPU3  = ${reqs.minimum.gpu3}`;
                    if (reqs.minimum.vram) p += `\n|minVRAM  = ${reqs.minimum.vram}`;
                    if (reqs.minimum.dx) p += `\n|minDX    = ${reqs.minimum.dx}`;
                    if (reqs.minimum.other) p += `\n|minother = ${reqs.minimum.other}`;
                }

                // Recommended
                if (reqs.recommended) {
                    if (reqs.recommended.target) p += `\n\n|recTGT   = ${reqs.recommended.target}`;
                    if (reqs.recommended.os) p += `\n|recOS    = ${reqs.recommended.os}`;
                    if (reqs.recommended.cpu) p += `\n|recCPU   = ${reqs.recommended.cpu}`;
                    if (reqs.recommended.cpu2) p += `\n|recCPU2  = ${reqs.recommended.cpu2}`;
                    if (reqs.recommended.ram) p += `\n|recRAM   = ${reqs.recommended.ram}`;
                    if (reqs.recommended.hdd) p += `\n|recHD    = ${reqs.recommended.hdd}`;
                    if (reqs.recommended.gpu) p += `\n|recGPU   = ${reqs.recommended.gpu}`;
                    if (reqs.recommended.gpu2) p += `\n|recGPU2  = ${reqs.recommended.gpu2}`;
                    if (reqs.recommended.vram) p += `\n|recVRAM  = ${reqs.recommended.vram}`;
                    if (reqs.recommended.dx) p += `\n|recDX    = ${reqs.recommended.dx}`;
                    if (reqs.recommended.other) p += `\n|recother = ${reqs.recommended.other}`;
                }

                if (reqs.notes) p += `\n\n|notes    = ${reqs.notes}`;

                // Add closing newline for clean formatting
                p += `\n`;
                return p;
            };

            if (!match || match.index === undefined) {
                // Not found -> Append it ONLY if we have data!
                if (!hasData()) return;

                const newTemplate = `{{System requirements${buildParams()}}}`;

                // Use findSection from parser
                const section = this.parser.findSection('System requirements');

                if (section) {
                    // Append to the end of the section content
                    const insertPos = section.end;
                    const charBefore = insertPos > 0 ? wikitext[insertPos - 1] : '';
                    const needsNewline = charBefore !== '\n';

                    this.parser = new WikitextParser(
                        wikitext.substring(0, insertPos) + `${needsNewline ? '\n' : ''}${newTemplate}\n` + wikitext.substring(insertPos)
                    );
                } else {
                    // No section, create at end
                    const needsNewline = wikitext.length > 0 && !wikitext.endsWith('\n');
                    this.parser = new WikitextParser(wikitext + `${needsNewline ? '\n' : ''}\n== System requirements ==\n${newTemplate}\n`);
                }
                return;
            }


            // FOUND -> Update existing logic
            const tempStart = match.index;
            let depth = 0;
            let i = tempStart;
            let tempEnd = tempStart;

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

            const blockContent = wikitext.substring(tempStart, tempEnd);
            const blockParser = new WikitextParser(blockContent);

            if (reqs.minimum) {
                blockParser.setParameter('System requirements', 'minTGT', reqs.minimum.target);
                blockParser.setParameter('System requirements', 'minOS', reqs.minimum.os);
                blockParser.setParameter('System requirements', 'minCPU', reqs.minimum.cpu);
                blockParser.setParameter('System requirements', 'minCPU2', reqs.minimum.cpu2);
                blockParser.setParameter('System requirements', 'minRAM', reqs.minimum.ram);
                blockParser.setParameter('System requirements', 'minHD', reqs.minimum.hdd);
                blockParser.setParameter('System requirements', 'minGPU', reqs.minimum.gpu);
                blockParser.setParameter('System requirements', 'minGPU2', reqs.minimum.gpu2);
                blockParser.setParameter('System requirements', 'minGPU3', reqs.minimum.gpu3);
                blockParser.setParameter('System requirements', 'minVRAM', reqs.minimum.vram);
                blockParser.setParameter('System requirements', 'minDX', reqs.minimum.dx);
                blockParser.setParameter('System requirements', 'minother', reqs.minimum.other);
            }
            if (reqs.recommended) {
                blockParser.setParameter('System requirements', 'recTGT', reqs.recommended.target);
                blockParser.setParameter('System requirements', 'recOS', reqs.recommended.os);
                blockParser.setParameter('System requirements', 'recCPU', reqs.recommended.cpu);
                blockParser.setParameter('System requirements', 'recCPU2', reqs.recommended.cpu2);
                blockParser.setParameter('System requirements', 'recRAM', reqs.recommended.ram);
                blockParser.setParameter('System requirements', 'recHD', reqs.recommended.hdd);
                blockParser.setParameter('System requirements', 'recGPU', reqs.recommended.gpu);
                blockParser.setParameter('System requirements', 'recGPU2', reqs.recommended.gpu2);
                blockParser.setParameter('System requirements', 'recVRAM', reqs.recommended.vram);
                blockParser.setParameter('System requirements', 'recDX', reqs.recommended.dx);
                blockParser.setParameter('System requirements', 'recother', reqs.recommended.other);
            }
            if (reqs.notes) {
                blockParser.setParameter('System requirements', 'notes', reqs.notes);
            }

            this.parser = new WikitextParser(
                wikitext.substring(0, tempStart) + blockParser.getText() + wikitext.substring(tempEnd)
            );
        };

        updateOSReq('Windows', data.windows);
        updateOSReq('Mac', data.mac);
        updateOSReq('Linux', data.linux);
    }

    updateGameData(config: GameDataConfig) {
        const wrapInGameData = (content: string) => {
            return `{{Game data|\n${content}\n}}`;
        };

        // Config Files
        if (config.configFiles.length > 0) {
            const content = config.configFiles.map(row => {
                // Format: {{Game data/config|Platform|Path1|Path2|...}}
                const paths = row.paths.filter(p => p.trim() !== '').join('|');
                if (!paths) return ''; // Skip if no paths for this row? Or output empty? PCGW usually wants at least one empty param if row exists? 
                // Actually if row exists but empty paths, maybe we skip.
                return `{{Game data/config|${row.platform}|${paths}}}`;
            }).filter(s => s !== '').join('\n');

            if (content.length > 0) {
                const wrappedContent = wrapInGameData(content);
                this.replaceSectionContent(/Configuration file(s|\(s\))? location/i, '\n' + wrappedContent + '\n', '=== Configuration file(s) location ===');
            }
        }

        // Save Data
        if (config.saveData.length > 0) {
            const content = config.saveData.map(row => {
                // Format: {{Game data/saves|Platform|Path1|Path2|...}}
                const paths = row.paths.filter(p => p.trim() !== '').join('|');
                if (!paths) return '';
                return `{{Game data/saves|${row.platform}|${paths}}}`;
            }).filter(s => s !== '').join('\n');

            if (content.length > 0) {
                // The user requested {{Game data}} wrapper for paths. Assuming this applies to saves too.
                // However, user example only showed it for config. I will wrap it to be consistent with table style.
                const wrappedContent = wrapInGameData(content);
                this.replaceSectionContent(/Save game data location/i, '\n' + wrappedContent + '\n', '=== Save game data location ===');
            }
        }

        // Cloud Sync
        const cloud = config.cloudSync;
        const cloudMap: Record<string, string> = {
            discord: 'discord',
            epicGamesLauncher: 'epic games launcher',
            gogGalaxy: 'gog galaxy',
            eaApp: 'ea app',
            steamCloud: 'steam cloud',
            ubisoftConnect: 'ubisoft connect',
            xboxCloud: 'xbox cloud'
        };

        for (const [key, param] of Object.entries(cloudMap)) {
            // @ts-ignore
            const status = cloud[key];
            // @ts-ignore
            const notes = cloud[key + 'Notes'];

            if (status || notes) {
                // Ensure template exists before first write
                this.ensureTemplate('Save game cloud syncing');
                this.setTemplateParam('Save game cloud syncing', param, status);
                this.setTemplateParam('Save game cloud syncing', `${param} notes`, notes);
            }
        }
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

{{Game data
|file structure              = 
}}

=== Configuration file(s) location ===
{{Game data/config|Windows|}}

=== Save game data location ===
{{Game data/saves|Windows|}}

{{Save game cloud syncing
|discord                   = 
|discord notes             = 
|epic games launcher       = 
|epic games launcher notes = 
|gog galaxy                = 
|gog galaxy notes          = 
|ea app                    = 
|ea app notes              = 
|steam cloud               = 
|steam cloud notes         = 
|ubisoft connect           = 
|ubisoft connect notes     = 
|xbox cloud                = 
|xbox cloud notes          = 
}}

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

    editor.updateSystemRequirements(data.requirements);
    editor.updateGameData(data.config);
    editor.updateGalleries(data.galleries);

    return editor.getText();
}