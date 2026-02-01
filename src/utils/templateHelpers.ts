export interface TextRange {
    start: number;
    end: number;
    content: string;
}

/**
 * Finds the range of a specific template in wikitext.
 * Handles nested templates ({{ ... }}).
 * @param text The full wikitext.
 * @param templateName The name of the template to find (case-insensitive).
 * @returns The range of the template or null if not found.
 */
export function findTemplateRange(text: string, templateName: string): TextRange | null {
    // Escape template name for regex
    const escapedName = templateName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const startRegex = new RegExp(`\\{\\{\\s*${escapedName}`, 'i');
    const match = text.match(startRegex);

    if (!match || match.index === undefined) return null;

    const startIndex = match.index;
    let depth = 0;
    let endIndex = -1;

    for (let i = startIndex; i < text.length; i++) {
        if (text.substr(i, 2) === '{{') {
            depth++;
            i++;
        } else if (text.substr(i, 2) === '}}') {
            depth--;
            i++;
            if (depth === 0) {
                endIndex = i + 1;
                break;
            }
        }
    }

    if (endIndex !== -1) {
        return {
            start: startIndex,
            end: endIndex,
            content: text.substring(startIndex, endIndex)
        };
    }
    return null;
}

/**
 * Finds the range of a section identified by a header.
 * A section ends at the start of the next header of same or higher level, or EOF.
 * @param text The full wikitext.
 * @param headerRegex The regex to match the header (e.g. /==\s*Availability\s*==/i).
 * @returns The range of the section (including header) or null if not found.
 */
export function findSectionRange(text: string, headerRegex: RegExp): TextRange | null {
    const match = text.match(headerRegex);
    if (!match || match.index === undefined) return null;

    const startIndex = match.index;
    const headerContent = match[0];
    const afterHeader = startIndex + headerContent.length;

    // Determine header level (count = signs)
    const levelMatch = headerContent.match(/^(=+)/);
    const level = levelMatch ? levelMatch[1].length : 2;

    // Find next header of same or higher level
    // We scan from after the header
    const nextHeaderRegex = new RegExp(`^={2,${level}}\\s*[^=]+\\s*={2,${level}}`, 'gm');
    nextHeaderRegex.lastIndex = afterHeader;

    // We need to manually scan since 'gm' regex with lastIndex matches from there
    // But 'gm' is tricky. Simpler: search for \n==...

    let endIndex = text.length;

    // Create a regex for any header
    const anyHeaderRegex = /^(={2,})\s*[^=]+\s*\1/gm;
    anyHeaderRegex.lastIndex = afterHeader;

    let m;
    while ((m = anyHeaderRegex.exec(text)) !== null) {
        if (m[1].length <= level && m.index > startIndex) {
            endIndex = m.index;
            break;
        }
    }

    return {
        start: startIndex,
        end: endIndex,
        content: text.substring(startIndex, endIndex)
    };
}
