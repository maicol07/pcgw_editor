import iconTcTrue from '../assets/icons/tc-true.svg';
import iconTcFalse from '../assets/icons/tc-false.svg';
import iconTcUnknown from '../assets/icons/tc-unknown.svg';
import iconTcHackable from '../assets/icons/tc-hackable.svg';
import iconTcNa from '../assets/icons/tc-not-applicable.svg';
import iconBulletDocument from '../assets/icons/bullet-document.svg';
import iconBulletInfo from '../assets/icons/bullet-info.svg';

// Fallback Icons
const iconTcLimited = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 250 250'%3E%3Ccircle cx='125' cy='125' r='121' fill='%231db288'/%3E%3Cpath fill='%23fff' d='m121,189c-4,5-7,8.5-14,8.5-14,0-61-51-63-57-2,-6 4,-10 8-12 9-5 17.5,1 23,7.5 25.5,33 34,13.5 51-11l41.5-61c5.5-7.5 13,-11.5 22.5-5 7.5,5.5 6,12 2,18.5z'/%3E%3Cpath style='fill:%23ffffff;stroke:%23f89842;stroke-width:8.22652245' d='m 116.89174,180.43528 8.9032,-27.4839 c 20.516,7.2261 35.4192,13.4841 44.7096,18.7742 -2.4517,-23.3545 -3.742,-39.419 -3.871,-48.1935 h 28.0645 c -0.3872,12.7745 -1.8711,28.7744 -4.4516,48 13.2902,-6.7095 28.516,-12.903 45.6773,-18.5807 l 8.9033,27.4839 c -16.3872,5.4195 -32.4517,9.0324 -48.1935,10.8387 7.8708,6.8389 18.9676,19.0324 33.2903,36.5806 l -23.2258,16.4515 c -7.484,-10.1933 -16.3227,-24.0642 -26.5161,-41.6128 -9.5484,18.1937 -17.9355,32.0647 -25.1613,41.6128 l -22.8386,-16.4515 c 14.9676,-18.4514 25.6773,-30.6449 32.129,-36.5806 -16.6452,-3.2256 -32.4516,-6.8385 -47.4193,-10.8387 z'/%3E%3C/svg%3E";
const iconTcAlwaysOn = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 250 250'%3E%3Ccircle cx='125' cy='125' r='121' fill='%23a0a11c'/%3E%3Crect ry='35.501' rx='35.501' height='106.501' width='71.001' y='62.874' x='89.499' fill='none' stroke='%23fff' stroke-width='17.75'/%3E%3Crect ry='8.875' rx='8.875' height='88.751' width='106.501' y='107.25' x='71.749' fill='%23fff'/%3E%3C/svg%3E";

