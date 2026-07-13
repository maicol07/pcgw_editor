
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

const MultiSelectStub = {
    template: '<select multiple :value="modelValue" @change="$emit(\'update:modelValue\', [])"></select>',
    props: ['modelValue', 'options'],
    emits: ['update:modelValue']
};

// Popover only renders its content once toggled; default to no content so the
// footer button counts reflect the closed state.
const PopoverStub = {
    template: '<div></div>',
    methods: { toggle() {}, hide() {} }
};

// Mock Lucide and Flag icons
vi.mock('lucide-vue-next', () => ({
    Trash2: { template: '<span class="icon-trash"></span>' },
    Plus: { template: '<span class="icon-plus"></span>' },
    GripVertical: { template: '<span class="icon-grip"></span>' },
    Languages: { template: '<span class="icon-languages"></span>' }
}));

vi.mock('@placetopay/flagicons-vue', () => ({
    FlagIcon: { template: '<span class="flag-icon"></span>' }
}));

// vue-draggable-plus renders a wrapper that just emits its default slot
vi.mock('vue-draggable-plus', () => ({
    VueDraggable: { template: '<div><slot /></div>', props: ['modelValue'] }
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
                        Button: ButtonStub,
                        MultiSelect: MultiSelectStub,
                        Popover: PopoverStub
                    }
                }
            }),
            localizations
        };
    };

    it('renders one language Select per row plus the Set-all column selects', async () => {
        const { wrapper, localizations } = setupWrapper();
        const selects = wrapper.findAllComponents(SelectStub);
        // One language Select per row + 3 "Set all" column Selects (UI/Audio/Subtitles)
        expect(selects.length).toBe(localizations.length + 3);
    });

    it('adds a new row', async () => {
        const { wrapper } = setupWrapper([]);

        // With no rows the "Set all" bar is hidden; only the two footer buttons remain:
        // "Add Language" and "Add common languages". Popover is closed (no content).
        const buttons = wrapper.findAllComponents(ButtonStub);
        expect(buttons.length).toBe(2);

        // First footer button is "Add Language"
        await buttons[0].trigger('click');

        const emitted = wrapper.emitted('update:localizations');
        expect(emitted).toBeTruthy();
        const newVal = emitted![0][0] as LocalizationRow[];
        expect(newVal.length).toBe(1);
    });

    it('removes a row', async () => {
        const { wrapper } = setupWrapper(createLocalizations());

        const buttons = wrapper.findAllComponents(ButtonStub);
        // Per row: drag handle + delete (2 each) for 2 rows = 4,
        // plus footer "Add Language" + "Add common languages" = 2. Total = 6.
        expect(buttons.length).toBe(6);

        // Row 0: buttons[0] is drag handle, buttons[1] is delete.
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

    it('includes Chuvash, Gothic, and Võro in the supported languages list', () => {
        const { wrapper } = setupWrapper();
        const selects = wrapper.findAllComponents(SelectStub);
        const langSelect = selects.find(s => s.vm.options?.some((opt: any) => opt.value === 'English'));
        expect(langSelect).toBeTruthy();
        const values = langSelect!.vm.options.map((opt: any) => opt.value);
        expect(values).toContain('Chuvash');
        expect(values).toContain('Gothic');
        expect(values).toContain('Võro');
    });
});
