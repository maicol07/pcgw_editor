
import { describe, it, expect } from 'vitest';
import { parseWikitext } from '../../../src/utils/parser';
import { PCGWEditor } from '../../../src/utils/wikitext';
import { GameData } from '../../../src/models/GameData';

describe('Field Group: Game Data', () => {
    const getCleanData = (): GameData => ({
        pageTitle: '',
        articleState: {},
        infobox: {} as any,
        introduction: {} as any,
        availability: [],
        gameData: { configFiles: [], saveData: [], xdg: null, cloudSync: { discord: 'unknown', epicGamesLauncher: 'unknown', gogGalaxy: 'unknown', eaApp: 'unknown', steamCloud: 'unknown', ubisoftConnect: 'unknown', xboxCloud: 'unknown', status: 'unknown', notes: '' } },
        video: {}, input: {}, audio: {}, network: {}, vr: {}, localizations: [], api: {},
        systemRequirements: { windows: {}, mac: {}, linux: {} } as any,
        monetization: {}, microtransactions: {},
        config: { configFiles: [], saveData: [], xdg: null, cloudSync: {} as any }
    } as any);


    describe('Parsing', () => {
        interface PathTestCase {
            platform: string;
            path: string;
        }

        const configTestCases: PathTestCase[] = [
            { platform: 'DOS', path: '{{p|game}}' },
            { platform: 'Windows', path: '{{p|userprofile\\Documents}}\\' },
            { platform: 'Amazon Games', path: '{{P|userprofile\\documents}}\\Aspyr\\Fahrenheit Profile\\' },
            { platform: 'EA app', path: '{{p|userprofile\\Documents}}\\My Games\\FINAL FANTASY XV\\Origin\\savestorage\\' },
            { platform: 'Epic Games Launcher', path: '{{P|localappdata}}\\MW5Mercs\\Saved\\Config\\WindowsNoEditor\\' },
            { platform: 'GOG.com', path: '{{p|game}}\\saves' },
            { platform: 'Microsoft Store', path: '{{P|localappdata}}\\Packages\\39EA002F.FINALFANTASYXVforPC_n746a19ndrrjg\\LocalState' },
            { platform: 'Steam', path: '{{p|userprofile\\Documents}}\\My Games\\FINAL FANTASY XV\\Steam\\{{p|uid}}\\savestorage\\' },
            { platform: 'Ubisoft Connect', path: '{{p|uplay}}\\savegames\\{{p|uid}}\\4\\' },
            { platform: 'Mac OS', path: '{{p|game}}' },
            { platform: 'OS X', path: '{{p|machome}}/Library/Application Support/Vessel/' },
            { platform: 'Mac App Store', path: '{{P|osxhome}}/Library/Containers/Civilization VI/Data/Library/Application Support/Sid Meier’s Civilization VI/' },
            { platform: 'Linux', path: '{{p|linuxhome}}/.config/Vessel/' }
        ];

        it.each(configTestCases)('should parse $platform config location', async ({ platform, path }) => {
            const wikitext = `{{Game data|{{Game data/config|${platform}|${path}}}}}`;
            const data = await parseWikitext(wikitext);
            expect(data.config.configFiles).toContainEqual(expect.objectContaining({ platform, paths: [path] }));
        });

        describe('Save Data Locations', () => {
            const saveTestCases: PathTestCase[] = [
                { platform: 'DOS', path: '{{p|game}}' },
                { platform: 'Windows', path: '{{p|userprofile\\Documents}}\\' },
                { platform: 'Amazon Games', path: '{{P|userprofile\\documents}}\\Aspyr\\Fahrenheit Profile\\' },
                { platform: 'EA app', path: '{{p|userprofile\\Documents}}\\My Games\\FINAL FANTASY XV\\Origin\\savestorage\\' },
                { platform: 'Epic Games Launcher', path: '{{P|localappdata}}\\MW5Mercs\\Saved\\Config\\WindowsNoEditor\\' },
                { platform: 'GOG.com', path: '{{p|game}}\\saves' },
                { platform: 'Microsoft Store', path: '{{P|localappdata}}\\Packages\\39EA002F.FINALFANTASYXVforPC_n746a19ndrrjg\\LocalState' },
                { platform: 'Steam', path: '{{p|userprofile\\Documents}}\\My Games\\FINAL FANTASY XV\\Steam\\{{p|uid}}\\savestorage\\' },
                { platform: 'Ubisoft Connect', path: '{{p|uplay}}\\savegames\\{{p|uid}}\\4\\' },
                { platform: 'Mac OS', path: '{{p|game}}' },
                { platform: 'OS X', path: '{{p|machome}}/Library/Application Support/Vessel/' },
                { platform: 'Mac App Store', path: '{{P|osxhome}}/Library/Containers/Civilization VI/Data/Library/Application Support/Sid Meier’s Civilization VI/' },
                { platform: 'Linux', path: '{{p|linuxhome}}/.config/Vessel/' }
            ];

            it.each(saveTestCases)('should parse $platform save location', async ({ platform, path }) => {
                const wikitext = `{{Game data|{{Game data/saves|${platform}|${path}}}}}`;
                const data = await parseWikitext(wikitext);
                expect(data.config.saveData).toContainEqual(expect.objectContaining({ platform, paths: [path] }));
            });
        });

        describe('Cloud Sync', () => {
            interface CloudSyncTestCase {
                key: string;
                name: string;
                field?: string;
            }

            const providers: CloudSyncTestCase[] = [
                { key: 'discord', name: 'Discord' },
                { key: 'epic games launcher', name: 'Epic Games Launcher', field: 'epicGamesLauncher' },
                { key: 'gog galaxy', name: 'GOG Galaxy', field: 'gogGalaxy' },
                { key: 'ea app', name: 'EA app', field: 'eaApp' },
                { key: 'steam cloud', name: 'Steam Cloud', field: 'steamCloud' },
                { key: 'ubisoft connect', name: 'Ubisoft Connect', field: 'ubisoftConnect' },
                { key: 'xbox cloud', name: 'Xbox Cloud', field: 'xboxCloud' }
            ];

            const template = (props: string) => `{{Save game cloud syncing\n${props}\n}}`;

            it.each(providers)('should parse $name cloud sync', async ({ key, field }) => {
                const prop = (field || key) as keyof GameData['config']['cloudSync'];
                const data = await parseWikitext(template(`|${key} = true |${key} notes = note`));
                expect(data.config.cloudSync[prop]).toBe('true');
                // @ts-ignore
                expect(data.config.cloudSync[`${prop}Notes`]).toBe('note');
            });
        });


        describe('Parsing Complex Blocks', () => {
            it('should parse realistic multi-line Game data blocks', async () => {
                const wikitext = `==Game data==
===Configuration file(s) location===
{{Game data|
{{Game data/config|Windows|%USERPROFILE%\\Config}}
{{Game data/config|Steam|%USERPROFILE%\\SteamConfig}}
}}

===Save game data location===
{{Game data|
{{Game data/saves|Windows|%USERPROFILE%\\Saves}}
}}
`;
                const data = await parseWikitext(wikitext);
                
                expect(data.config.configFiles).toHaveLength(2);
                expect(data.config.configFiles[0]).toEqual(expect.objectContaining({
                    platform: 'Windows', paths: ['%USERPROFILE%\\Config']
                }));
                expect(data.config.configFiles[1]).toEqual(expect.objectContaining({
                    platform: 'Steam', paths: ['%USERPROFILE%\\SteamConfig']
                }));
                
                expect(data.config.saveData).toHaveLength(1);
                expect(data.config.saveData[0]).toEqual(expect.objectContaining({
                    platform: 'Windows', paths: ['%USERPROFILE%\\Saves']
                }));
            });
        });

    });

    describe('Writing', () => {
        it('should write Game Configuration', async () => {
            const data = getCleanData();
            data.config.configFiles = [
                { platform: 'Windows', paths: ['%USERPROFILE%\\Config'] }
            ];

            const writer = new PCGWEditor('');
            writer.updateGameData(data.config);
            const text = writer.getText();

            expect(text).toContain('===Configuration file(s) location===');
            expect(text).toContain('{{Game data/config');
            expect(text).toContain('|Windows|%USERPROFILE%\\Config');
        });

        it('should write Save Game Data', async () => {
            const data = getCleanData();
            data.config.saveData = [
                { platform: 'Windows', paths: ['%USERPROFILE%\\Saves'] }
            ];

            const writer = new PCGWEditor('');
            writer.updateGameData(data.config);
            const text = writer.getText();

            expect(text).toContain('===Save game data location===');
            expect(text).toContain('{{Game data|\n{{Game data/saves|Windows|%USERPROFILE%\\Saves}}\n}}');
        });

        it('should write both Config and Save Data', async () => {
            const data = getCleanData();
            data.config.configFiles = [
                { platform: 'Windows', paths: ['%USERPROFILE%\\Config'] }
            ];
            data.config.saveData = [
                { platform: 'Windows', paths: ['%USERPROFILE%\\Saves'] }
            ];

            const writer = new PCGWEditor('');
            writer.updateGameData(data.config);
            const text = writer.getText();

            expect(text).toContain('===Configuration file(s) location===');
            expect(text).toContain('{{Game data|\n{{Game data/config|Windows|%USERPROFILE%\\Config}}\n}}');
            expect(text).toContain('===Save game data location===');
            expect(text).toContain('{{Game data|\n{{Game data/saves|Windows|%USERPROFILE%\\Saves}}\n}}');
        });
        
        it('should update existing Game Data section properly', async () => {
            const data = getCleanData();
            data.config.configFiles = [
                { platform: 'Windows', paths: ['%USERPROFILE%\\NewConfig'] }
            ];
            
            const initialWikitext = `==Game data==
===Configuration file(s) location===
{{Game data|
{{Game data/config|Windows|%USERPROFILE%\\OldConfig}}
}}

===Save game data location===
{{Game data|
{{Game data/saves|Windows|%USERPROFILE%\\Saves}}
}}
`;
            const writer = new PCGWEditor(initialWikitext);
            writer.updateGameData(data.config);
            const text = writer.getText();
            
            // Should replace config, preserve saves
            expect(text).toContain('{{Game data/config|Windows|%USERPROFILE%\\NewConfig}}');
            expect(text).not.toContain('OldConfig');
            expect(text).toContain('{{Game data/saves|Windows|%USERPROFILE%\\Saves}}');
        });

        it('should write Cloud Sync', async () => {
            const data = getCleanData();
            data.config.cloudSync = {
                discord: 'true',
                steamCloud: 'true',
                status: 'true',
                notes: ''
            } as any;

            const writer = new PCGWEditor('');
            writer.updateCloudSync(data.config.cloudSync);
            const text = writer.getText();

            expect(text).toContain('===[[Glossary:Save game cloud syncing|Save game cloud syncing]]===');
            expect(text).toContain('{{Save game cloud syncing');
            expect(text).toContain('|discord = true');
            expect(text).toContain('|steam cloud = true');
        });
        
        it('should append Cloud Sync correctly to existing Game data section without rewriting config files', async () => {
            const data = getCleanData();
            data.config.cloudSync = {
                steamCloud: 'true',
                status: 'true',
                notes: ''
            } as any;

            const initialWikitext = `==Game data==
===Configuration file(s) location===
{{Game data|
{{Game data/config|Windows|%USERPROFILE%\\Config}}
}}
`;
            const writer = new PCGWEditor(initialWikitext);
            writer.updateCloudSync(data.config.cloudSync);
            const text = writer.getText();

            expect(text).toContain('==Game data==');
            expect(text).toContain('===Configuration file(s) location===');
            expect(text).toContain('===[[Glossary:Save game cloud syncing|Save game cloud syncing]]===');
            expect(text).toContain('{{Save game cloud syncing');
            expect(text).toContain('|steam cloud = true');
        });
        
        it('should not duplicate Cloud Sync block if it already exists', async () => {
            const data = getCleanData();
            data.config.cloudSync = {
                steamCloud: 'true',
                status: 'true',
                notes: ''
            } as any;

            const initialWikitext = `==Game data==
===[[Glossary:Save game cloud syncing|Save game cloud syncing]]===
{{Save game cloud syncing
|steam cloud = false
}}
`;
            const writer = new PCGWEditor(initialWikitext);
            writer.updateCloudSync(data.config.cloudSync);
            const text = writer.getText();

            // Check it updated the template
            expect(text).toContain('|steam cloud = true');
            // Check it didn't duplicate the template
            expect((text.match(/{{Save game cloud syncing/g) || []).length).toBe(1);
            expect((text.match(/===\[\[Glossary:Save game cloud syncing\|Save game cloud syncing\]\]===/g) || []).length).toBe(1);
        });
    });
});
