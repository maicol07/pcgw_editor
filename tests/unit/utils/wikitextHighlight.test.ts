import { describe, it, expect } from 'vitest';
import { mediawikiLanguage } from '@bhsd/codemirror-wikitext';
import config from 'wikiparser-node/config/default.json';
import { highlightTree } from '@lezer/highlight';
import {
    wikitextHighlightLight,
    wikitextHighlightDark,
    getWikitextThemeExtensions
} from '../../../src/utils/wikitextHighlight';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

describe('wikitextHighlight', () => {
    const sampleText = [
        '== Header ==',
        '{{Infobox game|title=Doom|developer=id Software}}',
        '[[Main Page|Home]]',
        "'''Bold''' ''Italic''",
        '<ref name="test">Reference</ref>',
        '{|',
        '| Cell',
        '|}',
        '<!-- Comment -->'
    ].join('\n');

    it('generates highlight classes in light mode', () => {
        const lang = mediawikiLanguage(config as any);
        const tree = lang.parser.parse(sampleText);

        const highlightedTokens: Array<{ text: string; classes: string }> = [];
        highlightTree(tree, wikitextHighlightLight, (from, to, classes) => {
            highlightedTokens.push({
                text: sampleText.slice(from, to),
                classes
            });
        });

        expect(highlightedTokens.length).toBeGreaterThan(0);

        // Verify key syntax tokens are styled
        const hasTemplateBracket = highlightedTokens.some(t => t.text === '{{' && t.classes.length > 0);
        const hasTemplateName = highlightedTokens.some(t => t.text === 'Infobox game' && t.classes.length > 0);
        const hasTemplateArg = highlightedTokens.some(t => t.text === 'title=' && t.classes.length > 0);
        const hasHeader = highlightedTokens.some(t => t.text === '==' && t.classes.length > 0);
        const hasLink = highlightedTokens.some(t => t.text === 'Main Page' && t.classes.length > 0);
        const hasBold = highlightedTokens.some(t => t.text === 'Bold' && t.classes.length > 0);

        expect(hasTemplateBracket).toBe(true);
        expect(hasTemplateName).toBe(true);
        expect(hasTemplateArg).toBe(true);
        expect(hasHeader).toBe(true);
        expect(hasLink).toBe(true);
        expect(hasBold).toBe(true);
    });

    it('generates highlight classes in dark mode', () => {
        const lang = mediawikiLanguage(config as any);
        const tree = lang.parser.parse(sampleText);

        const highlightedTokens: Array<{ text: string; classes: string }> = [];
        highlightTree(tree, wikitextHighlightDark, (from, to, classes) => {
            highlightedTokens.push({
                text: sampleText.slice(from, to),
                classes
            });
        });

        expect(highlightedTokens.length).toBeGreaterThan(0);

        const hasTemplateBracket = highlightedTokens.some(t => t.text === '{{' && t.classes.length > 0);
        const hasTemplateName = highlightedTokens.some(t => t.text === 'Infobox game' && t.classes.length > 0);
        const hasTemplateArg = highlightedTokens.some(t => t.text === 'title=' && t.classes.length > 0);

        expect(hasTemplateBracket).toBe(true);
        expect(hasTemplateName).toBe(true);
        expect(hasTemplateArg).toBe(true);
    });

    it('returns appropriate extensions for light and dark modes with highlighting enabled or disabled', () => {
        const lightExts = getWikitextThemeExtensions(false, true);
        const darkExts = getWikitextThemeExtensions(true, true);
        const lightDisabled = getWikitextThemeExtensions(false, false);
        const darkDisabled = getWikitextThemeExtensions(true, false);

        expect(lightExts.length).toBe(1);
        expect(darkExts.length).toBe(2); // oneDarkTheme + syntaxHighlighting
        expect(lightDisabled.length).toBe(1); // emptyHighlightStyle
        expect(darkDisabled.length).toBe(2); // oneDarkTheme + emptyHighlightStyle
    });

    it('creates an EditorState without errors using theme extensions with highlighting disabled', () => {
        const lang = mediawikiLanguage(config as any);
        const stateLightDisabled = EditorState.create({
            doc: sampleText,
            extensions: [lang, ...getWikitextThemeExtensions(false, false)]
        });
        expect(stateLightDisabled.doc.toString()).toBe(sampleText);

        const stateDarkDisabled = EditorState.create({
            doc: sampleText,
            extensions: [lang, ...getWikitextThemeExtensions(true, false)]
        });
        expect(stateDarkDisabled.doc.toString()).toBe(sampleText);
    });

    it('creates an EditorState without errors using theme extensions', () => {
        const lang = mediawikiLanguage(config as any);
        const stateLight = EditorState.create({
            doc: sampleText,
            extensions: [lang, ...getWikitextThemeExtensions(false)]
        });
        expect(stateLight.doc.toString()).toBe(sampleText);

        const stateDark = EditorState.create({
            doc: sampleText,
            extensions: [lang, ...getWikitextThemeExtensions(true)]
        });
        expect(stateDark.doc.toString()).toBe(sampleText);

        const container = document.createElement('div');
        const view = new EditorView({
            state: stateDark,
            parent: container
        });
        expect(view.state.doc.toString()).toBe(sampleText);
        view.destroy();
    });
});
