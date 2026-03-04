
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import EditorToolbar from '../../../src/components/editor/EditorToolbar.vue';
import { useUiStore } from '../../../src/stores/ui';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import SelectButton from 'primevue/selectbutton';
import Toolbar from 'primevue/toolbar';

// Mock Lucide icons
vi.mock('lucide-vue-next', () => ({
    Menu: { template: '<span class="menu-icon"></span>' },
    Wand2: { template: '<span class="wand-icon"></span>' },
    Loader2: { template: '<span class="loader-icon"></span>' },
    ExternalLink: { template: '<span class="external-link-icon"></span>' },
    Settings: { template: '<span class="settings-icon"></span>' }
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
                    components: { Button, InputText, SelectButton, Toolbar },
                    stubs: {
                        Toolbar: { template: '<div><slot name="start" /><slot name="end" /></div>' }
                    }
                }
            }),
            store
        };
    };

    it('renders correctly with given props', async () => {
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

    it('opens settings dialog when settings button is clicked', async () => {
        const { wrapper, store } = setupWrapper();
        store.isSettingsOpen = false;

        const settingsIcon = wrapper.find('.settings-icon');
        await settingsIcon.trigger('click');

        // Since it's inside a button, we can just trigger click on it or the button
        // Actually the click is on the button wrapper, let's find the button containing it
        const btn = settingsIcon.element.closest('button');
        if (btn) btn.click();

        expect(store.isSettingsOpen).toBe(true);
    });

    it('emits update:editorMode when select button changes', async () => {
        const { wrapper } = setupWrapper();
        const select = wrapper.findComponent(SelectButton);
        await select.vm.$emit('update:modelValue', 'Code');

        expect(wrapper.emitted('update:editorMode')).toBeTruthy();
        expect(wrapper.emitted('update:editorMode')![0]).toEqual(['Code']);
    });
});
