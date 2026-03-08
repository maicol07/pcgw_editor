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
vi.mock('lucide-vue-next', () => {
    const icons = [
        'Palette', 'Bot', 'Sun', 'Moon', 'Monitor', 'Type', 'Layout', 'Key', 
        'AlignJustify', 'AlignLeft', 'Menu', 'Globe', 'LogOut', 'LogIn', 
        'Info', 'RotateCcw', 'ShieldAlert', 'Wrench', 'FileText', 'Puzzle', 'Keyboard',
        'MessageSquareWarning', 'Link2', 'ListChecks'
    ];
    const mock: any = {};
    icons.forEach(icon => {
        mock[icon] = { template: `<span class="${icon.toLowerCase()}-icon"></span>` };
    });
    return mock;
});

// Mock PrimeVue useToast
const mockToast = {
    add: vi.fn()
};
vi.mock('primevue/usetoast', () => ({
    useToast: () => mockToast
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

        // Find Done button specifically by searching for its text
        const buttons = wrapper.findAllComponents(Button);
        const doneButton = buttons.find(b => b.text().includes('Done'));
        if (!doneButton) throw new Error('Done button not found');
        await doneButton.trigger('click');

        expect(mockGeminiApiKey.value).toBe('new-test-key');
        expect(store.isSettingsOpen).toBe(false);
    });

    it('updates uiStore autoReLogin when toggle is clicked', async () => {
        const { wrapper, store } = setupWrapper();
        const toggle = wrapper.findComponent({ name: 'ToggleSwitch' });
        
        await toggle.vm.$emit('update:modelValue', true);
        expect(store.autoReLogin).toBe(true);
    });
});
