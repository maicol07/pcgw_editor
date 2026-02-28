export const wikitextToHtml = (wikitext: string): string => {
    if (!wikitext) return '';
    let html = wikitext;

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
    html = html.replace(/<code>(.*?)<\/code>/g, '<code>$1</code>');

    // Links [url title] -> <a href="url">title</a>
    html = html.replace(/\[(https?:\/\/[^\s\]]+)\s+([^\]]+)\]/g, '<a href="$1" rel="noopener noreferrer" target="_blank">$2</a>');
    html = html.replace(/\[(https?:\/\/[^\s\]]+)\]/g, '<a href="$1" rel="noopener noreferrer" target="_blank">$1</a>');

    // Internal links [[Page]] -> <a href="Page">Page</a>
    html = html.replace(/\[\[([^|\]]+)\|?([^\]]*)\]\]/g, (_match, page, title) => {
        return `<a href="${page}">${title || page}</a>`;
    });

    // Fixboxes
    html = html.replace(/\{\{Fixbox\s*\|([^}]+)\}\}/gi, (match, content) => {
        let description = '';
        let ref = '';
        let fix = '';
        let collapsed = false;

        const parts = content.split(/\|(?=\w+=)/);
        for (const part of parts) {
            const eqIndex = part.indexOf('=');
            if (eqIndex > -1) {
                const key = part.substring(0, eqIndex).trim();
                const val = part.substring(eqIndex + 1).trim();
                if (key === 'description') description = val;
                else if (key === 'ref') ref = val;
                else if (key === 'collapsed') collapsed = val.toLowerCase() === 'yes';
                else if (key === 'fix') fix = val;
            } else if (part.trim() && !description) {
                // simple unnamed parameter might be description if omitted key
                description = part.trim();
            }
        }

        let htmlOut = `<div class="fixbox-wrapper" contenteditable="false" data-wikitext="${encodeURIComponent(`{{Fixbox|${content}}}`)}"><table class="pcgwikitable fixbox${collapsed ? ' mw-collapsible mw-collapsed mw-made-collapsible' : ''}"><tbody><tr><th class="fixbox-title">`;
        if (collapsed) {
            htmlOut += `<span class="mw-collapsible-toggle mw-collapsible-toggle-default mw-collapsible-toggle-collapsed" role="button" tabindex="0" aria-expanded="false"><a class="mw-collapsible-text">Expand</a></span>`;
        }
        htmlOut += `<div title="Fix" class="svg-icon svg-16 fixbox-icon"></div>${description}${ref ? `<sup class="reference">${ref.replace(/^<ref>([\s\S]*)<\/ref>$/, '$1')}</sup>` : ''}</th></tr>`;

        if (fix && fix.trim() !== '') {
            htmlOut += `<tr${collapsed ? ' style="display: none;"' : ''}><td class="fixbox-body"><p>${fix.trim()}</p></td></tr>`;
        }
        htmlOut += `</tbody></table></div>`;
        return htmlOut;
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
    wikitext = wikitext.replace(/<code[^>]*>(.*?)<\/code>/gi, "<code>$1</code>");

    // Fixboxes
    const fixboxRegex = /<table[^>]*class=["'][^"']*fixbox([^"']*)["'][^>]*>([\s\S]*?)<\/table>/gi;
    wikitext = wikitext.replace(fixboxRegex, (match, classes, innerHtml) => {
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
