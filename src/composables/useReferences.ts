import { ref } from 'vue';
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
        const regex = /{{(Refcheck|Refurl|cn)([^}]*)}}|([^{]+)/g;
        let match;

        // If no templates found, treat purely as text
        if (!text.includes('{{')) {
            refs.push({ id: crypto.randomUUID(), type: 'text', params: {}, content: text });
            return refs;
        }

        while ((match = regex.exec(text)) !== null) {
            // Group 3 matches plain text content outside of templates
            if (match[3]) {
                if (match[3].trim()) {
                    refs.push({ id: crypto.randomUUID(), type: 'text', params: {}, content: match[3] });
                }
            } else {
                // Group 1: Template Name (Refcheck, Refurl, cn)
                const type = match[1] as ReferenceType;
                // Group 2: Parameters string (|a=b|c=d)
                const paramStr = match[2];
                const params: Record<string, string> = {};

                if (paramStr) {
                    const paramPairs = paramStr.split('|');
                    paramPairs.forEach(p => {
                        if (!p.trim()) return;
                        // Handle named parameters (key=val) and positional ones if any (though usually named for these templates)
                        const [key, val] = p.split('=');
                        if (key && val !== undefined) {
                            params[key.trim()] = val.trim();
                        }
                    });
                }
                refs.push({ id: crypto.randomUUID(), type, params });
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

            const params = Object.entries(r.params)
                .filter(([_, v]) => v !== undefined && v !== null && v !== '')
                .map(([k, v]) => `${k}=${v}`)
                .join('|');

            return `{{${r.type}${params ? '|' + params : ''}}}`;
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
