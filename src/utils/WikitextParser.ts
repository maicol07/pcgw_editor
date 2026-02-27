/**
 * WikitextParser - Robust depth-aware parser for MediaWiki wikitext
 * 
 * This parser uses positional/character-by-character iteration with brace depth tracking
 * instead of greedy regex patterns. This ensures proper handling of nested templates.
 */

export interface TemplateLocation {
    start: number;
    end: number;
    content: string;
}

export interface ParameterLocation {
    start: number;          // Start of |paramName
    end: number;            // End of value (before next | or }})
    valueStart: number;     // Start of value after =
    valueEnd: number;       // End of value
    paramName: string;
}

export class WikitextParser {
    private wikitext: string;

    constructor(wikitext: string) {
        this.wikitext = wikitext;
    }

    getText(): string {
        return this.wikitext;
    }

    /**
     * Find a template by name using depth-aware brace counting.
     * Returns the outermost matching template.
     */
    findTemplate(name: string): TemplateLocation | null {
        // Handle spaces and underscores interchangeably
        const normalizedName = this.escapeRegex(name).replace(/ /g, '[\\s_]+');
        const regex = new RegExp(`\\{\\{\\s*${normalizedName}`, 'i');
        const match = this.wikitext.match(regex);

        if (!match || match.index === undefined) {
            return null;
        }

        const start = match.index;
        let depth = 0;
        let i = start;

        // Count braces to find matching closing }}
        while (i < this.wikitext.length) {
            const char = this.wikitext[i];
            const nextChar = i + 1 < this.wikitext.length ? this.wikitext[i + 1] : '';

            if (char === '{' && nextChar === '{') {
                depth++;
                i += 2;
                continue;
            }

            if (char === '}' && nextChar === '}') {
                depth--;
                if (depth === 0) {
                    // Found the closing braces
                    const end = i + 2;
                    return {
                        start,
                        end,
                        content: this.wikitext.substring(start, end)
                    };
                }
                i += 2;
                continue;
            }

            i++;
        }

        // Unclosed template
        return null;
    }

    /**
     * Find all instances of a template by name.
     */
    findTemplates(name: string): TemplateLocation[] {
        // Handle spaces and underscores interchangeably
        const normalizedName = this.escapeRegex(name).replace(/ /g, '[\\s_]+');
        const regex = new RegExp(`\\{\\{\\s*${normalizedName}`, 'gi');
        const matches = [...this.wikitext.matchAll(regex)];
        const results: TemplateLocation[] = [];

        for (const match of matches) {
            if (match.index === undefined) continue;

            const start = match.index;
            let depth = 0;
            let i = start;

            while (i < this.wikitext.length) {
                const char = this.wikitext[i];
                const nextChar = i + 1 < this.wikitext.length ? this.wikitext[i + 1] : '';

                if (char === '{' && nextChar === '{') {
                    depth++;
                    i += 2;
                    continue;
                }

                if (char === '}' && nextChar === '}') {
                    depth--;
                    if (depth === 0) {
                        const end = i + 2;
                        results.push({
                            start,
                            end,
                            content: this.wikitext.substring(start, end)
                        });
                        break;
                    }
                    i += 2;
                    continue;
                }
                i++;
            }
        }
        return results;
    }

