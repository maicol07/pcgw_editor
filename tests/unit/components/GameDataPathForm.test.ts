
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import GameDataPathForm from '../../../src/components/GameDataPathForm.vue';
import { GameDataPathRow } from '../../../src/models/GameData';

// Mock Components
const PathInputFieldStub = {
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" class="p-inputtext path-input-field-stub" />',
    props: ['modelValue'],
    emits: ['update:modelValue']
};

const InputTextStub = {
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" class="p-inputtext" />',
    props: ['modelValue'],
    emits: ['update:modelValue']
};

const InputGroupStub = { template: '<div class="p-inputgroup"><slot /></div>' };
const InputGroupAddonStub = { template: '<span class="p-inputgroup-addon"><slot /></span>' };

const ButtonStub = {
    template: '<button :data-label="label" @click="$emit(\'click\')">{{ label }}<slot /><slot name="icon" /></button>',
    props: ['label'],
    emits: ['click']
};

const SelectStub = {
    template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="opt in options" :key="opt.value" :value="opt.value">{{opt.label}}</option></select>',
    props: ['modelValue', 'options'],
    emits: ['update:modelValue']
};

const PopoverStub = {
    template: '<div class="popover-stub"><slot /></div>',
    methods: {
        toggle: vi.fn(),
        hide: vi.fn()
    }
};

// Mock Lucide icons
vi.mock('lucide-vue-next', () => ({
    Plus: { template: '<span class="icon-plus"></span>' },
    Trash: { template: '<span class="icon-trash"></span>' },
    X: { template: '<span class="icon-x"></span>' },
    Bookmark: { template: '<span class="icon-bookmark"></span>' },
    Folder: { template: '<span class="icon-folder"></span>' },
    Save: { template: '<span class="icon-save"></span>' },
    Gamepad2: { template: '<span class="icon-gamepad2"></span>' },
    Search: { template: '<span class="icon-search"></span>' },
    ShoppingCart: { template: '<span class="icon-shopping-cart"></span>' },
    GripVertical: { template: '<span class="icon-grip-vertical"></span>' }
}));

// VueDraggable wraps the row list; stub it to a plain container that renders its slot.
vi.mock('vue-draggable-plus', () => ({
    VueDraggable: { template: '<div class="vue-draggable-stub"><slot /></div>' }
}));

// Mock imported icons (using strings or stubs)
// Original file imports svg as default import (string path)
vi.mock('../../../src/assets/icons/os-windows.svg', () => ({ default: 'icon-windows.svg' }));
vi.mock('../../../src/assets/icons/os-osx.svg', () => ({ default: 'icon-osx.svg' }));
vi.mock('../../../src/assets/icons/os-linux.svg', () => ({ default: 'icon-linux.svg' }));
vi.mock('../../../src/assets/icons/store-steam.svg', () => ({ default: 'icon-steam.svg' }));
vi.mock('../../../src/assets/icons/store-gogcom.svg', () => ({ default: 'icon-gog.svg' }));
vi.mock('../../../src/assets/icons/store-epicgames.svg', () => ({ default: 'icon-epic.svg' }));
vi.mock('../../../src/assets/icons/store-uplay.svg', () => ({ default: 'icon-uplay.svg' }));
vi.mock('../../../src/assets/icons/store-origin.svg', () => ({ default: 'icon-origin.svg' }));
vi.mock('../../../src/assets/icons/store-microsoft.svg', () => ({ default: 'icon-ms.svg' }));
vi.mock('../../../src/assets/icons/store-ws.svg', () => ({ default: 'icon-ws.svg' }));
vi.mock('../../../src/assets/icons/os-booter.svg', () => ({ default: 'icon-booter.svg' }));
vi.mock('../../../src/assets/icons/os-dos.svg', () => ({ default: 'icon-dos.svg' }));
vi.mock('../../../src/assets/icons/menu-icon.svg', () => ({ default: 'icon-generic.svg' }));

describe('GameDataPathForm.vue', () => {
    const createRows = (): GameDataPathRow[] => [
        { platform: 'Windows', paths: ['%USERPROFILE%\\Documents\\MyGame'] }
    ];

    const setupWrapper = (rows: GameDataPathRow[] = createRows()) => {
        return {
            wrapper: mount(GameDataPathForm, {
                props: { rows, title: 'Test Paths' },
                global: {
                    stubs: {
                        PathInputField: PathInputFieldStub,
                        Button: ButtonStub,
                        Select: SelectStub,
                        Popover: PopoverStub,
                        InputText: InputTextStub,
                        InputGroup: InputGroupStub,
                        InputGroupAddon: InputGroupAddonStub
                    }
                }
            }),
            rows
        };
    };

    it('renders initial rows and paths', async () => {
        const { wrapper, rows } = setupWrapper();
        const selects = wrapper.findAllComponents(SelectStub);
        expect(selects.length).toBe(rows.length);

        const inputs = wrapper.findAllComponents(PathInputFieldStub);
        // Each path has an input
        expect(inputs.length).toBe(rows[0].paths.length);
    });

    it('adds a new platform row', async () => {
        const { wrapper } = setupWrapper([]);

        // "Add Platform" is the dashed button rendered below the (empty) list.
        const addBtn = wrapper.findAllComponents(ButtonStub)
            .find((b) => b.props('label') === 'Add Platform');
        expect(addBtn).toBeTruthy();

        await addBtn!.trigger('click');

        const emitted = wrapper.emitted('update:rows');
        expect(emitted).toBeTruthy();
        const newVal = emitted![0][0] as GameDataPathRow[];
        expect(newVal.length).toBe(1);
        expect(newVal[0].platform).toBe('Windows'); // Default
    });

    it('adds a new path to a row', async () => {
        const { wrapper } = setupWrapper();

        // Each row exposes an "Add Path" button in its body header.
        const addPathBtn = wrapper.findAllComponents(ButtonStub)
            .find((b) => b.props('label') === 'Add Path');
        expect(addPathBtn).toBeTruthy();

        await addPathBtn!.trigger('click');

        const emitted = wrapper.emitted('update:rows');
        expect(emitted).toBeTruthy();
        const newVal = emitted![0][0] as GameDataPathRow[];
        expect(newVal[0].paths.length).toBe(2);
    });

    it('updates path value', async () => {
        const { wrapper } = setupWrapper();
        const inputs = wrapper.findAllComponents(PathInputFieldStub);

        await inputs[0].vm.$emit('update:modelValue', 'New Path');
        await wrapper.vm.$nextTick();

        // The path field is bound with v-model="row.paths[pathIndex]", so the
        // edit propagates back through the bound row and re-renders the input.
        const updated = wrapper.findAllComponents(PathInputFieldStub);
        expect(updated[0].props('modelValue')).toBe('New Path');
    });
});
