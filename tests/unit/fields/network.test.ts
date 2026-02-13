
import { describe, it, expect } from 'vitest';
import { parseWikitext } from '../../../src/utils/parser';
import { PCGWEditor } from '../../../src/utils/wikitext';
import { GameData, SettingsNetwork } from '../../../src/models/GameData';

describe('Field Group: Network', () => {
    describe('Multiplayer', () => {
        interface MultiplayerTestCase {
            field: keyof SettingsNetwork;
            template: string;
            value: string;
            expected: string;
            hasNotes?: boolean;
            extraParams?: Record<string, string>;
        }

        const multiplayerFields: MultiplayerTestCase[] = [
            { field: 'localPlay', template: 'local play', value: 'true', expected: 'true', hasNotes: true, extraParams: { players: '4', modes: 'Co-op' } },
            { field: 'lanPlay', template: 'lan play', value: 'true', expected: 'true', hasNotes: true, extraParams: { players: '8', modes: 'Versus' } },
            { field: 'onlinePlay', template: 'online play', value: 'true', expected: 'true', hasNotes: true, extraParams: { players: '32', modes: 'Team Deathmatch' } },
            { field: 'asynchronous', template: 'asynchronous', value: 'true', expected: 'true', hasNotes: true },
            { field: 'crossplay', template: 'crossplay', value: 'true', expected: 'true', hasNotes: true, extraParams: { platforms: 'PC, Xbox' } }
        ];

        const getCleanData = (): GameData => ({
            pageTitle: '',
            articleState: {},
            infobox: {} as any,
            introduction: {} as any,
            availability: [],
            gameData: { configFiles: [], saveData: [], xdg: null, cloudSync: {} as any },
            video: {}, input: {}, audio: {},
            network: {
                localPlay: 'unknown', lanPlay: 'unknown', onlinePlay: 'unknown',
                matchmaking: 'unknown', p2p: 'unknown', dedicated: 'unknown', selfHosting: 'unknown', directIp: 'unknown'
            },
            vr: {}, localizations: [], api: {},
            systemRequirements: { windows: {}, mac: {}, linux: {} } as any,
            monetization: {}, microtransactions: {},
            config: { configFiles: [], saveData: [], xdg: null, cloudSync: {} as any }
        } as any);

        describe('Parsing', () => {
            it.each(multiplayerFields)('should parse %s field', ({ field, template, value, expected, hasNotes, extraParams }) => {
                let wikitext = `{{Network/Multiplayer\n|${template} = ${value}\n`;
                if (hasNotes) wikitext += `|${template} notes = Note for ${template}\n`;
                if (extraParams) {
                    for (const [key, val] of Object.entries(extraParams)) {
                        let paramName = `${template} ${key}`;
                        wikitext += `|${paramName} = ${val}\n`;
                    }
                }
                wikitext += '}}';

                const data = parseWikitext(wikitext);
                // @ts-ignore
                expect(data.network[field]).toBe(expected);

                if (hasNotes) {
                    // @ts-ignore
                    expect(data.network[`${field}Notes`]).toBe(`Note for ${template}`);
                }

                if (extraParams) {
                    for (const [key, val] of Object.entries(extraParams)) {
                        const suffix = key.charAt(0).toUpperCase() + key.slice(1);
                        const propName = `${field}${suffix}`;
                        // @ts-ignore
                        expect(data.network[propName]).toBe(val);
                    }
                }
            });
        });

        describe('Writing', () => {
            it.each(multiplayerFields)('should write %s field', ({ field, template, value, hasNotes, extraParams }) => {
                const data = getCleanData();
                // @ts-ignore
                data.network[field] = value;
                if (hasNotes) {
                    // @ts-ignore
                    data.network[`${field}Notes`] = `Note for ${template}`;
                }
                if (extraParams) {
                    for (const [key, val] of Object.entries(extraParams)) {
                        const suffix = key.charAt(0).toUpperCase() + key.slice(1);
                        const propName = `${field}${suffix}`;
                        // @ts-ignore
                        data.network[propName] = val;
                    }
                }

                const editor = new PCGWEditor('{{Network/Multiplayer}}\n');
                editor.updateNetwork(data.network as any);

                const output = editor.getText();
                expect(output).toContain(`|${template} = ${value}`);

                if (hasNotes) {
                    expect(output).toContain(`|${template} notes = Note for ${template}`);
                }

                if (extraParams) {
                    for (const [key, val] of Object.entries(extraParams)) {
                        let paramName = `${template} ${key}`;
                        expect(output).toContain(`|${paramName} = ${val}`);
                    }
                }
            });
        });
    });
});