    /**
     * Find a parameter within a template.
     * Uses depth tracking to avoid breaking on nested templates.
     */
    findParameter(templateName: string, paramName: string): ParameterLocation | null {
        const template = this.findTemplate(templateName);
        if (!template) {
            return null;
        }

        // Search within the template content
        const content = template.content;
        const normalizedParam = paramName.toLowerCase().trim();

        // Find all pipe-separated parameters
        let depth = 0;
        let paramStart = -1;
        let i = 0;
        let positionalCount = 0;

        // Skip the template name first ({{TemplateName)
        const templateNameMatch = content.match(/^\{\{\s*[\w\s/]+/);
        if (templateNameMatch) {
            i = templateNameMatch[0].length;
        }

        while (i < content.length - 2) { // -2 to exclude closing }}
            const char = content[i];
            const nextChar = i + 1 < content.length ? content[i + 1] : '';

            // Track nesting depth
            if (char === '{' && nextChar === '{') {
                depth++;
                i += 2;
                continue;
            }

            if (char === '}' && nextChar === '}') {
                depth--;
                i += 2;
                continue;
            }

            // Only look for pipes at depth 0 (not inside nested templates)
            if (char === '|' && depth === 0) {
                paramStart = i;

                // Extract parameter name and check if it matches
                const remainingContent = content.substring(i + 1);
                const paramMatch = remainingContent.match(/^\s*([\w\s-]+)\s*=/);

                if (paramMatch) {
                    const foundParamName = paramMatch[1].trim().toLowerCase();

                    if (foundParamName === normalizedParam) {
                        // Found it! Now find the value boundaries
                        const equalsPos = i + 1 + paramMatch[0].indexOf('=');
                        const valueStart = equalsPos + 1;

                        // Find end of value (next | at depth 0 or closing }})
                        let valueEnd = valueStart;
                        let j = valueStart;
                        let valueDepth = 0;
                        let linkDepth = 0;

                        while (j < content.length - 2) {
                            const c = content[j];
                            const nc = j + 1 < content.length ? content[j + 1] : '';

                            if (c === '{' && nc === '{') {
                                valueDepth++;
                                j += 2;
                                continue;
                            }

                            if (c === '}' && nc === '}') {
                                if (valueDepth === 0 && linkDepth === 0) {
                                    // End of template
                                    valueEnd = j;
                                    break;
                                }
                                if (valueDepth > 0) valueDepth--;
                                j += 2;
                                continue;
                            }

                            if (c === '[' && nc === '[') {
                                linkDepth++;
                                j += 2;
                                continue;
                            }

                            if (c === ']' && nc === ']') {
                                if (linkDepth > 0) linkDepth--;
                                j += 2;
                                continue;
                            }

                            if (c === '|' && valueDepth === 0 && linkDepth === 0) {
                                // Next parameter
                                valueEnd = j;
                                break;
                            }

                            j++;
                        }

                        if (valueEnd === valueStart) {
                            valueEnd = content.length - 2;
                        }

                        return {
                            start: template.start + paramStart,
                            end: template.start + valueEnd,
                            valueStart: template.start + valueStart,
                            valueEnd: template.start + valueEnd,
                            paramName: paramMatch[1].trim()
                        };
                    }
                } else {
                    // Positional parameter
                    positionalCount++;
                    if (positionalCount.toString() === normalizedParam) {
                        const valueStart = i + 1;
                        let valueEnd = valueStart;
                        let j = valueStart;
                        let valueDepth = 0;
                        let linkDepth = 0;

                        while (j < content.length - 2) {
                            const c = content[j];
                            const nc = j + 1 < content.length ? content[j + 1] : '';

                            if (c === '{' && nc === '{') {
                                valueDepth++;
                                j += 2;
                                continue;
                            }

                            if (c === '}' && nc === '}') {
                                if (valueDepth === 0 && linkDepth === 0) {
                                    valueEnd = j;
                                    break;
                                }
                                if (valueDepth > 0) valueDepth--;
                                j += 2;
                                continue;
                            }

                            if (c === '[' && nc === '[') {
                                linkDepth++;
                                j += 2;
                                continue;
                            }

                            if (c === ']' && nc === ']') {
                                if (linkDepth > 0) linkDepth--;
                                j += 2;
                                continue;
                            }

                            if (c === '|' && valueDepth === 0 && linkDepth === 0) {
                                valueEnd = j;
                                break;
                            }
                            j++;
                        }

                        if (valueEnd === valueStart) {
                            valueEnd = content.length - 2;
                        }

                        return {
                            start: template.start + paramStart,
                            end: template.start + valueEnd,
                            valueStart: template.start + valueStart,
                            valueEnd: template.start + valueEnd,
                            paramName: positionalCount.toString()
                        };
                    }
                }
            }

            i++;
        }

        return null;
    }

    /**
     * Set a parameter value. Creates the parameter if it doesn't exist.
     * Preserves whitespace formatting and ensures proper newlines.
     */
    setParameter(templateName: string, paramName: string, value: string | number | boolean | null | undefined): void {
        if (value === null || value === undefined) {
            return;
        }

        const valueStr = String(value);
        const param = this.findParameter(templateName, paramName);

        if (param) {
            // Parameter exists - replace the value
            const beforeEquals = this.wikitext.substring(param.start, param.valueStart);
            const currentValue = this.wikitext.substring(param.valueStart, param.valueEnd);
            const after = this.wikitext.substring(param.valueEnd);

            // If the new value is empty, preserve the current value's whitespace exactly as is
            if (valueStr.trim() === '') {
                // For empty values, just keep the original whitespace structure
                this.wikitext = this.wikitext.substring(0, param.start) +
                    beforeEquals +
                    currentValue.replace(/[^\s]/g, '') + // Keep only whitespace
                    after;
                return;
            }

            // 1. Preserve only horizontal whitespace (spaces/tabs) after = for leading space
            // 2. Preserve any trailing newlines to keep parameters on separate lines
            const leadingMatch = currentValue.match(/^([ \t]*)/);
            let leadingWhitespace = leadingMatch ? leadingMatch[1] : ' ';

            // If the value starts with a newline, we don't want a leading space after the equals
            if (valueStr.startsWith('\n')) {
                leadingWhitespace = '';
            }

            // Preserve trailing newlines (but not other trailing whitespace)
            const trailingNewlines = currentValue.match(/(\n+)$/);
            const trailingWhitespace = trailingNewlines ? trailingNewlines[1] : '';

            // Reconstruct with preserved whitespace structure
            this.wikitext = this.wikitext.substring(0, param.start) +
                beforeEquals +
                leadingWhitespace +
                valueStr +
                trailingWhitespace +
                after;
        } else {
            // Parameter doesn't exist - insert it
            this.insertParameter(templateName, paramName, valueStr);
        }
    }

    /**
     * Remove a parameter from a template.
     */
    removeParameter(templateName: string, paramName: string): void {
        const param = this.findParameter(templateName, paramName);
        if (!param) return;

        // Determine the full range to remove, including the preceding pipe
        this.wikitext = this.wikitext.substring(0, param.start) + this.wikitext.substring(param.end);
    }

    /**
     * Remove a template entirely.
     * Also attempts to remove one trailing newline to prevent gaps.
     */
    removeTemplate(templateName: string): void {
        const template = this.findTemplate(templateName);
        if (!template) return;

        let end = template.end;
        if (this.wikitext[end] === '\n') {
            end++;
        }

        this.wikitext = this.wikitext.substring(0, template.start) + this.wikitext.substring(end);
        this.cleanNewlines();
    }

    /**
     * Clean up excessive vertical whitespace (3+ newlines).
     */
    cleanNewlines(): void {
        this.wikitext = this.wikitext.replace(/\n{3,}/g, '\n\n');
    }

    /**
     * Insert a new parameter into a template.
     * Ensures proper formatting with newlines and pipes.
     */
    insertParameter(templateName: string, paramName: string, value: string): void {
        const template = this.findTemplate(templateName);
        if (!template) {
            return;
        }

        // Find the position just before the closing }}
        const insertPos = template.end - 2;

        // Check if we need a leading newline
        const charBefore = insertPos > 0 ? this.wikitext[insertPos - 1] : '';
        const needsNewlineBefore = charBefore !== '\n';

        // Format the new parameter
        // If the value starts with a newline, don't add spaces around =
        const spacing = value.startsWith('\n') ? '' : ' ';
        const formattedParam = `${needsNewlineBefore ? '\n' : ''}|${paramName}${spacing}=${spacing}${value}\n`;

        // Insert it
        this.wikitext = this.wikitext.substring(0, insertPos) + formattedParam + this.wikitext.substring(insertPos);
    }

    /**
     * Replace content between two pipe-delimited parameters.
     * Useful for replacing lists of nested templates.
     */
    replaceParameterContent(templateName: string, paramName: string, newContent: string): void {
        const param = this.findParameter(templateName, paramName);
        if (!param) {
            // Parameter doesn't exist, insert it
            this.insertParameter(templateName, paramName, '\n' + newContent + '\n');
            return;
        }

        // Replace everything from after the = to the end of the value
        const before = this.wikitext.substring(0, param.valueStart);
        const after = this.wikitext.substring(param.valueEnd);

        // Ensure proper spacing
        const needsLeadingNewline = newContent.trim().length > 0 && !newContent.startsWith('\n');
        const needsTrailingNewline = newContent.trim().length > 0 && !newContent.endsWith('\n');

        const formatted = (needsLeadingNewline ? '\n' : '') + newContent + (needsTrailingNewline ? '\n' : '');

        this.wikitext = before + formatted + after;
    }

    /**
     * Format nested row templates with proper whitespace.
     * Example: developers list with multiple {{Infobox game/row/developer|...}}
     */
    /**
     * Format nested row templates with proper whitespace.
     * Example: developers list with multiple {{Infobox game/row/developer|...}}
     */
    formatNestedRows(items: Array<{ type: string; name: string; extra?: string; params?: Record<string, string | undefined> }>): string {
        if (!items || items.length === 0) {
            return '';
        }

        return items.map(item => {
            let row = `{{Infobox game/row/${item.type}|${item.name}`;
            if (item.extra) {
                row += `|${item.extra}`;
            }
            if (item.params) {
                Object.entries(item.params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== '') {
                        row += `|${key}=${value}`;
                    }
                });
            }
            row += `}}`;
            return row;
        }).join('\n');
    }

