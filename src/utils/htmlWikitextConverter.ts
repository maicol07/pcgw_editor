import { renderInlineToken, renderMmList, renderInlineMarkup, splitArgs } from './wikiRender';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Wrap rendered HTML in an atomic, editable-via-dialog inline chip carrying its source. */
const chip = (wt: string, inner: string) =>
    `<span class="wiki-token" contenteditable="false" data-wikitext="${encodeURIComponent(wt)}">${inner}</span>`;

/**
 * Replace every top-level `{{Name|…}}` whose name matches `nameRe`, using balanced brace
 * scanning so nested templates (e.g. {{Refcheck|…{{Code|x}}…}}) stay intact.
 */
const replaceBalancedTemplates = (text: string, nameRe: RegExp, fn: (full: string) => string): string => {
    let out = '';
    let i = 0;
    while (i < text.length) {
        if (text[i] === '{' && text[i + 1] === '{') {
            let depth = 0;
            let j = i;
            for (; j < text.length; j++) {
                if (text[j] === '{' && text[j + 1] === '{') { depth++; j++; }
                else if (text[j] === '}' && text[j + 1] === '}') { depth--; j++; if (depth === 0) { j++; break; } }
            }
            const full = text.slice(i, j);
            const nameMatch = full.match(/^\{\{\s*([A-Za-z]+)/);
            if (nameMatch && nameRe.test(nameMatch[1])) {
                out += fn(full);
                i = j;
                continue;
            }
        }
        out += text[i];
        i++;
    }
    return out;
};

/** Render a single balanced `{{Fixbox|…}}` to its table, preserving the verbatim source. */
const renderFixbox = (full: string): string => {
    const inner = full.replace(/^\{\{\s*Fixbox\s*\|/i, '').replace(/\}\}$/, '');
    let description = '';
    let ref = '';
    let fix = '';
    let collapsed = false;
    for (const part of splitArgs(inner)) {
        const eq = part.indexOf('=');
        if (eq > -1 && !/[{[]/.test(part.slice(0, eq))) {
            const key = part.slice(0, eq).trim();
            const val = part.slice(eq + 1).trim();
            if (key === 'description') description = val;
            else if (key === 'ref') ref = val;
            else if (key === 'collapsed') collapsed = val.toLowerCase() === 'yes';
            else if (key === 'fix') fix = val;
        } else if (part.trim() && !description) {
            description = part.trim();
        }
    }

    let refHtml = '';
    if (ref) {
        const innerRef = ref.replace(/^(?:<ref(?:\s+[^>]+)?>|&lt;ref(?:\s+[^&]+)?&gt;)([\s\S]*?)(?:<\/ref>|&lt;\/ref&gt;)$/i, '$1').trim();
        refHtml = `<sup class="reference">${renderInlineToken(innerRef) ?? esc(innerRef)}</sup>`;
    }

    let htmlOut = `<div class="fixbox-wrapper" contenteditable="false" data-wikitext="${encodeURIComponent(full)}"><table class="pcgwikitable fixbox${collapsed ? ' mw-collapsible mw-collapsed mw-made-collapsible' : ''}"><tbody><tr><th class="fixbox-title">`;
    if (collapsed) {
        htmlOut += `<span class="mw-collapsible-toggle mw-collapsible-toggle-default mw-collapsible-toggle-collapsed" role="button" tabindex="0" aria-expanded="false"><a class="mw-collapsible-text">Expand</a></span>`;
    }
    htmlOut += `<div title="Fix" class="svg-icon svg-16 fixbox-icon"></div>${renderInlineMarkup(description)}${refHtml}</th></tr>`;
    if (fix && fix.trim() !== '') {
        htmlOut += `<tr${collapsed ? ' style="display: none;"' : ''}><td class="fixbox-body"><p>${renderInlineMarkup(fix.trim())}</p></td></tr>`;
    }
    htmlOut += `</tbody></table></div>`;
    return htmlOut;
};

export const wikitextToHtml = (wikitext: string): string => {
    if (!wikitext) return '';
    let html = wikitext;

    // Fixboxes first (balanced) so an inner ref=<ref>…</ref> isn't chip-ified before the box renders
    html = replaceBalancedTemplates(html, /^Fixbox$/i, renderFixbox);

    // {{mm}} "more info" runs -> block embed (verbatim source preserved in data-wikitext)
    html = html.replace(/(?:\{\{\s*mm\s*\}\}[^\n{]*)+/gi, (match) =>
        `<div class="wiki-mm" contenteditable="false" data-wikitext="${encodeURIComponent(match.trim())}"><dl>${renderMmList(match)}</dl></div>`);

    // <ref>…</ref> citations -> inline chip
    html = html.replace(/<ref(?:\s+name="[^"]*")?>[\s\S]*?<\/ref>/gi, (m) => chip(m, renderInlineToken(m) ?? esc(m)));

    // Citation / formatting templates produced by the toolbar -> inline chips
    html = replaceBalancedTemplates(html, /^(?:Refcheck|Refurl|cn|Key|u|t)$/i, (full) => chip(full, renderInlineToken(full) ?? esc(full)));

    // Interwiki / Wikipedia links produced by the "Wiki Link" button -> inline chips
    html = html.replace(/\[\[\s*w\s*\|\s*[^|\]]+?\s*\]\]/gi, (m) => chip(m, renderInlineToken(m) ?? esc(m)));
    html = html.replace(/\[\[\s*Wikipedia\s*:[^\]]+?\]\]/gi, (m) => chip(m, renderInlineToken(m) ?? esc(m)));

    // Escape any remaining <ref> tags so Quill doesn't strip them
    html = html.replace(/(<\/ref>|<ref\b(?:\s+[^>]+)?\/?>)/gi, (match) => {
        return match.replace('<', '&lt;').replace('>', '&gt;');
    });

    // Bold and Italic
    html = html.replace(/'''(.*?)'''/g, '<strong>$1</strong>');
    html = html.replace(/''(.*?)''/g, '<em>$1</em>');

    // Underline and Strike
    html = html.replace(/<u>(.*?)<\/u>/gi, '<u>$1</u>');
    html = html.replace(/<s[^>]*>(.*?)<\/s>/gi, '<s>$1</s>');
    html = html.replace(/<del[^>]*>(.*?)<\/del>/gi, '<s>$1</s>');

    // Headers
    html = html.replace(/^======\s*(.*?)\s*======$/gm, '<h6>$1</h6>');
    html = html.replace(/^=====\s*(.*?)\s*=====$/gm, '<h5>$1</h5>');
    html = html.replace(/^====\s*(.*?)\s*====$/gm, '<h4>$1</h4>');
    html = html.replace(/^===\s*(.*?)\s*===$/gm, '<h3>$1</h3>');
    html = html.replace(/^==\s*(.*?)\s*==$/gm, '<h2>$1</h2>');

    // Blockquote & Pre
    // Pre is basic handling right now, could be multiline
    html = html.replace(/<blockquote>([\s\S]*?)<\/blockquote>/gi, '<blockquote>$1</blockquote>');
    html = html.replace(/<pre>([\s\S]*?)<\/pre>/gi, '<pre>$1</pre>');

    // Code
    html = html.replace(/\{\{Code\|(.*?)\}\}/gi, '<code>$1</code>');
    html = html.replace(/<code>(.*?)<\/code>/g, '<code>$1</code>');

    // Links [url title] -> <a href="url">title</a>
    html = html.replace(/\[(https?:\/\/[^\s\]]+)\s+([^\]]+)\]/g, '<a href="$1" rel="noopener noreferrer" target="_blank">$2</a>');
    html = html.replace(/\[(https?:\/\/[^\s\]]+)\]/g, '<a href="$1" rel="noopener noreferrer" target="_blank">$1</a>');

    // Internal links [[Page]] -> <a href="Page">Page</a>
    html = html.replace(/\[\[([^|\]]+)\|?([^\]]*)\]\]/g, (_match, page, title) => {
        return `<a href="${page}">${title || page}</a>`;
    });

    // Paragraphs and lists
    const paragraphs = html.split(/(?:\r?\n){2,}/);
    html = paragraphs.map(p => {
        // Simple list support
        if (p.trim().startsWith('* ') || p.trim().startsWith('# ')) {
            const lines = p.split(/\r?\n/);
            let listHtml = '';
            let inUl = false;
            let inOl = false;
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('* ')) {
                    if (inOl) { listHtml += '</ol>'; inOl = false; }
                    if (!inUl) { listHtml += '<ul>'; inUl = true; }
                    listHtml += `<li>${trimmed.substring(2)}</li>`;
                } else if (trimmed.startsWith('# ')) {
                    if (inUl) { listHtml += '</ul>'; inUl = false; }
                    if (!inOl) { listHtml += '<ol>'; inOl = true; }
                    listHtml += `<li>${trimmed.substring(2)}</li>`;
                } else {
                    if (inUl) { listHtml += '</ul>'; inUl = false; }
                    if (inOl) { listHtml += '</ol>'; inOl = false; }
                    listHtml += `<p>${trimmed}</p>`;
                }
            }
            if (inUl) listHtml += '</ul>';
            if (inOl) listHtml += '</ol>';
            return listHtml;
        } else {
            // Newlines to <br> to keep within same paragraph
            if (/^(<h[1-6]>|<blockquote>|<pre>|<table|<div)/.test(p.trim())) {
                return p;
            }
            const inner = p.replace(/\r?\n/g, '<br>');
            return `<p>${inner}</p>`;
        }
    }).join('');

    return html;
};

