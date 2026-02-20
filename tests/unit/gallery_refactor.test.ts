import { describe, it, expect } from 'vitest';
import { PCGWEditor } from '../../src/utils/wikitext';
import { parseWikitext } from '../../src/utils/parser';

describe('Gallery Refactor', () => {
    describe('Parsing', () => {
        it('should extract images from specific sections', () => {
            const wikitext = `
==Video==
{{Image|Video1.jpg|Caption1}}
{{Video|}}
<gallery>
Video2.jpg|Caption2
</gallery>

==Input==
{{Image|Input1.jpg}}
{{Input|}}
`;
            const data = parseWikitext(wikitext);

            expect(data.galleries).toBeDefined();
            expect(data.galleries['video']).toBeDefined();
            expect(data.galleries['video']).toHaveLength(2);
            expect(data.galleries['video'][0].name).toBe('Video1.jpg');
            expect(data.galleries['video'][0].position).toBe('lateral');
            expect(data.galleries['video'][1].name).toBe('Video2.jpg');
            expect(data.galleries['video'][1].position).toBe('gallery');

            expect(data.galleries['input']).toBeDefined();
            expect(data.galleries['input']).toHaveLength(1);
            expect(data.galleries['input'][0].name).toBe('Input1.jpg');
            expect(data.galleries['input'][0].position).toBe('lateral');
        });

        it('should assign lateral position to [[File]] links', () => {
            const wikitext = `==Video==\n[[File:Test.jpg|thumb|right|Caption]]`;
            const data = parseWikitext(wikitext);
            expect(data.galleries['video'][0].position).toBe('lateral');
        });
    });

    describe('Generation', () => {
        it('should format lateral images as {{Image}} and rest as <gallery>', () => {
            const wikitext = `==Video==\n{{Video|}}`;
            const editor = new PCGWEditor(wikitext);

            editor.updateSectionImages('Video', [
                { name: '1.jpg', caption: 'C1', position: 'lateral' },
                { name: '2.jpg', caption: 'C2', position: 'lateral' }, // Max 2 lateral
                { name: '3.jpg', caption: 'C3', position: 'gallery' },
                { name: '4.jpg', caption: 'C4', position: 'lateral' }, // Overflow lateral -> formatted as gallery?
            ]);

            const text = editor.getText();
            expect(text).toContain('{{Image|1.jpg|C1}}');
            expect(text).toContain('{{Image|2.jpg|C2}}');
            expect(text).toContain('<gallery>\n3.jpg|C3\n4.jpg|C4\n</gallery>'); // 4.jpg pushed to gallery due to limit

            expect(text.indexOf('{{Image|1.jpg|C1}}')).toBeLessThan(text.indexOf('{{Video|}}'));
            expect(text.indexOf('{{Video|}}')).toBeLessThan(text.indexOf('<gallery>'));
        });

        it('should handle only gallery images', () => {
            const wikitext = `==Video==\n{{Video|}}`;
            const editor = new PCGWEditor(wikitext);

            editor.updateSectionImages('Video', [
                { name: '1.jpg', caption: 'C1', position: 'gallery' }
            ]);

            const text = editor.getText();
            expect(text).not.toContain('{{Image}}');
            expect(text).toContain('<gallery>\n1.jpg|C1\n</gallery>');
        });

        it('should handle manual lateral choice (even if not first in array)', () => {
            const wikitext = `==Video==\n{{Video|}}`;
            const editor = new PCGWEditor(wikitext);

            editor.updateSectionImages('Video', [
                { name: '1.jpg', caption: 'C1', position: 'gallery' },
                { name: '2.jpg', caption: 'C2', position: 'lateral' }
            ]);

            const text = editor.getText();
            expect(text).toContain('{{Image|2.jpg|C2}}');
            expect(text).toContain('<gallery>\n1.jpg|C1\n</gallery>');
        });

        it('should handle only 1 image', () => {
            const wikitext = `==Video==\n{{Video|}}`;
            const editor = new PCGWEditor(wikitext);

            editor.updateSectionImages('Video', [
                { name: '1.jpg', caption: 'C1', position: 'lateral' }
            ]);

            const text = editor.getText();
            expect(text).toContain('{{Image|1.jpg|C1}}');
            expect(text).not.toContain('<gallery>');
        });

        it('should replace existing images', () => {
            const wikitext = `==Video==
{{Image|Old1.jpg}}
{{Video|}}
<gallery>
Old2.jpg
</gallery>
`;
            const editor = new PCGWEditor(wikitext);
            editor.updateSectionImages('Video', [
                { name: 'New1.jpg', caption: 'C1', position: 'lateral' }
            ]);

            const text = editor.getText();
            expect(text).toContain('{{Image|New1.jpg|C1}}');
            expect(text).not.toContain('Old1.jpg');
            expect(text).not.toContain('Old2.jpg');
            expect(text).not.toContain('<gallery>');
        });
    });
});
