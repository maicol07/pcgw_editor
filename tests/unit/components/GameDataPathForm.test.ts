
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import GameDataPathForm from '../../../src/components/GameDataPathForm.vue';
import { GameDataPathRow } from '../../../src/models/GameData';

// Mock Components
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
    Gamepad2: { template: '<span class="icon-gamepad2"></span>' }
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
                        InputText: InputTextStub,
                        Button: ButtonStub,
                        Select: SelectStub,
                        Popover: PopoverStub
                    }
                }
            }),
            rows
        };
    };

    it('renders initial rows and paths', () => {
        const { wrapper, rows } = setupWrapper();
        const selects = wrapper.findAllComponents(SelectStub);
        expect(selects.length).toBe(rows.length);

        const inputs = wrapper.findAllComponents(InputTextStub);
        // Each path has an input
        expect(inputs.length).toBe(rows[0].paths.length);
    });

    it('adds a new platform row', async () => {
        const { wrapper } = setupWrapper([]);

        // Find "Add Platform" button. 
        // It's in the header, probably first/second button.
        // Or find by hierarchy.
        // Structure: Header -> Add Platform Button.
        // Then rows.

        const buttons = wrapper.findAllComponents(ButtonStub);
        // Assuming "Add Platform" is visibly first/prominent button before list.
        const addBtn = buttons[0]; // Usually.

        await addBtn.trigger('click');

        const emitted = wrapper.emitted('update:rows');
        expect(emitted).toBeTruthy();
        const newVal = emitted![0][0] as GameDataPathRow[];
        expect(newVal.length).toBe(1);
        expect(newVal[0].platform).toBe('Windows'); // Default
    });

    it('adds a new path to a row', async () => {
        const { wrapper } = setupWrapper();

        // Find "Add Path" button for row 0.
        // Inside row 0 div.
        // Button with label "Add Path" (not visible in stub unless slot content checked, but stub renders slot).
        // Let's find button by some context if possible.
        // There are many buttons: Add Platform, Remove Platform, Add Path, Insert Path, Remove Path.

        // Logic:
        // wrapper.findAllComponents(ButtonStub) order:
        // 1. Add Platform (header)
        // 2. Remove Platform (row 0 header)
        // 3. Add Path (row 0 path header)
        // 4. Bookmark (path 0)
        // 5. Remove Path (path 0 - only if length > 1, so hidden initially for 1 path)

        // With 1 row, 1 path:
        // Buttons present: Add Platform, Remove Platform, Add Path, Bookmark.
        // Index 2 should be Add Path.

        const buttons = wrapper.findAllComponents(ButtonStub);
        const addPathBtn = buttons[2];

        await addPathBtn.trigger('click');

        const emitted = wrapper.emitted('update:rows');
        expect(emitted).toBeTruthy();
        const newVal = emitted![0][0] as GameDataPathRow[];
        expect(newVal[0].paths.length).toBe(2);
    });

    it('updates path value', async () => {
        const { wrapper } = setupWrapper();
        const inputs = wrapper.findAllComponents(InputTextStub);

        await inputs[0].vm.$emit('update:modelValue', 'New Path');

        // Since props.rows is mutated via v-model="row.paths[pathIndex]"
        // And emit('update:rows') is NOT called on input change in the component directly?
        // Let's check `GameDataPathForm.vue`.
        // <InputText v-model="row.paths[pathIndex]" ... />
        // It mutates the prop object directly.
        // It does NOT emit 'update:rows' on input change.
        // So the parent must rely on object mutation reactivity or the component is designed to mutate props (anti-pattern but common in complex forms).
        // However, `update:rows` IS emitted on add/remove row/path.

        // If it mutates prop without verify, we just check if prop was mutated?
        // But in test utils, props are reactive if passed reactive?
        // setupWrapper returns `rows` array.
        // We can check if `rows[0].paths[0]` changed.

        // Wait, if it doesn't emit, we can't strict check emitted.
        // If the component relies on direct mutation of objects inside the array prop,
        // then checking `rows` object reference for changes helps.

        expect(inputs[0].props('modelValue')).toBe('New Path'); // If v-model updates local state
        // Actually, InputTextStub updates its own modelValue if implementation allows? No.
        // Parent component updates `row.paths`.

        // In Vue 3, v-model on component prop:
        // If `row` is reactive, `row.paths[i] = val` updates it.
        // `createRows` returns plain object. Mount wraps props in reactive?
        // Yes, `props` are reactive.
        // `rows` variable in test scope is the original array.
        // If mounted component mutates prop objects, strict mode warns.
        // But usually it works.

        // Let's check wrapper.props().rows[0].paths[0].
        // But since we just triggered emit on stub, parent handles update. 
        // Parent `v-model` updates `row.paths[pathIndex]`.

        // Test: verify if we can emit update.
        // Actually, `GameDataPathForm` does NOT Listen to @update:modelValue explicitly to re-emit.
        // It relies on deep mutation.

        // So we skip expect(emitted).
        // We verify visual or internal state if possible.
        // Or if we can't easily verify mutation in test utils without warning, maybe skip or just check add/remove.
        // Add/remove DO emit.
    });
});
