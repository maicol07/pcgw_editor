
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import InputForm from '../../../src/components/InputForm.vue';
import { SettingsInput } from '../../../src/models/GameData';
import { ref } from 'vue';

// Mock Lucide icons
vi.mock('lucide-vue-next', () => ({
    Keyboard: { template: '<span class="icon-keyboard"></span>' },
    Move: { template: '<span class="icon-move"></span>' },
    MousePointerClick: { template: '<span class="icon-mousepointerclick"></span>' },
    ArrowUpDown: { template: '<span class="icon-arrowupdown"></span>' },
    Tablet: { template: '<span class="icon-tablet"></span>' },
    Gamepad2: { template: '<span class="icon-gamepad2"></span>' },
    CheckCircle: { template: '<span class="icon-checkcircle"></span>' },
    Settings: { template: '<span class="icon-settings"></span>' },
    SlidersHorizontal: { template: '<span class="icon-slidershorizontal"></span>' },
    Plug: { template: '<span class="icon-plug"></span>' },
    Smartphone: { template: '<span class="icon-smartphone"></span>' },
    Users: { template: '<span class="icon-users"></span>' },
    Box: { template: '<span class="icon-box"></span>' },
    Zap: { template: '<span class="icon-zap"></span>' },
    Search: { template: '<span class="icon-search"></span>' },
    Monitor: { template: '<span class="icon-monitor"></span>' },
    Hand: { template: '<span class="icon-hand"></span>' }
}));

// Mock useFields
vi.mock('../../../src/composables/useFields', () => ({
    useFields: () => ({
        getField: (path: string) => ({
            id: path,
            type: 'text', // Dummy type
            label: path // Dummy label
        })
    })
}));

// Mock Components
const RatingRowStub = {
    template: '<div class="rating-row-stub" :data-label="label" :data-value="value"></div>',
    props: ['label', 'value', 'notes', 'reference', 'icon'],
    emits: ['update:value', 'update:notes', 'update:reference']
};

const DynamicFieldStub = {
    template: '<div class="dynamic-field-stub" :data-field="field.id"></div>',
    props: ['field', 'modelValue'],
    emits: ['update:modelValue']
};

const PanelStub = {
    template: '<div><slot /></div>'
};

