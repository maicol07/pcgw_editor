import { WikitextParser, type TemplateLocation } from './WikitextParser';
import { PCGWEditor } from './wikitext';
import type { GameData } from '../models/GameData';

export interface SectionRange {
    start: number;
    end: number;
    content: string;
    hasHeader: boolean;
    headerTitle?: string;
}

interface SectionConfig {
    headerRegex?: RegExp;
    subHeaderRegex?: RegExp;
    defaultHeaderTitle?: string;
    primaryTemplate?: string;
    additionalTemplates?: string[];
    osFilter?: 'windows' | 'mac' | 'linux';
    // Generator function if section is not present in wikitext
    generate?: (editor: PCGWEditor, gameData: GameData) => void;
}

const SECTION_CONFIGS: Record<string, SectionConfig> = {
    articleState: {
        additionalTemplates: ['stub', 'cleanup', 'delete', 'State', 'Disambig', 'Distinguish'],
        generate: (editor, data) => editor.updateArticleState(data.articleState),
    },
    infobox: {
        primaryTemplate: 'Infobox game',
        generate: (editor, data) => editor.updateInfobox(data.infobox),
    },
    introduction: {
        primaryTemplate: 'Introduction',
        generate: (editor, data) => {
            editor.updateIntroduction(data.introduction);
            if (data.introduction.generalInfo) {
                editor.updateGeneralInfo(data.introduction.generalInfo);
            }
        },
    },
    availability: {
        headerRegex: /^Availability$/i,
        defaultHeaderTitle: 'Availability',
        primaryTemplate: 'Availability',
        generate: (editor, data) => editor.updateAvailability(data.availability),
    },
    monetization: {
        headerRegex: /^Monetization$/i,
        defaultHeaderTitle: 'Monetization',
        primaryTemplate: 'Monetization',
        additionalTemplates: ['Microtransactions'],
        generate: (editor, data) => {
            editor.updateMonetization(data.monetization);
            editor.updateMicrotransactions(data.microtransactions);
        },
    },
    'monetization.monetization': {
        primaryTemplate: 'Monetization',
        generate: (editor, data) => editor.updateMonetization(data.monetization),
    },
    'monetization.microtransactions': {
        subHeaderRegex: /^Microtransactions$/i,
        primaryTemplate: 'Microtransactions',
        generate: (editor, data) => editor.updateMicrotransactions(data.microtransactions),
    },
    microtransactions: {
        subHeaderRegex: /^Microtransactions$/i,
        primaryTemplate: 'Microtransactions',
        generate: (editor, data) => editor.updateMicrotransactions(data.microtransactions),
    },
    dlc: {
        headerRegex: /^DLC(?:\s*&\s*Expansions)?$/i,
        defaultHeaderTitle: 'DLC & Expansions',
        primaryTemplate: 'DLC',
        generate: (editor, data) => editor.updateDLC(data.dlc),
    },
    essentialImprovements: {
        headerRegex: /^Essential\s+improvements$/i,
        defaultHeaderTitle: 'Essential improvements',
        generate: (editor, data) => editor.updateEssentialImprovements(data.essentialImprovements),
    },
    gameData: {
        headerRegex: /^Game\s+data$/i,
        defaultHeaderTitle: 'Game data',
        primaryTemplate: 'Game data',
        additionalTemplates: ['Save game cloud syncing'],
        generate: (editor, data) => {
            editor.updateGameData(data.config);
            editor.updateCloudSync(data.config.cloudSync);
        },
    },
    'gameData.config': {
        subHeaderRegex: /^Configuration\s+file\(s\)\s+location$/i,
        primaryTemplate: 'Game data/config',
        generate: (editor, data) => {
            const temp = new PCGWEditor('');
            temp.updateGameData({ ...data.config, saveData: [] });
            editor.replaceSectionContent('Configuration file(s) location', temp.getText());
        },
    },
    'gameData.saves': {
        subHeaderRegex: /^Save\s+game\s+data\s+location$/i,
        primaryTemplate: 'Game data/saves',
        generate: (editor, data) => {
            const temp = new PCGWEditor('');
            temp.updateGameData({ ...data.config, configFiles: [] });
            editor.replaceSectionContent('Save game data location', temp.getText());
        },
    },
    'gameData.cloudSync': {
        primaryTemplate: 'Save game cloud syncing',
        generate: (editor, data) => editor.updateCloudSync(data.config?.cloudSync),
    },
    video: {
        headerRegex: /^Video$/i,
        defaultHeaderTitle: 'Video',
        primaryTemplate: 'Video',
        generate: (editor, data) => {
            editor.updateVideo(data.video);
            editor.updateSectionImages('Video', data.galleries['video']);
        },
    },
    input: {
        headerRegex: /^Input$/i,
        defaultHeaderTitle: 'Input',
        primaryTemplate: 'Input',
        generate: (editor, data) => {
            editor.updateInput(data.input);
            editor.updateSectionImages('Input', data.galleries['input']);
        },
    },
    audio: {
        headerRegex: /^Audio$/i,
        defaultHeaderTitle: 'Audio',
        primaryTemplate: 'Audio',
        generate: (editor, data) => {
            editor.updateAudio(data.audio);
            editor.updateSectionImages('Audio', data.galleries['audio']);
        },
    },
    l10n: {
        headerRegex: /^Localizations$/i,
        defaultHeaderTitle: 'Localizations',
        primaryTemplate: 'L10n',
        generate: (editor, data) => editor.updateLocalizations(data.localizations),
    },
    network: {
        headerRegex: /^Network$/i,
        defaultHeaderTitle: 'Network',
        primaryTemplate: 'Network',
        additionalTemplates: ['Network/Multiplayer', 'Network/Connections', 'Network/Ports'],
        generate: (editor, data) => {
            editor.updateNetwork(data.network);
            editor.updateSectionImages('Network', data.galleries['network']);
        },
    },
    vr: {
        headerRegex: /^VR\s+support$/i,
        defaultHeaderTitle: 'VR support',
        primaryTemplate: 'VR support',
        generate: (editor, data) => {
            editor.updateVR(data.vr);
            editor.updateSectionImages('VR support', data.galleries['vr']);
        },
    },
    issues: {
        defaultHeaderTitle: 'Issues unresolved',
        generate: (editor, data) => editor.updateIssues(data.issues),
    },
    other: {
        headerRegex: /^Other\s+information$/i,
        defaultHeaderTitle: 'Other information',
        primaryTemplate: 'API',
        additionalTemplates: ['Middleware'],
        generate: (editor, data) => {
            editor.updateAPI(data.api);
            editor.updateMiddleware(data.middleware);
            editor.updateSectionImages('API', data.galleries['other'] || data.galleries['api']);
            editor.updateSectionImages('Middleware', data.galleries['middleware']);
        },
    },
    'other.api': {
        primaryTemplate: 'API',
        generate: (editor, data) => editor.updateAPI(data.api),
    },
    api: {
        primaryTemplate: 'API',
        generate: (editor, data) => editor.updateAPI(data.api),
    },
    'other.middleware': {
        primaryTemplate: 'Middleware',
        generate: (editor, data) => editor.updateMiddleware(data.middleware),
    },
    middleware: {
        primaryTemplate: 'Middleware',
        generate: (editor, data) => editor.updateMiddleware(data.middleware),
    },
    systemReq: {
        headerRegex: /^System\s+requirements$/i,
        defaultHeaderTitle: 'System requirements',
        primaryTemplate: 'System requirements',
        generate: (editor, data) => {
            editor.updateSystemRequirements(data.requirements);
            editor.updateSectionImages('System requirements', data.galleries['systemReq'] || data.galleries['system_requirements']);
        },
    },
    'systemReq.windows': {
        osFilter: 'windows',
        generate: (editor, data) => editor.updateSystemRequirements({ windows: data.requirements?.windows } as any),
    },
    'systemReq.mac': {
        osFilter: 'mac',
        generate: (editor, data) => editor.updateSystemRequirements({ mac: data.requirements?.mac } as any),
    },
    'systemReq.linux': {
        osFilter: 'linux',
        generate: (editor, data) => editor.updateSystemRequirements({ linux: data.requirements?.linux } as any),
    },
};

