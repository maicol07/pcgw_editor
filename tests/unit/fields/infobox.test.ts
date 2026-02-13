import { describe, it, expect } from 'vitest';
import { parseWikitext } from '../../../src/utils/parser';
import { PCGWEditor } from '../../../src/utils/wikitext';
import { initialGameData } from '../../../src/models/GameData';

describe('Field Group: Infobox', () => {
    const getCleanData = () => JSON.parse(JSON.stringify(initialGameData));

    describe('Basic Information', () => {
        it('should parse cover', () => {
            const wikitext = `{{Infobox game|cover = MyGame.jpg}}`;
            const data = parseWikitext(wikitext);
            expect(data.infobox.cover).toBe('MyGame.jpg');
        });

        it('should write cover', () => {
            const data = getCleanData();
            data.infobox.cover = 'TestCover.png';
            const writer = new PCGWEditor('');
            writer.updateInfobox(data.infobox);
            expect(writer.getText()).toContain('|cover = TestCover.png');
        });

        it('should parse license', () => {
            const wikitext = `{{Infobox game|license = open source}}`;
            const data = parseWikitext(wikitext);
            expect(data.infobox.license).toBe('open source');
        });

        it('should write license', () => {
            const data = getCleanData();
            data.infobox.license = 'freeware';
            const writer = new PCGWEditor('');
            writer.updateInfobox(data.infobox);
            expect(writer.getText()).toContain('|license = freeware');
        });
    });

    describe('Lists', () => {
        it('should parse developers', () => {
            const wikitext = `{{Infobox game|developers = {{Infobox game/row/developer|Dev A}}}}`;
            const data = parseWikitext(wikitext);
            expect(data.infobox.developers).toHaveLength(1);
            expect(data.infobox.developers[0].name).toBe('Dev A');
        });

        it('should write developers', () => {
            const data = getCleanData();
            data.infobox.developers = [{ name: 'Dev One', type: 'developer' }];
            const writer = new PCGWEditor('');
            writer.updateInfobox(data.infobox);
            expect(writer.getText()).toContain('{{Infobox game/row/developer|Dev One}}');
        });

        it('should parse publishers', () => {
            const wikitext = `{{Infobox game|publishers = {{Infobox game/row/publisher|Pub A}}}}`;
            const data = parseWikitext(wikitext);
            expect(data.infobox.publishers).toHaveLength(1);
            expect(data.infobox.publishers[0].name).toBe('Pub A');
        });

        it('should write publishers', () => {
            const data = getCleanData();
            data.infobox.publishers = [{ name: 'Pub One', type: 'publisher' }];
            const writer = new PCGWEditor('');
            writer.updateInfobox(data.infobox);
            expect(writer.getText()).toContain('{{Infobox game/row/publisher|Pub One}}');
        });

        it('should parse engines', () => {
            const wikitext = `{{Infobox game|engines = {{Infobox game/row/engine|Engine X}}}}`;
            const data = parseWikitext(wikitext);
            expect(data.infobox.engines).toHaveLength(1);
            expect(data.infobox.engines[0].name).toBe('Engine X');
        });

        it('should parse engines with build', () => {
            const wikitext = `{{Infobox game|engines = {{Infobox game/row/engine|Engine X|build=1.0}}}}`;
            const data = parseWikitext(wikitext);
            expect(data.infobox.engines[0].build).toBe('1.0');
        });

        it('should parse engines with "Used For" and other params', () => {
            const wikitext = `{{Infobox game|engines = {{Infobox game/row/engine|Unreal Engine 4|Physics|build=4.12.4|name=UE4|ref=<ref>ref</ref>}}}}`;
            const data = parseWikitext(wikitext);
            expect(data.infobox.engines[0].name).toBe('Unreal Engine 4');
            expect(data.infobox.engines[0].extra).toBe('Physics'); // Used For
            expect(data.infobox.engines[0].build).toBe('4.12.4');
            expect(data.infobox.engines[0].displayName).toBe('UE4');
            expect(data.infobox.engines[0].ref).toBe('<ref>ref</ref>');
        });

        it('should write engines', () => {
            const data = getCleanData();
            data.infobox.engines = [{ name: 'Unity', type: 'engine' }];
            const writer = new PCGWEditor('');
            writer.updateInfobox(data.infobox);
            expect(writer.getText()).toContain('{{Infobox game/row/engine|Unity}}');
        });

        it('should write engines with build', () => {
            const data = getCleanData();
            data.infobox.engines = [{ name: 'Unity', build: '2022', type: 'engine' }];
            const writer = new PCGWEditor('');
            writer.updateInfobox(data.infobox);
            expect(writer.getText()).toContain('{{Infobox game/row/engine|Unity|build=2022}}');
        });

        it('should write engines with all params (Used For, name, build, ref)', () => {
            const data = getCleanData();
            data.infobox.engines = [{
                name: 'Unreal Engine 4',
                displayName: 'UE4',
                extra: 'Physics',
                build: '4.12.4',
                ref: '<ref>ref</ref>',
                type: 'engine'
            }];
            const writer = new PCGWEditor('');
            writer.updateInfobox(data.infobox);
            // Expect: {{Infobox game/row/engine|Unreal Engine 4|Physics|build=4.12.4|ref=<ref>ref</ref>|name=UE4}}
            // Order of named params might vary, but "Used For" (Physics) must be second positional.
            const text = writer.getText();
            expect(text).toContain('{{Infobox game/row/engine|Unreal Engine 4|Physics');
            expect(text).toContain('|build=4.12.4');
            expect(text).toContain('|name=UE4');
            expect(text).toContain('|ref=<ref>ref</ref>');
        });
    });

    describe('Release Dates', () => {
        it('should parse release dates', () => {
            const wikitext = `{{Infobox game|release dates = {{Infobox game/row/date|Windows|2023-01-01}}}}`;
            const data = parseWikitext(wikitext);
            expect(data.infobox.releaseDates).toHaveLength(1);
            expect(data.infobox.releaseDates[0]).toMatchObject({ platform: 'Windows', date: '2023-01-01' });
        });

        it('should write release dates', () => {
            const data = getCleanData();
            data.infobox.releaseDates = [{ platform: 'Windows', date: '2020-01-01' }];
            const writer = new PCGWEditor('');
            writer.updateInfobox(data.infobox);
            expect(writer.getText()).toContain('{{Infobox game/row/date|Windows|2020-01-01}}');
        });
    });

    describe('Reception', () => {
        it('should parse reception', () => {
            const wikitext = `{{Infobox game|reception = {{Infobox game/row/reception|Metacritic|1234|85}}}}`;
            const data = parseWikitext(wikitext);
            expect(data.infobox.reception).toHaveLength(1);
            expect(data.infobox.reception[0]).toEqual({ aggregator: 'Metacritic', id: '1234', score: '85' });
        });

        it('should write reception', () => {
            const data = getCleanData();
            data.infobox.reception = [{ aggregator: 'Metacritic', id: 'game-name', score: '90' }];
            const writer = new PCGWEditor('');
            writer.updateInfobox(data.infobox);
            expect(writer.getText()).toContain('{{Infobox game/row/reception|Metacritic|game-name|90}}');
        });
    });

    describe('Taxonomy', () => {
        const taxonomyFields = [
            'monetization', 'microtransactions', 'modes', 'pacing', 'perspectives',
            'controls', 'genres', 'sports', 'vehicles', 'artStyles', 'themes', 'series'
        ];

        // Helper to map camelCase field to wikitext row name suffix
        // Basic mapping: most are same, some might differ slightly but here mostly match or handled by parser
        // parser uses `getTax('art styles')` for `artStyles`
        // so we need a map
        const taxMap: Record<string, string> = {
            monetization: 'monetization',
            microtransactions: 'microtransactions',
            modes: 'modes',
            pacing: 'pacing',
            perspectives: 'perspectives',
            controls: 'controls',
            genres: 'genres',
            sports: 'sports',
            vehicles: 'vehicles',
            artStyles: 'art styles',
            themes: 'themes',
            series: 'series'
        };

        Object.entries(taxMap).forEach(([field, rowName]) => {
            it(`should parse taxonomy: ${field}`, () => {
                const wikitext = `{{Infobox game|taxonomy = {{Infobox game/row/taxonomy/${rowName}|Value}}}}`;
                const data = parseWikitext(wikitext);
                // @ts-ignore
                expect(data.infobox.taxonomy[field].value).toBe('Value');
            });

            it(`should write taxonomy: ${field}`, () => {
                const data = getCleanData();
                // @ts-ignore
                data.infobox.taxonomy[field] = { value: 'Value' };
                const writer = new PCGWEditor('');
                writer.updateInfobox(data.infobox);
                expect(writer.getText()).toContain(`{{Infobox game/row/taxonomy/${rowName}|Value}}`);
            });
        });
    });

    describe('External Links', () => {
        const linkMap: Record<string, { param: string, testVal: string }> = {
            steamAppId: { param: 'steam appid', testVal: '10' },
            steamAppIdSide: { param: 'steam appid side', testVal: 'sub/1' },
            gogComId: { param: 'gogcom id', testVal: 'game_slug' },
            gogComIdSide: { param: 'gogcom id side', testVal: 'DLC' },
            officialSite: { param: 'official site', testVal: 'https://example.com' },
            hltb: { param: 'hltb', testVal: '123' },
            igdb: { param: 'igdb', testVal: 'igdb-slug' },
            lutris: { param: 'lutris', testVal: 'lutris-slug' },
            mobygames: { param: 'mobygames', testVal: 'moby-slug' },
            vndb: { param: 'vndb', testVal: 'v123' },
            strategyWiki: { param: 'strategywiki', testVal: 'sw-slug' },
            wikipedia: { param: 'wikipedia', testVal: 'Example Game' },
            wineHq: { param: 'winehq', testVal: '456' },
            wineHqSide: { param: 'winehq side', testVal: 'gold' }
        };

        Object.entries(linkMap).forEach(([field, { param, testVal }]) => {
            it(`should parse external link: ${field}`, () => {
                const wikitext = `{{Infobox game|${param} = ${testVal}}}`;
                const data = parseWikitext(wikitext);
                // @ts-ignore
                expect(data.infobox.links[field]).toBe(testVal);
            });

            it(`should write external link: ${field}`, () => {
                const data = getCleanData();
                // @ts-ignore
                data.infobox.links[field] = testVal;
                const writer = new PCGWEditor('');
                writer.updateInfobox(data.infobox);
                expect(writer.getText()).toContain(`|${param} = ${testVal}`);
            });
        });
    });
});
