import { describe, it, expect } from 'vitest';
import { wikitextToHtml } from '../../../src/utils/htmlWikitextConverter';
import { renderInlineMarkup, renderMmList } from '../../../src/utils/wikiRender';
import { sanitizeEditorHtml } from '../../../src/utils/sanitize';

// Wikitext is attacker-controlled: any wiki user can edit a PCGW page, and the WYSIWYG editor
// feeds the converted HTML straight to innerHTML. These tests pin the hardening in place.
//
// NB: these assertions only mean something under jsdom. Under happy-dom DOMPurify silently
// drops the first top-level element, so every expectation here passed vacuously.

const XSS_PAYLOADS = [
    '<img src=x onerror=alert(1)>',
    '<script>alert(1)</script>',
    '<svg onload=alert(1)>',
    '<iframe src="javascript:alert(1)"></iframe>',
    '<a href="javascript:alert(1)">click</a>',
    '<body onload=alert(1)>',
];

describe('wikitextToHtml — XSS hardening', () => {
    it.each(XSS_PAYLOADS)('neutralises %s', (payload) => {
        const html = wikitextToHtml(payload);
        expect(html).not.toMatch(/<script/i);
        expect(html).not.toMatch(/\son\w+\s*=/i);
        expect(html).not.toMatch(/javascript:/i);
    });

    it('neutralises a payload smuggled through an external-link label', () => {
        const html = wikitextToHtml('[https://x.com <img src=x onerror=fetch("//evil")>]');
        expect(html).not.toMatch(/\sonerror\s*=/i);
        expect(html).not.toMatch(/evil/);
    });

    it('neutralises a payload inside a Fixbox description', () => {
        const html = wikitextToHtml('{{Fixbox|description=<img src=x onerror=alert(1)>|fix=ok}}');
        // The payload survives as inert escaped text; what must not exist is a real element.
        // (data-wikitext legitimately carries the percent-encoded source, hence the tag check.)
        expect(html).not.toMatch(/<img/i);
        expect(html).toContain('&lt;img');
    });
});

describe('wikitextToHtml — the editor round-trip must survive sanitisation', () => {
    it('keeps data-wikitext, its exact value, and the wrapper class on a Fixbox', () => {
        const source = "{{Fixbox|description=Do '''this'''|fix=Step one}}";
        const html = wikitextToHtml(source);

        expect(html).toContain('fixbox-wrapper');
        expect(html).toContain('contenteditable');
        expect(html).toContain('<strong>this</strong>');

        const m = html.match(/data-wikitext="([^"]+)"/);
        expect(m).not.toBeNull();
        // The editor recovers wikitext by decoding this attribute; it must be byte-identical.
        expect(decodeURIComponent(m![1])).toBe(source);
    });

    it('keeps data-wikitext intact when the source contains quotes, pipes and angle brackets', () => {
        const wt = 'a|b with "quotes" & <brackets>';
        const html = `<div class="fixbox-wrapper" contenteditable="false" data-wikitext="${encodeURIComponent(wt)}">x</div>`;
        const out = sanitizeEditorHtml(html);
        const m = out.match(/data-wikitext="([^"]+)"/);
        expect(m).not.toBeNull();
        expect(decodeURIComponent(m![1])).toBe(wt);
    });

    it('still renders ordinary wiki markup', () => {
        expect(wikitextToHtml("'''bold'''")).toContain('<strong>bold</strong>');
        expect(wikitextToHtml("''italic''")).toContain('<em>italic</em>');
        expect(wikitextToHtml('== Heading ==')).toContain('<h2>Heading</h2>');
        expect(wikitextToHtml('[https://example.com label]')).toContain('href="https://example.com"');
    });
});

describe('renderInlineMarkup / renderMmList — escape at source', () => {
    it('escapes injected HTML instead of emitting it', () => {
        const out = renderInlineMarkup('<img src=x onerror=alert(1)>');
        expect(out).not.toMatch(/<img/i);
        expect(out).toContain('&lt;img');
    });

    it('escapes a <script> tag', () => {
        const out = renderInlineMarkup('<script>alert(1)</script>');
        expect(out).not.toMatch(/<script/i);
        expect(out).toContain('&lt;script&gt;');
    });

    it('still renders bold, italic and links', () => {
        expect(renderInlineMarkup("'''b'''")).toContain('<strong>b</strong>');
        expect(renderInlineMarkup("''i''")).toContain('<em>i</em>');
        expect(renderInlineMarkup('[https://e.com x]')).toContain('href="https://e.com"');
    });

    it('escapes payloads in {{mm}} items', () => {
        const out = renderMmList('{{mm}} <img src=x onerror=alert(1)>');
        expect(out).not.toMatch(/<img/i);
        expect(out).toContain('&lt;img');
    });
});
