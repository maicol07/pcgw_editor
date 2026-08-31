import { describe, it, expect } from 'vitest';
import { WikitextParser } from '../../../src/utils/WikitextParser';
import { PCGWEditor } from '../../../src/utils/wikitext';

describe('WikitextParser.removeSection', () => {
    it('removes level 2 section and its content until next section', () => {
        const text = `== Section 1 ==\nContent 1\n\n== Section 2 ==\nContent 2\n\n== Section 3 ==\nContent 3`;
        const parser = new WikitextParser(text);
        parser.removeSection('Section 2');
        const res = parser.getText();
        expect(res).toContain('== Section 1 ==');
        expect(res).toContain('Content 1');
        expect(res).not.toContain('Section 2');
        expect(res).not.toContain('Content 2');
        expect(res).toContain('== Section 3 ==');
        expect(res).toContain('Content 3');
    });

    it('removes section at end of text', () => {
        const text = `== Section 1 ==\nContent 1\n\n== Section 2 ==\nContent 2`;
        const parser = new WikitextParser(text);
        parser.removeSection('Section 2');
        const res = parser.getText();
        expect(res).toContain('== Section 1 ==');
        expect(res).not.toContain('Section 2');
    });
});

describe('PCGWEditor.removeSectionByKey', () => {
    it('removes availability section and template', () => {
        const text = `== Availability ==\n{{Availability\n|Steam|1234|Steam|}}\n\n== Video ==\n{{Video}}`;
        const editor = new PCGWEditor(text);
        editor.removeSectionByKey('availability');
        const res = editor.getText();
        expect(res).not.toContain('Availability');
        expect(res).toContain('== Video ==');
    });

    it('removes video section and template', () => {
        const text = `== Video ==\n{{Video\n|widescreen resolution=true\n}}\n\n== Input ==\n{{Input}}`;
        const editor = new PCGWEditor(text);
        editor.removeSectionByKey('video');
        const res = editor.getText();
        expect(res).not.toContain('Video');
        expect(res).toContain('== Input ==');
    });

    it('removes gameData section, configuration, and save game data', () => {
        const text = `== Game data ==\n=== Configuration file(s) location ===\n{{Game data/config|Windows}}\n=== Save game data location ===\n{{Game data/saves|Windows}}\n== Video ==`;
        const editor = new PCGWEditor(text);
        editor.removeSectionByKey('gameData');
        const res = editor.getText();
        expect(res).not.toContain('Game data');
        expect(res).not.toContain('Configuration file(s) location');
        expect(res).not.toContain('Save game data location');
        expect(res).toContain('== Video ==');
    });

    it('removes system requirements templates and section', () => {
        const text = `== System requirements ==\n{{System requirements\n|OS=Windows\n}}\n{{System requirements\n|OS=Linux\n}}\n== Localizations ==`;
        const editor = new PCGWEditor(text);
        editor.removeSectionByKey('systemReq');
        const res = editor.getText();
        expect(res).not.toContain('System requirements');
        expect(res).toContain('== Localizations ==');
    });
});
