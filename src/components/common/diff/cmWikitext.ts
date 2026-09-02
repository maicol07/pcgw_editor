// Shared CodeMirror extensions for diff/merge views — mirrors CodeEditor.vue setup.
import { EditorView } from '@codemirror/view';
import { mediawiki } from '@bhsd/codemirror-wikitext';
import { getWikitextThemeExtensions } from '../../../utils/wikitextHighlight';
import config from 'wikiparser-node/config/default.json';

export const isDark = () => document.documentElement.classList.contains('dark');

const baseTheme = EditorView.theme({
    '&': { height: '100%', fontSize: '14px' },
    '.cm-scroller': {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    },
});

// Extensions shared by every pane. `dark` toggles the dark theme and `highlight` toggles custom syntax highlighting.
export function wikitextExtensions(dark = isDark(), highlight?: boolean) {
    const enableHighlight = highlight !== undefined
        ? highlight
        : (typeof localStorage !== 'undefined' ? localStorage.getItem('diffSyntaxHighlighting') !== 'false' : true);
    return [
        mediawiki(config as any),
        EditorView.lineWrapping,
        baseTheme,
        ...getWikitextThemeExtensions(dark, enableHighlight),
    ];
}

