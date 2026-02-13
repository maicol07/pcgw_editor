
import { describe, it, expect } from 'vitest';
import { parseWikitext } from '../../../src/utils/parser';
import { PCGWEditor } from '../../../src/utils/wikitext';
import { GameData, SettingsInput } from '../../../src/models/GameData';

describe('Field Group: Input', () => {
    interface InputTestCase {
        field: keyof SettingsInput;
        template: string;
        value: string;
        expected: string;
        hasNotes?: boolean;
    }

    const inputFields: InputTestCase[] = [
        { field: 'keyRemap', template: 'key remap', value: 'true', expected: 'true', hasNotes: true },
        { field: 'mouseSensitivity', template: 'mouse sensitivity', value: 'true', expected: 'true', hasNotes: true },
        { field: 'accelerationOption', template: 'acceleration option', value: 'false', expected: 'false', hasNotes: true },
        { field: 'mouseMenu', template: 'mouse menu', value: 'true', expected: 'true', hasNotes: true },
        { field: 'keyboardMousePrompts', template: 'keyboard and mouse prompts', value: 'true', expected: 'true', hasNotes: true },
        { field: 'invertMouseY', template: 'invert mouse y-axis', value: 'true', expected: 'true', hasNotes: true },
        { field: 'touchscreen', template: 'touchscreen', value: 'sexual', expected: 'sexual', hasNotes: true },
        { field: 'controllerSupport', template: 'controller support', value: 'true', expected: 'true', hasNotes: true },
        { field: 'fullController', template: 'full controller', value: 'true', expected: 'true', hasNotes: true },
        { field: 'controllerRemap', template: 'controller remap', value: 'true', expected: 'true', hasNotes: true },
        { field: 'controllerSensitivity', template: 'controller sensitivity', value: 'true', expected: 'true', hasNotes: true },
        { field: 'invertControllerY', template: 'invert controller y-axis', value: 'true', expected: 'true', hasNotes: true },
        { field: 'xinputControllers', template: 'xinput controllers', value: 'true', expected: 'true', hasNotes: true },
        { field: 'xboxPrompts', template: 'xbox prompts', value: 'true', expected: 'true', hasNotes: true },
        { field: 'impulseTriggers', template: 'impulse triggers', value: 'true', expected: 'true', hasNotes: true },
        { field: 'directInputControllers', template: 'directinput controllers', value: 'true', expected: 'true', hasNotes: true },
        { field: 'directInputPrompts', template: 'directinput prompts', value: 'true', expected: 'true', hasNotes: true },
        { field: 'playstationControllers', template: 'playstation controllers', value: 'true', expected: 'true', hasNotes: true },
        { field: 'playstationControllerModels', template: 'playstation controller models', value: 'CheckDS4', expected: 'CheckDS4', hasNotes: false },
        { field: 'playstationPrompts', template: 'playstation prompts', value: 'true', expected: 'true', hasNotes: true },
        { field: 'playstationMotionSensors', template: 'playstation motion sensors', value: 'true', expected: 'true', hasNotes: true },
        { field: 'playstationMotionSensorsModes', template: 'playstation motion sensors modes', value: 'aiming', expected: 'aiming', hasNotes: false },
        { field: 'glightBar', template: 'light bar support', value: 'true', expected: 'true', hasNotes: true },
        { field: 'dualSenseAdaptiveTrigger', template: 'dualsense adaptive trigger support', value: 'true', expected: 'true', hasNotes: true },
        { field: 'dualSenseHaptics', template: 'dualsense haptics support', value: 'true', expected: 'true', hasNotes: true },
        { field: 'playstationConnectionModes', template: 'playstation connection modes', value: 'USB', expected: 'USB', hasNotes: true },
        { field: 'nintendoControllers', template: 'nintendo controllers', value: 'true', expected: 'true', hasNotes: true },
        { field: 'nintendoControllerModels', template: 'nintendo controller models', value: 'SwitchPro', expected: 'SwitchPro', hasNotes: false },
        { field: 'nintendoPrompts', template: 'nintendo prompts', value: 'true', expected: 'true', hasNotes: true },
        { field: 'nintendoButtonLayout', template: 'nintendo button layout', value: 'digital', expected: 'digital', hasNotes: true },
        { field: 'nintendoMotionSensors', template: 'nintendo motion sensors', value: 'true', expected: 'true', hasNotes: true },
        { field: 'nintendoMotionSensorsModes', template: 'nintendo motion sensors modes', value: 'steering', expected: 'steering', hasNotes: false },
        { field: 'nintendoConnectionModes', template: 'nintendo connection modes', value: 'Bluetooth', expected: 'Bluetooth', hasNotes: true },
        { field: 'trackedMotionControllers', template: 'tracked motion controllers', value: 'true', expected: 'true', hasNotes: true },
        { field: 'trackedMotionPrompts', template: 'tracked motion prompts', value: 'true', expected: 'true', hasNotes: true },
        { field: 'otherControllers', template: 'other controllers', value: 'true', expected: 'true', hasNotes: true },
        { field: 'peripheralDevices', template: 'peripheral devices', value: 'true', expected: 'true', hasNotes: true },
        { field: 'peripheralDeviceTypes', template: 'peripheral device types', value: 'wheel', expected: 'wheel', hasNotes: false },
        { field: 'otherButtonPrompts', template: 'other button prompts', value: 'custom', expected: 'custom', hasNotes: true },
        { field: 'controllerHotplug', template: 'controller hotplug', value: 'true', expected: 'true', hasNotes: true },
        { field: 'inputPromptOverride', template: 'input prompt override', value: 'true', expected: 'true', hasNotes: true },
        { field: 'hapticFeedback', template: 'haptic feedback', value: 'true', expected: 'true', hasNotes: true },
        { field: 'hapticFeedbackHd', template: 'haptic feedback hd', value: 'true', expected: 'true', hasNotes: true },
        { field: 'hapticFeedbackHdControllerModels', template: 'haptic feedback hd controller models', value: 'SteamController', expected: 'SteamController', hasNotes: false },
        { field: 'digitalMovementSupported', template: 'digital movement supported', value: 'true', expected: 'true', hasNotes: true },
        { field: 'simultaneousInput', template: 'simultaneous input', value: 'true', expected: 'true', hasNotes: true },
        { field: 'steamInputApi', template: 'steam input api', value: 'true', expected: 'true', hasNotes: true },
        { field: 'steamHookInput', template: 'steam hook input', value: 'true', expected: 'true', hasNotes: true },
        { field: 'steamInputPrompts', template: 'steam input prompts', value: 'true', expected: 'true', hasNotes: true },
        { field: 'steamInputPromptsIcons', template: 'steam input prompts icons', value: 'ABXY', expected: 'ABXY', hasNotes: false },
        { field: 'steamInputPromptsStyles', template: 'steam input prompts styles', value: 'Light', expected: 'Light', hasNotes: false },
        { field: 'steamDeckPrompts', template: 'steam deck prompts', value: 'true', expected: 'true', hasNotes: true },
        { field: 'steamControllerPrompts', template: 'steam controller prompts', value: 'true', expected: 'true', hasNotes: true },
        { field: 'steamInputMotionSensors', template: 'steam input motion sensors', value: 'true', expected: 'true', hasNotes: true },
        { field: 'steamInputMotionSensorsModes', template: 'steam input motion sensors modes', value: 'gyro', expected: 'gyro', hasNotes: false },
        { field: 'steamInputPresets', template: 'steam input presets', value: 'true', expected: 'true', hasNotes: true },
        { field: 'steamCursorDetection', template: 'steam cursor detection', value: 'true', expected: 'true', hasNotes: true },
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
        it.each(inputFields)('should parse %s field', ({ field, template, value, expected, hasNotes }) => {
            let wikitext = `{{Input\n|${template} = ${value}\n`;
            if (hasNotes) wikitext += `|${template} notes = Note for ${template}\n`;
            wikitext += '}}';

            const data = parseWikitext(wikitext);
            // @ts-ignore - dynamic assignment
            expect(data.input[field]).toBe(expected);

            if (hasNotes) {
                // @ts-ignore
                expect(data.input[`${field}Notes`]).toBe(`Note for ${template}`);
            }
        });
    });

    describe('Writing', () => {
        it.each(inputFields)('should write %s field', ({ field, template, value, hasNotes }) => {
            const data = getCleanData();
            // @ts-ignore - dynamic assignment
            data.input[field] = value;
            if (hasNotes) {
                // @ts-ignore
                data.input[`${field}Notes`] = `Note for ${template}`;
            }

            const editor = new PCGWEditor('{{Input}}\n');
            editor.updateInput(data.input as any);

            const output = editor.getText();
            expect(output).toContain(`|${template} = ${value}`);

            if (hasNotes) {
                expect(output).toContain(`|${template} notes = Note for ${template}`);
            }
        });
    });
});
