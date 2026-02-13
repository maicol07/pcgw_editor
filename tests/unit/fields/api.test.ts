
import { describe, it, expect } from 'vitest';
import { parseWikitext } from '../../../src/utils/parser';
import { PCGWEditor } from '../../../src/utils/wikitext';
import { GameData } from '../../../src/models/GameData';

describe('Field Group: API', () => {
    interface ApiTestCase {
        wikitextField: string;
        dataField: string;
        value: string;
        notesField?: string;
        notesDataField?: string;
        notesValue?: string;
    }

    const testCases: ApiTestCase[] = [
        { wikitextField: 'direct3d versions', dataField: 'api.dxVersion', value: '11, 12', notesField: 'direct3d notes', notesDataField: 'api.dxNotes', notesValue: 'Some notes' },
        { wikitextField: 'directdraw versions', dataField: 'api.directDrawVersion', value: '7', notesField: 'directdraw notes', notesDataField: 'api.directDrawNotes', notesValue: 'DD notes' },
        { wikitextField: 'opengl versions', dataField: 'api.openGlVersion', value: '4.5', notesField: 'opengl notes', notesDataField: 'api.openGlNotes', notesValue: 'OGL notes' },
        { wikitextField: 'vulkan versions', dataField: 'api.vulkanVersion', value: '1.2', notesField: 'vulkan notes', notesDataField: 'api.vulkanNotes', notesValue: 'Vk notes' },
        { wikitextField: 'glide versions', dataField: 'api.glideVersion', value: '3dfx', notesField: 'glide notes', notesDataField: 'api.glideNotes', notesValue: 'Glide notes' },
        { wikitextField: 'wing', dataField: 'api.wing', value: 'true', notesField: 'wing notes', notesDataField: 'api.wingNotes', notesValue: 'WinG notes' },
        { wikitextField: 'software mode', dataField: 'api.softwareMode', value: 'true', notesField: 'software mode notes', notesDataField: 'api.softwareModeNotes', notesValue: 'Soft notes' },
        { wikitextField: 'mantle support', dataField: 'api.mantle', value: 'true', notesField: 'mantle support notes', notesDataField: 'api.mantleNotes', notesValue: 'Mantle notes' },
        { wikitextField: 'metal support', dataField: 'api.metal', value: 'true', notesField: 'metal support notes', notesDataField: 'api.metalNotes', notesValue: 'Metal notes' },
        { wikitextField: 'dos modes', dataField: 'api.dosModes', value: 'true', notesField: 'dos modes notes', notesDataField: 'api.dosModesNotes', notesValue: 'DOS notes' },
        // Windows
        { wikitextField: 'windows 32-bit exe', dataField: 'api.windows32', value: 'true' },
        { wikitextField: 'windows 64-bit exe', dataField: 'api.windows64', value: 'true' },
        { wikitextField: 'windows arm app', dataField: 'api.windowsArm', value: 'true' },
        { wikitextField: 'windows exe notes', dataField: 'api.windowsNotes', value: 'Win notes' },
        // Mac
        { wikitextField: 'mac os x powerpc app', dataField: 'api.macOsXPowerPc', value: 'true' },
        { wikitextField: 'macos intel 32-bit app', dataField: 'api.macOsIntel32', value: 'true' },
        { wikitextField: 'macos intel 64-bit app', dataField: 'api.macOsIntel64', value: 'true' },
        { wikitextField: 'macos arm app', dataField: 'api.macOsArm', value: 'true' },
        { wikitextField: 'mac os 68k app', dataField: 'api.macOs68k', value: 'true' },
        { wikitextField: 'mac os powerpc app', dataField: 'api.macOsPowerPc', value: 'true' },
        { wikitextField: 'mac os executable notes', dataField: 'api.macOsNotes', value: 'Mac exe notes' },
        { wikitextField: 'macos app notes', dataField: 'api.macOsAppNotes', value: 'Mac app notes' },
        // Linux
        { wikitextField: 'linux 32-bit executable', dataField: 'api.linux32', value: 'true' },
        { wikitextField: 'linux 64-bit executable', dataField: 'api.linux64', value: 'true' },
        { wikitextField: 'linux arm app', dataField: 'api.linuxArm', value: 'true' },
        { wikitextField: 'linux powerpc app', dataField: 'api.linuxPowerPc', value: 'true' },
        { wikitextField: 'linux 68k app', dataField: 'api.linux68k', value: 'true' },
        { wikitextField: 'linux executable notes', dataField: 'api.linuxNotes', value: 'Linux notes' }
    ];

    describe('Parsing', () => {
        it.each(testCases)('should parse %s', ({ wikitextField, dataField, value, notesField, notesDataField, notesValue }) => {
            let wikitext = `{{API\n|${wikitextField} = ${value}\n`;
            if (notesField && notesValue) {
                wikitext += `|${notesField} = ${notesValue}\n`;
            }
            wikitext += `}}`;

            const data = parseWikitext(wikitext);

            const accessData = (path: string, obj: any) => {
                return path.split('.').reduce((acc, part) => acc && acc[part], obj);
            };

            expect(accessData(dataField, data)).toBe(value);
            if (notesDataField && notesValue) {
                expect(accessData(notesDataField, data)).toBe(notesValue);
            }
        });
    });

    describe('Writing', () => {
        it.each(testCases)('should write %s', ({ wikitextField, dataField, value, notesField, notesDataField, notesValue }) => {
            const data: any = { api: {} };

            const setData = (path: string, obj: any, val: any) => {
                const parts = path.split('.');
                let current = obj;
                for (let i = 0; i < parts.length - 1; i++) {
                    if (!current[parts[i]]) current[parts[i]] = {};
                    current = current[parts[i]];
                }
                current[parts[parts.length - 1]] = val;
            };

            setData(dataField, data, value);
            if (notesDataField && notesValue) {
                setData(notesDataField, data, notesValue);
            }

            const editor = new PCGWEditor('{{API}}');
            editor.updateAPI(data.api);
            const output = editor.getText();

            expect(output).toContain(`|${wikitextField} = ${value}`);
            if (notesField && notesValue) {
                expect(output).toContain(`|${notesField} = ${notesValue}`);
            }
        });
    });
});
