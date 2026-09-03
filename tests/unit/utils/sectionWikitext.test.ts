import { describe, it, expect } from 'vitest';
import { getSectionWikitext, setSectionWikitext } from '../../../src/utils/sectionWikitext';
import { initialGameData } from '../../../src/models/GameData';

const SAMPLE_WIKITEXT = `{{stub}}
{{cleanup|reason=Needs more info}}

{{Infobox game
|cover        = GameCover.jpg
|developers   = 
{{Infobox game/row/developer|Valve Corporation}}
|publishers   = 
{{Infobox game/row/publisher|Valve Corporation}}
|release dates= 
{{Infobox game/row/release date|Windows|November 16, 2004}}
}}

{{Introduction
|introduction      = '''''Half-Life 2''''' is a first-person shooter.
|release history   = 
|current state     = 
}}
'''General information'''
* [https://example.com Official site]

== Availability ==
{{Availability|
{{Availability/row|Steam|220|Steam| | |Windows, macOS, Linux}}
}}

== Monetization ==
{{Monetization
|one-time game purchase = true
}}

=== Microtransactions ===
{{Microtransactions
|none = true
}}

== Game data ==
{{Game data
|file structure = Steam
}}

=== Configuration file(s) location ===
{{Game data/config|Windows|%USERPROFILE%\\Documents\\Game\\config.ini}}

=== Save game data location ===
{{Game data/saves|Windows|%USERPROFILE%\\Documents\\Game\\saves}}

{{Save game cloud syncing
|steam cloud = true
}}

== Video ==
{{Video
|widescreen resolution = true
|fov                   = 90
|fov notes             = Native support.
}}

== Audio ==
{{Audio
|separate volume = true
|surround sound  = true
}}

== Issues unresolved ==
=== Stutter on launch ===
{{Fixbox|description=Delete config file}}

== Other information ==
{{API
|direct3d versions = 9.0c
}}
{{Middleware
|physics = Havok
}}

== System requirements ==
{{System requirements
|OS=Windows
|minCPU=Intel Core 2 Duo
}}
{{System requirements
|OS=Linux
|minCPU=Any 64-bit CPU
}}
`;

