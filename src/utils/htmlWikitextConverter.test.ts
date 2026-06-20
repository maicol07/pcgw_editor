import { describe, it, expect } from 'vitest';
import { wikitextToHtml, htmlToWikitext } from './htmlWikitextConverter';

/** Round-trip: wikitext -> editor HTML -> wikitext should be stable for rendered tokens. */
const roundtrip = (wt: string) => htmlToWikitext(wikitextToHtml(wt));

describe('wikitextToHtml rendering', () => {
    it('renders a {{mm}} run as a more-info definition list with external links', () => {
        const html = wikitextToHtml('{{mm}} [https://discord.gg/x Developer Discord server]{{mm}} [https://steam/y Steam Community Discussions]');
        expect(html).toContain('<dl>');
        expect(html).toMatch(/class="svg-icon svg-16 more-info"/);
        expect(html).toContain('href="https://discord.gg/x"');
        expect(html).toContain('Developer Discord server');
        expect((html.match(/<dd>/g) || []).length).toBe(2);
    });

    it('renders citation/key/wlink tokens (not raw wikitext)', () => {
        expect(wikitextToHtml('{{Refcheck|user=Bob|date=2024-01-01}}')).toContain('Verified by');
        expect(wikitextToHtml('{{Key|Esc}}')).toContain('keypress');
        expect(wikitextToHtml('{{cn|date=2024}}')).toContain('citation needed');
        expect(wikitextToHtml('[[w|Quake]]')).toContain('en.wikipedia.org/wiki/Quake');
    });

    it('renders a Fixbox reference that contains a nested template (the bug)', () => {
        const html = wikitextToHtml('{{Fixbox|description=Do the thing|ref=<ref>{{Refurl|url=https://x.com|title=Source|date=2024-01-01}}</ref>}}');
        expect(html).toContain('fixbox-wrapper');
        expect(html).toContain('Do the thing');
        // The ref renders as a real link, not raw {{Refurl}} text
        expect(html).toContain('href="https://x.com"');
        expect(html).not.toContain('{{Refurl');
    });

    it('leaves plain internal links and external links to native rendering', () => {
        expect(wikitextToHtml('[[Half-Life]]')).toContain('<a href="Half-Life"');
        expect(wikitextToHtml('[https://x.com text]')).toContain('href="https://x.com"');
    });
});

describe('round-trip stability', () => {
    it.each([
        '{{Refcheck|user=Bob|date=2024-01-01}}',
        '{{Refurl|url=https://x.com|title=Source|date=2024-01-01}}',
        '{{cn|date=2024}}',
        '{{Key|Ctrl|C}}',
        '[[w|Quake]]',
        '[[Wikipedia:Doom (1993 video game)|Doom]]',
        '<ref>{{Refcheck|user=Bob|date=2024-01-01}}</ref>',
        '{{Fixbox|description=Do the thing|ref=<ref>{{Refurl|url=https://x.com|title=Source|date=2024-01-01}}</ref>}}',
        '{{mm}} [https://discord.gg/x Developer Discord server]{{mm}} [https://steam/y Steam Discussions]',
    ])('preserves %s', (wt) => {
        expect(roundtrip(wt).trim()).toBe(wt);
    });
});
