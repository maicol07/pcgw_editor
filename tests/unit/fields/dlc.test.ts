import { describe, it, expect } from 'vitest';
import { parseWikitext } from '../../../src/utils/parser';
import { PCGWEditor } from '../../../src/utils/wikitext';
import { GameData } from '../../../src/models/GameData';

describe('Field Group: DLC', () => {
    const getCleanData = (): GameData => ({
        pageTitle: 'Test Game',
        articleState: {},
        infobox: { developers: [], publishers: [], engines: [], releaseDates: [], reception: [], taxonomy: { monetization: { value: '' }, microtransactions: { value: '' }, modes: { value: '' }, pacing: { value: '' }, perspectives: { value: '' }, controls: { value: '' }, genres: { value: '' }, sports: { value: '' }, vehicles: { value: '' }, artStyles: { value: '' }, themes: { value: '' }, series: { value: '' } }, links: { steamAppId: '', steamAppIdSide: '', officialSite: '', gogComId: '', gogComIdSide: '', hltb: '', igdb: '', mobygames: '', strategyWiki: '', wikipedia: '', vndb: '', wineHq: '', wineHqSide: '', lutris: '' }, license: '' },
        introduction: { introduction: '', releaseHistory: '', currentState: '' },
        availability: [],
        monetization: { oneTimePurchase: '', freeToPlay: '', freeware: '', adSupported: '', subscription: '', subscriptionGamingService: '', dlc: '', expansionPack: '', crossGameBonus: '' },
        microtransactions: { none: '', cosmetic: '', currency: '', lootBox: '', unlock: '', boost: '', freeToGrind: '', finiteSpend: '', infiniteSpend: '', playerTrading: '', timeLimited: '' },
        dlc: [],
        gameData: { configFiles: [], saveData: [], xdg: null, cloudSync: { discord: 'unknown', epicGamesLauncher: 'unknown', gogGalaxy: 'unknown', eaApp: 'unknown', steamCloud: 'unknown', ubisoftConnect: 'unknown', xboxCloud: 'unknown', status: 'unknown', notes: '' } },
        video: {}, input: {}, audio: {}, network: {}, vr: {}, localizations: [], api: {},
        systemRequirements: { windows: {}, mac: {}, linux: {} } as any
    } as any);

    it('should parse DLC table', () => {
        const wikitext = `{{DLC|
{{DLC/row| DLC Name | DLC Notes | Windows }}
{{DLC/row| Expansion | | Windows, Linux }}
}}`;
        const data = parseWikitext(wikitext);
        expect(data.dlc).toHaveLength(2);
        expect(data.dlc[0].name).toBe('DLC Name');
        expect(data.dlc[0].notes).toBe('DLC Notes');
        expect(data.dlc[0].os).toBe('Windows');

        expect(data.dlc[1].name).toBe('Expansion');
        expect(data.dlc[1].os).toBe('Windows, Linux');
    });

    it('should write DLC table', () => {
        const data = getCleanData();
        data.dlc = [
            { name: 'DLC 1', notes: 'Notes 1', os: 'Windows' },
            { name: 'DLC 2', notes: '', os: 'Linux' }
        ];

        const writer = new PCGWEditor('');
        writer.updateDLC(data.dlc);
        const text = writer.getText();

        expect(text).toContain('{{DLC');
        expect(text).toContain('{{DLC/row| DLC 1 | Notes 1 | Windows }}');
        expect(text).toContain('{{DLC/row| DLC 2 |  | Linux }}');
    });
});