describe('sectionWikitext utilities', () => {
    it('extracts articleState correctly', () => {
        const text = getSectionWikitext('articleState', SAMPLE_WIKITEXT);
        expect(text).toContain('{{stub}}');
        expect(text).toContain('{{cleanup|reason=Needs more info}}');
    });

    it('extracts infobox correctly', () => {
        const text = getSectionWikitext('infobox', SAMPLE_WIKITEXT);
        expect(text).toContain('{{Infobox game');
        expect(text).toContain('Valve Corporation');
    });

    it('extracts introduction including General information', () => {
        const text = getSectionWikitext('introduction', SAMPLE_WIKITEXT);
        expect(text).toContain('{{Introduction');
        expect(text).toContain("'''General information'''");
    });

    it('extracts availability section content', () => {
        const text = getSectionWikitext('availability', SAMPLE_WIKITEXT);
        expect(text).toContain('{{Availability|');
        expect(text).not.toContain('== Availability ==');
    });

    it('extracts monetization section content including Microtransactions', () => {
        const text = getSectionWikitext('monetization', SAMPLE_WIKITEXT);
        expect(text).toContain('{{Monetization');
        expect(text).toContain('=== Microtransactions ===');
        expect(text).toContain('{{Microtransactions');
    });

    it('extracts video section content', () => {
        const text = getSectionWikitext('video', SAMPLE_WIKITEXT);
        expect(text).toContain('{{Video');
        expect(text).toContain('widescreen resolution = true');
        expect(text).not.toContain('== Video ==');
        expect(text).not.toContain('== Audio ==');
    });

    it('extracts issues section content', () => {
        const text = getSectionWikitext('issues', SAMPLE_WIKITEXT);
        expect(text).toContain('=== Stutter on launch ===');
        expect(text).toContain('Delete config file');
    });

    it('extracts other information section content', () => {
        const text = getSectionWikitext('other', SAMPLE_WIKITEXT);
        expect(text).toContain('{{API');
        expect(text).toContain('{{Middleware');
    });

    it('extracts subsections: gameData.config, gameData.saves, and cloudSync', () => {
        const configText = getSectionWikitext('gameData.config', SAMPLE_WIKITEXT);
        expect(configText).toContain('{{Game data/config|Windows');
        expect(configText).not.toContain('{{Game data/saves');

        const savesText = getSectionWikitext('gameData.saves', SAMPLE_WIKITEXT);
        expect(savesText).toContain('{{Game data/saves|Windows');
        expect(savesText).not.toContain('{{Game data/config');

        const cloudText = getSectionWikitext('gameData.cloudSync', SAMPLE_WIKITEXT);
        expect(cloudText).toContain('{{Save game cloud syncing');
        expect(cloudText).toContain('steam cloud = true');
    });

    it('extracts subsections: monetization.monetization and monetization.microtransactions', () => {
        const monText = getSectionWikitext('monetization.monetization', SAMPLE_WIKITEXT);
        expect(monText).toContain('{{Monetization');
        expect(monText).not.toContain('{{Microtransactions');

        const microText = getSectionWikitext('monetization.microtransactions', SAMPLE_WIKITEXT);
        expect(microText).toContain('{{Microtransactions');
        expect(microText).not.toContain('{{Monetization\n');
    });

    it('extracts subsections: other.api and other.middleware', () => {
        const apiText = getSectionWikitext('other.api', SAMPLE_WIKITEXT);
        expect(apiText).toContain('{{API');
        expect(apiText).not.toContain('{{Middleware');

        const mwText = getSectionWikitext('other.middleware', SAMPLE_WIKITEXT);
        expect(mwText).toContain('{{Middleware');
        expect(mwText).not.toContain('{{API');
    });

    it('extracts subsections: systemReq OS filters', () => {
        const winText = getSectionWikitext('systemReq.windows', SAMPLE_WIKITEXT);
        expect(winText).toContain('OS=Windows');
        expect(winText).toContain('Intel Core 2 Duo');

        const linuxText = getSectionWikitext('systemReq.linux', SAMPLE_WIKITEXT);
        expect(linuxText).toContain('OS=Linux');
        expect(linuxText).toContain('Any 64-bit CPU');
    });

    it('replaces gameData.config without touching gameData.saves or surrounding sections', () => {
        const newConfig = `{{Game data/config|Windows|%LOCALAPPDATA%\\NewGame\\settings.cfg}}`;
        const updated = setSectionWikitext('gameData.config', newConfig, SAMPLE_WIKITEXT);

        expect(updated).toContain('=== Configuration file(s) location ===\n{{Game data/config|Windows|%LOCALAPPDATA%\\NewGame\\settings.cfg}}');
        expect(updated).toContain('=== Save game data location ===\n{{Game data/saves|Windows|%USERPROFILE%\\Documents\\Game\\saves}}');
        expect(updated).toContain('{{Save game cloud syncing');
    });

    it('replaces video section content while preserving header and surrounding sections', () => {
        const newVideoText = `{{Video
|widescreen resolution = hackable
|fov                   = 120
}}`;
        const updated = setSectionWikitext('video', newVideoText, SAMPLE_WIKITEXT);

        expect(updated).toContain('== Video ==\n{{Video\n|widescreen resolution = hackable\n|fov                   = 120\n}}');
        expect(updated).toContain('== Availability ==');
        expect(updated).toContain('== Audio ==');
        expect(updated).not.toContain('widescreen resolution = true');

        const reExtracted = getSectionWikitext('video', updated);
        expect(reExtracted).toContain('fov                   = 120');
    });

    it('replaces infobox content without duplicating or corrupting surrounding content', () => {
        const newInfobox = `{{Infobox game
|cover = NewCover.jpg
}}`;
        const updated = setSectionWikitext('infobox', newInfobox, SAMPLE_WIKITEXT);
        expect(updated).toContain('{{stub}}');
        expect(updated).toContain('NewCover.jpg');
        expect(updated).toContain('{{Introduction');
        expect(updated).not.toContain('Valve Corporation');
    });

    it('generates fallback wikitext from gameData when section is missing', () => {
        const data = structuredClone(initialGameData);
        data.video.widescreenResolution = 'true';
        const emptyWikitext = '{{Infobox game\n}}';

        const extracted = getSectionWikitext('video', emptyWikitext, data);
        expect(extracted).toContain('{{Video');
        expect(extracted).toContain('widescreen resolution');
    });
});
