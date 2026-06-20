// Shared rendering helpers for the WYSIWYG editor: turn the inline wiki tokens that the
// custom toolbar buttons produce into their visual HTML result.
// ponytail: splitArgs is duplicated from renderer.ts (a ~30-line pure helper) rather than
// refactoring the 800-line working preview renderer. Keep the two in sync if either changes.

/** Split template body on top-level `|`, respecting nested {{}} and [[]]. */
export const splitArgs = (text: string): string[] => {
    const args: string[] = [];
    let current = '';
    let depth = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if ((char === '{' && text[i + 1] === '{') || (char === '[' && text[i + 1] === '[')) {
            depth++;
            current += char + text[++i];
        } else if ((char === '}' && text[i + 1] === '}') || (char === ']' && text[i + 1] === ']')) {
            depth--;
            current += char + text[++i];
        } else if (char === '|' && depth === 0) {
            args.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    args.push(current);
    return args;
};

/** Parse a template body into {named params} + positional args. */
const parseArgs = (body: string): { params: Record<string, string>; positional: string[] } => {
    const params: Record<string, string> = {};
    const positional: string[] = [];
    for (const arg of splitArgs(body)) {
        const eq = arg.indexOf('=');
        if (eq > -1 && !/[{[]/.test(arg.slice(0, eq))) {
            params[arg.slice(0, eq).trim().toLowerCase()] = arg.slice(eq + 1).trim();
        } else if (arg.trim()) {
            positional.push(arg.trim());
        }
    }
    return { params, positional };
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const MORE_INFO_ICON = '<div title="More information" class="svg-icon svg-16 more-info"></div>';

/** Render an external link `[url text]` or plain text fragment to HTML. */
export const renderInlineFragment = (text: string): string => {
    return text.replace(/\[(https?:\/\/[^\s\]]+)\s+([^\]]+)\]/g,
        (_m, url, label) => `<a rel="nofollow" class="external text" href="${esc(url)}">${esc(label)}</a>`)
        .replace(/\[(https?:\/\/[^\s\]]+)\]/g,
            (_m, url) => `<a rel="nofollow" class="external text" href="${esc(url)}">${esc(url)}</a>`);
};

/**
 * Render the common inline wiki markup (bold, italic, internal/external links) of a text
 * fragment to HTML. Used for content embedded inside blocks (fixbox description/fix, mm items)
 * that is rendered out of the main converter pipeline.
 */
export const renderInlineMarkup = (text: string): string => {
    let h = text;
    h = h.replace(/'''(.*?)'''/g, '<strong>$1</strong>');
    h = h.replace(/''(.*?)''/g, '<em>$1</em>');
    h = h.replace(/\[(https?:\/\/[^\s\]]+)\s+([^\]]+)\]/g, '<a href="$1" rel="noopener noreferrer" target="_blank">$2</a>');
    h = h.replace(/\[(https?:\/\/[^\s\]]+)\]/g, '<a href="$1" rel="noopener noreferrer" target="_blank">$1</a>');
    h = h.replace(/\[\[([^|\]]+)\|?([^\]]*)\]\]/g, (_m, page, title) => `<a href="${page}">${title || page}</a>`);
    return h;
};

/**
 * Render a run of `{{mm}} item{{mm}} item` into the PCGW "more info" definition list.
 * Returns the inner `<dd>…</dd>` markup (caller wraps in the embed/<dl>).
 */
export const renderMmList = (wikitext: string): string => {
    return wikitext
        .split(/\{\{\s*mm\s*\}\}/i)
        .map(s => s.trim())
        .filter(Boolean)
        .map(item => `<dd>${MORE_INFO_ICON} ${renderInlineFragment(item)}</dd>`)
        .join('');
};

/**
 * Render one inline wiki token (the output of the citation / link / formatting buttons)
 * to its visual HTML. Returns null if `wikitext` isn't a recognised inline token.
 */
export const renderInlineToken = (wikitext: string): string | null => {
    const wt = wikitext.trim();

    // <ref>…</ref> — render the inner citation (or raw inner) as a reference marker
    const refMatch = wt.match(/^<ref(?:\s+name="[^"]*")?>([\s\S]*?)<\/ref>$/i);
    if (refMatch) {
        const inner = renderInlineToken(refMatch[1].trim());
        return `<sup class="reference" title="Reference">${inner ?? esc(refMatch[1].trim())}</sup>`;
    }

    // Interwiki / page links produced by the wlink button
    const wikiPage = wt.match(/^\[\[\s*Wikipedia\s*:\s*([^|\]]+?)\s*(?:\|\s*([^\]]*?))?\s*\]\]$/i)
        || wt.match(/^\[\[\s*w\s*\|\s*([^|\]]+?)\s*\]\]$/i);
    if (wikiPage) {
        const page = wikiPage[1].trim();
        const label = (wikiPage[2] ?? page).trim() || page;
        const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(page.replace(/\s+/g, '_'))}`;
        return `<a rel="nofollow" class="external text" href="${esc(url)}" title="Wikipedia: ${esc(page)}">${esc(label)}</a>`;
    }

    // Templates {{Name|…}}
    const tpl = wt.match(/^\{\{\s*([A-Za-z]+)\s*(?:\|([\s\S]*))?\}\}$/);
    if (!tpl) return null;
    const name = tpl[1].toLowerCase();
    const { params, positional } = parseArgs(tpl[2] ?? '');

    switch (name) {
        case 'refcheck':
            return `<span class="reference-text">Verified by <a rel="nofollow" class="external text" href="https://www.pcgamingwiki.com/wiki/User:${esc(params.user || '')}">User:${esc(params.user || '')}</a>${params.date ? ` on ${esc(params.date)}` : ''}${params.comment ? ` — ${esc(params.comment)}` : ''}</span>`;
        case 'refurl':
            return `<span class="reference-text"><a rel="nofollow" class="external text" href="${esc(params.url || '')}">${esc(params.title || params.url || '')}</a>${params.date ? ` - last accessed on ${esc(params.date)}` : ''}</span>`;
        case 'cn':
            return `<sup class="reference">[citation needed]</sup>`;
        case 'key':
            return positional.map(k => `<span class="keypress">${esc(k)}</span>`).join(' ');
        case 'u': // forum user link
            return `<a rel="nofollow" class="external text" href="https://community.pcgamingwiki.com/profile/${esc(positional[1] || '')}-${esc(positional[0] || '')}/">${esc(positional[0] || '')}</a>`;
        case 't': // template link
            return `<a class="wiki-link" href="/wiki/Template:${esc(positional[0] || '')}">{{${esc(positional[0] || '')}}}</a>`;
        default:
            return null;
    }
};