export const renderWikitextToHtml = (wikitext: string): string => {
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
    bodyText = bodyText.replace(/{{mm}}/gi, `<img src="${iconBulletDocument}" alt="mm" class="inline-icon" width="12" height="12">`);
    bodyText = bodyText.replace(/{{ii\|?(.*?)}}/gi, (_match, content) => {
        const title = content ? ` title="${content.replace(/"/g, '&quot;')}"` : '';
        return `<img src="${iconBulletInfo}" alt="ii" class="inline-icon template-ii"${title} width="12" height="12">`;
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

    // ============================================
    // Sections & Templates
    // ============================================

    // 1. Infobox
    // Simple render floating right
    const infobox = parseTemplate('Infobox game', bodyText);
    if (infobox) {
        // Create simple table
        let rows = '';
        Object.entries(infobox).forEach(([k, v]) => {
            if (v) rows += `<tr><th>${k}</th><td>${v}</td></tr>`;
        });
        const infoHtml = `<div class="infobox" style="float:right; width:300px; border:1px solid #aaa; background:#f9f9f9; padding:5px;">
            <table style="width:100%">${rows}</table>
         </div>`;
        // Replace block
        const tpl = findBalancedTemplate(bodyText, 'Infobox game')[0];
        bodyText = bodyText.replace(tpl.content, ''); // Remove from body, put in html preamble? 
        // Actually PCGW floats it.
        html += infoHtml;
    }

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
            tableHtml += `<tr class="template-infotable-body table-availability-body-row">
                    <th scope="row" class="table-availability-body-source">${args[0] || ''}</th>
                    <td class="table-availability-body-DRM">${args[2] || ''}</td>
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
        const services = ['discord', 'epic games launcher', 'gog galaxy', 'steam cloud', 'ubisoft connect', 'xbox cloud'];
        let cRows = '';
        services.forEach(s => {
            const stat = cloud[s] || 'unknown';
            const note = cloud[s + ' notes'] || '';
            let icon = `<img src="${iconTcUnknown}" width="20">`;
            if (stat === 'true') icon = `<img src="${iconTcTrue}" width="20">`;
            if (stat === 'false') icon = `<img src="${iconTcFalse}" width="20">`;
            cRows += `<tr><th>${s}</th><td>${icon}</td><td>${note}</td></tr>`;
        });
        const cTpl = findBalancedTemplate(bodyText, 'Save game cloud syncing')[0];
        bodyText = bodyText.replace(cTpl.content, `
        <h3><a href="https://www.pcgamingwiki.com/wiki/Glossary:Save_game_cloud_syncing" target="_blank">Save game cloud syncing</a></h3>
        <table class="pcgwikitable"><tr><th>System</th><th>Native</th><th>Notes</th></tr>${cRows}</table>`);
    }

    // 5. Specs Tables (Video, Input, Audio, Network, VR)
    const renderSpecs = (name: string, tableId: string, featureHeader: string, keys: string[]) => {
        const data = parseTemplate(name, bodyText);
        if (!data) return;
        const tpl = findBalancedTemplate(bodyText, name)[0];
        let rows = '';
        keys.forEach(k => {
            const val = data[k.toLowerCase()] || 'unknown';
            const note = data[k.toLowerCase() + ' notes'] || '';
            let icon = `<img src="${iconTcUnknown}" width="20">`;
            if (val === 'true') icon = `<img src="${iconTcTrue}" width="20">`;
            if (val === 'false') icon = `<img src="${iconTcFalse}" width="20">`;
            if (val === 'limited') icon = `<img src="${iconTcLimited}" width="20">`;
            if (val === 'always on') icon = `<img src="${iconTcAlwaysOn}" width="20">`;
            if (val === 'hackable') icon = `<img src="${iconTcHackable}" width="20">`;
            if (val === 'n/a') icon = `<img src="${iconTcNa}" width="20">`;

            rows += `<tr class="template-infotable-body ${tableId}-body-row">
                <th scope="row" class="${tableId}-body-parameter">${k}</th>
                <td class="${tableId}-body-rating">${icon}</td>
                <td class="${tableId}-body-notes">${note}</td>
             </tr>`;
        });

        const table = `
        <div class="container-pcgwikitable">
            <table class="pcgwikitable template-infotable" id="${tableId}">
                <tr class="template-infotable-head ${tableId}-head-row">
                    <th scope="col" style="width: 230px;" class="${tableId}-head-parameter">${featureHeader}</th>
                    <th scope="col" style="width: 50px;" class="${tableId}-head-rating">State</th>
                    <th scope="col" style="width: 540px;" class="${tableId}-head-notes">Notes</th>
                </tr>
                ${rows}
            </table>
        </div>`;
        bodyText = bodyText.replace(tpl.content, table);
    };

    // Video
    renderSpecs('Video', 'table-settings-video', 'Graphics feature', ['widescreen resolution', 'multimonitor', 'ultrawidescreen', '4k ultra hd', 'fov', 'windowed', 'borderless windowed', 'anisotropic', 'antialiasing', 'upscaling', 'framegen', 'vsync', '60 fps', '120 fps', 'hdr', 'ray tracing', 'color blind']);
    // Input
    renderSpecs('Input', 'table-settings-input', 'Keyboard and mouse', ['key remap', 'mouse sensitivity', 'mouse menu', 'controller support', 'full controller', 'touchscreen']);
    // Audio
    renderSpecs('Audio', 'table-settings-audio', 'Audio feature', ['separate volume', 'surround sound', 'subtitles', 'closed captions', 'mute on focus lost']);
    // Network
    renderSpecs('Network/Multiplayer', 'table-network-multiplayer', 'Multiplayer types', ['local play', 'lan play', 'online play', 'asynchronous', 'crossplay']);
    renderSpecs('Network/Connections', 'table-network-connections', 'Connection types', ['matchmaking', 'p2p', 'dedicated', 'self-hosting', 'direct ip']);
    renderSpecs('Network/Ports', 'table-network-ports', 'Ports', ['tcp', 'udp', 'upnp']);
    // VR
    renderSpecs('VR support', 'table-vr', 'VR Support', ['native 3d', 'nvidia 3d vision', 'vorpx', 'openxr', 'steamvr', 'oculus', 'windows mixed reality']);

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
                const ui = data['interface'] === 'true' ? '✅' : '';
                const audio = data['audio'] === 'true' ? '✅' : '';
                const sub = data['subtitles'] === 'true' ? '✅' : '';
                const notes = data['notes'] || '';
                const fan = data['fan'] ? '(Fan)' : '';
                rows.push(`<tr><td>${lang} ${fan}</td><td>${ui}</td><td>${audio}</td><td>${sub}</td><td>${notes}</td></tr>`);
                cursor = end;
            } else { break; }
        }
        bodyText = bodyText.replace(tpl.content, `
        <div class="container-pcgwikitable">
            <table class="pcgwikitable sortable template-infotable jquery-tablesorter">
                <tr class="template-infotable-head"><th>Language</th><th>UI</th><th>Audio</th><th>Sub</th><th>Notes</th></tr>
                ${rows.join('')}
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
                const w32 = data['windows 32-bit exe'] === 'true' ? `<div title="Native support" class="svg-icon svg-25 tickcross-true"><img src="${iconTcTrue}" width="20"></div>` : `<div title="Unknown" class="svg-icon svg-25 tickcross-unknown"><img src="${iconTcUnknown}" width="20"></div>`;
                const w64 = data['windows 64-bit exe'] === 'true' ? `<div title="Native support" class="svg-icon svg-25 tickcross-true"><img src="${iconTcTrue}" width="20"></div>` : `<div title="Unknown" class="svg-icon svg-25 tickcross-unknown"><img src="${iconTcUnknown}" width="20"></div>`;
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
        bodyText = bodyText.replace(tpl.content, `<div class="container-pcgwikitable"><table class="pcgwikitable template-infotable"><tr class="template-infotable-head"><th colspan="2">Middleware</th></tr>${rows}</table></div>`);
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
            <table class="pcgwikitable template-infotable" id="table-sysreqs-${os.toLowerCase()}">
                <tr class="template-infotable-doublehead sysreq_heading table-sysreqs-head-row">
                    <th colspan="5" class="table-sysreqs-head-OS">${os}</th>
                </tr>
                <tr class="template-infotable-head table-sysreqs-head-row">
                     <th scope="col" class="table-sysreqs-head-parameter" style="width: 220px;"></th>
                     <th scope="col" class="table-sysreqs-head-minimum" style="width: 300px" colspan="2">Minimum</th>
                     <th scope="col" class="table-sysreqs-head-recommended" style="width: 300px">Recommended</th>
                </tr>
                
                ${data['minos'] || data['osfamily'] ? `<tr class="template-infotable-body table-sysreqs-body-row"><th class="table-sysreqs-body-parameter">Operating system (OS)</th><td class="table-sysreqs-body-minimum" colspan="2">${data['minos'] || data['osfamily']}</td><td class="table-sysreqs-body-recommended">${data['recos'] || data['recosfamily'] || ''}</td></tr>` : ''}
                
                ${data['mincpu'] ? `<tr class="template-infotable-body table-sysreqs-body-row"><th class="table-sysreqs-body-parameter">Processor (CPU)</th><td class="table-sysreqs-body-minimum" colspan="2">${data['mincpu']}</td><td class="table-sysreqs-body-recommended">${data['reccpu'] || ''}</td></tr>` : ''}
                
                ${data['minram'] ? `<tr class="template-infotable-body table-sysreqs-body-row"><th class="table-sysreqs-body-parameter">System memory (RAM)</th><td class="table-sysreqs-body-minimum" colspan="2">${data['minram']}</td><td class="table-sysreqs-body-recommended">${data['recram'] || ''}</td></tr>` : ''}
                
                ${data['minhd'] ? `<tr class="template-infotable-body table-sysreqs-body-row"><th class="table-sysreqs-body-parameter">Storage drive (HDD/SSD)</th><td class="table-sysreqs-body-minimum" colspan="2">${data['minhd']}</td><td class="table-sysreqs-body-recommended">${data['rechd'] || ''}</td></tr>` : ''}
                
                ${data['mingpu'] ? `<tr class="template-infotable-body table-sysreqs-body-row"><th class="table-sysreqs-body-parameter">Video card (GPU)</th><td class="table-sysreqs-body-minimum" colspan="2">${data['mingpu']}</td><td class="table-sysreqs-body-recommended">${data['recgpu'] || ''}</td></tr>` : ''}
            </table>
         </div>`;
        bodyText = bodyText.replace(tpl.content, h);
    });

    // Formatting
    const slugify = (text: string) => {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    };

    bodyText = bodyText.replace(/^==\s*(.*?)\s*==$/gm, (_match, title) => `<h2 id="${slugify(title)}">${title}</h2>`);
    bodyText = bodyText.replace(/^===\s*(.*?)\s*===$/gm, (_match, title) => `<h3 id="${slugify(title)}">${title}</h3>`);
    bodyText = bodyText.replace(/'''(.*?)'''/g, '<b>$1</b>');
    bodyText = bodyText.replace(/''(.*?)''/g, '<i>$1</i>');

    // Lists
    bodyText = bodyText.replace(/^[#] (.*)/gm, '<li>$1</li>');
    bodyText = bodyText.replace(/(?:^<li>.*(\r?\n|$))+/gm, (match) => `<ol>${match}</ol>`);
    bodyText = bodyText.replace(/^[*] (.*)/gm, '<li>$1</li>');
    bodyText = bodyText.replace(/(?:^<li>.*(\r?\n|$))+/gm, (match) => `<ul>${match}</ul>`);
    // Note: This regex might conflict if both * and # use same <li> tag. 
    // But since I process # first and wrap, * won't match wrapped items?
    // Wait, ^<li> matches start of line? No.
    // I should use class or distinct tag.

    // External links
    bodyText = bodyText.replace(/\[(https?:\/\/[^\s]+)\s+(.+?)\]/g, '<a href="$1" target="_blank" class="external text">$2</a>');

    // Newlines
    bodyText = bodyText.replace(/\n\n/g, '<br><br>');

    return `<div class="mw-parser-output">
        ${html}
        <div class="wiki-content">${bodyText}</div>
    </div>`;
};
