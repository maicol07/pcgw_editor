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
            const inner = p.replace(/\r?\n/g, '<br>');
            if (/^(<h[1-6]>|<blockquote>|<pre>)/.test(inner)) {
                return inner;
            }
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

    // Replace <br> with single newline
    wikitext = wikitext.replace(/<br\s*\/?>/gi, "\n");

    // Paragraphs
    wikitext = wikitext.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");

    // Remove all remaining HTML tags except valid wikitext allowed styles
    wikitext = wikitext.replace(/<\/?(?!(?:u|s|strike|del|pre|blockquote|code|ins)\b)[a-z0-9-]+[^>]*>/gi, "");

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
