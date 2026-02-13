import { describe, it, expect } from 'vitest';
import { parseWikitext } from '../../../src/utils/parser';
import { PCGWEditor } from '../../../src/utils/wikitext';
import { GameData } from '../../../src/models/GameData';

describe('Field Group: Monetization & Microtransactions', () => {
    const getCleanData = (): GameData => ({
        pageTitle: 'Test Game',
        articleState: {},
        infobox: { developers: [], publishers: [], engines: [], releaseDates: [], reception: [], taxonomy: { monetization: { value: '' }, microtransactions: { value: '' }, modes: { value: '' }, pacing: { value: '' }, perspectives: { value: '' }, controls: { value: '' }, genres: { value: '' }, sports: { value: '' }, vehicles: { value: '' }, artStyles: { value: '' }, themes: { value: '' }, series: { value: '' } }, links: { steamAppId: '', steamAppIdSide: '', officialSite: '', gogComId: '', gogComIdSide: '', hltb: '', igdb: '', mobygames: '', strategyWiki: '', wikipedia: '', vndb: '', wineHq: '', wineHqSide: '', lutris: '' }, license: '' },
        introduction: { introduction: '', releaseHistory: '', currentState: '' },
        availability: [],
        gameData: { configFiles: [], saveData: [], xdg: null, cloudSync: { discord: 'unknown', epicGamesLauncher: 'unknown', gogGalaxy: 'unknown', eaApp: 'unknown', steamCloud: 'unknown', ubisoftConnect: 'unknown', xboxCloud: 'unknown', status: 'unknown', notes: '' } },
        video: {}, input: {}, audio: {}, network: {}, vr: {}, localizations: [], api: {},
        systemRequirements: { windows: {}, mac: {}, linux: {} } as any,
        monetization: { oneTimePurchase: '', freeToPlay: '', freeware: '', adSupported: '', subscription: '', subscriptionGamingService: '', dlc: '', expansionPack: '', crossGameBonus: '' },
        microtransactions: { none: '', cosmetic: '', currency: '', lootBox: '', unlock: '', boost: '', freeToGrind: '', finiteSpend: '', infiniteSpend: '', playerTrading: '', timeLimited: '' }
    } as any);

    it('should parse Monetization with all fields', () => {
        const wikitext = `
==Monetization==
{{Monetization
|ad-supported                = true
|cross-game bonus            = true
|dlc                         = true
|expansion pack              = true
|freeware                    = true
|free-to-play                = true
|one-time game purchase      = true
|subscription                = true
|subscription gaming service = true
}}
`;
        const data = parseWikitext(wikitext);

        expect(data.monetization.adSupported).toBe('true');
        expect(data.monetization.crossGameBonus).toBe('true');
        expect(data.monetization.dlc).toBe('true');
        expect(data.monetization.expansionPack).toBe('true');
        expect(data.monetization.freeware).toBe('true');
        expect(data.monetization.freeToPlay).toBe('true');
        expect(data.monetization.oneTimePurchase).toBe('true');
        expect(data.monetization.subscription).toBe('true');
        expect(data.monetization.subscriptionGamingService).toBe('true');
    });

    it('should parse Microtransactions with all fields', () => {
        const wikitext = `
===Microtransactions===
{{Microtransactions
|boost               = true
|cosmetic            = true
|currency            = true
|finite spend        = true
|infinite spend      = true
|free-to-grind       = true
|loot box            = true
|none                = true
|player trading      = true
|time-limited        = true
|unlock              = true
}}
`;
        const data = parseWikitext(wikitext);

        expect(data.microtransactions.boost).toBe('true');
        expect(data.microtransactions.cosmetic).toBe('true');
        expect(data.microtransactions.currency).toBe('true');
        expect(data.microtransactions.finiteSpend).toBe('true');
        expect(data.microtransactions.infiniteSpend).toBe('true');
        expect(data.microtransactions.freeToGrind).toBe('true');
        expect(data.microtransactions.lootBox).toBe('true');
        expect(data.microtransactions.none).toBe('true');
        expect(data.microtransactions.playerTrading).toBe('true');
        expect(data.microtransactions.timeLimited).toBe('true');
        expect(data.microtransactions.unlock).toBe('true');
    });

    it('should write Monetization template', () => {
        const data = getCleanData();
        data.monetization.oneTimePurchase = 'True';
        data.monetization.dlc = 'Some';

        const writer = new PCGWEditor('');
        writer.updateMonetization(data.monetization);
        const text = writer.getText();

        expect(text).toContain('{{Monetization');
        expect(text).toContain('|one-time game purchase = True');
        expect(text).toContain('|dlc = Some');
    });

    it('should write Microtransactions template', () => {
        const data = getCleanData();
        data.microtransactions.none = 'False';
        data.microtransactions.cosmetic = 'Yes';

        const writer = new PCGWEditor('');
        writer.updateMicrotransactions(data.microtransactions);
        const text = writer.getText();

        expect(text).toContain('{{Microtransactions');
        expect(text).toContain('|none = False');
        expect(text).toContain('|cosmetic = Yes');
    });
});
