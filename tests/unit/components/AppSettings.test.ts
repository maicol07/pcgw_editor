import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import AppSettings from '../../../src/components/settings/AppSettings.vue';
import { useUiStore } from '../../../src/stores/ui';
import Dialog from 'primevue/dialog';
import SelectButton from 'primevue/selectbutton';
import Select from 'primevue/select';
import Slider from 'primevue/slider';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { ref } from 'vue';

// Mock Lucide icons
vi.mock('lucide-vue-next', () => ({
    Palette: { template: '<span class="palette-icon"></span>' },
    Bot: { template: '<span class="bot-icon"></span>' },
    Sun: { template: '<span class="sun-icon"></span>' },
    Moon: { template: '<span class="moon-icon"></span>' },
    Monitor: { template: '<span class="monitor-icon"></span>' },
    Type: { template: '<span class="type-icon"></span>' },
    Layout: { template: '<span class="layout-icon"></span>' },
    Key: { template: '<span class="key-icon"></span>' },
    AlignJustify: { template: '<span class="align-justify-icon"></span>' },
    AlignLeft: { template: '<span class="align-left-icon"></span>' },
    Menu: { template: '<span class="menu-icon"></span>' }
}));

describe('AppSettings.vue', () => {
    let mockGeminiApiKey: ReturnType<typeof ref>;

    beforeEach(() => {
        mockGeminiApiKey = ref('initial-key');
    });

    const setupWrapper = () => {
        const pinia = createPinia();
        setActivePinia(pinia);
        const store = useUiStore();
        store.isSettingsOpen = true; // Open the dialog

        return {
            wrapper: mount(AppSettings, {
                global: {
                    plugins: [pinia],
                    components: { Dialog, SelectButton, Select, Slider, InputText, Button },
                    stubs: {
                        Dialog: {
                            template: '<div class="p-dialog"><slot name="header"></slot><slot></slot><slot name="footer"></slot></div>',
                            props: ['visible']
                        }
                    },
                    provide: {
                        geminiApiKey: mockGeminiApiKey
                    }
                }
            }),
            store
        };
    };

    it('renders the dialog when isSettingsOpen is true', () => {
        const { wrapper } = setupWrapper();
        expect(wrapper.find('.p-dialog').exists()).toBe(true);
        expect(wrapper.text()).toContain('App Settings');
        expect(wrapper.text()).toContain('Appearance');
        expect(wrapper.text()).toContain('Integrations');
    });

    it('updates uiStore when a theme is selected', async () => {
        const { wrapper, store } = setupWrapper();
        const selectButton = wrapper.findComponent(SelectButton);

        await selectButton.vm.$emit('update:modelValue', 'dark');
        expect(store.theme).toBe('dark');
    });

    it('updates uiStore font family string', async () => {
        const { wrapper, store } = setupWrapper();
        const select = wrapper.findComponent(Select);

        await select.vm.$emit('update:modelValue', 'Outfit');
        expect(store.fontFamily).toBe('Outfit');
    });

    it('updates density using the custom segment buttons', async () => {
        const { wrapper, store } = setupWrapper();
        store.densityMode = 'normal';

        // Find the align-left button (Comfortable / index 1)
        const buttons = wrapper.findAll('.flex-col.items-center');
        const middleButton = buttons[1]; // Index 1 is comfortable

        await middleButton.trigger('click');
        expect(store.densityMode).toBe('comfortable');
    });

    it('syncs gemini key and closes dialog on save', async () => {
        const { wrapper, store } = setupWrapper();

        // Find input text
        const inputText = wrapper.findComponent(InputText);
        await inputText.setValue('new-test-key');

        // Find Done button
        const doneButton = wrapper.findComponent(Button);
        await doneButton.trigger('click');

        expect(mockGeminiApiKey.value).toBe('new-test-key');
        expect(store.isSettingsOpen).toBe(false);
    });
});
