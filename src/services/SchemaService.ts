import { WikitextParser } from '../utils/WikitextParser';
import { SectionDefinition, FieldDefinition } from '../types/schema';

export class SchemaService {
    /**
     * Helper to get all fields from a section, whether flat or grouped.
     */
    private static getFields(section: SectionDefinition): FieldDefinition[] {
        if (section.fields) return section.fields;
        if (section.groups) return section.groups.flatMap(g => g.fields);
        return [];
    }

    /**
     * Helper to set value at path (supports simple dot notation)
     */
    private static setDeep(obj: any, path: string, value: any) {
        if (!path.includes('.')) {
            obj[path] = value;
            return;
        }
        const parts = path.split('.');
        let current = obj;
        for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) current[parts[i]] = {};
            current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
    }

    /**
     * Helper to get value at path
     */
    private static getDeep(obj: any, path: string): any {
        if (!path.includes('.')) return obj[path];
        return path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
    }

    /**
     * Parses the wikitext using the provided schema configuration to build the state object.
     */
    static parseState(wikitext: string, schema: SectionDefinition[]): Record<string, any> {
        const parser = new WikitextParser(wikitext);
        const state: Record<string, any> = {};

        for (const section of schema) {
            state[section.id] = {};
            const fields = this.getFields(section);

            // If the section maps to a specific template
            if (section.templateName) {
                const template = parser.findTemplate(section.templateName);
                if (template) {
                    // We found the template, now simple fields can be extracted
                    for (const field of fields) {
                        if (field.parser) {
                            // Custom parser strategy
                            const param = parser.findParameter(section.templateName, field.wikitextParam);
                            const rawValue = param ? wikitext.substring(param.valueStart, param.valueEnd) : '';
                            this.setDeep(state[section.id], field.key, field.parser(rawValue));
                        } else {
                            // Standard 1:1 mapping
                            const param = parser.findParameter(section.templateName, field.wikitextParam);
                            let value = param ? wikitext.substring(param.valueStart, param.valueEnd) : (field.defaultValue ?? '');

                            // Clean up value
                            if (typeof value === 'string') {
                                value = value.trim();
                            }

                            this.setDeep(state[section.id], field.key, value);
                        }
                    }
                } else {
                    // Template not found, Initialize with defaults
                    for (const field of fields) {
                        this.setDeep(state[section.id], field.key, field.defaultValue ?? '');
                    }
                }
            } else if (section.isCustomSection) {
                // For custom sections
                for (const field of fields) {
                    if (field.parser) {
                        const parsedValue = field.parser(wikitext);
                        // Deep merge with default value if both are objects
                        if (parsedValue && typeof parsedValue === 'object' && field.defaultValue && typeof field.defaultValue === 'object') {
                            this.setDeep(state[section.id], field.key, { ...field.defaultValue, ...parsedValue });
                        } else {
                            const val = parsedValue !== undefined ? parsedValue : field.defaultValue;
                            this.setDeep(state[section.id], field.key, val);
                        }
                    } else {
                        this.setDeep(state[section.id], field.key, field.defaultValue ?? '');
                    }
                }
            }
        }
        return state;
    }

    /**
     * Generates the new wikitext based on the current state and schema.
     */
    static generateWikitext(originalWikitext: string, state: Record<string, any>, schema: SectionDefinition[]): string {
        let parser = new WikitextParser(originalWikitext);

        for (const section of schema) {
            const sectionState = state[section.id] || {};
            const fields = this.getFields(section);

            if (section.templateName) {
                // Ensure template exists
                let template = parser.findTemplate(section.templateName);

                // If template matches but is not found, we effectively skip writing for now unless we add creation logic.
                if (!template) {
                    // console.warn(`Template ${section.templateName} not found in wikitext.`);
                    // continue;
                }

                for (const field of fields) {
                    const value = this.getDeep(sectionState, field.key);
                    let stringValue = '';

                    if (field.formatter) {
                        stringValue = field.formatter(value);
                    } else {
                        stringValue = String(value ?? '');
                    }

                    // Write to wikitext
                    parser.setParameter(section.templateName, field.wikitextParam, stringValue);
                }
            } else if (section.isCustomSection) {
                for (const field of fields) {
                    if (field.writer) {
                        const value = this.getDeep(sectionState, field.key);
                        // Call custom writer to update wikitext
                        const newWikitext = field.writer(parser.getText(), value);
                        // Update parser with new text
                        parser = new WikitextParser(newWikitext);
                    } else if (field.formatter) {
                        // Fallback or specific parameter replacement logic if needed
                    }
                }
            }
        }

        return parser.getText();
    }
}