export const htmlToWikitext = (html: string): string => {
    if (!html) return '';

    // Decode editor embeds (chips, mm lists, fixboxes) back to their verbatim wikitext.
    // Each carries its source in data-wikitext, so this is lossless and robust against the
    // nested tags inside the rendered visual. Fixboxes without data-wikitext fall through
    // to the table-parsing fallback below.
    if (typeof DOMParser !== 'undefined' && /data-wikitext=/.test(html)) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        doc.querySelectorAll('.wiki-token[data-wikitext], .wiki-mm[data-wikitext], .fixbox-wrapper[data-wikitext]').forEach((el) => {
            const enc = el.getAttribute('data-wikitext');
            if (enc) el.replaceWith(doc.createTextNode(decodeURIComponent(enc)));
        });
        html = doc.body.innerHTML;
    }

    let wikitext = html;

    // Strong / Bold
    wikitext = wikitext.replace(/<strong[^>]*>(.*?)<\/strong>/g, "'''$1'''");
    wikitext = wikitext.replace(/<b[^>]*>(.*?)<\/b>/g, "'''$1'''");

    // Emphasis / Italic
    wikitext = wikitext.replace(/<em[^>]*>(.*?)<\/em>/g, "''$1''");
    wikitext = wikitext.replace(/<i[^>]*>(.*?)<\/i>/g, "''$1''");

    // Underline and Strike
    wikitext = wikitext.replace(/<u[^>]*>(.*?)<\/u>/gi, "<u>$1</u>");
    wikitext = wikitext.replace(/<s[^>]*>(.*?)<\/s>/gi, "<s>$1</s>");
    wikitext = wikitext.replace(/<strike[^>]*>(.*?)<\/strike>/gi, "<s>$1</s>");
    wikitext = wikitext.replace(/<del[^>]*>(.*?)<\/del>/gi, "<s>$1</s>");

    // Headers
    wikitext = wikitext.replace(/<h6[^>]*>(.*?)<\/h6>/gi, "====== $1 ======");
    wikitext = wikitext.replace(/<h5[^>]*>(.*?)<\/h5>/gi, "===== $1 =====");
    wikitext = wikitext.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "==== $1 ====");
    wikitext = wikitext.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "=== $1 ===");
    wikitext = wikitext.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "== $1 ==");

    // Blockquotes
    wikitext = wikitext.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, "<blockquote>$1</blockquote>");

    // Links
    wikitext = wikitext.replace(/<a[^>]*href=["'](https?:\/\/[^\s"']+)["'][^>]*>(.*?)<\/a>/gi, "[$1 $2]");
    wikitext = wikitext.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, "[[$1|$2]]");

    // Lists
    wikitext = wikitext.replace(/<ul[^>]*>(.*?)<\/ul>/gi, (_match, inner) => {
        return '\n' + inner.replace(/<li[^>]*>(.*?)<\/li>/gi, "* $1\n") + '\n';
    });
    wikitext = wikitext.replace(/<ol[^>]*>(.*?)<\/ol>/gi, (_match, inner) => {
        return '\n' + inner.replace(/<li[^>]*>(.*?)<\/li>/gi, "# $1\n") + '\n';
    });

    // Formatting tags like Code
    wikitext = wikitext.replace(/<pre[^>]*>(.*?)<\/pre>/gi, "<code>$1</code>\n");
    wikitext = wikitext.replace(/<code[^>]*>(.*?)<\/code>/gi, "{{Code|$1}}");

    // Fixboxes
    const fixboxRegex = /<table[^>]*class=["'][^"']*fixbox([^"']*)["'][^>]*>([\s\S]*?)<\/table>/gi;
    wikitext = wikitext.replace(fixboxRegex, (_match, classes, innerHtml) => {
        const isCollapsed = classes && classes.includes('mw-collapsed');
        let desc = '';
        let refRaw = '';
        let fixContent = '';

        // Extract Title and Reference
        const thMatch = innerHtml.match(/<th[^>]*class=["'][^"']*fixbox-title["'][^>]*>([\s\S]*?)<\/th>/i);
        if (thMatch) {
            let thContent = thMatch[1];
            // Remove toggle span if present
            thContent = thContent.replace(/<span[^>]*class=["'][^"']*mw-collapsible-toggle[^"']*["'][^>]*>[\s\S]*?<\/span>\s*/i, '');
            // Remove icon div
            thContent = thContent.replace(/<div[^>]*class=["'][^"']*fixbox-icon["'][^>]*><\/div>\s*/i, '');

            // Extract Reference sup
            const refMatch = thContent.match(/<sup[^>]*class=["'][^"']*reference["'][^>]*>([\s\S]*?)<\/sup>/i);
            if (refMatch) {
                refRaw = refMatch[1].replace(/<a[^>]*>/i, '').replace(/<\/a>/i, '');
                thContent = thContent.replace(refMatch[0], ''); // Remove ref from description
            }
            desc = thContent.trim();
        }

        // Extract Body
        const tdMatch = innerHtml.match(/<td[^>]*class=["'][^"']*fixbox-body["'][^>]*>([\s\S]*?)<\/td>/i);
        if (tdMatch) {
            let tdContent = tdMatch[1];
            // Remove wrapping <p> tags
            tdContent = tdContent.replace(/^[\s\S]*?<p>/i, '').replace(/<\/p>[\s\S]*?$/i, '');
            fixContent = tdContent.trim();
        }

        let refStr = refRaw ? refRaw.trim() : '';
        if (refStr && !refStr.startsWith('[')) {
            refStr = `<ref>${refStr}</ref>`;
        }

        let wt = `{{Fixbox|description=${desc ? desc.trim() : ''}`;
        if (refStr) wt += `|ref=${refStr}`;
        if (isCollapsed) wt += `|collapsed=yes`;

        if (fixContent) {
            fixContent = fixContent.replace(/<br\s*\/?>/gi, '\n');
            wt += `|fix=\n${fixContent}\n`;
        }
        wt += `}}`;
        return wt;
    });

    // Replace <br> with single newline
    wikitext = wikitext.replace(/<br\s*\/?>/gi, "\n");

    // Paragraphs
    wikitext = wikitext.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");

    // Remove all remaining HTML tags except valid wikitext allowed styles
    wikitext = wikitext.replace(/<\/?(?!(?:u|s|strike|del|pre|blockquote|code|ins|ref)\b)[a-z0-9-]+[^>]*>/gi, "");

    // Decode HTML entities
    wikitext = wikitext.replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&nbsp;/g, " ")
        .replace(/&quot;/g, "\"");

    // Clean up excessive newlines
    wikitext = wikitext.replace(/\n{3,}/g, "\n\n");

    // Clean up lists spacing
    wikitext = wikitext.replace(/\n(\*|#) (.*?)\n\n/g, "\n$1 $2\n");

    return wikitext.trim();
};