/**
 * Locate a section range in the full wikitext.
 */
export function findSectionRange(key: string, wikitext: string): SectionRange | null {
    if (!wikitext) return null;
    const parser = new WikitextParser(wikitext);

    // 1. Special case: articleState (templates at beginning before Infobox)
    if (key === 'articleState') {
        const templates = ['stub', 'cleanup', 'delete', 'State', 'Disambig', 'Distinguish'];
        const matched: TemplateLocation[] = [];
        for (const t of templates) {
            const found = parser.findTemplates(t);
            matched.push(...found);
        }
        if (matched.length === 0) return null;
        matched.sort((a, b) => a.start - b.start);
        const start = matched[0].start;
        const end = matched[matched.length - 1].end;
        return {
            start,
            end,
            content: wikitext.substring(start, end).trim(),
            hasHeader: false,
        };
    }

    // 2. Special case: issues
    if (key === 'issues') {
        const issuesHeaderRegex = /^={2,}\s*Issues(?:\s+unresolved|\s+fixed)?\s*={2,}[^\n]*\n?/im;
        const match = wikitext.match(issuesHeaderRegex);
        if (match && match.index !== undefined) {
            const start = match.index + match[0].length;
            const remaining = wikitext.substring(start);
            const level2HeaderRegex = /\n==(?!=)\s*([^=]+?)\s*==/g;
            let end = wikitext.length;
            let m: RegExpExecArray | null;
            while ((m = level2HeaderRegex.exec(remaining)) !== null) {
                const title = m[1].trim();
                if (!/^Issues(?:\s+unresolved|\s+fixed)?$/i.test(title)) {
                    end = start + m.index;
                    break;
                }
            }
            return {
                start,
                end,
                content: wikitext.substring(start, end).trim(),
                hasHeader: true,
                headerTitle: match[0].replace(/^=+\s*|\s*=+\s*$/g, '').trim(),
            };
        }
        return null;
    }

    const config = SECTION_CONFIGS[key];
    if (!config) return null;

    // 3. Try finding by Sub-Header (Level 3 header like === Configuration file(s) location ===)
    if (config.subHeaderRegex) {
        const headerPattern = new RegExp(`^={3,}\\s*${config.subHeaderRegex.source}\\s*={3,}[^\\n]*\\n?`, 'im');
        const match = wikitext.match(headerPattern);
        if (match && match.index !== undefined) {
            const start = match.index + match[0].length;
            const remaining = wikitext.substring(start);
            // End at next header (Level 2 or 3)
            const nextMatch = remaining.match(/\n={2,}(?!=)/);
            const end = nextMatch && nextMatch.index !== undefined ? start + nextMatch.index : wikitext.length;
            return {
                start,
                end,
                content: wikitext.substring(start, end).trim(),
                hasHeader: true,
            };
        }
    }

    // 4. Try finding by OS Filter for System Requirements
    if (config.osFilter) {
        const templates = parser.findTemplates('System requirements');
        for (const t of templates) {
            const osParamMatch = t.content.match(/\|\s*OS\s*=\s*([^|\n}]+)/i);
            const osVal = osParamMatch ? osParamMatch[1].trim().toLowerCase() : '';
            if (config.osFilter === 'windows' && (!osVal || osVal === 'windows')) {
                return { start: t.start, end: t.end, content: t.content.trim(), hasHeader: false };
            }
            if (config.osFilter === 'mac' && (osVal.includes('mac') || osVal.includes('osx') || osVal.includes('os x'))) {
                return { start: t.start, end: t.end, content: t.content.trim(), hasHeader: false };
            }
            if (config.osFilter === 'linux' && osVal.includes('linux')) {
                return { start: t.start, end: t.end, content: t.content.trim(), hasHeader: false };
            }
        }
    }

    // 5. Try finding by Level 2 header
    if (config.headerRegex) {
        const section = parser.findSection(config.headerRegex);
        if (section) {
            return {
                start: section.start,
                end: section.end,
                content: section.content.trim(),
                hasHeader: true,
            };
        }
    }

    // 6. Fallback: find by template range
    if (config.primaryTemplate) {
        const primary = parser.findTemplate(config.primaryTemplate);
        if (primary) {
            const start = primary.start;
            let end = primary.end;

            // Multiple templates of same type (e.g. Game data/config)
            const allPrimary = parser.findTemplates(config.primaryTemplate);
            if (allPrimary.length > 1) {
                end = allPrimary[allPrimary.length - 1].end;
            }

            // Additional templates
            if (config.additionalTemplates) {
                for (const addName of config.additionalTemplates) {
                    const addTpl = parser.findTemplate(addName);
                    if (addTpl && addTpl.start >= start && addTpl.end > end) {
                        end = addTpl.end;
                    }
                }
            }

            if (key === 'introduction') {
                const afterIntro = wikitext.substring(end);
                const nextHeaderMatch = afterIntro.match(/\n==(?!=)/);
                const nextHeaderPos = nextHeaderMatch && nextHeaderMatch.index !== undefined
                    ? end + nextHeaderMatch.index
                    : wikitext.length;
                const intermediate = wikitext.substring(end, nextHeaderPos);
                if (/'''\s*General information\s*'''/i.test(intermediate)) {
                    end = nextHeaderPos;
                }
            }

            return {
                start,
                end,
                content: wikitext.substring(start, end).trim(),
                hasHeader: false,
            };
        }
    }

    return null;
}

