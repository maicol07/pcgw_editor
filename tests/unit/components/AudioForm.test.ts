
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AudioForm from '../../../src/components/AudioForm.vue';
import { SettingsAudio } from '../../../src/models/GameData';

// Mock Lucide icons
vi.mock('lucide-vue-next', () => ({
    SlidersHorizontal: { template: '<span class="icon-sliders"></span>' },
    Volume2: { template: '<span class="icon-volume2"></span>' },
    AlignCenter: { template: '<span class="icon-aligncenter"></span>' },
    Captions: { template: '<span class="icon-captions"></span>' },
    VolumeX: { template: '<span class="icon-volumex"></span>' },
    CheckCircle: { template: '<span class="icon-checkcircle"></span>' }
}));

// Mock Components
const RatingRowStub = {
    template: '<div class="rating-row-stub" :data-label="label" :data-value="value"></div>',
    props: ['label', 'value', 'notes', 'reference', 'icon'],
    emits: ['update:value', 'update:notes', 'update:reference']
};

const PanelStub = {
    template: '<div><slot /></div>'
};

describe('AudioForm.vue', () => {
    const createAudioSettings = (): SettingsAudio => ({
        separateVolume: 'unknown',
        surroundSound: 'unknown',
        subtitles: 'unknown',
        closedCaptions: 'unknown',
        muteOnFocusLost: 'unknown',
        royaltyFree: 'unknown',
        eaxSupport: 'unknown',
        redBookCdAudio: 'unknown',
        generalMidiAudio: 'unknown'
    });

    const setupWrapper = (audioProps: Partial<SettingsAudio> = {}) => {
        const audio = { ...createAudioSettings(), ...audioProps };
        return {
            wrapper: mount(AudioForm, {
                props: { audio },
                global: {
                    stubs: {
                        RatingRow: RatingRowStub,
                        Panel: PanelStub
                    }
                }
            }),
            audio
        };
    };

    const fields = [
        { label: 'Separate Volume Controls', prop: 'separateVolume' },
        { label: 'Surround Sound', prop: 'surroundSound' },
        { label: 'Subtitles', prop: 'subtitles' },
        { label: 'Closed Captions', prop: 'closedCaptions' },
        { label: 'Mute on Focus Lost', prop: 'muteOnFocusLost' },
        { label: 'Royalty Free Audio', prop: 'royaltyFree' },
        { label: 'EAX Support', prop: 'eaxSupport' },
        { label: 'Red Book CD Audio', prop: 'redBookCdAudio' },
        { label: 'General MIDI Audio', prop: 'generalMidiAudio' }
    ];

    it('renders all rating rows', () => {
        const { wrapper } = setupWrapper();
        const rows = wrapper.findAllComponents(RatingRowStub);

        expect(rows.length).toBe(fields.length);

        fields.forEach(field => {
            const row = wrapper.findComponent(`[data-label="${field.label}"]`);
            expect(row.exists()).toBe(true);
        });
    });

    it('passes correct props to RatingRows', () => {
        const { wrapper } = setupWrapper({ separateVolume: 'true' as any });
        const row = wrapper.findComponent('[data-label="Separate Volume Controls"]');
        expect((row as any).props('value')).toBe('true');
    });

    it('updates audio object when RatingRow emits update', async () => {
        const { wrapper, audio } = setupWrapper();

        for (const field of fields) {
            const row = wrapper.findComponent(`[data-label="${field.label}"]`);
            await (row as any).vm.$emit('update:value', 'true');
            expect((audio as any)[field.prop]).toBe('true');
        }
    });
});
