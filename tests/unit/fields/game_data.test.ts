
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

        it.each(configTestCases)('should parse $platform config location', ({ platform, path }) => {
            const wikitext = `{{Game data|{{Game data/config|${platform}|${path}}}}}`;
            const data = parseWikitext(wikitext);
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

            it.each(saveTestCases)('should parse $platform save location', ({ platform, path }) => {
                const wikitext = `{{Game data|{{Game data/saves|${platform}|${path}}}}}`;
                const data = parseWikitext(wikitext);
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

            it.each(providers)('should parse $name cloud sync', ({ key, field }) => {
                const prop = (field || key) as keyof GameData['config']['cloudSync'];
                const data = parseWikitext(template(`|${key} = true |${key} notes = note`));
                expect(data.config.cloudSync[prop]).toBe('true');
                // @ts-ignore
                expect(data.config.cloudSync[`${prop}Notes`]).toBe('note');
            });
        });


    });

    describe('Writing', () => {
        it('should write Game Configuration', () => {
            const data = getCleanData();
            data.config.configFiles = [
                { platform: 'Windows', paths: ['%USERPROFILE%\\Config'] }
            ];

            const writer = new PCGWEditor('');
            writer.updateGameData(data.config);
            const text = writer.getText();

            expect(text).toContain('{{Game data|config');
            expect(text).toContain('|Windows|%USERPROFILE%\\Config');
        });

        it('should write Cloud Sync', () => {
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

            expect(text).toContain('{{Save game cloud syncing');
            expect(text).toContain('|discord = true');
            expect(text).toContain('|steam cloud = true');
        });
    });
});
