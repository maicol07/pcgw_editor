import { describe, it, expect } from 'vitest';
import { parseWikitext } from '../parser';
import { PCGWEditor } from '../wikitext';

describe('Gallery Processing', () => {
    it('should parse <gallery> tags', () => {
        const wikitext = `
== Video ==
<gallery>
File:Image1.jpg|Caption 1
File:Image2.png|Caption 2
</gallery>
        `;
        const data = parseWikitext(wikitext);
        expect(data.galleries.video).toBeDefined();
        expect(data.galleries.video.length).toBe(2);
        expect(data.galleries.video[0].name).toBe('Image1.jpg');
        expect(data.galleries.video[0].caption).toBe('Caption 1');
    });

    it('should parse {{Gallery}} templates', () => {
        const wikitext = `
{{Gallery|content=
File:TplImage.jpg|Tpl Caption
}}
        `;
        const data = parseWikitext(wikitext);
        expect(data.galleries.video).toBeDefined();
        expect(data.galleries.video[0].name).toBe('TplImage.jpg');
    });

    it('should maintain round-trip consistency (writing back)', () => {
        const wikitext = `== Video ==\n<gallery>\nFile:Image1.jpg|Caption 1\n</gallery>`;
        const data = parseWikitext(wikitext);

        // Add a new image
        data.galleries.video.push({ name: 'NewImage.jpg', caption: 'New Caption' });

        const editor = new PCGWEditor(wikitext);
        editor.updateGalleries(data.galleries);

        const output = editor.getText();
        expect(output).toContain('<gallery>');
        expect(output).toContain('File:Image1.jpg|Caption 1');
        expect(output).toContain('File:NewImage.jpg|New Caption');
    });

    it('should parse single [[File:...]] tags', () => {
        const wikitext = `
== Video ==
[[File:SingleShot.jpg|thumb|Single Caption]]
        `;
        const data = parseWikitext(wikitext);
        expect(data.galleries.video).toBeDefined();
        const img = data.galleries.video.find(i => i.name === 'SingleShot.jpg');
        expect(img).toBeDefined();
        expect(img?.caption).toBe('Single Caption');
    });

    it('should avoid duplicates between gallery and single shots', () => {
        const wikitext = `
<gallery>
File:Dup.jpg|Gallery Caption
</gallery>
[[File:Dup.jpg|thumb|Single Caption]]
        `;
        const data = parseWikitext(wikitext);
        const dups = data.galleries.video.filter(i => i.name === 'Dup.jpg');
        expect(dups.length).toBe(1);
        expect(dups[0].caption).toBe('Gallery Caption'); // Gallery usually takes precedence
    });

    it('should parse {{Image|...}} templates', () => {
        const wikitext = `
== Video ==
{{Image|SingleShotTpl.png|Single Tpl Caption}}
        `;
        const data = parseWikitext(wikitext);
        expect(data.galleries.video).toBeDefined();
        const img = data.galleries.video.find(i => i.name === 'SingleShotTpl.png');
        expect(img).toBeDefined();
        expect(img?.caption).toBe('Single Tpl Caption');
    });
});
