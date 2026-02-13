import { describe, it, expect } from 'vitest';
import { parseWikitext } from '../../../src/utils/parser';
import { PCGWEditor } from '../../../src/utils/wikitext';
import { GameData } from '../../../src/models/GameData';

describe('Field Group: Availability', () => {
    const getCleanData = (): GameData => ({
        pageTitle: 'Test Game',
        articleState: {},
        infobox: { developers: [], publishers: [], engines: [], releaseDates: [], reception: [], taxonomy: { monetization: { value: '' }, microtransactions: { value: '' }, modes: { value: '' }, pacing: { value: '' }, perspectives: { value: '' }, controls: { value: '' }, genres: { value: '' }, sports: { value: '' }, vehicles: { value: '' }, artStyles: { value: '' }, themes: { value: '' }, series: { value: '' } }, links: { steamAppId: '', steamAppIdSide: '', officialSite: '', gogComId: '', gogComIdSide: '', hltb: '', igdb: '', mobygames: '', strategyWiki: '', wikipedia: '', vndb: '', wineHq: '', wineHqSide: '', lutris: '' }, license: '' },
        introduction: { introduction: '', releaseHistory: '', currentState: '' },
        availability: [],
        gameData: { configFiles: [], saveData: [], xdg: null, cloudSync: { discord: 'unknown', epicGamesLauncher: 'unknown', gogGalaxy: 'unknown', eaApp: 'unknown', steamCloud: 'unknown', ubisoftConnect: 'unknown', xboxCloud: 'unknown', status: 'unknown', notes: '' } },
        video: {}, input: {}, audio: {}, network: {}, vr: {}, localizations: [], api: {},
        systemRequirements: { windows: {}, mac: {}, linux: {} } as any
    } as any);

    it('should parse Availability table', () => {
        const wikitext = `{{Availability|
{{Availability/row| Steam | 220 | Steam | | | Windows, Linux }}
{{Availability/row| GOG.com | game_title | DRM-free | Notes | | Windows }}
}}`;
        const data = parseWikitext(wikitext);
        expect(data.availability).toHaveLength(2);
        expect(data.availability[0].distribution).toBe('Steam');
        expect(data.availability[0].id).toBe('220');
        expect(data.availability[0].drm).toBe('Steam');
        expect(data.availability[0].os).toBe('Windows, Linux');

        expect(data.availability[1].distribution).toBe('GOG.com');
        expect(data.availability[1].os).toBe('Windows');
    });

    it('should write Availability table', () => {
        const data = getCleanData();
        data.availability = [
            { distribution: 'Steam', id: '220', drm: 'Steam', notes: '', keys: '', os: 'Windows' },
            { distribution: 'GOG.com', id: 'test', drm: 'DRM-free', notes: 'Note', keys: '', os: 'Windows, Linux' }
        ];

        const writer = new PCGWEditor('');
        writer.updateAvailability(data.availability);
        const text = writer.getText();

        expect(text).toContain('{{Availability');
        expect(text).toContain('{{Availability/row| Steam | 220 | Steam |  |  | Windows }}');
        expect(text).toContain('{{Availability/row| GOG.com | test | DRM-free | Note |  | Windows, Linux }}');
    });

    it('should parse Availability with named parameters (special cases)', () => {
        const wikitext = `{{Availability|
{{Availability/row|1=source |2=store URL |3=DRM used |4=notes |5=keys |6=Windows }}
}}`;
        const data = parseWikitext(wikitext);
        expect(data.availability[0].distribution).toBe('source');
        expect(data.availability[0].id).toBe('store URL'); // In this format, param 2 is URL/ID
        expect(data.availability[0].drm).toBe('DRM used');
        expect(data.availability[0].notes).toBe('notes');
        expect(data.availability[0].keys).toBe('keys');
        expect(data.availability[0].os).toBe('Windows');
    });

    it('should parse Availability with unavailable/upcoming state', () => {
        const wikitext = `{{Availability|
{{Availability/row| Store | ID | DRM | Note | Key | Win | unavailable }}
}}`;
        const data = parseWikitext(wikitext);
        expect(data.availability[0].state).toBe('unavailable');
    });

    it('should write Availability with unavailable state', () => {
        const data = getCleanData();
        data.availability = [
            { distribution: 'Store', id: 'ID', drm: 'DRM', notes: 'Note', keys: 'Key', os: 'Win', state: 'unavailable' }
        ];

        const writer = new PCGWEditor('');
        writer.updateAvailability(data.availability);
        const text = writer.getText();
        expect(text).toContain('{{Availability/row| Store | ID | DRM | Note | Key | Win | unavailable }}');
    });
});
