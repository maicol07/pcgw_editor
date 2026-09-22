import { describe, it, expect } from 'vitest';
import { parseWikitext } from '../../../src/utils/parser';
import { PCGWEditor, generateWikitext } from '../../../src/utils/wikitext';
import { getSectionWikitext, setSectionWikitext } from '../../../src/utils/sectionWikitext';
import { renderWikitextToHtml } from '../../../src/utils/renderer';
import { initialGameData, type GameData } from '../../../src/models/GameData';

describe('Section: AI Usage', () => {
    describe('Parsing', () => {
        it('should parse real ai level from infobox', async () => {
            const wikitext = `
{{Infobox game
|cover = test.jpg
|real ai level = 3
}}
`;
            const data = await parseWikitext(wikitext);
            expect(data.infobox.realAiLevel).toBe('3');
        });

        it('should parse real ai level "unknown" and "0"', async () => {
            const wikitext0 = `{{Infobox game|real ai level=0}}`;
            const data0 = await parseWikitext(wikitext0);
            expect(data0.infobox.realAiLevel).toBe('0');

            const wikitextUnknown = `{{Infobox game|real ai level=unknown}}`;
            const dataUnknown = await parseWikitext(wikitextUnknown);
            expect(dataUnknown.infobox.realAiLevel).toBe('unknown');
        });

        it('should parse AI usage template categories', async () => {
            const wikitext = `
==Other information==
===AI usage===
{{AI usage
|code         = AI assisted pathfinding code
|2d graphics  = Upscaled textures via ESRGAN
|3d graphics  = None
|animation    = Motion synthesis
|audio        = Cleaned background noise
|speech       = Generated via TTS API<ref>https://example.com</ref>
|video        = Translated subtitles
|text         = Machine translated dialogue
|localization = Fan translation assisted by LLM
|concept      = Early concept brainstorming
}}

===API===
{{API}}
`;
            const data = await parseWikitext(wikitext);
            expect(data.ai.code).toBe('AI assisted pathfinding code');
            expect(data.ai.graphics2D).toBe('Upscaled textures via ESRGAN');
            expect(data.ai.graphics3D).toBe('None');
            expect(data.ai.animation).toBe('Motion synthesis');
            expect(data.ai.audio).toBe('Cleaned background noise');
            expect(data.ai.speech).toBe('Generated via TTS API<ref>https://example.com</ref>');
            expect(data.ai.video).toBe('Translated subtitles');
            expect(data.ai.text).toBe('Machine translated dialogue');
            expect(data.ai.localization).toBe('Fan translation assisted by LLM');
            expect(data.ai.concept).toBe('Early concept brainstorming');
        });
    });

    describe('Wikitext Generation', () => {
        it('should update real ai level in infobox', () => {
            const initial = `{{Infobox game\n|cover = test.jpg\n}}`;
            const editor = new PCGWEditor(initial);
            editor.updateInfobox({ ...initialGameData.infobox, cover: 'test.jpg', realAiLevel: '4' });
            const result = editor.getText();
            expect(result).toContain('|real ai level = 4');
        });

        it('should remove real ai level from infobox when empty', () => {
            const initial = `{{Infobox game\n|cover = test.jpg\n|real ai level = 3\n}}`;
            const editor = new PCGWEditor(initial);
            editor.updateInfobox({ ...initialGameData.infobox, cover: 'test.jpg', realAiLevel: '' });
            const result = editor.getText();
            expect(result).not.toContain('real ai level');
        });

        it('should insert AI usage at beginning of Other information before API', () => {
            const initial = `
==Other information==
===API===
{{API
|direct3d versions = 11
}}
`;
            const editor = new PCGWEditor(initial);
            editor.updateAiUsage({
                code: 'Pathfinding code',
                speech: 'TTS voices',
            });
            const result = editor.getText();
            expect(result).toContain('===AI usage===');
            expect(result).toContain('{{AI usage');
            expect(result).toContain('|code');
            expect(result).toContain('Pathfinding code');
            expect(result).toContain('|speech');
            expect(result).toContain('TTS voices');

            // AI usage must precede API
            const aiIdx = result.indexOf('===AI usage===');
            const apiIdx = result.indexOf('===API===');
            expect(aiIdx).toBeGreaterThan(-1);
            expect(apiIdx).toBeGreaterThan(aiIdx);
        });

        it('should integrate AI usage via generateWikitext', () => {
            const gameData: GameData = {
                ...initialGameData,
                infobox: {
                    ...initialGameData.infobox,
                    cover: 'Game.jpg',
                    realAiLevel: '2',
                },
                ai: {
                    ...initialGameData.ai,
                    concept: 'Brainstorming enemy types',
                },
            };

            const result = generateWikitext(gameData, '');
            expect(result).toContain('|real ai level = 2');
            expect(result).toContain('===AI usage===');
            expect(result).toContain('|concept');
            expect(result).toContain('Brainstorming enemy types');
        });

        it('should delete other.ai section cleanly', () => {
            const initial = `
==Other information==
===AI usage===
{{AI usage
|code = test
}}

===API===
{{API}}
`;
            const editor = new PCGWEditor(initial);
            editor.removeSectionByKey('other.ai');
            const result = editor.getText();
            expect(result).not.toContain('AI usage');
            expect(result).toContain('==Other information==');
            expect(result).toContain('===API===');
        });

        it('should delete entire other section including AI usage', () => {
            const initial = `
==Other information==
===AI usage===
{{AI usage
|code = test
}}

===API===
{{API}}

===Middleware===
{{Middleware}}
`;
            const editor = new PCGWEditor(initial);
            editor.removeSectionByKey('other');
            const result = editor.getText();
            expect(result).not.toContain('Other information');
            expect(result).not.toContain('AI usage');
            expect(result).not.toContain('API');
            expect(result).not.toContain('Middleware');
        });
    });

    describe('Section Wikitext Isolation', () => {
        it('should extract other.ai content using getSectionWikitext', () => {
            const wikitext = `
==Other information==
===AI usage===
{{AI usage
|code = Generated shader
}}

===API===
{{API}}
`;
            const section = getSectionWikitext('other.ai', wikitext, initialGameData);
            expect(section).toContain('{{AI usage');
            expect(section).toContain('Generated shader');
            expect(section).not.toContain('===API===');
        });

        it('should update other.ai section using setSectionWikitext', () => {
            const wikitext = `
==Other information==
===AI usage===
{{AI usage
|code = Old code
}}

===API===
{{API}}
`;
            const newAi = `{{AI usage\n|code = Updated code\n}}`;
            const updated = setSectionWikitext('other.ai', newAi, wikitext);
            expect(updated).toContain('Updated code');
            expect(updated).not.toContain('Old code');
            expect(updated).toContain('===API===');
        });
    });

    describe('Preview Rendering', () => {
        it('should render AI usage table with rating, badge image, and category details', () => {
            const wikitext = `
{{Infobox game
|real ai level = 1
}}

==Other information==
===AI usage===
{{AI usage
|audio = Noise reduction
}}
`;
            const html = renderWikitextToHtml(wikitext);
            expect(html).toContain('id="table-ai-usage"');
            expect(html).toContain('class="table-ai-usage-badge"');
            expect(html).toContain('Level 1: Automation');
            expect(html).toContain('Noise reduction');
            expect(html).toContain('Audio');
        });
    });

    describe('Schema Configuration', () => {
        it('should configure AI categories as WysiwygEditor with icons', async () => {
            const { fieldsConfig, realAiLevelOptions } = await import('../../../src/config/fields');
            const aiSection = fieldsConfig.find(s => s.id === 'ai');
            expect(aiSection).toBeDefined();

            // Check realAiLevelOptions have badges and explanations
            const level1 = realAiLevelOptions.find(opt => opt.value === '1');
            expect(level1).toBeDefined();
            expect(level1?.image).toBeDefined();
            expect(level1?.explanation).toBeDefined();
            expect(level1?.explanation?.length).toBeGreaterThan(10);

            // Every option must have explanation
            for (const opt of realAiLevelOptions) {
                expect(opt.explanation).toBeDefined();
            }

            // Check implementation categories
            const group = aiSection?.groups?.find(g => g.title === 'Implementation Categories');
            expect(group).toBeDefined();
            expect(group?.fields.length).toBe(10);

            for (const field of group!.fields) {
                expect(field.component).toBe('WysiwygEditor');
                expect(field.icon).toBeDefined();
                expect(field.iconClass).toBeDefined();
            }
        });
    });

    describe('AI Note & Fixbox AI Integration', () => {
        it('should render 15px badge for AI note level >= 3', async () => {
            const { renderInlineToken } = await import('../../../src/utils/wikiRender');
            const html3 = renderInlineToken('{{AI note|level=3}}');
            expect(html3).toContain('ai-note-badge');
            expect(html3).toContain('real-ai-3');
            expect(html3).toContain('width: 15px');

            const html4 = renderInlineToken('{{AI note|level=4|hover=Generated content}}');
            expect(html4).toContain('real-ai-4');
            expect(html4).toContain('Generated content');

            const html5 = renderInlineToken('{{AI note|level=5|ref=<ref>https://pcgamingwiki.com</ref>}}');
            expect(html5).toContain('real-ai-5');
            expect(html5).toContain('https://pcgamingwiki.com');
        });

        it('should render nothing for AI note level < 3 as per PCGW specification', async () => {
            const { renderInlineToken } = await import('../../../src/utils/wikiRender');
            expect(renderInlineToken('{{AI note|level=1}}')).toBe('');
            expect(renderInlineToken('{{AI note|level=2}}')).toBe('');
            expect(renderInlineToken('{{AI note|level=0}}')).toBe('');
        });

        it('should support named shared references <ref name="..." /> in renderInlineToken', async () => {
            const { renderInlineToken } = await import('../../../src/utils/wikiRender');
            const rendered = renderInlineToken('<ref name="mod-ai" />');
            expect(rendered).toContain('[mod-ai]');
        });

        it('should render AI note inside Fixbox header via wikitextToHtml', async () => {
            const { wikitextToHtml } = await import('../../../src/utils/htmlWikitextConverter');
            const wt = `{{Fixbox|description=Stuttering fix|ai={{AI note|level=4}}|fix=Set framerate cap.}}`;
            const html = wikitextToHtml(wt);
            expect(html).toContain('fixbox-wrapper');
            expect(html).toContain('Stuttering fix');
            expect(html).toContain('real-ai-4');
            expect(html).toContain('fixbox-title');
        });

        it('should parse and serialize ainote in useReferences', async () => {
            const { useReferences } = await import('../../../src/composables/useReferences');
            const { parseReferences, serializeReferences } = useReferences();

            const parsed = parseReferences('{{AI note|level=3|hover=Assisted fix}}');
            expect(parsed.length).toBe(1);
            expect(parsed[0].type).toBe('ainote');
            expect(parsed[0].params.level).toBe('3');
            expect(parsed[0].params.hover).toBe('Assisted fix');

            const serialized = serializeReferences([parsed[0]]);
            expect(serialized).toBe('{{AI note|level=3|hover=Assisted fix}}');
        });
    });
});
