// Shared CodeMirror extensions for diff/merge views — mirrors CodeEditor.vue setup.
import { EditorView } from '@codemirror/view';
import { mediawiki } from '@bhsd/codemirror-wikitext';
import { oneDark } from '@codemirror/theme-one-dark';
// @ts-ignore - JSON import
import config from 'wikiparser-node/config/default.json';

export const isDark = () => document.documentElement.classList.contains('dark');

const baseTheme = EditorView.theme({
    '&': { height: '100%', fontSize: '14px' },
    '.cm-scroller': {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    },
});

// Extensions shared by every pane. `dark` toggles the oneDark theme.
export function wikitextExtensions(dark = isDark()) {
    const exts = [mediawiki(config as any), EditorView.lineWrapping, baseTheme];
    if (dark) exts.push(oneDark);
    return exts;
}
