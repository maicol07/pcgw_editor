import iconTcTrue from '../assets/icons/tc-true.svg';
import iconTcFalse from '../assets/icons/tc-false.svg';
import iconTcUnknown from '../assets/icons/tc-unknown.svg';
import iconTcHackable from '../assets/icons/tc-hackable.svg';
import iconTcNa from '../assets/icons/tc-not-applicable.svg';
import iconBulletDocument from '../assets/icons/bullet-document.svg';
import iconDrmLimit from '../assets/icons/drm-install-limit.png';

// Fallback Icons
const iconTcLimited = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 250 250'%3E%3Ccircle cx='125' cy='125' r='121' fill='%231db288'/%3E%3Cpath fill='%23fff' d='m121,189c-4,5-7,8.5-14,8.5-14,0-61-51-63-57-2,-6 4,-10 8-12 9-5 17.5,1 23,7.5 25.5,33 34,13.5 51-11l41.5-61c5.5-7.5 13,-11.5 22.5-5 7.5,5.5 6,12 2,18.5z'/%3E%3Cpath style='fill:%23ffffff;stroke:%23f89842;stroke-width:8.22652245' d='m 116.89174,180.43528 8.9032,-27.4839 c 20.516,7.2261 35.4192,13.4841 44.7096,18.7742 -2.4517,-23.3545 -3.742,-39.419 -3.871,-48.1935 h 28.0645 c -0.3872,12.7745 -1.8711,28.7744 -4.4516,48 13.2902,-6.7095 28.516,-12.903 45.6773,-18.5807 l 8.9033,27.4839 c -16.3872,5.4195 -32.4517,9.0324 -48.1935,10.8387 7.8708,6.8389 18.9676,19.0324 33.2903,36.5806 l -23.2258,16.4515 c -7.484,-10.1933 -16.3227,-24.0642 -26.5161,-41.6128 -9.5484,18.1937 -17.9355,32.0647 -25.1613,41.6128 l -22.8386,-16.4515 c 14.9676,-18.4514 25.6773,-30.6449 32.129,-36.5806 -16.6452,-3.2256 -32.4516,-6.8385 -47.4193,-10.8387 z'/%3E%3C/svg%3E";
const iconTcAlwaysOn = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 250 250'%3E%3Ccircle cx='125' cy='125' r='121' fill='%23a0a11c'/%3E%3Crect ry='35.501' rx='35.501' height='106.501' width='71.001' y='62.874' x='89.499' fill='none' stroke='%23fff' stroke-width='17.75'/%3E%3Crect ry='8.875' rx='8.875' height='88.751' width='106.501' y='107.25' x='71.749' fill='%23fff'/%3E%3C/svg%3E";

