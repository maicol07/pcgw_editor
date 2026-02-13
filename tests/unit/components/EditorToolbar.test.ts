
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import EditorToolbar from '../../../src/components/editor/EditorToolbar.vue';
import { useUiStore } from '../../../src/stores/ui';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import SelectButton from 'primevue/selectbutton';
import Slider from 'primevue/slider';

// Mock Lucide icons
vi.mock('lucide-vue-next', () => ({
    Menu: { template: '<span class="menu-icon"></span>' },
    Wand2: { template: '<span class="wand-icon"></span>' },
    Loader2: { template: '<span class="loader-icon"></span>' },
    LayoutList: { template: '<span class="layout-icon"></span>' }
}));

describe('EditorToolbar.vue', () => {
    const defaultProps = {
        title: 'Test Page',
        editorMode: 'Visual' as const,
        isGeneratingSummary: false
    };

    const setupWrapper = (props = {}) => {
        const pinia = createPinia();
        setActivePinia(pinia);
        const store = useUiStore();

        return {
            wrapper: mount(EditorToolbar, {
                props: { ...defaultProps, ...props },
                global: {
                    plugins: [pinia],
                    components: { Button, InputText, SelectButton, Slider },
                    stubs: {
                        Toolbar: { template: '<div><slot name="start" /><slot name="end" /></div>' }
                    }
                }
            }),
            store
        };
    };

    it('renders correctly with given props', () => {
        const { wrapper } = setupWrapper();
        const input = wrapper.findComponent(InputText);
        expect(input.exists()).toBe(true);
        expect(input.props('modelValue')).toBe('Test Page');
    });

    it('emits update:title when input changes', async () => {
        const { wrapper } = setupWrapper();
        const input = wrapper.findComponent(InputText);
        await input.vm.$emit('update:modelValue', 'New Title');

        expect(wrapper.emitted('update:title')).toBeTruthy();
        expect(wrapper.emitted('update:title')![0]).toEqual(['New Title']);
    });

    it('emits toggleSidebar when menu button is clicked', async () => {
        const { wrapper } = setupWrapper();
        // The menu button is the one with @click="emit('toggleSidebar')"
        // We can find it by finding all buttons and checking expected behavior or classes
        // But since we stubbed Toolbar, we know the structure.
        // The menu button is the first button in the start slot.
        const buttons = wrapper.findAllComponents(Button);
        await buttons[0].trigger('click');

        expect(wrapper.emitted('toggleSidebar')).toBeTruthy();
    });

    it('updates density store when slider changes', async () => {
        const { wrapper, store } = setupWrapper();
        store.densityMode = 'normal';

        const slider = wrapper.findComponent(Slider);

        // Simulate slider update (1=comfortable)
        await slider.vm.$emit('update:modelValue', 1);

        expect(store.densityMode).toBe('comfortable');
    });

    it('emits update:editorMode when select button changes', async () => {
        const { wrapper } = setupWrapper();
        const select = wrapper.findComponent(SelectButton);
        await select.vm.$emit('update:modelValue', 'Code');

        expect(wrapper.emitted('update:editorMode')).toBeTruthy();
        expect(wrapper.emitted('update:editorMode')![0]).toEqual(['Code']);
    });
});
