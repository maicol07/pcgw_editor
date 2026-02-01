import { describe, it, expect } from 'vitest';
import { WikitextParser } from './WikitextParser';
import { PCGWEditor } from './wikitext';

describe('WikitextParser - Core Functionality', () => {
    describe('findTemplate', () => {
        it('should find a simple template', () => {
            const parser = new WikitextParser('{{Video|ultrawidescreen = true}}');
            const result = parser.findTemplate('Video');

            expect(result).not.toBeNull();
            expect(result?.content).toBe('{{Video|ultrawidescreen = true}}');
        });

        it('should find a template with nested content', () => {
            const wikitext = `{{Infobox game
|developers = 
{{Infobox game/row/developer|Studio A}}
{{Infobox game/row/developer|Studio B}}
}}`;
            const parser = new WikitextParser(wikitext);
            const result = parser.findTemplate('Infobox game');

            expect(result).not.toBeNull();
            expect(result?.content).toContain('Studio A');
            expect(result?.content).toContain('Studio B');
        });

        it('should handle multiple levels of nesting', () => {
            const wikitext = `{{Outer|param1={{Inner|nested=value}}|param2=simple}}`;
            const parser = new WikitextParser(wikitext);
            const result = parser.findTemplate('Outer');

            expect(result).not.toBeNull();
            expect(result?.content).toBe(wikitext);
        });

        it('should return null for non-existent template', () => {
            const parser = new WikitextParser('{{Video|test=value}}');
            const result = parser.findTemplate('Audio');

            expect(result).toBeNull();
        });
    });

    describe('findParameter', () => {
        it('should find a simple parameter', () => {
            const parser = new WikitextParser('{{Video|ultrawidescreen = true|fps = 60}}');
            const result = parser.findParameter('Video', 'ultrawidescreen');

            expect(result).not.toBeNull();
            expect(parser.getText().substring(result!.valueStart, result!.valueEnd).trim()).toBe('true');
        });

        it('should find parameter with nested template value', () => {
            const wikitext = `{{Infobox game
|developers = 
{{Infobox game/row/developer|Studio A}}
|publishers = Test
}}`;
            const parser = new WikitextParser(wikitext);
            const result = parser.findParameter('Infobox game', 'developers');

            expect(result).not.toBeNull();
            const value = parser.getText().substring(result!.valueStart, result!.valueEnd);
            expect(value).toContain('Studio A');
        });

        it('should return null for non-existent parameter', () => {
            const parser = new WikitextParser('{{Video|ultrawidescreen = true}}');
            const result = parser.findParameter('Video', 'nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('setParameter', () => {
        it('should update an existing parameter', () => {
            const parser = new WikitextParser('{{Video|ultrawidescreen = true}}');
            parser.setParameter('Video', 'ultrawidescreen', 'false');

            expect(parser.getText()).toContain('ultrawidescreen = false');
        });

        it('should insert a new parameter', () => {
            const parser = new WikitextParser('{{Video|ultrawidescreen = true}}');
            parser.setParameter('Video', 'fps', '60');

            const text = parser.getText();
            expect(text).toContain('|fps = 60');
        });

        it('should preserve whitespace formatting', () => {
            const parser = new WikitextParser(`{{Video
|ultrawidescreen = true
}}`);
            parser.setParameter('Video', 'ultrawidescreen', 'false');

            const text = parser.getText();
            // Should still have newlines
            expect(text).toMatch(/\n\|ultrawidescreen = false\n/);
        });
    });

    describe('formatNestedRows', () => {
        it('should format developer rows correctly', () => {
            const parser = new WikitextParser('');
            const items = [
                { type: 'developer', name: 'Studio A' },
                { type: 'developer', name: 'Studio B' }
            ];

            const result = parser.formatNestedRows(items);

            expect(result).toContain('{{Infobox game/row/developer|Studio A}}');
            expect(result).toContain('{{Infobox game/row/developer|Studio B}}');
            expect(result.split('\n')).toHaveLength(2);
        });
    });

    describe('replaceSection', () => {
        it('should replace existing section content', () => {
            const wikitext = `==Introduction==\nOld content\n==Availability==\nStuff`;
            const parser = new WikitextParser(wikitext);

            parser.replaceSection('Introduction', 'New content');

            expect(parser.getText()).toContain('New content');
            expect(parser.getText()).not.toContain('Old content');
        });

        it('should create new section if not exists', () => {
            const wikitext = `==Introduction==\nContent`;
            const parser = new WikitextParser(wikitext);

            parser.replaceSection('New Section', 'New content');

            expect(parser.getText()).toContain('==New Section==');
            expect(parser.getText()).toContain('New content');
        });
    });
});

describe('PCGWEditor - PCGW Compliance', () => {
    describe('Whitespace Handling', () => {
        it('should NOT create line smashing', () => {
            const template = `{{Video
|ultrawidescreen = true
|fps = 60
}}`;
            const editor = new PCGWEditor(template);
            editor.setTemplateParam('Video', 'hdr', 'true');

            const result = editor.getText();

            // Should NOT have |param1=val|param2=val
            expect(result).not.toMatch(/\|[^|\n]+\|/);
            // Should have newlines between parameters
            expect(result).toMatch(/\n\|/);
        });

        it('should preserve proper formatting in nested templates', () => {
            const template = `{{Infobox game
|developers = 
{{Infobox game/row/developer|Studio A}}
|publishers = 
{{Infobox game/row/publisher|Publisher B}}
}}`;
            const editor = new PCGWEditor(template);
            editor.setTemplateParam('Infobox game', 'cover', 'image.jpg');

            const result = editor.getText();

            // Should still have nested templates on separate lines
            expect(result).toContain('\n{{Infobox game/row/developer|Studio A}}');
            expect(result).toContain('\n{{Infobox game/row/publisher|Publisher B}}');
        });
    });

    describe('Nested Template Integrity', () => {
        it('should not break nested developer rows', () => {
            const template = `{{Infobox game
|developers = 
{{Infobox game/row/developer|Dev1}}
{{Infobox game/row/developer|Dev2}}
|publishers = Test
}}`;
            const editor = new PCGWEditor(template);
            editor.setTemplateParam('Infobox game', 'cover', 'test.jpg');

            const result = editor.getText();

            // Both developers should still be present
            expect(result).toContain('Dev1');
            expect(result).toContain('Dev2');
            // Should have proper closing
            const openBraces = (result.match(/\{\{/g) || []).length;
            const closeBraces = (result.match(/\}\}/g) || []).length;
            expect(openBraces).toBe(closeBraces);
        });

        it('should correctly update availability rows', () => {
            const template = `{{Availability|
{{Availability/row| Steam | 12345 | Steam | DRM | Yes | Windows }}
}}`;
            const editor = new PCGWEditor(template);
            const availability = [{
                distribution: 'GOG',
                id: '67890',
                drm: 'DRM-free',
                notes: '',
                keys: 'No',
                os: 'Windows',
                state: 'normal'
            }];

            editor.updateAvailability(availability);
            const result = editor.getText();

            expect(result).toContain('GOG');
            expect(result).toContain('67890');
            expect(result).toContain('DRM-free');
        });
    });

    describe('Brace Counting', () => {
        it('should maintain correct brace balance', () => {
            const template = `{{Video|param={{Nested|value=test}}|other=simple}}`;
            const editor = new PCGWEditor(template);
            editor.setTemplateParam('Video', 'other', 'modified');

            const result = editor.getText();
            const openBraces = (result.match(/\{\{/g) || []).length;
            const closeBraces = (result.match(/\}\}/g) || []).length;

            expect(openBraces).toBe(closeBraces);
            expect(result).toContain('modified');
        });
    });

    describe('System Requirements Nesting', () => {
        it('should correctly update Windows requirements without affecting others', () => {
            const template = `{{System requirements
|OS=Windows
|minCPU = Old CPU
}}
{{System requirements
|OS=Linux
|minCPU = Linux CPU
}}`;
            const editor = new PCGWEditor(template);
            const requirements = {
                windows: {
                    minimum: { os: 'Windows 10', cpu: 'New CPU', ram: '8 GB', hdd: '50 GB', gpu: 'GTX 1060' },
                    recommended: { os: '', cpu: '', ram: '', hdd: '', gpu: '' },
                    notes: ''
                },
                linux: null,
                mac: null
            };

            editor.updateSystemRequirements(requirements);
            const result = editor.getText();

            // Windows should be updated
            expect(result).toContain('New CPU');
            expect(result).not.toContain('Old CPU');

            // Linux should remain unchanged
            expect(result).toContain('Linux CPU');
        });
    });
});

describe('Edge Cases', () => {
    it('should handle empty wikitext', () => {
        const editor = new PCGWEditor('');
        expect(editor.getText()).toBe('');
    });

    it('should handle template with no parameters', () => {
        const parser = new WikitextParser('{{SimpleTemplate}}');
        parser.setParameter('SimpleTemplate', 'newparam', 'value');

        expect(parser.getText()).toContain('|newparam = value');
    });

    it('should handle parameters with special characters', () => {
        const parser = new WikitextParser('{{Video|test = value}}');
        parser.setParameter('Video', 'test', 'value|with|pipes');

        expect(parser.getText()).toContain('value|with|pipes');
    });
});
