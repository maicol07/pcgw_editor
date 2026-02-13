
import { describe, it, expect } from 'vitest';
import { parseWikitext } from '../../../src/utils/parser';
import { PCGWEditor } from '../../../src/utils/wikitext';
import { GameData, SettingsVideo } from '../../../src/models/GameData';

describe('Field Group: Video', () => {
    interface VideoTestCase {
        field: keyof SettingsVideo;
        template: string;
        value: string;
        expected: string;
        hasNotes?: boolean;
        hasTech?: boolean;
    }

    const videoFields: VideoTestCase[] = [
        { field: 'wsgfLink', template: 'wsgf link', value: 'http://wsgf.org', expected: 'http://wsgf.org' },
        { field: 'widescreenWsgfAward', template: 'widescreen wsgf award', value: 'gold', expected: 'gold' },
        { field: 'multiMonitorWsgfAward', template: 'multimonitor wsgf award', value: 'silver', expected: 'silver' },
        { field: 'ultraWidescreenWsgfAward', template: 'ultrawidescreen wsgf award', value: 'bronze', expected: 'bronze' },
        { field: 'fourKUltraHdWsgfAward', template: '4k ultra hd wsgf award', value: 'unsupported', expected: 'unsupported' },
        { field: 'widescreenResolution', template: 'widescreen resolution', value: 'native', expected: 'native', hasNotes: true },
        { field: 'multiMonitor', template: 'multimonitor', value: 'hackable', expected: 'hackable', hasNotes: true },
        { field: 'ultraWidescreen', template: 'ultrawidescreen', value: 'true', expected: 'true', hasNotes: true },
        { field: 'fourKUltraHd', template: '4k ultra hd', value: 'false', expected: 'false', hasNotes: true },
        { field: 'fov', template: 'fov', value: 'hor+', expected: 'hor+', hasNotes: true },
        { field: 'windowed', template: 'windowed', value: 'true', expected: 'true', hasNotes: true },
        { field: 'borderlessWindowed', template: 'borderless windowed', value: 'false', expected: 'false', hasNotes: true },
        { field: 'anisotropic', template: 'anisotropic', value: '16x', expected: '16x', hasNotes: true },
        { field: 'antiAliasing', template: 'antialiasing', value: 'MSAA', expected: 'MSAA', hasNotes: true },
        { field: 'upscaling', template: 'upscaling', value: 'dlss', expected: 'dlss', hasNotes: true, hasTech: true },
        { field: 'frameGen', template: 'framegen', value: 'fsr3', expected: 'fsr3', hasNotes: true, hasTech: true },
        { field: 'vsync', template: 'vsync', value: 'true', expected: 'true', hasNotes: true },
        { field: 'fps60', template: '60 fps', value: 'true', expected: 'true', hasNotes: true },
        { field: 'fps120', template: '120 fps', value: 'false', expected: 'false', hasNotes: true },
        { field: 'hdr', template: 'hdr', value: 'true', expected: 'true', hasNotes: true },
        { field: 'rayTracing', template: 'ray tracing', value: 'native', expected: 'native', hasNotes: true },
        { field: 'colorBlind', template: 'color blind', value: 'true', expected: 'true', hasNotes: true }
    ];

    const getCleanData = (): GameData => ({
        pageTitle: '',
        articleState: {},
        infobox: {} as any,
        introduction: {} as any,
        availability: [],
        gameData: { configFiles: [], saveData: [], xdg: null, cloudSync: {} as any },
        video: {}, input: {}, audio: {}, network: {}, vr: {}, localizations: [], api: {},
        systemRequirements: { windows: {}, mac: {}, linux: {} } as any,
        monetization: {}, microtransactions: {},
        config: { configFiles: [], saveData: [], xdg: null, cloudSync: {} as any }
    } as any);

    describe('Parsing', () => {
        it.each(videoFields)('should parse %s field', ({ field, template, value, expected, hasNotes, hasTech }) => {
            let wikitext = `{{Video\n|${template} = ${value}\n`;
            if (hasNotes) wikitext += `|${template} notes = Note for ${template}\n`;
            if (hasTech) wikitext += `|${template} tech = Tech for ${template}\n`;
            wikitext += '}}';

            const data = parseWikitext(wikitext);
            expect(data.video[field]).toBe(expected);

            if (hasNotes) {
                // @ts-ignore - dynamic access to optional notes field
                expect(data.video[`${field}Notes`]).toBe(`Note for ${template}`);
            }
            if (hasTech) {
                // @ts-ignore - dynamic access to optional tech field
                expect(data.video[`${field}Tech`]).toBe(`Tech for ${template}`);
            }
        });
    });

    describe('Writing', () => {
        it.each(videoFields)('should write %s field', ({ field, template, value, hasNotes, hasTech }) => {
            const data = getCleanData();
            // @ts-ignore - dynamic assignment
            data.video[field] = value;
            if (hasNotes) {
                // @ts-ignore
                data.video[`${field}Notes`] = `Note for ${template}`;
            }
            if (hasTech) {
                // @ts-ignore
                data.video[`${field}Tech`] = `Tech for ${template}`;
            }

            const editor = new PCGWEditor('{{Video}}\n');
            editor.updateVideo(data.video as any);

            const output = editor.getText();
            expect(output).toContain(`|${template} = ${value}`);

            if (hasNotes) {
                expect(output).toContain(`|${template} notes = Note for ${template}`);
            }
            if (hasTech) {
                expect(output).toContain(`|${template} tech = Tech for ${template}`);
            }
        });
    });
});
