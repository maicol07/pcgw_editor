import { fieldsConfig } from '../config/fields';
import { FieldDefinition } from '../types/schema';

export function useFields() {
    const getField = (key: string): FieldDefinition | undefined => {
        for (const section of fieldsConfig) {
            if (section.id === key) return section as any; // Section itself
            for (const group of section.groups || []) {
                for (const field of group.fields) {
                    if (field.key === key) return field;
                }
            }
        }
        return undefined;
    };

    return {
        getField
    };
}
