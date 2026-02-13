import { describe, it, expect } from 'vitest';
import { parseWikitext } from '../../../src/utils/parser';
import { PCGWEditor } from '../../../src/utils/wikitext';
import { GameData } from '../../../src/models/GameData';

describe('Field Group: Introduction', () => {
    const getCleanData = (): GameData => ({
        pageTitle: 'Test Game',
        articleState: {},
        infobox: {
            developers: [],
            publishers: [],
            engines: [],
            releaseDates: [],
            reception: [],
            taxonomy: {
                monetization: { value: '' },
                microtransactions: { value: '' },
                modes: { value: '' },
                pacing: { value: '' },
                perspectives: { value: '' },
                controls: { value: '' },
                genres: { value: '' },
                sports: { value: '' },
                vehicles: { value: '' },
                artStyles: { value: '' },
                themes: { value: '' },
                series: { value: '' },
            },
            links: {
                steamAppId: '', steamAppIdSide: '',
                officialSite: '',
                gogComId: '', gogComIdSide: '',
                hltb: '',
                igdb: '',
                mobygames: '',
                strategyWiki: '',
                wikipedia: '',
                vndb: '',
                wineHq: '', wineHqSide: '',
                lutris: ''
            },
            license: ''
        },
        introduction: {
            introduction: '',
            releaseHistory: '',
            currentState: ''
        },
        availability: [],
        gameData: {
            configFiles: [],
            saveData: [],
            xdg: null,
            cloudSync: {
                discord: 'unknown',
                epicGamesLauncher: 'unknown',
                gogGalaxy: 'unknown',
                eaApp: 'unknown',
                steamCloud: 'unknown',
                ubisoftConnect: 'unknown',
                xboxCloud: 'unknown',
                status: 'unknown',
                notes: ''
            }
        },
        video: {}, // Simplified
        input: {}, // Simplified
        audio: {}, // Simplified
        network: {}, // Simplified
        vr: {}, // Simplified
        localizations: [],
        api: {},  // Simplified
        systemRequirements: { windows: {}, mac: {}, linux: {} } as any
    } as any);

    it('should parse Introduction template', () => {
        const wikitext = `{{Introduction
|introduction      = This is an intro.
|release history   = Released in 2020.
|current state     = Active development.
}}`;
        const data = parseWikitext(wikitext);
        expect(data.introduction.introduction).toBe('This is an intro.');
        expect(data.introduction.releaseHistory).toBe('Released in 2020.');
        expect(data.introduction.currentState).toBe('Active development.');
    });

    it('should parse Introduction with some missing fields', () => {
        const wikitext = `{{Introduction
|introduction      = Only intro.
}}`;
        const data = parseWikitext(wikitext);
        expect(data.introduction.introduction).toBe('Only intro.');
        expect(data.introduction.releaseHistory).toBe('');
        expect(data.introduction.currentState).toBe('');
    });

    it('should write Introduction template', () => {
        const data = getCleanData();
        data.introduction.introduction = "Written intro.";
        data.introduction.releaseHistory = "Written release.";
        data.introduction.currentState = "Written state.";

        const writer = new PCGWEditor('');
        writer.updateIntroduction(data.introduction);
        const text = writer.getText();

        expect(text).toContain('{{Introduction');
        expect(text).toContain('|introduction = Written intro.');
        expect(text).toContain('|release history = Written release.');
        expect(text).toContain('|current state = Written state.');
    });

    it('should handle updates to existing Introduction', () => {
        const original = `{{Introduction
|introduction      = Old intro.
|release history   = Old release.
|current state     = Old state.
}}`;
        const data = getCleanData();
        data.introduction.introduction = "New intro.";
        // Keep others same (simulating full object update)
        data.introduction.releaseHistory = "Old release.";
        data.introduction.currentState = "Old state.";

        const writer = new PCGWEditor(original);
        writer.updateIntroduction(data.introduction);
        const text = writer.getText();

        expect(text).toContain('|introduction      = New intro.');
        expect(text).toContain('|release history   = Old release.');
        expect(text).toContain('|current state     = Old state.');
    });
});
