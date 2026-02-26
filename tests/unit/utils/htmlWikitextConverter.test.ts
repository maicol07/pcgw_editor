import { describe, it, expect } from 'vitest';
import { wikitextToHtml, htmlToWikitext } from '../../../src/utils/htmlWikitextConverter';

describe('htmlWikitextConverter', () => {
    describe('wikitextToHtml', () => {
        it('should convert bold wikitext to strong html', () => {
            expect(wikitextToHtml("'''Bold Text'''")).toBe('<p><strong>Bold Text</strong></p>');
        });

        it('should convert italic wikitext to em html', () => {
            expect(wikitextToHtml("''Italic Text''")).toBe('<p><em>Italic Text</em></p>');
        });

        it('should convert underline, strikethrough, headers, and blockquotes', () => {
            expect(wikitextToHtml("<u>Underline</u>")).toBe('<p><u>Underline</u></p>');
            expect(wikitextToHtml("<s>Strike</s>")).toBe('<p><s>Strike</s></p>');
            expect(wikitextToHtml("== Header 2 ==")).toBe('<h2>Header 2</h2>');
            expect(wikitextToHtml("====== Header 6 ======")).toBe('<h6>Header 6</h6>');
            expect(wikitextToHtml("<blockquote>Quote</blockquote>")).toBe('<blockquote>Quote</blockquote>');
        });

        it('should convert simple links', () => {
            expect(wikitextToHtml("[https://example.com]")).toBe('<p><a href="https://example.com" rel="noopener noreferrer" target="_blank">https://example.com</a></p>');
            expect(wikitextToHtml("[https://example.com Example]")).toBe('<p><a href="https://example.com" rel="noopener noreferrer" target="_blank">Example</a></p>');
        });

        it('should convert lists', () => {
            const wikitext = `* Item 1\n* Item 2\n* Item 3`;
            const html = `<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>`;
            expect(wikitextToHtml(wikitext)).toBe(html);
        });

        it('should handle paragraphs', () => {
            const wikitext = "Paragraph 1\n\nParagraph 2";
            const html = "<p>Paragraph 1</p><p>Paragraph 2</p>";
            expect(wikitextToHtml(wikitext)).toBe(html);
        });
    });

    describe('htmlToWikitext', () => {
        it('should convert strong html to bold wikitext', () => {
            expect(htmlToWikitext("<strong>Bold Text</strong>")).toBe("'''Bold Text'''");
            expect(htmlToWikitext("<b>Bold Text</b>")).toBe("'''Bold Text'''");
        });

        it('should convert em html to italic wikitext', () => {
            expect(htmlToWikitext("<em>Italic Text</em>")).toBe("''Italic Text''");
            expect(htmlToWikitext("<i>Italic Text</i>")).toBe("''Italic Text''");
        });

        it('should convert underline, strikethrough, headers, and blockquotes', () => {
            expect(htmlToWikitext("<u>Underline</u>")).toBe("<u>Underline</u>");
            expect(htmlToWikitext("<s>Strike</s>")).toBe("<s>Strike</s>");
            expect(htmlToWikitext("<del>Strike</del>")).toBe("<s>Strike</s>");
            expect(htmlToWikitext("<h2>Header 2</h2>")).toBe("== Header 2 ==");
            expect(htmlToWikitext("<h6>Header 6</h6>")).toBe("====== Header 6 ======");
            expect(htmlToWikitext("<blockquote>Quote</blockquote>")).toBe("<blockquote>Quote</blockquote>");
        });

        it('should convert links', () => {
            expect(htmlToWikitext('<a href="https://example.com">Example</a>')).toBe("[https://example.com Example]");
            expect(htmlToWikitext('<a href="https://example.com" rel="noopener noreferrer" target="_blank">Example</a>')).toBe("[https://example.com Example]");
        });

        it('should convert lists', () => {
            const html = `<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>`;
            const wikitext = `* Item 1\n* Item 2\n* Item 3`;
            expect(htmlToWikitext(html)).toBe(wikitext);
        });

        it('should handle quill paragraphs', () => {
            const html = `<p>Paragraph 1</p><p>Paragraph 2</p>`;
            const wikitext = `Paragraph 1\n\nParagraph 2`;
            expect(htmlToWikitext(html)).toBe(wikitext);
        });

        it('should handle quill empty paragraphs', () => {
            const html = `<p><br></p>`;
            const wikitext = ``;
            expect(htmlToWikitext(html)).toBe(wikitext);
        });

        it('should handle internal links correctly', () => {
            expect(htmlToWikitext('<a href="Page">Page</a>')).toBe("[[Page|Page]]");
        });

        it('should handle complex mixed content', () => {
            const html = `<p>This is <strong>bold</strong> and <em>italic</em> text.</p><ul><li>List 1</li><li>List 2</li></ul><p>Next paragraph with <a href="https://test.com">a link</a>.</p>`;
            const expected = `This is '''bold''' and ''italic'' text.\n\n* List 1\n* List 2\nNext paragraph with [https://test.com a link].`;
            expect(htmlToWikitext(html)).toBe(expected);
        });
    });
});
