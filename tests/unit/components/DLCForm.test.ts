
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import DLCForm from '../../../src/components/DLCForm.vue';
import { DLCRow } from '../../../src/models/GameData';

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

const MultiSelectStub = {
    template: '<div class="multiselect-stub"><div v-for="opt in options" :key="opt.value" @click="select(opt.value)">{{opt.name}}</div></div>',
    props: ['modelValue', 'options'],
    emits: ['update:modelValue'],
    methods: {
        select(val: string) {
            const current = this.modelValue || [];
            const isSelected = current.includes(val);
            const newValue = isSelected
                ? current.filter((v: string) => v !== val)
                : [...current, val];
            this.$emit('update:modelValue', newValue);
        }
    }
};

// Mock Lucide icons
vi.mock('lucide-vue-next', () => ({
    X: { template: '<span class="icon-x"></span>' },
    Plus: { template: '<span class="icon-plus"></span>' },
    Info: { template: '<span class="icon-info"></span>' }
}));

describe('DLCForm.vue', () => {
    const createRows = (): DLCRow[] => [
        { name: 'Expansion 1', notes: 'Notes 1', os: 'Windows' },
        { name: 'DLC 2', notes: '', os: 'Windows, Linux' }
    ];

    const setupWrapper = (rows: DLCRow[] = createRows()) => {
        return {
            wrapper: mount(DLCForm, {
                props: { modelValue: rows },
                global: {
                    stubs: {
                        InputText: InputTextStub,
                        Button: ButtonStub,
                        MultiSelect: MultiSelectStub
                    }
                }
            }),
            rows
        };
    };

    it('renders initial rows', () => {
        const { wrapper, rows } = setupWrapper();
        // Each row layout verification
        // Count Text inputs? 2 per row (Name, Notes) * 2 rows = 4 inputs
        const inputs = wrapper.findAllComponents(InputTextStub);
        expect(inputs.length).toBe(rows.length * 2);
    });

    it('adds a new row', async () => {
        const { wrapper } = setupWrapper([]);

        // Find Add button. It's usually the last button or distinguished by text/icon.
        // It has label "Add DLC/Expansion". 
        // ButtonStub slots renders content. 
        // We can findButton by text or just assume it's the only button when 0 rows (plus maybe verify).
        // With 0 rows, there is only the Add Button.

        const buttons = wrapper.findAllComponents(ButtonStub);
        expect(buttons.length).toBe(1);

        await buttons[0].trigger('click');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        const newVal = emitted![0][0] as DLCRow[];
        expect(newVal.length).toBe(1);
        expect(newVal[0].name).toBe('');
    });

    it('removes a row', async () => {
        const { wrapper } = setupWrapper(createRows());

        // Rows have delete buttons (danger).
        // Wrapper has 2 rows -> 2 delete buttons + 1 add button = 3 buttons.
        // Delete buttons are first in the DOM order for each row? 
        // Template: absolute positioned button inside v-for. Then Add button after v-for.
        // So buttons[0] is delete row 0.

        const buttons = wrapper.findAllComponents(ButtonStub);
        await buttons[0].trigger('click');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        const newVal = emitted![0][0] as DLCRow[];
        expect(newVal.length).toBe(1); // One removed
        expect(newVal[0].name).toBe('DLC 2'); // First one removed
    });

    it('updates OS selection', async () => {
        const { wrapper } = setupWrapper();
        const multiSelects = wrapper.findAllComponents(MultiSelectStub);

        // Select 'Linux' for the first row (currently 'Windows')
        // MultiSelectStub logic: click updates value.
        // Current value: ['Windows'] (derived from split string in component)
        // Click 'Linux' -> ['Windows', 'Linux']

        // We need to trigger selection on the stub.
        // The stub renders options. We verify options are passed.
        // Component passes options: Windows, DOS, ... Linux ...

        // Let's call select directly on vm to avoid finding div text
        await multiSelects[0].vm.select('Linux');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        const newVal = emitted![0][0] as DLCRow[];
        // Component logic: joins array with ', '
        expect(newVal[0].os).toContain('Windows');
        expect(newVal[0].os).toContain('Linux');
        expect(newVal[0].os).toMatch(/Windows.*Linux/); // Order depends on existing + new? stub appends.
    });

    it('updates text fields', async () => {
        const { wrapper } = setupWrapper();
        const inputs = wrapper.findAllComponents(InputTextStub);

        // Input 0 = Name of row 0
        await inputs[0].vm.$emit('update:modelValue', 'New Name');

        // Component uses v-model="row.name". Mutates prop object.
        // Does not emit update:modelValue for text changes?
        // Let's check DLCForm.vue.
        // <InputText v-model="row.name" ... />
        // No emit call attached to InputText.
        // So it relies on object mutation.

        const rows = wrapper.props('modelValue') as DLCRow[];
        expect(rows[0].name).toBe('New Name');
    });
});