/**
 * Extract wikitext for a given section or subsection.
 */
export function getSectionWikitext(key: string, fullWikitext: string, gameData?: GameData): string {
    const range = findSectionRange(key, fullWikitext);
    if (range && range.content) {
        return range.content;
    }

    const config = SECTION_CONFIGS[key];
    if (config && config.generate && gameData) {
        const editor = new PCGWEditor('');
        config.generate(editor, gameData);
        return editor.getText().trim();
    }

    return '';
}

/**
 * Replace or insert a section or subsection wikitext within the full document wikitext.
 */
export function setSectionWikitext(key: string, sectionWikitext: string, fullWikitext: string): string {
    const trimmed = sectionWikitext.trim();
    const range = findSectionRange(key, fullWikitext);

    // 1. If found, replace its span
    if (range) {
        if (range.hasHeader) {
            const before = fullWikitext.substring(0, range.start);
            const after = fullWikitext.substring(range.end);
            const prefix = before.endsWith('\n') ? '' : '\n';
            return before + prefix + (trimmed ? trimmed + '\n\n' : '\n') + after.trimStart();
        } else {
            const before = fullWikitext.substring(0, range.start);
            const after = fullWikitext.substring(range.end);
            const prefix = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
            const suffix = after.length > 0 && !after.startsWith('\n') ? '\n' : '';
            return before + prefix + (trimmed ? trimmed + '\n' : '') + suffix + after.trimStart();
        }
    }

    // 2. Not found in wikitext; insert it
    const config = SECTION_CONFIGS[key];
    const headerTitle = config?.defaultHeaderTitle;

    if (key === 'articleState') {
        return (trimmed ? trimmed + '\n\n' : '') + fullWikitext.trimStart();
    }

    if (key === 'infobox') {
        const stateRange = findSectionRange('articleState', fullWikitext);
        if (stateRange) {
            const before = fullWikitext.substring(0, stateRange.end);
            const after = fullWikitext.substring(stateRange.end);
            return before + '\n\n' + trimmed + '\n\n' + after.trimStart();
        }
        return trimmed + '\n\n' + fullWikitext.trimStart();
    }

    if (headerTitle) {
        const editor = new PCGWEditor(fullWikitext);
        editor.replaceSectionContent(headerTitle, '\n' + trimmed + '\n', `== ${headerTitle} ==`);
        return editor.getText();
    }

    const needsNewline = fullWikitext.length > 0 && !fullWikitext.endsWith('\n');
    return fullWikitext + (needsNewline ? '\n\n' : '') + trimmed + '\n';
}
