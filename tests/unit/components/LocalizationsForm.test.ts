
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import LocalizationsForm from '../../../src/components/LocalizationsForm.vue';
import { LocalizationRow } from '../../../src/models/GameData';

// Mock Components
const SelectStub = {
    template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="opt in options" :key="opt.value" :value="opt.value">{{opt.label}}</option></select>',
    props: ['modelValue', 'options'],
    emits: ['update:modelValue']
};

const CheckboxStub = {
    template: '<input type="checkbox" :checked="modelValue === \'true\' || modelValue === true" @change="$emit(\'update:modelValue\', $event.target.checked ? (trueValue ?? true) : (falseValue ?? false))" />',
    props: ['modelValue', 'trueValue', 'falseValue'],
    emits: ['update:modelValue']
};

const RatingSelectStub = {
    template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option value="unknown">Unknown</option></select>',
    props: ['modelValue'],
    emits: ['update:modelValue']
};

const InputTextStub = {
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" class="p-inputtext" />',
    props: ['modelValue'],
    emits: ['update:modelValue']
};

const ButtonStub = {
    template: '<button @click="$emit(\'click\')"><slot /><slot name="icon" /></button>',
    emits: ['click']
};

// Mock Lucide and Flag icons
vi.mock('lucide-vue-next', () => ({
    Trash2: { template: '<span class="icon-trash"></span>' },
    Plus: { template: '<span class="icon-plus"></span>' },
    GripVertical: { template: '<span class="icon-grip"></span>' }
}));

vi.mock('@placetopay/flagicons-vue', () => ({
    FlagIcon: { template: '<span class="flag-icon"></span>' }
}));

describe('LocalizationsForm.vue', () => {
    const createLocalizations = (): LocalizationRow[] => [
        { language: 'English', interface: 'true', audio: 'unknown', subtitles: 'unknown', notes: '', fan: false, ref: '' },
        { language: 'Italian', interface: 'true', audio: 'unknown', subtitles: 'unknown', notes: '', fan: false, ref: '' }
    ];

    const setupWrapper = (localizations: LocalizationRow[] = createLocalizations()) => {
        return {
            wrapper: mount(LocalizationsForm, {
                props: { localizations },
                global: {
                    stubs: {
                        Select: SelectStub,
                        Checkbox: CheckboxStub,
                        RatingSelect: RatingSelectStub,
                        InputText: InputTextStub,
                        Button: ButtonStub
                    }
                }
            }),
            localizations
        };
    };

    it('renders initial rows', () => {
        const { wrapper, localizations } = setupWrapper();
        const selects = wrapper.findAllComponents(SelectStub);
        expect(selects.length).toBe(localizations.length);
    });

    it('adds a new row', async () => {
        const { wrapper } = setupWrapper([]);

        const buttons = wrapper.findAllComponents(ButtonStub);
        expect(buttons.length).toBe(1); // Add button only

        await buttons[0].trigger('click');

        const emitted = wrapper.emitted('update:localizations');
        expect(emitted).toBeTruthy();
        const newVal = emitted![0][0] as LocalizationRow[];
        expect(newVal.length).toBe(1);
    });

    it('removes a row', async () => {
        const { wrapper } = setupWrapper(createLocalizations());

        const buttons = wrapper.findAllComponents(ButtonStub);
        // Buttons: Row 1 drag, Row 1 remove, Row 2 drag, Row 2 remove, Add.
        // buttons[1] is remove for row 0.
        expect(buttons.length).toBe(5);

        await buttons[1].trigger('click');

        const emitted = wrapper.emitted('update:localizations');
        expect(emitted).toBeTruthy();
        const newVal = emitted![0][0] as LocalizationRow[];
        expect(newVal.length).toBe(1);
        expect(newVal[0].language).toBe('Italian');
    });

    it('updates fields', async () => {
        const { wrapper } = setupWrapper();
        const checkboxes = wrapper.findAllComponents(CheckboxStub);

        // Row 0, Interface checkbox
        await checkboxes[0].vm.$emit('update:modelValue', 'false');

        // Check internal state as defineModel with array mutation doesn't always emit update:localizations
        // when checking deep properties unless strict.
        const model = (wrapper.vm as any).localizations as LocalizationRow[];
        expect(model[0].interface).toBe('false');
    });
});
