
import { describe, it, expect } from 'vitest';
import { parseWikitext } from '../../../src/utils/parser';
import { PCGWEditor } from '../../../src/utils/wikitext';
import { GameData, LocalizationRow } from '../../../src/models/GameData';

describe('Field Group: Localization', () => {
    const localizationRows: LocalizationRow[] = [
        {
            language: 'English',
            interface: 'true',
            audio: 'true',
            subtitles: 'true',
            notes: '',
            fan: false,
            ref: ''
        },
        {
            language: 'French',
            interface: 'true',
            audio: 'unknown', // 'unknown' should usually conform to parsing logic or defaults
            subtitles: 'true',
            notes: '',
            fan: false,
            ref: ''
        },
        {
            language: 'Russian',
            interface: 'hackable',
            audio: 'n/a',
            subtitles: 'hackable',
            notes: 'Fan translation by Someone.',
            fan: true,
            ref: ''
        },
        {
            language: 'Japanese',
            interface: 'false',
            audio: 'true',
            subtitles: 'false',
            notes: 'No interface.',
            fan: false,
            ref: 'Ref1'
        }
    ];

    const getCleanData = (): GameData => ({
        pageTitle: '',
        articleState: {},
        infobox: {} as any,
        introduction: {} as any,
        availability: [],
        gameData: { configFiles: [], saveData: [], xdg: null, cloudSync: {} as any },
        video: {}, input: {}, audio: {}, network: {}, vr: {},
        localizations: [],
        api: {},
        systemRequirements: { windows: {}, mac: {}, linux: {} } as any,
        monetization: {}, microtransactions: {},
        config: { configFiles: [], saveData: [], xdg: null, cloudSync: {} as any }
    } as any);

    describe('Parsing', () => {
        it('should parse localization rows correctly', () => {
            const rowTemplates = localizationRows.map(row => {
                let tpl = `{{L10n/switch\n`;
                tpl += ` |language  = ${row.language}\n`;
                tpl += ` |interface = ${row.interface}\n`;
                tpl += ` |audio     = ${row.audio}\n`;
                tpl += ` |subtitles = ${row.subtitles}\n`;
                if (row.notes) tpl += ` |notes     = ${row.notes}\n`;
                if (row.fan) tpl += ` |fan       = true\n`;
                if (row.ref) tpl += ` |ref       = ${row.ref}\n`;
                tpl += `}}`;
                return tpl;
            }).join('\n');

            const wikitext = `{{L10n|content=\n${rowTemplates}\n}}`;
            const data = parseWikitext(wikitext);

            expect(data.localizations).toHaveLength(localizationRows.length);
            data.localizations.forEach((parsedRow, index) => {
                const expectedRow = localizationRows[index];
                expect(parsedRow.language).toBe(expectedRow.language);
                expect(parsedRow.interface).toBe(expectedRow.interface);
                expect(parsedRow.audio).toBe(expectedRow.audio);
                expect(parsedRow.subtitles).toBe(expectedRow.subtitles);
                expect(parsedRow.notes).toBe(expectedRow.notes || '');
                expect(parsedRow.fan).toBe(expectedRow.fan);
                expect(parsedRow.ref).toBe(expectedRow.ref || '');
            });
        });

        it('should parse empty localization section', () => {
            const wikitext = `{{L10n|content=}}`;
            const data = parseWikitext(wikitext);
            expect(data.localizations).toEqual([]);
        });
    });

    describe('Writing', () => {
        it('should write localization rows correctly', () => {
            const data = getCleanData();
            data.localizations = localizationRows;

            const editor = new PCGWEditor('{{L10n|content=\n}}');
            editor.updateLocalizations(data.localizations);

            const output = editor.getText();

            localizationRows.forEach(row => {
                expect(output).toContain(`|language  = ${row.language}`);
                // Verify interface value is written correctly (e.g. 'hackable', 'true', 'false')
                // Note: The writer ensures 'false' if undefined/unknown, but let's check specifically what we expect
                const expectedInterface = row.interface;
                expect(output).toContain(`|interface = ${expectedInterface}`);

                // For audio/subtitles, unknown/undefined becomes false or omitted?
                // Logic: row.audio !== 'unknown' && row.audio ? row.audio : 'false';
                // So 'unknown' becomes 'false' in writer output.
                let expectedAudio = row.audio;
                if (expectedAudio === 'unknown' || !expectedAudio) expectedAudio = 'false';
                expect(output).toContain(`|audio     = ${expectedAudio}`);

                let expectedSubs = row.subtitles;
                if (expectedSubs === 'unknown' || !expectedSubs) expectedSubs = 'false';
                expect(output).toContain(`|subtitles = ${expectedSubs}`);

                if (row.notes) {
                    expect(output).toContain(`|notes     = ${row.notes}`);
                }
                if (row.fan) {
                    expect(output).toContain(`|fan       = true`);
                }
                if (row.ref) {
                    expect(output).toContain(`|ref       = ${row.ref}`);
                }
            });
        });
    });
});
