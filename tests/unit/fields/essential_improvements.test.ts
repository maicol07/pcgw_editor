import { describe, it, expect } from 'vitest';
import { parseWikitext } from '../../../src/utils/parser';
import { PCGWEditor } from '../../../src/utils/wikitext';
import { GameData } from '../../../src/models/GameData';

describe('Field Group: Essential Improvements', () => {
    it('should parse Essential Improvements section', () => {
        const wikitext = `
==Essential improvements==
This is a test improvement.
* Bullet point 1
* Bullet point 2
`;
        const data = parseWikitext(wikitext);
        expect(data.essentialImprovements).toContain('This is a test improvement.');
        expect(data.essentialImprovements).toContain('* Bullet point 1');
    });

    it('should write Essential Improvements section', () => {
        const data = {
            essentialImprovements: 'Tests are important.\n* Yes they are.'
        } as GameData;

        const writer = new PCGWEditor('');
        writer.updateEssentialImprovements(data.essentialImprovements);
        const text = writer.getText();

        expect(text).toContain('Essential improvements');
        expect(text).toContain('Tests are important.');
    });
});
