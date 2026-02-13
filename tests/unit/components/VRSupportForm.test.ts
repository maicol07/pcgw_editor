
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import VRSupportForm from '../../../src/components/VRSupportForm.vue';
import { SettingsVR } from '../../../src/models/GameData';

// Mock Components
const RatingRowStub = {
    template: '<div class="rating-row-stub" :data-label="label" :data-value="value"></div>',
    props: ['label', 'value', 'notes', 'reference', 'icon'],
    emits: ['update:value', 'update:notes', 'update:reference']
};

const PanelStub = {
    template: '<div><slot /></div>'
};

describe('VRSupportForm.vue', () => {
    const createVRSettings = (): SettingsVR => ({
        native3d: 'unknown',
        nvidia3dVision: 'unknown',
        vorpx: 'unknown',
        vrOnly: 'unknown',
        openXr: 'unknown',
        steamVr: 'unknown',
        oculusVr: 'unknown',
        windowsMixedReality: 'unknown',
        osvr: 'unknown',
        forteNsx1: 'unknown',
        keyboardMouse: 'unknown',
        handTracking: 'unknown',
        bodyTracking: 'unknown',
        faceTracking: 'unknown',
        eyeTracking: 'unknown',
        tobiiEyeTracking: 'unknown',
        trackIr: 'unknown',
        thirdSpaceGamingVest: 'unknown',
        novintFalcon: 'unknown',
        playAreaSeated: 'unknown',
        playAreaStanding: 'unknown',
        playAreaRoomScale: 'unknown'
    });

    const setupWrapper = (vrProps: Partial<SettingsVR> = {}) => {
        const vr = { ...createVRSettings(), ...vrProps };
        return {
            wrapper: mount(VRSupportForm, {
                props: { vr },
                global: {
                    stubs: {
                        RatingRow: RatingRowStub,
                        Panel: PanelStub
                    }
                }
            }),
            vr
        };
    };

    it('renders all rating rows', () => {
        const { wrapper } = setupWrapper();
        const startLen = wrapper.findAllComponents(RatingRowStub).length;
        // Just checking basic count or specific labels
        // 3D Modes: 4
        // Headsets: 6
        // Input: 9
        // Play Area: 3
        // Total: 22
        expect(startLen).toBe(22);
    });

    it('updates value when RatingRow emits update', async () => {
        const { wrapper, vr } = setupWrapper();

        // Find "Native 3D" row
        const row = wrapper.findComponent('[data-label="Native 3D"]');
        await (row as any).vm.$emit('update:value', 'true');
        expect(vr.native3d).toBe('true');
    });

    it('updates vrOnly field (boolean-like behavior but stored as string in this model)', async () => {
        const { wrapper, vr } = setupWrapper();
        const row = wrapper.findComponent('[data-label="VR only"]');
        await (row as any).vm.$emit('update:value', 'true');
        expect(vr.vrOnly).toBe('true');
    });
});
