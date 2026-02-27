import { describe, it, expect } from 'vitest';
import { PCGWEditor, generateWikitext } from '../../src/utils/wikitext';
import { parseWikitext } from '../../src/utils/parser';
import {
    SettingsVideo,
    SettingsInput,
    SettingsAudio,
    SettingsNetwork,
    GameInfobox,
    AvailabilityRow,
    DLCRow,
    GameDataConfig,
    GameData
} from '../../src/models/GameData';

describe('Wikitext Generation & Parsing Issues', () => {
    const createEditor = (content = '') => new PCGWEditor(content);

    describe('Generation (Visual -> Code)', () => {
        // 1. Empty first line
        it('should not have an empty first line', () => {
            const editor = createEditor();
            editor.updateInfobox({ developers: [{ name: 'Dev' }] } as any);
            const text = editor.getText();
            expect(text.startsWith('\n')).toBe(false);
            expect(text.trimStart()).toBe(text);
        });

        // 2. Publishers and Engines on same line
        it('should put publishers and engines on separate lines', () => {
            const editor = createEditor();
            editor.updateInfobox({
                publishers: [{ name: 'Pub' }],
                engines: [{ name: 'Eng', build: '1.0' }]
            } as any);
            const text = editor.getText();
            expect(text).toMatch(/\|publishers\s*=\s*{{Infobox game\/row\/publisher\|Pub}}/);
            expect(text).toMatch(/\|engines\s*=\s*{{Infobox game\/row\/engine\|Eng\|build=1.0}}/);
            expect(text).not.toMatch(/\|publishers\s*=\s*\|engines/);
        });

        it('should separate publishers and engines even if they were on the same line', () => {
            const initialWikitext = '{{Infobox game|publishers=|engines=}}';
            const editor = new PCGWEditor(initialWikitext);

            editor.updateInfobox({
                publishers: [],
                engines: [{ name: 'Unreal Engine 5', build: '5.6.1' }]
            } as any);

            const text = editor.getText();
            expect(text).not.toContain('|publishers=|engines=');
            expect(text).toMatch(/\|publishers\s*=\s*\n\|engines/);
        });

        // 3. Reception rows
        it('should put reception rows on separate lines', () => {
            const editor = createEditor();
            editor.updateInfobox({
                reception: [
                    { aggregator: 'Metacritic', score: '80', id: '1' },
                    { aggregator: 'OpenCritic', score: '85', id: '2' }
                ]
            } as any);
            const text = editor.getText();
            // Check for newline between rows
            expect(text).toMatch(/}}\n{{Infobox game\/row\/reception/);
        });

        // 4. Taxonomy alignment
        it('should align taxonomy rows with pipes', () => {
            const editor = createEditor();
            editor.updateInfobox({
                taxonomy: {
                    monetization: { value: 'One-time game purchase' },
                    microtransactions: { value: 'None' },
                    modes: { value: 'Singleplayer' }
                }
            } as any);
            const text = editor.getText();
            expect(text).toContain('{{Infobox game/row/taxonomy/monetization      | One-time game purchase }}');
            expect(text).toContain('{{Infobox game/row/taxonomy/microtransactions | None }}');
        });

        // 5. Taxonomy always include fields
        it('should include all taxonomy fields even if empty', () => {
            const editor = createEditor();
            editor.updateInfobox({
                taxonomy: {
                    monetization: { value: '' }
                }
            } as any);
            const text = editor.getText();
            expect(text).toContain('{{Infobox game/row/taxonomy/monetization      | }}');
            expect(text).toContain('{{Infobox game/row/taxonomy/microtransactions | }}');
        });

        // 6. External links should include empty fields (except igdb)
        it('should output empty fields for external links (except igdb)', () => {
            const editor = createEditor();
            editor.updateInfobox({
                links: {
                    officialSite: 'http://example.com',
                    steamAppId: ''
                }
            } as any);
            const text = editor.getText();
            expect(text).toContain('|official site = http://example.com');
            expect(text).toContain('|steam appid');
        });

        // 7. IGDB exclusion
        it('should exclude igdb from external links if empty', () => {
            const editor = createEditor();
            editor.updateInfobox({
                links: { igdb: '' }
            } as any);
            const text = editor.getText();
            expect(text).not.toContain('|igdb');
        });

        it('should exclude igdb from external links if present in reception', () => {
            const editor = createEditor();
            editor.updateInfobox({
                links: { igdb: 'some-id' },
                reception: [{ aggregator: 'IGDB', id: 'some-id', score: '80' }]
            } as any);
            const text = editor.getText();
            expect(text).not.toContain('|igdb = some-id');
            expect(text).toContain('{{Infobox game/row/reception|IGDB|some-id|80}}');
        });

        // 7. General information position
        it('should place General information before Availability section header', () => {
            const editor = createEditor('== Availability ==\n{{Availability}}\n');
            editor.updateGeneralInfo("* {{mm}} [http://g.com G]");
            const text = editor.getText();
            expect(text.indexOf("'''General information'''")).toBeLessThan(text.indexOf("== Availability =="));
            expect(text).toContain("'''General information'''\n* {{mm}} [http://g.com G]");
        });

        // 8. Availability row format
        it('should format Availability rows correctly and handle empty fields', () => {
            const editor = createEditor();
            editor.updateAvailability([
                { distribution: 'Steam', id: '123', drm: 'Steam', notes: '', keys: '', os: 'Windows' }
            ]);
            const text = editor.getText();
            // Expect spaces around pipes
            expect(text).toContain('{{Availability/row| Steam | 123 | Steam | | | Windows }}');
            // Ensure empty fields are preserved as empty space
            expect(text).not.toContain('{{Availability/row| Steam | 123 | Steam |  |  | Windows }}');
        });

        // 9. DLC skip empty
        it('should not write DLC section if no rows', () => {
            const editor = createEditor();
            editor.updateDLC([]);
            const text = editor.getText();
            expect(text).not.toContain('{{DLC');
        });

        it('should remove existing DLC section if rows become empty and not leave extra newlines', () => {
            const initialWikitext = '== Availability ==\n{{Availability}}\n\n{{DLC|{{DLC/row| Existing DLC | | Windows }}}}\n\n== Monetization ==';
            const editor = new PCGWEditor(initialWikitext);
            editor.updateDLC([]);
            const text = editor.getText();
            expect(text).not.toContain('{{DLC');
            expect(text).not.toContain('Existing DLC');
            // Should not have 3+ newlines between sections
            expect(text).not.toContain('\n\n\n');
            expect(text).toContain('== Availability ==\n{{Availability}}\n\n== Monetization ==');
        });

        // 10. Input fields always appear
        it('should write all input fields even if empty', () => {
            const editor = createEditor();
            editor.updateInput({} as any);
            const text = editor.getText();
            expect(text).toContain('|mouse sensitivity');
            expect(text).toContain('|mouse sensitivity notes');
        });

        // 11. Issues position
        // Skipping specific issues position test as it requires more complex setup, will verify manually or add later.

        // 12. Audio empty lines
        it('should not have extra empty lines in Audio section', () => {
            const editor = createEditor();
            editor.updateAudio({
                separateVolume: 'true',
                separateVolumeNotes: 'notes'
            } as any);
            const text = editor.getText();
            expect(text).not.toMatch(/\|\s*separate volume\s*=[^\n]*\n\s*\n\s*\|/);
        });

        // 13. Network check nulls
        it('should not add Network section if all values are null/unknown', () => {
            const editor = createEditor();
            editor.updateNetwork({
                multiplayer: { local: 'unknown' }
            } as any);
            const text = editor.getText();
            expect(text).not.toContain('{{Network');
        });

        // 14. Availability duplication bug (|1= issue)
        it('should replace existing anonymous parameter in Availability instead of appending', () => {
            const initialWikitext = '{{Availability| EXISTING_CONTENT }}';
            const editor = new PCGWEditor(initialWikitext);
            editor.updateAvailability([
                { distribution: 'Steam', id: '123', drm: 'Steam', notes: '', keys: '', os: 'Windows' }
            ]);
            const text = editor.getText();
            // Should NOT contain EXISTING_CONTENT
            expect(text).not.toContain('EXISTING_CONTENT');
            // Should NOT contain |1=
            expect(text).not.toContain('|1=');
            // Should be correctly replaced
            expect(text).toContain('{{Availability|\n{{Availability/row| Steam | 123 | Steam | | | Windows }}\n}}');
        });
    });

    describe('Parsing (Code -> Visual)', () => {
        // 1. Config location
        it('should parse Config location correctly', () => {
            const wikitext = `
== Game data ==
=== Configuration file(s) location ===
{{Game data|config|Windows|%USERPROFILE%\\Documents\\My Game\\}}
`;
            const data = parseWikitext(wikitext);
            expect(data.config.configFiles).toHaveLength(1);
            expect(data.config.configFiles[0].paths[0]).toBe('%USERPROFILE%\\Documents\\My Game\\');
        });

        // 2. Xbox cloud
        it('should parse Xbox cloud field', () => {
            const wikitext = `{{Save game cloud syncing
|xbox cloud = true
}}`;
            const data = parseWikitext(wikitext);
            expect(data.config.cloudSync.xboxCloud).toBe('true');
        });

        // 3. Input fields
        it('should parse Input fields correctly', () => {
            const wikitext = `{{Input
|mouse sensitivity = true
}}`;
            const data = parseWikitext(wikitext);
            expect(data.input.mouseSensitivity).toBe('true');
        });

        // 4. General information
        it('should parse General information', () => {
            const wikitext = `'''General information'''
* {{mm}}[https://example.com Link]
`;
            const data = parseWikitext(wikitext);
            expect(data.introduction.generalInfo).toBeDefined();
            expect(data.introduction.generalInfo).toContain('https://example.com');
        });

        // 5. Wrapped Game data
        it('should parse wrapped Game data templates', () => {
            const wikitext = `
== Game data ==
=== Configuration file(s) location ===
{{Game data
|config =
{{Game data/config|Windows|%USERPROFILE%\\Documents\\My Game\\}}
}}
`;
            const data = parseWikitext(wikitext);
            expect(data.config.configFiles).toHaveLength(1);
            expect(data.config.configFiles[0].paths[0]).toBe('%USERPROFILE%\\Documents\\My Game\\');
        });

        // 6. Complex Game data with multiple rows and sections
        it('should parse complex Game data with mixed formats', () => {
            const wikitext = `
== Game data ==
{{Game data
|config =
{{Game data/config|Windows|%USERPROFILE%\\Documents\\My Game\\}}
{{Game data/config|Linux|{{p|user}}/.config/mygame/}}
|saves =
{{Game data/saves|Windows|%USERPROFILE%\\Documents\\My Game\\Saves\\}}
}}
`;
            const data = parseWikitext(wikitext);
            expect(data.config.configFiles).toHaveLength(2);
            expect(data.config.configFiles[0].platform).toBe('Windows');
            expect(data.config.configFiles[1].platform).toBe('Linux');
            expect(data.config.saveData).toHaveLength(1);
            expect(data.config.saveData[0].platform).toBe('Windows');
        });

        // 7. Config location with subheadings but no Game data wrapper
        it('should parse Config location with subheadings and direct templates', () => {
            const wikitext = `{{Game data/config|Windows|%USERPROFILE%\\Documents\\My Game\\}}
{{Game data/saves|Windows|%USERPROFILE%\\Documents\\My Game\\Saves\\}}`;
            const data = parseWikitext(wikitext);
            expect(data.config.configFiles).toHaveLength(1);
            expect(data.config.saveData).toHaveLength(1);
        });

        // 8. Direct root-level templates without section or wrapper
        it('should parse direct Game data templates at root level', () => {
            const wikitext = `{{Game data/config|Windows|%USERPROFILE%\\Documents\\My Game\\}}`;
            const data = parseWikitext(wikitext);
            expect(data.config.configFiles).toHaveLength(1);
        });

        // 9. Complex Wikilinks in parameters (verify no corruption)
        it('should parse complex Wikilinks in parameters without corruption', () => {
            const wikitext = `
{{Input
|steam input presets notes     = [[DualShock 4]], [[DualSense]], and [[Switch Pro Controller|Nintendo Switch Pro Controller]] configs are available.
}}
`;
            const data = parseWikitext(wikitext);
            const expected = '[[DualShock 4]], [[DualSense]], and [[Switch Pro Controller|Nintendo Switch Pro Controller]] configs are available.';
            expect(data.input.steamInputPresetsNotes).toBe(expected);

            // Now test regeneration/update
            const updatedWikitext = generateWikitext(data, ''); // Use empty base to force full generation
            expect(updatedWikitext).toContain('steam input presets notes');

            // Now test update with base wikitext (where the bug was)
            const updatedWithBase = generateWikitext(data, wikitext);
            const occurrences = updatedWithBase.split('Nintendo Switch Pro Controller]] configs are available.').length - 1;
            expect(occurrences).toBe(1);
        });

        // 10. L10n formatting (newline after content=)
        it('should format L10n template with newline after content=', () => {
            const editor = new PCGWEditor('{{L10n}}');
            editor.updateLocalizations([
                { language: 'English', interface: 'true', audio: 'true', subtitles: 'true' }
            ] as any);
            const text = editor.getText();
            expect(text).toContain('|content=\n{{L10n/switch');
            expect(text).toContain('}}');
        });

        // 11. Issues duplication
        it('should not duplicate Issues when updating', () => {
            const wikitext = `==Issues unresolved==
===Issue 1===
Body 1
`;
            const editor = new PCGWEditor(wikitext);
            editor.updateIssues([
                { title: 'Issue 1', body: 'Body 1', fixed: false }
            ]);

            const text = editor.getText();
            const occurrences = text.split('===Issue 1===').length - 1;
            expect(occurrences).toBe(1);
        });

        // 12. Issues section spacing
        it('should add an empty line after Issues section', () => {
            const wikitext = `==Issues unresolved==
===Issue 1===
Body 1
==Next Section==`;
            const editor = new PCGWEditor(wikitext);
            editor.updateIssues([
                { title: 'Issue 1', body: 'New Body', fixed: false }
            ]);

            const text = editor.getText();
            expect(text).toContain('New Body\n\n==Next Section==');
        });

        // 13. Solitary Issues unresolved
        it('should handle solitary Issues unresolved section correctly', () => {
            const wikitext = `==Issues unresolved==
===Issue 1===
Body 1`;
            const editor = new PCGWEditor(wikitext);
            editor.updateIssues([
                { title: 'Issue 1', body: 'New Body', fixed: false }
            ]);

            const text = editor.getText();
            const occurrences = text.split('===Issue 1===').length - 1;
            expect(occurrences).toBe(1);
            expect(text).toContain('New Body');
            expect(text).toBe(`==Issues unresolved==\n===Issue 1===\nNew Body\n`);
            // Second pass (simulating another mode switch)
            editor.updateIssues([
                { title: 'Issue 1', body: 'New Body', fixed: false }
            ]);
            const text2 = editor.getText();
            expect(text2.split('===Issue 1===').length - 1).toBe(1);
        });

        // 14. Removing Issues fixed
        it('should remove Issues fixed when only unresolved is in data', () => {
            const wikitext = `==Issues unresolved==
===Issue 1===
Body 1

==Issues fixed==
===Issue 2===
Body 2`;
            const editor = new PCGWEditor(wikitext);
            editor.updateIssues([
                { title: 'Issue 1', body: 'New Body', fixed: false }
            ]);

            const text = editor.getText();
            expect(text).not.toContain('==Issues fixed==');
            expect(text).not.toContain('===Issue 2===');
            expect(text).toContain('==Issues unresolved==');
        });

        // 15. Realistic Issues unresolved
        it('should correctly update unresolved issues in full template', () => {
            const wikitext = `==Introduction==
{{Introduction}}

==Issues unresolved==
===Old Issue===
Old Body

==System requirements==
{{System requirements|OS=Windows}}
`;
            const editor = new PCGWEditor(wikitext);
            editor.updateIssues([
                { title: 'New Issue', body: 'New Body', fixed: false }
            ]);

            const text = editor.getText();
            expect(text).toContain('==Issues unresolved==\n===New Issue===\nNew Body\n\n==System requirements==');
            expect(text).not.toContain('Old Issue');
        });
    });
});