    /**
     * Find content between section headers.
     * Returns null if section not found.
     */
    findSection(header: string | RegExp): { start: number; end: number; content: string } | null {
        let headerRegex: RegExp;

        if (header instanceof RegExp) {
            // If it's a regex, we need to ensure it matches the full header line pattern
            // This is tricky because the user's regex might just match the text.
            // We can construct a new regex that looks for == around the pattern.
            // But simpler is to assume the caller provides a regex that matches the TITLE text, 
            // and we wrap it.
            // We want to match ^={2,}\s*pattern\s*={2,}$
            const source = header.source;
            const flags = header.flags.replace('g', '').replace('y', ''); // remove global/sticky
            // Construct regex: start of line, ==, space*, pattern, space*, ==
            headerRegex = new RegExp(`^={2,}\\s*${source}\\s*={2,}`, flags + 'm');
        } else {
            headerRegex = new RegExp(`^={2,}\\s*${this.escapeRegex(header)}\\s*={2,}`, 'im');
        }

        const match = this.wikitext.match(headerRegex);

        if (!match || match.index === undefined) {
            return null;
        }

        const start = match.index + match[0].length;

        // Find the next section or end of text
        const nextSectionRegex = /\n==/;
        const remaining = this.wikitext.substring(start);
        const nextMatch = remaining.match(nextSectionRegex);

        const end = nextMatch && nextMatch.index !== undefined ? start + nextMatch.index : this.wikitext.length;

        return {
            start,
            end,
            content: this.wikitext.substring(start, end)
        };
    }

