
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AvailabilityForm from '../../../src/components/AvailabilityForm.vue';
import { AvailabilityRow } from '../../../src/models/GameData';

// Mock PrimeVue Components
// Updated Stub to emit both update:modelValue (for v-model) and input (for @input listeners)
const InputTextStub = {
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value); $emit(\'input\', $event)" class="p-inputtext" />',
    props: ['modelValue', 'value'],
    emits: ['update:modelValue', 'input']
};

const ButtonStub = {
    template: '<button @click="$emit(\'click\')"><slot /><slot name="icon" /></button>',
    emits: ['click']
};

const SelectStub = {
    template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="opt in options" :key="opt.value" :value="opt.value">{{opt.label}}</option></select>',
    props: ['modelValue', 'options'],
    emits: ['update:modelValue']
};

const SelectButtonStub = {
    template: '<div class="select-button-stub"><button v-for="opt in options" :key="opt.value" @click="$emit(\'update:modelValue\', opt.value)">{{opt.label}}</button></div>',
    props: ['modelValue', 'options'],
    emits: ['update:modelValue']
};

// Mock Lucide icons
vi.mock('lucide-vue-next', () => ({
    Monitor: { template: '<span class="icon-monitor"></span>' },
    ShoppingBag: { template: '<span class="icon-shopping-bag"></span>' },
    Zap: { template: '<span class="icon-zap"></span>' },
    ShoppingCart: { template: '<span class="icon-shopping-cart"></span>' },
    Shield: { template: '<span class="icon-shield"></span>' },
    Play: { template: '<span class="icon-play"></span>' },
    Gift: { template: '<span class="icon-gift"></span>' },
    Heart: { template: '<span class="icon-heart"></span>' },
    Command: { template: '<span class="icon-command"></span>' },
    AppWindow: { template: '<span class="icon-app-window"></span>' },
    Globe: { template: '<span class="icon-globe"></span>' },
    Box: { template: '<span class="icon-box"></span>' },
    Code: { template: '<span class="icon-code"></span>' },
    Building2: { template: '<span class="icon-building-2"></span>' },
    Plus: { template: '<span class="icon-plus"></span>' },
    Trash2: { template: '<span class="icon-trash-2"></span>' }
}));

describe('AvailabilityForm.vue', () => {
    const createAvailabilityRows = (): AvailabilityRow[] => [
        { distribution: 'Steam', id: '123', drm: 'Steam', os: 'Windows', keys: '', notes: '', state: 'normal' },
        { distribution: 'GOG.com', id: 'game_slug', drm: 'DRM-free', os: 'Windows', keys: '', notes: '', state: 'unavailable' }
    ];

    const setupWrapper = (rows: AvailabilityRow[] = createAvailabilityRows()) => {
        return {
            wrapper: mount(AvailabilityForm, {
                props: { modelValue: rows },
                global: {
                    stubs: {
                        InputText: InputTextStub,
                        Button: ButtonStub,
                        Select: SelectStub,
                        SelectButton: SelectButtonStub,
                        TransitionGroup: { template: '<div><slot /></div>' }
                    }
                }
            }),
            rows
        };
    };

    it('renders initial rows', () => {
        const { wrapper, rows } = setupWrapper();
        const selects = wrapper.findAllComponents(SelectStub);
        expect(selects.length).toBe(rows.length);
    });

    it('adds a new row when Add button is clicked', async () => {
        const { wrapper } = setupWrapper([]);

        const buttons = wrapper.findAllComponents(ButtonStub);
        const addBtn = buttons[0]; // First button is usually Add Store

        await addBtn.trigger('click');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        const newVal = emitted![0][0] as AvailabilityRow[];
        expect(newVal.length).toBe(1);
        expect(newVal[0].distribution).toBe('Steam'); // Default
    });

    it('removes a row when Remove button is clicked', async () => {
        const { wrapper } = setupWrapper(createAvailabilityRows());

        // Remove buttons are the Danger buttons. 
        // 1 Add + 2 Remove
        const buttons = wrapper.findAllComponents(ButtonStub);
        expect(buttons.length).toBe(3);

        await buttons[1].trigger('click');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        const newVal = emitted![0][0] as AvailabilityRow[];
        expect(newVal.length).toBe(1);
        expect(newVal[0].distribution).not.toBe('Steam');
    });

    it('updates row field', async () => {
        const { wrapper } = setupWrapper();

        const inputs = wrapper.findAllComponents(InputTextStub);

        // ID input is first for row 0
        const idInput = inputs[0];

        // Use setValue on the internal input element to trigger the stub's listener
        const inputEl = idInput.find('input');
        await inputEl.setValue('new_id');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        const newVal = emitted![0][0] as AvailabilityRow[];
        expect(newVal[0].id).toBe('new_id');
    });
});
