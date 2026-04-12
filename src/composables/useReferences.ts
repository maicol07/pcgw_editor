import type { ReferenceItem, ReferenceType } from '../types/references';

export function useReferences() {
    /**
     * Parses a raw wikitext string into structured ReferenceItem objects.
     * Handles {{Refcheck}}, {{Refurl}}, {{cn}}, and plain text nodes.
     */
    const parseReferences = (text: string): ReferenceItem[] => {
        const refs: ReferenceItem[] = [];
        if (!text) return refs;

        // Regex to capture template calls {{Name|params}} or any other text
        // Optionally wrapped in <ref> tags
        const regex = /(?:<ref>)?\s*{{(Refcheck|Refurl|cn|key|ilink|wlink|ulink|tlink)([^}]*)}}\s*(?:<\/ref>)?|([^{<]+)/g;
        let match;

        while ((match = regex.exec(text)) !== null) {
            // Group 3 matches plain text content
            if (match[3]) {
                if (match[3].trim()) {
                    refs.push({ id: crypto.randomUUID(), type: 'text', params: {}, content: match[3].trim() });
                }
            } else {
                const type = match[1] as ReferenceType;
                const paramStr = match[2];
                const params: Record<string, string> = {};

                // Check if the match was wrapped in <ref> in the original text
                const fullMatch = match[0];
                const isWrapped = fullMatch.trim().startsWith('<ref>') && fullMatch.trim().endsWith('</ref>');

                let positionalIndex = 1;
                if (paramStr) {
                    const paramPairs = paramStr.split('|');
                    paramPairs.forEach(p => {
                        if (!p.trim()) return;
                        const eqIndex = p.indexOf('=');
                        if (eqIndex !== -1) {
                            const pk = p.substring(0, eqIndex).trim();
                            const pv = p.substring(eqIndex + 1).trim();
                            params[pk] = pv;
                        } else {
                            params[positionalIndex.toString()] = p.trim();
                            positionalIndex++;
                        }
                    });
                }
                refs.push({ id: crypto.randomUUID(), type, params, wrapInRef: isWrapped });
            }
        }
        return refs;
    };

    /**
     * Serializes an array of ReferenceItems back into a wikitext string.
     */
    const serializeReferences = (refs: ReferenceItem[]): string => {
        return refs.map(r => {
            if (r.type === 'text') return r.content || '';

            const sortedKeys = Object.keys(r.params).sort((a, b) => {
                const isANum = !isNaN(Number(a));
                const isBNum = !isNaN(Number(b));
                if (isANum && isBNum) return Number(a) - Number(b);
                if (isANum) return -1;
                if (isBNum) return 1;
                return a.localeCompare(b);
            });

            const paramsStr = sortedKeys
                .filter(k => r.params[k] !== undefined && r.params[k] !== null && r.params[k] !== '')
                .map(k => {
                    if (!isNaN(Number(k))) return r.params[k];
                    return `${k}=${r.params[k]}`;
                })
                .join('|');

            let template = `{{${r.type}${paramsStr ? '|' + paramsStr : ''}}}`;
            
            if (r.wrapInRef && ['Refcheck', 'Refurl', 'cn'].includes(r.type)) {
                template = `<ref>${template}</ref>`;
            }
            
            return template;
        }).join(' ');
    };

    /**
     * Utility to clear empty/undefined params before saving
     */
    const cleanParams = (params: Record<string, string>): Record<string, string> => {
        const cleaned: Record<string, string> = {};
        Object.keys(params).forEach(key => {
            if (params[key] && params[key].trim() !== '') {
                cleaned[key] = params[key].trim();
            }
        });
        return cleaned;
    };

    return {
        parseReferences,
        serializeReferences,
        cleanParams
    };
}
