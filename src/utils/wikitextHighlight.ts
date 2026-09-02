import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { oneDarkTheme } from '@codemirror/theme-one-dark';
import type { Extension } from '@codemirror/state';

export const wikitextHighlightLight = HighlightStyle.define([
    // Templates: {{templateName|param=value}}
    { tag: tags.definition(tags.variableName), color: '#2563eb', fontWeight: 'bold' },
    { tag: tags.special(tags.variableName), color: '#b45309' },
    { tag: tags.local(tags.variableName), color: '#7c3aed' },

    // Parser functions: {{#if:...}}
    { tag: tags.operatorKeyword, color: '#9333ea', fontWeight: 'bold' },

    // Links: [[Page|Label]], [https://...]
    { tag: tags.url, color: '#0284c7' },
    { tag: tags.link, color: '#0369a1', textDecoration: 'underline' },

    // Headings, apostrophes, lists, hr
    { tag: tags.processingInstruction, color: '#9ca3af' },
    { tag: tags.strong, fontWeight: 'bold', color: '#111827' },
    { tag: tags.emphasis, fontStyle: 'italic', color: '#374151' },

    // HTML & Ext tags: <ref>, <div>, <nowiki>
    { tag: tags.tagName, color: '#7c3aed' },
    { tag: tags.definition(tags.attributeName), color: '#0f766e' },
    { tag: tags.attributeValue, color: '#15803d' },

    // Tables: {| ... |}
    { tag: tags.special(tags.string), color: '#b45309', fontWeight: 'bold' },

    // Comments & Entities
    { tag: tags.comment, color: '#6b7280', fontStyle: 'italic' },
    { tag: tags.character, color: '#d97706' },
    { tag: tags.labelName, color: '#4f46e5', fontWeight: 'bold' },
    { tag: tags.invalid, color: '#dc2626', backgroundColor: '#fee2e2' },

    // Generic code fallbacks (for <pre>, <syntaxhighlight>)
    { tag: tags.keyword, color: '#9333ea' },
    { tag: tags.string, color: '#15803d' },
    { tag: tags.number, color: '#b45309' },
]);

export const wikitextHighlightDark = HighlightStyle.define([
    // Templates: {{templateName|param=value}}
    { tag: tags.definition(tags.variableName), color: '#e5c07b', fontWeight: 'bold' },
    { tag: tags.special(tags.variableName), color: '#e06c75' },
    { tag: tags.local(tags.variableName), color: '#c678dd' },

    // Parser functions: {{#if:...}}
    { tag: tags.operatorKeyword, color: '#c678dd', fontWeight: 'bold' },

    // Links: [[Page|Label]], [https://...]
    { tag: tags.url, color: '#56b6c2' },
    { tag: tags.link, color: '#56b6c2', textDecoration: 'underline' },

    // Headings, apostrophes, lists, hr
    { tag: tags.processingInstruction, color: '#7d8799' },
    { tag: tags.strong, fontWeight: 'bold', color: '#f3f4f6' },
    { tag: tags.emphasis, fontStyle: 'italic', color: '#e5c07b' },

    // HTML & Ext tags: <ref>, <div>, <nowiki>
    { tag: tags.tagName, color: '#c678dd' },
    { tag: tags.definition(tags.attributeName), color: '#d19a66' },
    { tag: tags.attributeValue, color: '#98c379' },

    // Tables: {| ... |}
    { tag: tags.special(tags.string), color: '#e5c07b', fontWeight: 'bold' },

    // Comments & Entities
    { tag: tags.comment, color: '#7d8799', fontStyle: 'italic' },
    { tag: tags.character, color: '#d19a66' },
    { tag: tags.labelName, color: '#61afef', fontWeight: 'bold' },
    { tag: tags.invalid, color: '#ff5370', backgroundColor: 'rgba(255, 83, 112, 0.15)' },

    // Generic code fallbacks (for <pre>, <syntaxhighlight>)
    { tag: tags.keyword, color: '#c678dd' },
    { tag: tags.string, color: '#98c379' },
    { tag: tags.number, color: '#d19a66' },
]);

const emptyHighlightStyle = HighlightStyle.define([]);

/**
 * Returns CodeMirror theme & syntax highlighting extensions for the given mode and highlighting preference.
 */
export function getWikitextThemeExtensions(isDark: boolean, enableHighlighting = true): Extension[] {
    const extensions: Extension[] = [];
    if (isDark) {
        extensions.push(oneDarkTheme);
    }
    if (enableHighlighting) {
        extensions.push(syntaxHighlighting(isDark ? wikitextHighlightDark : wikitextHighlightLight));
    } else {
        extensions.push(syntaxHighlighting(emptyHighlightStyle));
    }
    return extensions;
}
