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

        it('should handle Fixbox templates', () => {
            const wikitextStandard = `{{Fixbox|description=Name|ref=<ref>Reference</ref>|fix=\n--instructions go here--\n}}`;
            const encodedWikitextStandard = encodeURIComponent(`{{Fixbox|description=Name|ref=<ref>Reference</ref>|fix=\n--instructions go here--\n}}`);
            const htmlStandard = `<div class="fixbox-wrapper" contenteditable="false" data-wikitext="${encodedWikitextStandard}"><table class="pcgwikitable fixbox"><tbody><tr><th class="fixbox-title"><div title="Fix" class="svg-icon svg-16 fixbox-icon"></div>Name<sup class="reference">Reference</sup></th></tr><tr><td class="fixbox-body"><p>--instructions go here--</p></td></tr></tbody></table></div>`;
            expect(wikitextToHtml(wikitextStandard)).toBe(htmlStandard);

            const wikitextOneLine = `{{Fixbox|description=Use windowed mode, see [[#Video|Video]].|ref=<ref>Reference</ref>}}`;
            const encodedWikitextOneLine = encodeURIComponent(`{{Fixbox|description=Use windowed mode, see <a href="#Video">Video</a>.|ref=<ref>Reference</ref>}}`);
            const htmlOneLine = `<div class="fixbox-wrapper" contenteditable="false" data-wikitext="${encodedWikitextOneLine}"><table class="pcgwikitable fixbox"><tbody><tr><th class="fixbox-title"><div title="Fix" class="svg-icon svg-16 fixbox-icon"></div>Use windowed mode, see <a href="#Video">Video</a>.<sup class="reference">Reference</sup></th></tr></tbody></table></div>`;
            expect(wikitextToHtml(wikitextOneLine)).toBe(htmlOneLine);

            const wikitextCollapsed = `{{Fixbox|description=Name|ref=<ref>Reference</ref>|collapsed=yes|fix=\n--instructions go here--\n}}`;
            const encodedWikitextCollapsed = encodeURIComponent(`{{Fixbox|description=Name|ref=<ref>Reference</ref>|collapsed=yes|fix=\n--instructions go here--\n}}`);
            const htmlCollapsed = `<div class="fixbox-wrapper" contenteditable="false" data-wikitext="${encodedWikitextCollapsed}"><table class="pcgwikitable fixbox mw-collapsible mw-collapsed mw-made-collapsible"><tbody><tr><th class="fixbox-title"><span class="mw-collapsible-toggle mw-collapsible-toggle-default mw-collapsible-toggle-collapsed" role="button" tabindex="0" aria-expanded="false"><a class="mw-collapsible-text">Expand</a></span><div title="Fix" class="svg-icon svg-16 fixbox-icon"></div>Name<sup class="reference">Reference</sup></th></tr><tr style="display: none;"><td class="fixbox-body"><p>--instructions go here--</p></td></tr></tbody></table></div>`;
            expect(wikitextToHtml(wikitextCollapsed)).toBe(htmlCollapsed);
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

        it('should handle Fixbox templates back to wikitext', () => {
            const encodedWikitextStandard = encodeURIComponent(`{{Fixbox|description=Name|ref=<ref>Reference</ref>|fix=\n--instructions go here--\n}}`);
            const htmlStandard = `<div class="fixbox-wrapper" contenteditable="false" data-wikitext="${encodedWikitextStandard}">\n<table class="pcgwikitable fixbox">\n  <tbody><tr>\n    <th class="fixbox-title"><div title="Fix" class="svg-icon svg-16 fixbox-icon"></div>Name<sup class="reference">Reference</sup>\n    </th>\n  </tr>\n<tr>\n    <td class="fixbox-body">\n<p>--instructions go here--\n</p>\n    </td>\n  </tr>\n</tbody></table>\n</div>`;
            const resultStandard = htmlToWikitext(htmlStandard);
            expect(resultStandard).toContain('{{Fixbox|description=Name|ref=<ref>Reference</ref>|fix=\n--instructions go here--\n}}');

            const htmlOneLine = `<table class="pcgwikitable fixbox">\n  <tbody><tr>\n    <th class="fixbox-title"><div title="Fix" class="svg-icon svg-16 fixbox-icon"></div>Use windowed mode.<sup class="reference">Reference</sup>\n    </th>\n  </tr>\n</tbody></table>`;
            // Keep one of them as a raw table to test the fallback parse mechanism in htmlToWikitext which is vital for old non-wrapped DOM pasting
            const resultOneLine = htmlToWikitext(htmlOneLine);
            expect(resultOneLine).toContain('{{Fixbox|description=Use windowed mode.|ref=<ref>Reference</ref>}}');

            const encodedWikitextCollapsed = encodeURIComponent(`{{Fixbox|description=Name|ref=<ref>Reference</ref>|collapsed=yes|fix=\n--instructions go here--\n}}`);
            const htmlCollapsed = `<div class="fixbox-wrapper" contenteditable="false" data-wikitext="${encodedWikitextCollapsed}">\n<table class="pcgwikitable fixbox mw-collapsible mw-collapsed mw-made-collapsible">\n  <tbody><tr>\n    <th class="fixbox-title"><span class="mw-collapsible-toggle mw-collapsible-toggle-default mw-collapsible-toggle-collapsed" role="button" tabindex="0" aria-expanded="false"><a class="mw-collapsible-text">Expand</a></span>\n<div title="Fix" class="svg-icon svg-16 fixbox-icon"></div>Name<sup class="reference">Reference</sup>\n    </th>\n  </tr>\n<tr style="display: none;">\n    <td class="fixbox-body">\n<p>--instructions go here--\n</p>\n    </td>\n  </tr>\n</tbody></table>\n</div>`;
            const resultCollapsed = htmlToWikitext(htmlCollapsed);
            expect(resultCollapsed).toContain('{{Fixbox|description=Name|ref=<ref>Reference</ref>|collapsed=yes|fix=\n--instructions go here--\n}}');
        });
    });
});