export const renderWikitextToHtml = (wikitext: string, title: string = 'Preview'): string => {
    try {
        let bodyText = wikitext;
        let html = '';

        // ============================================
        // Helpers
        // ============================================
        const splitArgs = (text: string): string[] => {
            const args: string[] = [];
            let current = '';
            let depth = 0;
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                if (char === '{' && text[i + 1] === '{') {
                    depth++;
                    current += char;
                    current += text[++i];
                } else if (char === '}' && text[i + 1] === '}') {
                    depth--;
                    current += char;
                    current += text[++i];
                } else if (char === '[' && text[i + 1] === '[') {
                    depth++;
                    current += char;
                    current += text[++i];
                } else if (char === ']' && text[i + 1] === ']') {
                    depth--;
                    current += char;
                    current += text[++i];
                } else if (char === '|' && depth === 0) {
                    args.push(current);
                    current = '';
                } else {
                    current += char;
                }
            }
            args.push(current);
            return args;
        };

        const findBalancedTemplate = (text: string, templateName: string): { start: number, end: number, content: string }[] => {
            const result: { start: number, end: number, content: string }[] = [];
            const pattern = `{{${templateName}`;
            let startIndex = text.indexOf(pattern);

            while (startIndex !== -1) {
                let depth = 0;
                let endIndex = -1;
                for (let i = startIndex; i < text.length; i++) {
                    if (text[i] === '{' && text[i + 1] === '{') {
                        depth++;
                        i++;
                    } else if (text[i] === '}' && text[i + 1] === '}') {
                        depth--;
                        i++;
                        if (depth === 0) {
                            endIndex = i + 1;
                            break;
                        }
                    }
                }
                if (endIndex !== -1) {
                    result.push({ start: startIndex, end: endIndex, content: text.substring(startIndex, endIndex) });
                    startIndex = text.indexOf(pattern, endIndex);
                } else {
                    break;
                }
            }
            return result;
        };

        const parseTemplate = (tagName: string, text: string): Record<string, string> | null => {
            const templates = findBalancedTemplate(text, tagName);
            if (templates.length === 0) return null;

            const content = templates[0].content.slice(tagName.length + 2, -2);
            const result: Record<string, string> = {};
            const args = splitArgs(content);

            args.forEach(arg => {
                const eqIndex = arg.indexOf('=');
                if (eqIndex > -1) {
                    const key = arg.substring(0, eqIndex).trim().toLowerCase();
                    const val = arg.substring(eqIndex + 1).trim();
                    result[key] = val;
                }
            });
            return result;
        };

        // ============================================
        // Pre-processing
        // ============================================

        // {{cn}} -> [citation needed]
        bodyText = bodyText.replace(/{{cn\|.*?}}/gi, '<sup>[citation needed]</sup>');

        // References <ref>
        const refs: string[] = [];
        bodyText = bodyText.replace(/<ref(?:\s+name="([^"]+)")?>([\s\S]*?)<\/ref>/gi, (_match, _name, content) => {
            refs.push(content);
            const num = refs.length;
            return `<sup class="reference" id="cite_ref-${num}"><a href="#cite_note-${num}">[${num}]</a></sup>`;
        });

        // Icons
        // Wrap lines that start with an icon template so they form distinct lines like list items,
        // ensuring the text and icon stay together but each starts on a new line.
        bodyText = bodyText.replace(/^[ \t]*({{\s*(?:ii|--|\+\+|mm)(?:\|[^}]+)?}}.*?)$/gmi, '<div style="display: block; margin-bottom: 2px;">$1</div>');
        bodyText = bodyText.replace(/{{\s*--\s*}}/g, '<span title="Disadvantage" class="svg-icon svg-16 thumbs-down" style="vertical-align: -3px; margin-right: 4px;"></span>');
        bodyText = bodyText.replace(/{{\s*\+\+\s*}}/g, '<span title="Advantage" class="svg-icon svg-16 thumbs-up" style="vertical-align: -3px; margin-right: 4px;"></span>');
        bodyText = bodyText.replace(/{{mm}}/gi, `<img src="${iconBulletDocument}" alt="mm" class="inline-icon" style="display: inline-block; vertical-align: baseline;" width="12" height="12">`);
        bodyText = bodyText.replace(/{{ii\|?(.*?)}}/gi, (_match, content) => {
            const titleAttr = content ? ` title="${content.replace(/"/g, '&quot;')}"` : '';
            return `<span class="svg-icon svg-16 info-icon"${titleAttr} style="vertical-align: -3px; margin-right: 4px;"></span>`;
        });

        const renderDrmIcon = (argRaw: string) => {
            const arg = argRaw.toLowerCase().trim();
            if (arg === 'epic games store') {
                return `<div class="svg-25 svg-icon store-epicgames"><a href="/wiki/Epic_Games_Store" title="Epic Games Launcher"></a></div>`;
            } else if (arg === 'activation limit') {
                return `<a href="/wiki/Digital_rights_management_(DRM)#Activation_limit" title="Can only be used x times" style="margin-right:2px; vertical-align:middle; display:inline-block;"><img alt="Can only be used x times" src="${iconDrmLimit}" width="25" height="25"></a>`;
            } else if (arg === 'steam') {
                return `<div class="svg-25 svg-icon store-steam" style="margin-right:2px; vertical-align:middle; display:inline-block;"><a href="/wiki/Steam" title="Steam"></a></div>`;
            } else if (arg === 'macapp' || arg === 'mac app store') {
                return `<div class="svg-25 svg-icon store-mas" style="margin-right:2px; vertical-align:middle; display:inline-block;"><a href="/wiki/Mac_App_Store" title="Mac App Store"></a></div>`;
            } else if (arg === 'microsoft store' || arg === 'windows store') {
                return `<div class="svg-25 svg-icon store-microsoft" style="margin-right:2px; vertical-align:middle; display:inline-block;"><a href="/wiki/Store:Microsoft_Store" title="Microsoft Store"></a></div>`;
            } else if (argRaw.trim()) {
                return `<span title="DRM: ${argRaw.trim()}" class="font-bold" style="margin-right:4px; vertical-align:middle;">${argRaw.trim()}</span>`;
            }
            return '';
        };

        // DRM generic parser
        bodyText = bodyText.replace(/{{\s*DRM\s*\|([^}]+)}}/gi, (_match, argsString) => {
            return argsString.split('|').map((a: string) => renderDrmIcon(a)).join(' ');
        });

        // Refcheck
        bodyText = bodyText.replace(/{{Refcheck\|user=(.*?)\|date=(.*?)}}/gi, (_match, user, date) => {
            return `<span class="reference-text">Verified by <a href="https://www.pcgamingwiki.com/wiki/User:${user}" title="User:${user}">User:${user}</a> on ${date}</span>`;
        });

        // Refurl
        bodyText = bodyText.replace(/{{Refurl\|(.*?)}}/gi, (_match, content) => {
            const args = splitArgs(content);
            let url = '', title = '', date = '';
            args.forEach(a => {
                const parts = a.split('=');
                if (parts.length < 2) return;
                const k = parts[0].trim().toLowerCase();
                const v = parts.slice(1).join('=').trim();
                if (k === 'url') url = v;
                if (k === 'title') title = v;
                if (k === 'date') date = v;
            });
            return `<span class="reference-text"><a rel="nofollow" class="external text" href="${url}">${title || url}</a> - last accessed on ${date}</span>`;
        });

        // Store links
        bodyText = bodyText.replace(/{{\s*store\s+link\s*\|\s*([^|{}]+)\s*\|\s*([^|{}]+)(?:\|\s*([^|{}]+))?\s*}}/gi, (_match, storeRaw, idRaw, titleRaw) => {
            const store = storeRaw.trim().toLowerCase();
            const id = idRaw.trim();
            const titleText = titleRaw ? titleRaw.trim() : 'Store url';

            let url = '';
            if (store === 'steam') url = `https://store.steampowered.com/app/${id}/`;
            else if (store === 'epic games store') url = `https://store.epicgames.com/p/${id}?epic_affiliate=pcgamingwiki`;
            else if (store === 'gog.com' || store === 'gog') url = `https://www.gog.com/game/${id}`;
            else if (store === 'humble store') url = `https://www.humblebundle.com/store/${id}`;
            else if (store === 'microsoft store') url = `https://www.microsoft.com/p/${id}`;
            else if (store === 'xbox' || store === 'xbox store') url = `https://www.xbox.com/games/store/a/${id}`;
            else if (store === 'ea' || store === 'ea app' || store === 'origin') url = `https://www.ea.com/games/${id}`;
            else if (store === 'ubisoft store' || store === 'uplay') url = `https://store.ubisoft.com/game?pid=${id}`;
            else if (store === 'itch.io') {
                const parts = id.split('/');
                url = parts.length > 1 ? `https://${parts[0]}.itch.io/${parts[1]}` : `https://itch.io/game/${id}`;
            }
            else url = `https://pcgamingwiki.com/wiki/Store:${store}?id=${id}`;

            return `<a rel="nofollow" class="external text" href="${url}">${titleText}</a>`;
        });

        // ============================================
        // Sections & Templates
        // ============================================

        let noticesHtml = '';
        // {{stub}}
        const pageTitleForEdit = encodeURIComponent(title || 'Preview');
        bodyText = bodyText.replace(/{{\s*[Ss]tub\s*}}/g, () => {
            noticesHtml += `<div class="notice notice-stub" id="notice-stub" style="overflow: hidden; padding-right: 15px; width: auto; margin-left: 0;">
<div class="notice-icon svg-icon svg-35 notice-icon-stub"></div>
<div class="notice-text">This page is a <a href="/wiki/Category:Stubs" title="Category:Stubs">stub</a>: it lacks content and/or basic article components. You can help to <span class="plainlinks"><a rel="nofollow" class="external text" href="https://www.pcgamingwiki.com/w/index.php?title=${pageTitleForEdit}&amp;action=edit"><span style="">expand this page</span></a>
</span> by adding an image or additional information.</div>
</div>\n`;
            return '';
        });

        // 1. Infobox
        const infobox = parseTemplate('Infobox game', bodyText);
        if (infobox) {
            let rowsHtml = '';

            const infoboxTitle = title || 'Preview';

            // Clean up nested sub-templates like {{Infobox game/row/taxonomy/monetization | One-time game purchase }}
            const cleanValue = (val: string) => {
                if (!val) return '';
                return val.replace(/{{\s*Infobox\s+game\/row\/[^\/|]+\/[^|]+\|\s*([^|}]+)[^}]*}}/gi, '$1')
                    .replace(/{{\s*Infobox\s+game\/row\/[^|]+\|\s*([^|}]+)[^}]*}}/gi, '$1')
                    .trim();
            };

            const addSection = (headerName: string, fields: { key: string; label: string }[]) => {
                const activeFields = fields.filter(f => infobox[f.key] && cleanValue(infobox[f.key]));
                if (activeFields.length > 0) {
                    if (headerName) rowsHtml += `<tr><th class="template-infobox-header" colspan="2">${headerName}</th></tr>`;
                    activeFields.forEach(f => {
                        const typeLabel = f.label;
                        rowsHtml += `<tr>
                        <td class="template-infobox-type">${typeLabel}</td>
                        <td class="template-infobox-info">${cleanValue(infobox[f.key])}</td>
                    </tr>`;
                    });
                }
            };

            if (infobox['cover']) rowsHtml += `<tr><td class="template-infobox-cover" colspan="2"><b>Cover image:</b> ${cleanValue(infobox['cover'])}</td></tr>`;

            addSection('Developers', [{ key: 'developers', label: '' }, { key: 'mac os developers', label: 'macOS (OS X)' }, { key: 'linux developers', label: 'Linux' }]);
            addSection('Publishers', [{ key: 'publishers', label: '' }, { key: 'mac os publishers', label: 'macOS (OS X)' }, { key: 'linux publishers', label: 'Linux' }]);
            addSection('Engines', [{ key: 'engines', label: '' }]);
            addSection('Release dates', [{ key: 'windows', label: 'Windows' }, { key: 'mac os', label: 'macOS (OS X)' }, { key: 'linux', label: 'Linux' }]);
            addSection('Reception', [{ key: 'metacritic', label: 'Metacritic' }, { key: 'opencritic', label: 'OpenCritic' }, { key: 'igdb', label: 'IGDB' }, { key: 'howlongtobeat', label: 'HowLongToBeat' }]);
            addSection('Taxonomy', [{ key: 'monetization', label: 'Monetization' }, { key: 'microtransactions', label: 'Microtransactions' }, { key: 'modes', label: 'Modes' }, { key: 'pacing', label: 'Pacing' }, { key: 'perspectives', label: 'Perspectives' }, { key: 'controls', label: 'Controls' }, { key: 'genres', label: 'Genres' }, { key: 'vehicles', label: 'Vehicles' }, { key: 'art styles', label: 'Art styles' }, { key: 'themes', label: 'Themes' }, { key: 'series', label: 'Series' }]);

            const mappedKeys = new Set(['cover', 'developers', 'mac os developers', 'linux developers', 'publishers', 'mac os publishers', 'linux publishers', 'engines', 'windows', 'mac os', 'linux', 'metacritic', 'opencritic', 'igdb', 'howlongtobeat', 'monetization', 'microtransactions', 'modes', 'pacing', 'perspectives', 'controls', 'genres', 'vehicles', 'art styles', 'themes', 'series', 'bgg']);
            const unknownFields = Object.keys(infobox)
                .filter(k => !mappedKeys.has(k) && infobox[k].trim() !== '')
                .map(k => ({ key: k, label: k.charAt(0).toUpperCase() + k.slice(1) }));

            // Assert non-null for infobox to satisfy TS
            if (unknownFields.length > 0) {
                const activeUnknownFields = unknownFields.filter(f => infobox![f.key] && cleanValue(infobox![f.key]));
                if (activeUnknownFields.length > 0) addSection('Other', activeUnknownFields);
            }

            rowsHtml += `<tr><td class="template-infobox-icons" colspan="2"><span class="text-xs italic text-surface-400">Icons placeholder</span></td></tr>`;

            const infoHtml = `<table class="vertical-navbox template-infobox" id="infobox-game" style="font-size: 0.85em !important; position: relative; z-index: 10; width: 300px !important;">
            <caption class="template-infobox-title">${infoboxTitle}</caption>
            <tbody>${rowsHtml}</tbody>
        </table>`;

            const tpl = findBalancedTemplate(bodyText, 'Infobox game')[0];
            if (tpl) bodyText = bodyText.replace(tpl.content, '');
            html += infoHtml;
        }

        html = html + noticesHtml;

        // 2. Introduction
        const intro = parseTemplate('Introduction', bodyText);
        if (intro) {
            const tpl = findBalancedTemplate(bodyText, 'Introduction')[0];
            let iHtml = `<p>${intro['introduction'] || ''}</p>`;
            if (intro['release history']) iHtml += `<p><b>Release History:</b> ${intro['release history']}</p>`;
            if (intro['current state']) iHtml += `<p><b>Current State:</b> ${intro['current state']}</p>`;
            bodyText = bodyText.replace(tpl.content, iHtml);
        }

        // 3. Availability
        const availTemplates = findBalancedTemplate(bodyText, 'Availability');
        if (availTemplates.length > 0) {
            const tpl = availTemplates[0];
            const availabilityRows: string[] = [];
            let cursor = 0;
            while (true) {
                const tag = '{{Availability/row';
                const idx = tpl.content.indexOf(tag, cursor);
                if (idx === -1) break;

                let depth = 0;
                let end = -1;
                for (let i = idx; i < tpl.content.length; i++) {
                    if (tpl.content.substr(i, 2) === '{{') { depth++; i++; }
                    else if (tpl.content.substr(i, 2) === '}}') { depth--; i++; if (depth === 0) { end = i + 1; break; } }
                }
                if (end !== -1) {
                    const rowContent = tpl.content.substring(idx + tag.length, end - 2);
                    availabilityRows.push(rowContent);
                    cursor = end;
                } else { break; }
            }

            let tableHtml = `
         <div class="container-pcgwikitable">
          <table class="pcgwikitable sortable template-infotable jquery-tablesorter" id="table-availability">
             <thead><tr class="template-infotable-head table-availability-head-row">
                <th scope="col" style="width: 230px;" class="table-availability-head-source unsortable">Source</th>
                <th scope="col" style="width: 60px" class="unsortable table-availability-head-DRM"><abbr title="DRM required to play the game">DRM</abbr></th>
                <th scope="col" style="width: 390px;" class="unsortable table-availability-head-notes">Notes</th>
                <th scope="col" style="width: 50px;" class="unsortable table-availability-head-keys"><abbr title="Optional product keys for other services">Keys</abbr></th>
                <th scope="col" style="width: 90px;" class="table-availability-head-OS"><abbr title="Operating system(s)">OS</abbr></th>
             </tr></thead><tbody>
         `;
            availabilityRows.forEach(rowInner => {
                let processedInner = rowInner.trim();
                if (processedInner.startsWith('|')) processedInner = processedInner.substring(1);
                const args = splitArgs(processedInner).map(a => a.trim());
                const drmStr = args[2] || '';
                const drmHtml = drmStr.split(',').map(a => renderDrmIcon(a)).join(' ');
                tableHtml += `<tr class="template-infotable-body table-availability-body-row">
                    <th scope="row" class="table-availability-body-source">${args[0] || ''}</th>
                    <td class="table-availability-body-DRM">${drmHtml}</td>
                    <td class="table-availability-body-notes">${args[3] || ''}</td>
                    <td class="table-availability-body-keys">${args[4] || ''}</td>
                    <td class="table-availability-body-OS">${args[5] || ''}</td>
                 </tr>`;
            });
            tableHtml += '</tbody></table></div>';
            bodyText = bodyText.replace(tpl.content, tableHtml);
        }

        // 4. Game Data
        const gameDataTemplates = findBalancedTemplate(bodyText, 'Game data');
        gameDataTemplates.sort((a, b) => b.start - a.start);
        for (const tpl of gameDataTemplates) {
            const isConfig = tpl.content.includes('Game data/config');

            // Simple extraction of rows
            const rows: string[] = [];
            let cursor = 0;
            const subTag = isConfig ? '{{Game data/config' : '{{Game data/saves';
            while (true) {
                const idx = tpl.content.indexOf(subTag, cursor);
                if (idx === -1) break;
                const endIdx = tpl.content.indexOf('}}', idx);
                if (endIdx === -1) break;
                rows.push(tpl.content.substring(idx + subTag.length, endIdx));
                cursor = endIdx;
            }

            let tableRows = '';
            rows.forEach(r => {
                const parts = splitArgs(r.startsWith('|') ? r.substring(1) : r);
                tableRows += `<tr class="template-infotable-body table-gamedata-body-row">
                 <th scope="row" class="table-gamedata-body-system">${parts[0] || ''}</th>
                 <td class="table-gamedata-body-location">${parts[1] || ''}</td>
             </tr>`;
            });

            // Header removal handled by replacement: we reconstruct the whole block
            bodyText = bodyText.replace(tpl.content, `
        <div class="container-pcgwikitable">
            <table class="pcgwikitable template-infotable">
                <tr class="template-infotable-head"><th>System</th><th>Location</th></tr>
                ${tableRows}
            </table>
        </div>`);
        }

        // Cloud Sync
        const cloud = parseTemplate('Save game cloud syncing', bodyText);
        if (cloud) {
            // ... Logic for cloud sync icons ...
            const services = [
                { id: 'discord', label: 'Discord' },
                { id: 'epic games launcher', label: 'Epic Games Launcher' },
                { id: 'gog galaxy', label: 'GOG Galaxy' },
                { id: 'steam cloud', label: 'Steam Cloud' },
                { id: 'ubisoft connect', label: 'Ubisoft Connect' },
                { id: 'xbox cloud', label: 'Xbox Cloud' }
            ];
            let cRows = '';
            services.forEach(s => {
                const stat = cloud[s.id] || 'unknown';
                const note = cloud[s.id + ' notes'] || '';
                let icon = `<img src="${iconTcUnknown}" width="20">`;
                if (stat === 'true') icon = `<img src="${iconTcTrue}" width="20">`;
                if (stat === 'false') icon = `<img src="${iconTcFalse}" width="20">`;

                cRows += `<tr class="template-infotable-body table-cloud-body-row">
                <th scope="row" class="table-cloud-body-source">${s.label}</th>
                <td class="table-cloud-body-native">${icon}</td>
                <td class="table-cloud-body-notes">${note}</td>
            </tr>`;
            });
            const cTpl = findBalancedTemplate(bodyText, 'Save game cloud syncing')[0];
            bodyText = bodyText.replace(cTpl.content, `
        <div class="container-pcgwikitable">
            <table class="pcgwikitable table-standard template-infotable page-normaltable table-cloud" id="table-cloud">
                <thead><tr class="template-infotable-head table-cloud-head-row">
                    <th scope="col" style="width: 230px;" class="table-cloud-head-source">System</th>
                    <th scope="col" style="width: 60px" class="table-cloud-head-native">Native</th>
                    <th scope="col" style="width: 590px;" class="table-cloud-head-notes">Notes</th>
                </tr></thead>
                <tbody>${cRows}</tbody>
            </table>
        </div>`);
        }

        // 5. Specs Tables (Video, Input, Audio, Network, VR)
        const renderSpecs = (name: string, tableId: string, featureHeader: string, keysMap: Record<string, string>) => {
            const data = parseTemplate(name, bodyText);
            if (!data) return;
            const tpl = findBalancedTemplate(bodyText, name)[0];
            let rows = '';
            Object.keys(keysMap).forEach(k => {
                const val = data[k.toLowerCase()] || 'unknown';
                const note = data[k.toLowerCase() + ' notes'] || '';
                let icon = `<img src="${iconTcUnknown}" width="20">`;
                if (val === 'true') icon = `<img src="${iconTcTrue}" width="20">`;
                if (val === 'false') icon = `<img src="${iconTcFalse}" width="20">`;
                if (val === 'limited') icon = `<img src="${iconTcLimited}" width="20">`;
                if (val === 'always on') icon = `<img src="${iconTcAlwaysOn}" width="20">`;
                if (val === 'hackable') icon = `<img src="${iconTcHackable}" width="20">`;
                if (val === 'n/a') icon = `<img src="${iconTcNa}" width="20">`;

                const label = keysMap[k];
                rows += `<tr class="template-infotable-body ${tableId}-body-row">
                <th scope="row" class="${tableId}-body-parameter">${label}</th>
                <td class="${tableId}-body-rating">${icon}</td>
                <td class="${tableId}-body-notes">${note}</td>
             </tr>`;
            });

            const table = `
        <div class="container-pcgwikitable">
            <table class="pcgwikitable table-standard template-infotable page-normaltable" id="${tableId}">
                <thead><tr class="template-infotable-head ${tableId}-head-row">
                    <th scope="col" style="width: 230px;" class="${tableId}-head-parameter">${featureHeader}</th>
                    <th scope="col" style="width: 50px;" class="${tableId}-head-rating">State</th>
                    <th scope="col" style="width: 540px;" class="${tableId}-head-notes">Notes</th>
                </tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
            bodyText = bodyText.replace(tpl.content, table);
        };

        // Video
        renderSpecs('Video', 'table-settings-video', 'Graphics feature', {
            'widescreen resolution': 'Widescreen resolution',
            'multimonitor': 'Multi-monitor',
            'ultrawidescreen': 'Ultra-widescreen',
            '4k ultra hd': '4K Ultra HD',
            'fov': 'Field of view (FOV)',
            'windowed': 'Windowed',
            'borderless windowed': 'Borderless windowed',
            'anisotropic': 'Anisotropic filtering (AF)',
            'antialiasing': 'Anti-aliasing (AA)',
            'upscaling': 'Upscaling',
            'framegen': 'Frame generation',
            'vsync': 'Vertical sync (Vsync)',
            '60 fps': '60 FPS',
            '120 fps': '120+ FPS',
            'hdr': 'High dynamic range (HDR)',
            'ray tracing': 'Ray tracing (RT)',
            'color blind': 'Color blind mode'
        });
        // Input
        renderSpecs('Input', 'table-settings-input', 'Keyboard and mouse', {
            'key remap': 'Remapping',
            'mouse sensitivity': 'Mouse sensitivity',
            'mouse menu': 'Mouse menu support',
            'controller support': 'Controller support',
            'full controller': 'Full controller support',
            'touchscreen': 'Touchscreen'
        });
        // Audio
        renderSpecs('Audio', 'table-settings-audio', 'Audio feature', {
            'separate volume': 'Separate volume controls',
            'surround sound': 'Surround sound',
            'subtitles': 'Subtitles',
            'closed captions': 'Closed captions',
            'mute on focus lost': 'Mute on focus lost'
        });
        // Network
        renderSpecs('Network/Multiplayer', 'table-network-multiplayer', 'Multiplayer types', {
            'local play': 'Local play',
            'lan play': 'LAN play',
            'online play': 'Online play',
            'asynchronous': 'Asynchronous',
            'crossplay': 'Crossplay'
        });
        renderSpecs('Network/Connections', 'table-network-connections', 'Connection types', {
            'matchmaking': 'Matchmaking',
            'p2p': 'P2P',
            'dedicated': 'Dedicated',
            'self-hosting': 'Self-hosting',
            'direct ip': 'Direct IP'
        });
        renderSpecs('Network/Ports', 'table-network-ports', 'Ports', {
            'tcp': 'TCP',
            'udp': 'UDP',
            'upnp': 'UPnP'
        });
        // VR
        renderSpecs('VR support', 'table-vr', 'VR Support', {
            'native 3d': 'Native 3D',
            'nvidia 3d vision': 'NVIDIA 3D Vision',
            'vorpx': 'VorpX',
            'openxr': 'OpenXR',
            'steamvr': 'SteamVR',
            'oculus': 'Oculus',
            'windows mixed reality': 'Windows Mixed Reality'
        });
        // Monetization & Microtransactions Custom Renderer
        const renderMonetization = (name: string, tableId: string, keysMap: Record<string, string>) => {
            const data = parseTemplate(name, bodyText);
            if (!data) return;
            const tpl = findBalancedTemplate(bodyText, name)[0];

            let rows = '';
            Object.keys(keysMap).forEach(k => {
                const val = data[k.toLowerCase()];

                if (val && val.trim() !== '') {
                    const label = keysMap[k];
                    const slugified = label.replace(/ /g, '_');
                    rows += `<tr class="${tableId}-body-row">
                    <th scope="col" style="width: 230px;" class="${tableId}-body-parameter"><a href="/wiki/Category:${slugified}" title="Category:${label}">${label}</a></th>
                    <td scope="col" style="width: 590px;" class="${tableId}-body-notes">${val.trim()}</td>
                </tr>`;
                }
            });

            if (rows) {
                const table = `
            <div class="container-pcgwikitable">
                <table class="pcgwikitable table-standard template-infotable page-normaltable ${tableId}">
                    <thead><tr class="${tableId}-head-row">
                        <th scope="col" style="width: 230px;" class="${tableId}-head-parameter">Type</th>
                        <th scope="col" style="width: 590px;" class="${tableId}-head-notes">Notes</th>
                    </tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
                bodyText = bodyText.replace(tpl.content, table);
            } else {
                bodyText = bodyText.replace(tpl.content, '');
            }
        };

        renderMonetization('Monetization', 'table-monetization', {
            'ad-supported': 'Ad-supported',
            'cross-game bonus': 'Cross-game bonus',
            'dlc': 'DLC',
            'expansion pack': 'Expansion pack',
            'freeware': 'Freeware',
            'free-to-play': 'Free-to-play',
            'one-time game purchase': 'One-time game purchase',
            'open source': 'Open source',
            'sponsored': 'Sponsored',
            'subscription': 'Subscription',
            'subscription gaming service': 'Subscription gaming service'
        });

        renderMonetization('Microtransactions', 'table-microtransaction', {
            'boost': 'Boost',
            'cosmetic': 'Cosmetic',
            'currency': 'Currency',
            'finite spend': 'Finite spend',
            'infinite spend': 'Infinite spend',
            'free-to-grind': 'Free-to-grind',
            'loot box': 'Loot box',
            'none': 'No microtransactions',
            'player trading': 'Player trading',
            'time-limited': 'Time-limited',
            'unlock': 'Unlock'
        });

        // 6. L10n
        const l10nTemplates = findBalancedTemplate(bodyText, 'L10n');
        if (l10nTemplates.length > 0) {
            const tpl = l10nTemplates[0];
            const rows: string[] = [];
            let cursor = 0;
            const textToScan = tpl.content;
            while (true) {
                const match = textToScan.substring(cursor).match(/{{L10n\/(?:row|switch)/);
                if (!match || match.index === undefined) break;
                const start = cursor + match.index;
                let depth = 0; let end = -1;
                for (let i = start; i < textToScan.length; i++) {
                    if (textToScan.substr(i, 2) === '{{') { depth++; i++; }
                    else if (textToScan.substr(i, 2) === '}}') { depth--; i++; if (depth === 0) { end = i + 1; break; } }
                }
                if (end !== -1) {
                    const rowContent = textToScan.substring(start, end);
                    const inner = rowContent.replace(/{{L10n\/(?:row|switch)/, '').slice(0, -2);
                    const args = splitArgs(inner);
                    const data: Record<string, string> = {};
                    args.forEach(a => {
                        const parts = a.split('=');
                        if (parts.length >= 2) {
                            const k = parts[0].replace(/^\|/, '').trim().toLowerCase();
                            const v = parts.slice(1).join('=').trim();
                            data[k] = v;
                        }
                    });
                    if (!data['language'] && !inner.includes('language=')) {
                        const pArgs = splitArgs(inner.startsWith('|') ? inner.substring(1) : inner);
                        data['language'] = pArgs[0];
                        data['interface'] = pArgs[1] === 'true' ? 'true' : '';
                        data['audio'] = pArgs[2] === 'true' ? 'true' : '';
                        data['subtitles'] = pArgs[3] === 'true' ? 'true' : '';
                        data['notes'] = pArgs[4];
                        data['fan'] = pArgs[5];
                        data['ref'] = pArgs[6];
                    }
                    const lang = data['language'] || '';
                    const fan = data['fan'] ? ' (Fan)' : '';
                    const ui = data['interface'] === 'true' ? `<div title="Native support" class="svg-icon tickcross-true"><img src="${iconTcTrue}" width="20"></div>` : '';
                    const audio = data['audio'] === 'true' ? `<div title="Native support" class="svg-icon tickcross-true"><img src="${iconTcTrue}" width="20"></div>` : '';
                    const sub = data['subtitles'] === 'true' ? `<div title="Native support" class="svg-icon tickcross-true"><img src="${iconTcTrue}" width="20"></div>` : '';
                    const notes = data['notes'] || '';

                    rows.push(`<tr class="template-infotable-body table-l10n-body-row">
                    <th scope="row" class="table-l10n-body-language">${lang}${fan}</th>
                    <td class="table-l10n-body-ui">${ui}</td>
                    <td class="table-l10n-body-audio">${audio}</td>
                    <td class="table-l10n-body-subtitles">${sub}</td>
                    <td class="table-l10n-body-notes">${notes}</td>
                </tr>`);
                    cursor = end;
                } else { break; }
            }
            bodyText = bodyText.replace(tpl.content, `
        <div class="container-pcgwikitable">
            <table class="pcgwikitable table-standard template-infotable page-normaltable table-l10n" id="table-languages">
                <thead><tr class="template-infotable-head table-l10n-head-row">
                    <th scope="col" style="width: 230px;" class="table-l10n-head-language">Language</th>
                    <th scope="col" style="width: 60px" class="table-l10n-head-ui">UI</th>
                    <th scope="col" style="width: 60px" class="table-l10n-head-audio">Audio</th>
                    <th scope="col" style="width: 60px" class="table-l10n-head-subtitles">Sub</th>
                    <th scope="col" style="width: 470px;" class="table-l10n-head-notes">Notes</th>
                </tr></thead>
                <tbody>${rows.join('')}</tbody>
            </table>
        </div>`);
        }



        // 8. API
        const apiTemplates = findBalancedTemplate(bodyText, 'API');
        if (apiTemplates.length > 0) {
            const tpl = apiTemplates[0];
            const data = parseTemplate('API', tpl.content);
            if (data) {
                let t1 = `<div class="container-pcgwikitable"><table class="pcgwikitable template-infotable" id="table-api">
                <tr class="template-infotable-head table-api-head-row">
                    <th scope="col" style="width: 230px;" class="table-api-head-parameter">Technical specs</th>
                    <th scope="col" style="width: 120px;" class="table-api-head-support">Supported</th>
                    <th scope="col" style="width: 470px;" class="table-api-head-notes">Notes</th>
                </tr>`;

                const r = (label: string, field: string) => {
                    const val = data[field] || '';
                    const notes = data[field + ' notes'] || '';
                    if (!val && !notes) return '';
                    return `<tr class="template-infotable-body table-api-body-row">
                    <th scope="row" class="table-api-body-parameter">${label}</th>
                    <td class="table-api-body-support">${val}</td>
                    <td class="table-api-body-notes">${notes}</td>
                 </tr>`;
                };
                t1 += r('Direct3D', 'direct3d versions');
                t1 += r('OpenGL', 'opengl versions');
                t1 += r('Vulkan', 'vulkan versions');
                t1 += '</table></div>';

                let t2 = `<div class="container-pcgwikitable"><table class="pcgwikitable template-infotable" id="table-api-executable">
                <tr class="template-infotable-head table-api-head-row">
                    <th scope="col" style="width: 230px;" class="table-api-head-parameter">Executable</th>
                    <th scope="col" style="width: 50px;" class="table-api-head-support">32-bit</th>
                    <th scope="col" style="width: 50px;" class="table-api-head-support">64-bit</th>
                    <th scope="col" style="width: 490px;" class="table-api-head-notes">Notes</th>
                </tr>`;
                if (data['windows 32-bit exe'] || data['windows 64-bit exe']) {
                    const w32 = data['windows 32-bit exe'] === 'true' ? `<div title="Native support" class="svg-icon tickcross-true"><img src="${iconTcTrue}" width="20"></div>` : `<div title="Unknown" class="svg-icon tickcross-unknown"><img src="${iconTcUnknown}" width="20"></div>`;
                    const w64 = data['windows 64-bit exe'] === 'true' ? `<div title="Native support" class="svg-icon tickcross-true"><img src="${iconTcTrue}" width="20"></div>` : `<div title="Unknown" class="svg-icon tickcross-unknown"><img src="${iconTcUnknown}" width="20"></div>`;
                    t2 += `<tr class="template-infotable-body table-api-body-row">
                    <th scope="row" class="table-api-body-parameter">Windows</th>
                    <td class="table-api-body-support">${w32}</td>
                    <td class="table-api-body-support">${w64}</td>
                    <td class="table-api-body-notes">${data['windows notes'] || ''}</td>
                 </tr>`;
                }
                t2 += '</table></div>';
                bodyText = bodyText.replace(tpl.content, t1 + t2);
            }
        }

        // 9. Middleware
        const midTemplates = findBalancedTemplate(bodyText, 'Middleware');
        if (midTemplates.length > 0) {
            const tpl = midTemplates[0];
            const inner = tpl.content.slice('{{Middleware'.length, -2);
            const args = splitArgs(inner);
            const mData: Record<string, string> = {};
            args.forEach(a => {
                const parts = a.split('=');
                if (parts.length >= 2) {
                    const k = parts[0].replace(/^\|/, '').trim().toLowerCase();
                    const v = parts.slice(1).join('=').trim();
                    mData[k] = v;
                }
            });
            let rows = '';
            const addM = (label: string, field: string) => {
                const val = mData[field];
                const notes = mData[field + ' notes'];
                if (val) {
                    rows += `<tr><td>${label}</td><td>${val} ${notes ? `(${notes})` : ''}</td></tr>`;
                }
            };
            addM('Physics', 'physics');
            addM('Audio', 'audio');
            addM('Interface', 'interface');
            addM('Input', 'input');
            addM('Cutscenes', 'cutscenes');
            addM('Multiplayer', 'multiplayer');
            addM('Anticheat', 'anticheat');
            bodyText = bodyText.replace(tpl.content, `<div class="container-pcgwikitable"><table class="pcgwikitable table-standard template-infotable page-normaltable table-middleware" id="table-middleware"><thead><tr class="template-infotable-head ta-middleware-head-row"><th colspan="2" class="ta-middleware-head-parameter">Middleware</th></tr></thead><tbody>${rows}</tbody></table></div>`);
        }

        // 10. System Requirements
        // Uses {{System requirements|OS=... | ...}}
        const sysTemplates = findBalancedTemplate(bodyText, 'System requirements');
        sysTemplates.forEach(tpl => {
            const data = parseTemplate('System requirements', tpl.content) || {};
            // Simple render
            const os = data['os'] || 'System';
            const h = `
         <div class="sysreq sysreq_${os} container-pcgwikitable">
            <table class="pcgwikitable table-standard template-infotable page-normaltable" id="table-sysreqs-${os.toLowerCase()}">
                <thead><tr class="template-infotable-doublehead sysreq_heading table-sysreqs-head-row">
                    <th colspan="5" class="table-sysreqs-head-OS">${os}</th>
                </tr>
                <tr class="template-infotable-head table-sysreqs-head-row">
                     <th scope="col" class="table-sysreqs-head-parameter" style="width: 220px;"></th>
                     <th scope="col" class="table-sysreqs-head-minimum" style="width: 300px" colspan="2">Minimum</th>
                     <th scope="col" class="table-sysreqs-head-recommended" style="width: 300px">Recommended</th>
                </tr></thead>
                <tbody>
                ${data['minos'] || data['osfamily'] ? `<tr class="template-infotable-body table-sysreqs-body-row"><th class="table-sysreqs-body-parameter">Operating system (OS)</th><td class="table-sysreqs-body-minimum" colspan="2">${data['minos'] || data['osfamily']}</td><td class="table-sysreqs-body-recommended">${data['recos'] || data['recosfamily'] || ''}</td></tr>` : ''}
                
                ${data['mincpu'] ? `<tr class="template-infotable-body table-sysreqs-body-row"><th class="table-sysreqs-body-parameter">Processor (CPU)</th><td class="table-sysreqs-body-minimum" colspan="2">${data['mincpu']}</td><td class="table-sysreqs-body-recommended">${data['reccpu'] || ''}</td></tr>` : ''}
                
                ${data['minram'] ? `<tr class="template-infotable-body table-sysreqs-body-row"><th class="table-sysreqs-body-parameter">System memory (RAM)</th><td class="table-sysreqs-body-minimum" colspan="2">${data['minram']}</td><td class="table-sysreqs-body-recommended">${data['recram'] || ''}</td></tr>` : ''}
                
                ${data['minhd'] ? `<tr class="template-infotable-body table-sysreqs-body-row"><th class="table-sysreqs-body-parameter">Storage drive (HDD/SSD)</th><td class="table-sysreqs-body-minimum" colspan="2">${data['minhd']}</td><td class="table-sysreqs-body-recommended">${data['rechd'] || ''}</td></tr>` : ''}
                
                ${data['mingpu'] ? `<tr class="template-infotable-body table-sysreqs-body-row"><th class="table-sysreqs-body-parameter">Video card (GPU)</th><td class="table-sysreqs-body-minimum" colspan="2">${data['mingpu']}</td><td class="table-sysreqs-body-recommended">${data['recgpu'] || ''}</td></tr>` : ''}
                </tbody>
            </table>
          </div>`;
            bodyText = bodyText.replace(tpl.content, h);
        });

        // Formatting
        const anchorify = (text: string) => {
            // Strip internal links for ID generation: [[Link|Text]] -> Text, [[Link]] -> Link
            let clean = text.replace(/\[\[(?:[^|\]]+\|)?([^\]]+)\]\]/g, '$1');
            return clean.trim().replace(/ /g, '_');
        };

        // Headers from H6 to H2 to ensure longest matches are caught first
        for (let i = 6; i >= 2; i--) {
            const eq = '='.repeat(i);
            const regex = new RegExp(`^${eq}\\s*(.*?)\\s*${eq}$`, 'gm');
            bodyText = bodyText.replace(regex, (_match, title) => {
                const id = anchorify(title);
                const text = title.trim();
                const tag = `h${i}`;
                return `<${tag}><span class="mw-headline" id="${id}">${text}<span class="mw-linkhere"> • <a title="Link" href="#${id}">Link</a></span></span></${tag}>`;
            });
        }
        bodyText = bodyText.replace(/'''(.*?)'''/g, '<b>$1</b>');
        bodyText = bodyText.replace(/''(.*?)''/g, '<i>$1</i>');

        // Internal links [[Link|Text]] or [[Link]]
        bodyText = bodyText.replace(/\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g, (_match, link, text) => {
            const display = text || link;
            const url = `/wiki/${link.trim().replace(/ /g, '_')}`;
            return `<a href="${url}" title="${link.trim()}">${display.trim()}</a>`;
        });

        // Lists
        bodyText = bodyText.replace(/^[#] (.*)/gm, '<li>$1</li>');
        bodyText = bodyText.replace(/(?:^<li>.*(\r?\n|$))+/gm, (match) => `<ol>${match}</ol>`);
        bodyText = bodyText.replace(/^[*] (.*)/gm, '<li>$1</li>');
        bodyText = bodyText.replace(/(?:^<li>.*(\r?\n|$))+/gm, (match) => `<ul>${match}</ul>`);

        // External links
        bodyText = bodyText.replace(/\[(https?:\/\/[^\s]+)\s+(.+?)\]/g, '<a href="$1" target="_blank" class="external text">$2</a>');

        // Newlines
        bodyText = bodyText.replace(/\n\n/g, '<br><br>');

        // Clean up <br> tags around headings
        bodyText = bodyText.replace(/(?:<br\s*\/?>\s*)+(<h[1-6][^>]*>)/gi, '$1');
        bodyText = bodyText.replace(/(<\/h[1-6]>)\s*(?:<br\s*\/?>\s*)+/gi, '$1');

        return `<div class="mw-parser-output">
        ${html}
        <div class="wiki-content">${bodyText}</div>
    </div>`;
    } catch (e: any) {
        return `<div style="color: red; border: 2px solid red; padding: 10px;"><b>Render Error:</b><br><pre>${e.stack || e}</pre></div>`;
    }
};
