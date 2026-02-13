
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import GeneralInfoForm from '../../../src/components/GeneralInfoForm.vue';
import { GeneralInfoRow } from '../../../src/models/GameData';

// Mock PrimeVue Components
const InputTextStub = {
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" class="p-inputtext" />',
    props: ['modelValue'],
    emits: ['update:modelValue']
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

// Mock Lucide icons
vi.mock('lucide-vue-next', () => ({
    X: { template: '<span class="icon-x"></span>' },
    Plus: { template: '<span class="icon-plus"></span>' }
}));

describe('GeneralInfoForm.vue', () => {
    const createRows = (): GeneralInfoRow[] => [
        { type: 'link', label: 'Official Site', url: 'https://example.com' },
        { type: 'steam', id: '12345' }
    ];

    const setupWrapper = (rows: GeneralInfoRow[] = createRows()) => {
        return {
            wrapper: mount(GeneralInfoForm, {
                props: { modelValue: rows },
                global: {
                    stubs: {
                        InputText: InputTextStub,
                        Button: ButtonStub,
                        Select: SelectStub
                    }
                }
            }),
            rows
        };
    };

    it('renders initial rows with correct fields', () => {
        const { wrapper, rows } = setupWrapper();
        const selects = wrapper.findAllComponents(SelectStub);
        expect(selects.length).toBe(rows.length);

        // Row 0 (Link) has 2 inputs: Label, URL
        // Row 1 (Steam) has 1 input: App ID
        // Total inputs: 3
        const inputs = wrapper.findAllComponents(InputTextStub);
        expect(inputs.length).toBe(3);
    });

    it('adds a new row', async () => {
        const { wrapper } = setupWrapper([]);

        const buttons = wrapper.findAllComponents(ButtonStub);
        expect(buttons.length).toBe(1); // Add button only

        await buttons[0].trigger('click');

        // Check vm state for mutation
        const model = (wrapper.vm as any).model as GeneralInfoRow[];
        expect(model.length).toBe(1);
        expect(model[0].type).toBe('link');
    });

    it('removes a row', async () => {
        const { wrapper } = setupWrapper(createRows());

        const buttons = wrapper.findAllComponents(ButtonStub);
        await buttons[0].trigger('click');

        // Check vm state
        const model = (wrapper.vm as any).model as GeneralInfoRow[];
        expect(model.length).toBe(1);
        expect(model[0].type).toBe('steam');
    });

    it('updates row type changes fields', async () => {
        const { wrapper } = setupWrapper([{ type: 'link', label: '', url: '' }]);

        const select = wrapper.findComponent(SelectStub);
        await select.vm.$emit('update:modelValue', 'steam');

        // Check vm state
        const model = (wrapper.vm as any).model as GeneralInfoRow[];
        expect(model[0].type).toBe('steam');

        // Force update to check rendering
        await wrapper.vm.$nextTick();

        const inputs = wrapper.findAllComponents(InputTextStub);
        expect(inputs.length).toBe(1); // Steam has 1 input
    });
});