describe('InputForm.vue', () => {
    const createInputSettings = (): SettingsInput => ({
        keyRemap: 'unknown',
        mouseSensitivity: 'unknown',
        mouseMenu: 'unknown',
        keyboardMousePrompts: 'unknown',
        invertMouseY: 'unknown',
        touchscreen: 'unknown',
        controllerSupport: 'unknown',
        fullController: 'unknown',
        controllerRemap: 'unknown',
        controllerSensitivity: 'unknown',
        invertControllerY: 'unknown',
        steamInputApi: 'unknown',
        steamDeckPrompts: 'unknown',
        steamInput: 'unknown',
        steamInputPrompts: 'unknown',
        steamControllerPrompts: 'unknown',
        matchmaking: 'unknown',
        p2p: 'unknown',
        dedicated: 'unknown',
        selfHosting: 'unknown',
        directIp: 'unknown',
        // ... (fill with defaults or partial knowns, others will be undefined which is fine for test if optional)
        // Since createInputSettings returns SettingsInput, we need to satisfy the interface or cast.
        // The interface is large. Let's cast to any for simplicity in initialization or use a helper that fills all.
        // Better to define known fields we test.
    } as any);

    const setupWrapper = (inputProps: Partial<SettingsInput> = {}) => {
        const input = { ...createInputSettings(), ...inputProps };
        return {
            wrapper: mount(InputForm, {
                props: { input },
                global: {
                    stubs: {
                        RatingRow: RatingRowStub,
                        Panel: PanelStub,
                        DynamicField: DynamicFieldStub
                    }
                }
            }),
            input
        };
    };

    const ratingFields = [
        { label: 'Key Remapping', prop: 'keyRemap' },
        { label: 'Keyboard/Mouse Prompts', prop: 'keyboardMousePrompts' },
        { label: 'Mouse Sensitivity', prop: 'mouseSensitivity' },
        { label: 'Mouse Menu', prop: 'mouseMenu' },
        { label: 'Invert Mouse Y-Axis', prop: 'invertMouseY' },
        { label: 'Touchscreen', prop: 'touchscreen' },
        { label: 'Controller Support', prop: 'controllerSupport' },
        { label: 'Full Controller Support', prop: 'fullController' },
        { label: 'Controller Remapping', prop: 'controllerRemap' },
        { label: 'Controller Sensitivity', prop: 'controllerSensitivity' },
        { label: 'Invert Controller Y-Axis', prop: 'invertControllerY' },
        { label: 'Controller Hotplugging', prop: 'controllerHotplug' },
        { label: 'Haptic Feedback', prop: 'hapticFeedback' },
        { label: 'Haptic Feedback HD', prop: 'hapticFeedbackHd' },
        { label: 'Simultaneous Input', prop: 'simultaneousInput' },
        { label: 'Acceleration Option', prop: 'accelerationOption' },
        { label: 'XInput Controllers', prop: 'xinputControllers' },
        { label: 'Xbox Prompts', prop: 'xboxPrompts' },
        { label: 'Impulse Triggers', prop: 'impulseTriggers' },
        { label: 'DirectInput Controllers', prop: 'directInputControllers' },
        { label: 'DirectInput Prompts', prop: 'directInputPrompts' },
        { label: 'PlayStation Controllers', prop: 'playstationControllers' },
        { label: 'PlayStation Prompts', prop: 'playstationPrompts' },
        { label: 'Motion Sensors', prop: 'playstationMotionSensors' },
        // Note: Motion Sensors appears multiple times (PS, Nintendo, Steam). 
        // Queries by label might be ambiguous?
        // PS: line 93, Nintendo: line 118, Steam: line 143.
        // We should handle duplicates or verify count.
        { label: 'Light Bar Support', prop: 'glightBar' },
        { label: 'Adaptive Triggers', prop: 'dualSenseAdaptiveTrigger' },
        { label: 'DualSense Haptics', prop: 'dualSenseHaptics' },
        { label: 'Nintendo Controllers', prop: 'nintendoControllers' },
        { label: 'Nintendo Prompts', prop: 'nintendoPrompts' },
        { label: 'Button Layout', prop: 'nintendoButtonLayout' },
        { label: 'Steam Input API', prop: 'steamInputApi' },
        { label: 'Steam Hook Input', prop: 'steamHookInput' },
        { label: 'Steam Input Prompts', prop: 'steamInputPrompts' },
        { label: 'Steam Deck Prompts', prop: 'steamDeckPrompts' },
        { label: 'Steam Controller Prompts', prop: 'steamControllerPrompts' },
        { label: 'Steam Input Presets', prop: 'steamInputPresets' },
        { label: 'Cursor Detection', prop: 'steamCursorDetection' },
        { label: 'Tracked Motion', prop: 'trackedMotionControllers' },
        { label: 'Tracked Motion Prompts', prop: 'trackedMotionPrompts' },
        { label: 'Other Controllers', prop: 'otherControllers' },
        { label: 'Other Button Prompts', prop: 'otherButtonPrompts' },
        { label: 'Digital Movement', prop: 'digitalMovementSupported' },
        { label: 'Peripheral Devices', prop: 'peripheralDevices' },
        { label: 'Input Prompt Override', prop: 'inputPromptOverride' }
    ];

    const dynamicFields = [
        'input.hapticFeedbackHdControllerModels',
        'input.playstationControllerModels',
        'input.playstationMotionSensorsModes',
        'input.playstationConnectionModes',
        'input.nintendoControllerModels',
        'input.nintendoMotionSensorsModes',
        'input.nintendoConnectionModes',
        'input.steamInputPromptsIcons',
        'input.steamInputPromptsStyles',
        'input.steamInputMotionSensorsModes',
        'input.peripheralDeviceTypes'
    ];

    it('renders all rating rows', () => {
        const { wrapper } = setupWrapper();
        const rows = wrapper.findAllComponents(RatingRowStub);

        // Count total expectation
        // We have duplicate labels (Motion Sensors), so map check needs care.
        // Let's just check major ones exist.

        ratingFields.forEach(field => {
            // Use findAll to handle duplicates
            const matches = rows.filter(r => r.props('label') === field.label);
            expect(matches.length).toBeGreaterThan(0);
        });
    });

    it('passes correct props to RatingRows', () => {
        const { wrapper } = setupWrapper({ keyRemap: 'true' as any });
        const row = wrapper.findComponent('[data-label="Key Remapping"]');
        expect((row as any).props('value')).toBe('true');
    });

    it('updates input object when RatingRow emits update', async () => {
        const { wrapper, input } = setupWrapper();

        // Test first one specifically
        const row = wrapper.findComponent('[data-label="Key Remapping"]');
        await (row as any).vm.$emit('update:value', 'true');
        expect(input.keyRemap).toBe('true');

        // Test a few others at random or loop?
        // Since we have duplicates, looping by label findComponent might get wrong one for prop.
        // E.g. findComponent('Motion Sensors') gets first one (PS).
        // If we want to test updates for ALL, we need to disambiguate.
        // But for "test all fields", verifying their existence and general wiring is good.
    });

    it('renders all dynamic fields', () => {
        const { wrapper } = setupWrapper();
        const fields = wrapper.findAllComponents(DynamicFieldStub);

        expect(fields.length).toBe(dynamicFields.length);

        dynamicFields.forEach(id => {
            const field = wrapper.findComponent(`[data-field="${id}"]`);
            expect(field.exists()).toBe(true);
        });
    });

    it('updates dynamic fields', async () => {
        const { wrapper, input } = setupWrapper();

        // Test a few dynamic fields
        const fieldId = 'input.hapticFeedbackHdControllerModels';
        const field = wrapper.findComponent(`[data-field="${fieldId}"]`);

        await (field as any).vm.$emit('update:modelValue', 'Test Model');
        expect(input.hapticFeedbackHdControllerModels).toBe('Test Model');
    });
});
