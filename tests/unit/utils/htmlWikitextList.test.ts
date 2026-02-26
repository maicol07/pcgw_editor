import { describe, it, expect } from 'vitest';
import { wikitextToHtml, htmlToWikitext } from '../../../src/utils/htmlWikitextConverter';

describe('htmlWikitextConverter Lists', () => {
    it('converts bullet list to HTML correctly', () => {
        const wikitext = "* Item 1\n* Item 2";
        const html = wikitextToHtml(wikitext);
        console.log("Bullet HTML:", html);
        expect(html).toContain('<ul>');
        expect(html).not.toContain('<ol>');
    });

    it('converts numbered list to HTML correctly', () => {
        const wikitext = "# Item 1\n# Item 2";
        const html = wikitextToHtml(wikitext);
        console.log("Numbered HTML:", html);
        expect(html).toContain('<ol>');
        expect(html).not.toContain('<ul>');
    });
});
