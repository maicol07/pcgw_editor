
import { describe, it, expect } from 'vitest';
import { parseWikitext } from '../../../src/utils/parser';
import { PCGWEditor } from '../../../src/utils/wikitext';
import { GameData, SettingsAudio } from '../../../src/models/GameData';

describe('Field Group: Audio', () => {
    interface AudioTestCase {
        field: keyof SettingsAudio;
        template: string;
        value: string;
        expected: string;
        hasNotes?: boolean;
    }

    const audioFields: AudioTestCase[] = [
        { field: 'separateVolume', template: 'separate volume', value: 'true', expected: 'true', hasNotes: true },
        { field: 'surroundSound', template: 'surround sound', value: 'true', expected: 'true', hasNotes: true },
        { field: 'subtitles', template: 'subtitles', value: 'true', expected: 'true', hasNotes: true },
        { field: 'closedCaptions', template: 'closed captions', value: 'true', expected: 'true', hasNotes: true },
        { field: 'muteOnFocusLost', template: 'mute on focus lost', value: 'true', expected: 'true', hasNotes: true },
        { field: 'eaxSupport', template: 'eax support', value: 'true', expected: 'true', hasNotes: true },
        { field: 'royaltyFree', template: 'royalty free audio', value: 'true', expected: 'true', hasNotes: true },
        { field: 'redBookCdAudio', template: 'red book cd audio', value: 'true', expected: 'true', hasNotes: true },
        { field: 'generalMidiAudio', template: 'general midi audio', value: 'true', expected: 'true', hasNotes: true },
    ];

    const getCleanData = (): GameData => ({
        pageTitle: '',
        articleState: {},
        infobox: {} as any,
        introduction: {} as any,
        availability: [],
        gameData: { configFiles: [], saveData: [], xdg: null, cloudSync: {} as any },
        video: {}, input: {}, audio: {}, network: {}, vr: {}, localizations: [], api: {},
        systemRequirements: { windows: {}, mac: {}, linux: {} } as any,
        monetization: {}, microtransactions: {},
        config: { configFiles: [], saveData: [], xdg: null, cloudSync: {} as any }
    } as any);

    describe('Parsing', () => {
        it.each(audioFields)('should parse %s field', ({ field, template, value, expected, hasNotes }) => {
            let wikitext = `{{Audio\n|${template} = ${value}\n`;
            if (hasNotes) wikitext += `|${template} notes = Note for ${template}\n`;
            wikitext += '}}';

            const data = parseWikitext(wikitext);
            // @ts-ignore - dynamic assignment
            expect(data.audio[field]).toBe(expected);

            if (hasNotes) {
                // @ts-ignore
                expect(data.audio[`${field}Notes`]).toBe(`Note for ${template}`);
            }
        });
    });

    describe('Writing', () => {
        it.each(audioFields)('should write %s field', ({ field, template, value, hasNotes }) => {
            const data = getCleanData();
            // @ts-ignore - dynamic assignment
            data.audio[field] = value;
            if (hasNotes) {
                // @ts-ignore
                data.audio[`${field}Notes`] = `Note for ${template}`;
            }

            const editor = new PCGWEditor('{{Audio}}\n');
            editor.updateAudio(data.audio as any);

            const output = editor.getText();
            expect(output).toContain(`|${template} = ${value}`);

            if (hasNotes) {
                expect(output).toContain(`|${template} notes = Note for ${template}`);
            }
        });
    });
});
