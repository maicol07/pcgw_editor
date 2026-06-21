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
