import DOMPurify from 'dompurify';

// Wiki/preview HTML is rendered with v-html, so it must be sanitized first:
// strip <script>, on* handlers and javascript: URIs while keeping the wiki markup.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
        node.setAttribute('rel', 'noopener noreferrer');
    }
});

/** Sanitizes untrusted HTML before any v-html / innerHTML injection. */
export const sanitizeHtml = (html: string): string => DOMPurify.sanitize(html);

/**
 * Sanitizer for the WYSIWYG editor's wikitext->HTML output.
 *
 * wikitextToHtml() interleaves generated markup with attacker-controlled wikitext (any wiki
 * user can edit a page), so the result is HTML of mixed provenance and must be sanitized
 * before reaching innerHTML. The editor's round-trip depends on `data-wikitext` and
 * `contenteditable` surviving — a bare DOMPurify.sanitize() call would drop them and silently
 * break wikitext recovery, so both are allowlisted explicitly here.
 */
export const sanitizeEditorHtml = (html: string): string =>
    DOMPurify.sanitize(html, {
        ADD_ATTR: ['data-wikitext', 'contenteditable', 'target'],
        ADD_TAGS: ['dl', 'dd'],
    });
