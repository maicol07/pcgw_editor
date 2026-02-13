
import { describe, it, expect } from 'vitest';
import { parseWikitext } from '../../../src/utils/parser';
import { PCGWEditor } from '../../../src/utils/wikitext';
import { GameData, SettingsVR } from '../../../src/models/GameData';

describe('Field Group: VR', () => {
    interface VRTestCase {
        field: keyof SettingsVR;
        template: string;
        value: string;
        expected: string;
        hasNotes?: boolean;
        extraParams?: Record<string, string>;
    }

    const vrFields: VRTestCase[] = [
        { field: 'native3d', template: 'native 3d', value: 'true', expected: 'true', hasNotes: true },
        { field: 'nvidia3dVision', template: 'nvidia 3d vision', value: 'fake 3d', expected: 'fake 3d', hasNotes: true },
        { field: 'vorpx', template: 'vorpx', value: 'true', expected: 'true', hasNotes: true, extraParams: { modes: 'Z3D' } },
        { field: 'vrOnly', template: 'vr only', value: 'true', expected: 'true', hasNotes: false },
        { field: 'openXr', template: 'openxr', value: 'true', expected: 'true', hasNotes: true },
        { field: 'steamVr', template: 'steamvr', value: 'native', expected: 'native', hasNotes: true },
        { field: 'oculusVr', template: 'oculusvr', value: 'native', expected: 'native', hasNotes: true },
        { field: 'windowsMixedReality', template: 'windows mixed reality', value: 'native', expected: 'native', hasNotes: true },
        { field: 'osvr', template: 'osvr', value: 'true', expected: 'true', hasNotes: true },
        { field: 'forteNsx1', template: 'forte vfx1', value: 'hackable', expected: 'hackable', hasNotes: true },
        { field: 'keyboardMouse', template: 'keyboard-mouse', value: 'true', expected: 'true', hasNotes: true },
        { field: 'bodyTracking', template: 'body tracking', value: 'supported', expected: 'supported', hasNotes: true },
        { field: 'handTracking', template: 'hand tracking', value: 'supported', expected: 'supported', hasNotes: true },
        { field: 'faceTracking', template: 'face tracking', value: 'supported', expected: 'supported', hasNotes: true },
        { field: 'eyeTracking', template: 'eye tracking', value: 'supported', expected: 'supported', hasNotes: true },
        { field: 'tobiiEyeTracking', template: 'tobii eye tracking', value: 'supported', expected: 'supported', hasNotes: true },
        { field: 'trackIr', template: 'trackir', value: 'true', expected: 'true', hasNotes: true },
        { field: 'thirdSpaceGamingVest', template: '3rd space gaming vest', value: 'true', expected: 'true', hasNotes: true },
        { field: 'novintFalcon', template: 'novint falcon', value: 'hackable', expected: 'hackable', hasNotes: true },
        { field: 'playAreaRoomScale', template: 'play area room-scale', value: 'true', expected: 'true', hasNotes: true },
    ];

    const getCleanData = (): GameData => ({
        pageTitle: '',
        articleState: {},
        infobox: {} as any,
        introduction: {} as any,
        availability: [],
        gameData: { configFiles: [], saveData: [], xdg: null, cloudSync: {} as any },
        video: {}, input: {}, audio: {}, network: {},
        vr: {
            native3d: 'unknown', nvidia3dVision: 'unknown', vorpx: 'unknown',
            openXr: 'unknown', steamVr: 'unknown', oculusVr: 'unknown', windowsMixedReality: 'unknown', osvr: 'unknown',
            keyboardMouse: 'unknown', bodyTracking: 'unknown', handTracking: 'unknown', faceTracking: 'unknown', eyeTracking: 'unknown',
            tobiiEyeTracking: 'unknown', trackIr: 'unknown',
            playAreaSeated: 'unknown', playAreaStanding: 'unknown', playAreaRoomScale: 'unknown'
        } as any,
        localizations: [], api: {},
        systemRequirements: { windows: {}, mac: {}, linux: {} } as any,
        monetization: {}, microtransactions: {},
        config: { configFiles: [], saveData: [], xdg: null, cloudSync: {} as any }
    } as any);

    describe('Parsing', () => {
        it.each(vrFields)('should parse %s field', ({ field, template, value, expected, hasNotes, extraParams }) => {
            let wikitext = `{{VR support\n|${template} = ${value}\n`;
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
            expect(data.vr[field]).toBe(expected);

            if (hasNotes) {
                // @ts-ignore
                expect(data.vr[`${field}Notes`]).toBe(`Note for ${template}`);
            }

            if (extraParams) {
                for (const [key, val] of Object.entries(extraParams)) {
                    const suffix = key.charAt(0).toUpperCase() + key.slice(1);
                    const propName = `${field}${suffix}`;
                    // @ts-ignore
                    expect(data.vr[propName]).toBe(val);
                }
            }
        });
    });

    describe('Writing', () => {
        it.each(vrFields)('should write %s field', ({ field, template, value, hasNotes, extraParams }) => {
            const data = getCleanData();
            // @ts-ignore
            data.vr[field] = value;
            if (hasNotes) {
                // @ts-ignore
                data.vr[`${field}Notes`] = `Note for ${template}`;
            }
            if (extraParams) {
                for (const [key, val] of Object.entries(extraParams)) {
                    const suffix = key.charAt(0).toUpperCase() + key.slice(1);
                    const propName = `${field}${suffix}`;
                    // @ts-ignore
                    data.vr[propName] = val;
                }
            }

            const editor = new PCGWEditor('{{VR support}}\n');
            editor.updateVR(data.vr as any);

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
