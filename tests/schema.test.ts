import { describe, it, expect } from 'vitest';
import { fieldsConfig } from '../src/config/fields';
import { parseWikitext } from '../src/utils/parser';
import { PCGWEditor } from '../src/utils/wikitext';
import { GameData, initialGameData } from '../src/models/GameData';

// Helper to generate a mock value based on the field type/component
const getMockValueForField = (field: any) => {
    switch (field.component) {
        case 'Checkbox':
            return true;
        case 'InputText':
        case 'Textarea':
            return `Mock ${field.wikitextParam}`;
        case 'Select':
            // Pick first option if available, else a string
            return field.componentProps?.options?.[0]?.value || 'mock_selection';
        case 'MultiSelect':
            // GameData stores MultiSelects as comma-separated strings
            return 'Option1, Option2';
        case 'InputChips':
            return ['Chip1', 'Chip2'];
        case 'CompoundRatingField':
            // GameData stores RatingValue as string
            return 'true';
        case 'InputWithNotes':
            return 'Mock Value';
        default:
            return undefined;
    }
};

describe('Schema Integrity Tests', () => {

    it('should have a valid schema structure', () => {
        expect(fieldsConfig).toBeDefined();
        expect(Array.isArray(fieldsConfig)).toBe(true);
        expect(fieldsConfig.length).toBeGreaterThan(0);
    });

    fieldsConfig.forEach(section => {
        // Flatten groups to get all fields
        const fields = (section.groups
            ? section.groups.flatMap(g => g.fields)
            : section.fields || []).filter(field => {
                if (!field.wikitextParam) return false;
                if (['developers', 'publishers', 'engines', 'releaseDates', 'reception', 'availability', 'dlc'].includes(field.key)) return false;
                if (field.key.startsWith('taxonomy.')) return false;
                return true;
            });

        if (fields.length === 0) return;

        describe(`Section: ${section.id}`, () => {
            fields.forEach(field => {
                // Determine the correct data path
                let dataPath = field.key;
                // ... (rest of the loop)

                if (field.component === 'CompoundRatingField' || field.component === 'InputWithNotes') {
                    if (field.componentProps?.field) {
                        // field.key is usually the parent (e.g. 'input'), and componentProps.field is the sub-property ('mouseSensitivity')
                        dataPath = `${field.key}.${field.componentProps.field}`;
                    }
                }

                it(`should consistently read/write field: ${dataPath} (${field.wikitextParam})`, () => {
                    const mockVal = getMockValueForField(field);
                    if (mockVal === undefined) return; // Skip if we don't know how to mock

                    // 1. Create a data object with this value
                    const data: GameData = JSON.parse(JSON.stringify(initialGameData));

                    // Helper to set nested property
                    const setPath = (obj: any, path: string, value: any) => {
                        const keys = path.split('.');
                        let current = obj;
                        for (let i = 0; i < keys.length - 1; i++) {
                            if (!current[keys[i]]) current[keys[i]] = {};
                            current = current[keys[i]];
                        }
                        current[keys[keys.length - 1]] = value;
                    };

                    setPath(data, dataPath, mockVal);

                    // 2. Write to wikitext
                    const writer = new PCGWEditor('');

                    if (section.id === 'video') {
                        writer.updateVideo(data.video);
                    } else if (section.id === 'input') {
                        writer.updateInput(data.input);
                    } else if (section.id === 'audio') {
                        writer.updateAudio(data.audio);
                    } else if (section.id === 'monetization') {
                        writer.updateMonetization(data.monetization);
                    } else if (section.id === 'microtransactions') {
                        writer.updateMicrotransactions(data.microtransactions);
                    } else if (section.id === 'article_state') {
                        writer.updateArticleState(data.articleState);
                    } else if (section.id === 'introduction') {
                        writer.updateIntroduction(data.introduction);
                    } else if (section.id === 'network') {
                        writer.updateNetwork(data.network);
                    } else if (section.id === 'vr') {
                        writer.updateVR(data.vr);
                    } else {
                        // Skip sections not yet implemented in writer generic update methods
                        return;
                    }

                    const wikitext = writer.getText();

                    // 3. Parse back
                    const parsedData = parseWikitext(wikitext);

                    // 4. Verify equality
                    // Helper to get nested property
                    const getPath = (obj: any, path: string) => {
                        return path.split('.').reduce((o, i) => o ? o[i] : undefined, obj);
                    };

                    const original = getPath(data, dataPath);
                    const roundTripped = getPath(parsedData, dataPath);

                    expect(roundTripped).toEqual(original);
                });
            });
        });
    });
});