    /**
     * Replace or create a section with new content.
     */
    replaceSection(header: string | RegExp, newContent: string, defaultTitle: string = ''): void {
        const section = this.findSection(header);

        if (section) {
            // Replace existing section content
            const before = this.wikitext.substring(0, section.start);
            const after = this.wikitext.substring(section.end);

            // We want to ensure one newline after the header and one before the next section
            // The 'newContent' usually passed in has explicit newlines, but we should be careful.
            // The current logic: before + '\n' + newContent + '\n' + after
            // 'before' includes the match up to ==Title==
            // 'after' starts at next == or end of string

            this.wikitext = before + newContent + after;
        } else {
            // Append new section at the end
            // Use defaultTitle if provided, otherwise if header is string use that.
            let title = defaultTitle;
            if (!title && typeof header === 'string') {
                title = header;
            }

            if (title) {
                const needsNewline = this.wikitext.length > 0 && !this.wikitext.endsWith('\n');
                // Check if title already includes ==
                if (title.trim().startsWith('=')) {
                    this.wikitext += `${needsNewline ? '\n' : ''}\n${title}${newContent.startsWith('\n') ? '' : '\n'}${newContent}\n`;
                } else {
                    this.wikitext += `${needsNewline ? '\n' : ''}\n== ${title} ==${newContent.startsWith('\n') ? '' : '\n'}${newContent}\n`;
                }
            }
        }
    }

    /**
     * Escape special regex characters
     */
    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Replace a section with a custom header regex.
     * Does not enforce == wrapping around the header.
     */
    replaceCustomSection(headerRegex: RegExp, newContent: string, defaultHeader: string): void {
        const match = this.wikitext.match(headerRegex);

        if (match && match.index !== undefined) {
            const start = match.index + match[0].length;

            // Find the next section or end of text
            // We assume standard sections follow
            const nextSectionRegex = /\n==/;
            const remaining = this.wikitext.substring(start);
            const nextMatch = remaining.match(nextSectionRegex);

            const end = nextMatch && nextMatch.index !== undefined ? start + nextMatch.index : this.wikitext.length;

            const before = this.wikitext.substring(0, start);
            const after = this.wikitext.substring(end);

            this.wikitext = before + '\n' + newContent + '\n' + after;
        } else {
            // Append new section
            const needsNewline = this.wikitext.length > 0 && !this.wikitext.endsWith('\n');
            this.wikitext += `${needsNewline ? '\n' : ''}\n${defaultHeader}\n${newContent}\n`;
        }
    }
}
