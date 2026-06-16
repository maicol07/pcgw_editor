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
        'MessageSquareWarning', 'Link2', 'ListChecks', 'Eye', 'EyeOff'
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
        
        // Find theme buttons/cards
        const buttons = wrapper.findAll('button');
        const darkButton = buttons.find(b => b.text().includes('Dark'));
        if (!darkButton) throw new Error('Dark theme button not found');
        
        await darkButton.trigger('click');
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

        // Find the comfortable density button by class
        const buttons = wrapper.findAll('.density-btn');
        const middleButton = buttons[1]; // Index 1 is comfortable

        await middleButton.trigger('click');
        expect(store.densityMode).toBe('comfortable');
    });

    it('syncs gemini key and closes dialog on save', async () => {
        const { wrapper, store } = setupWrapper();

        // Switch to integrations tab so the key input is active
        const tabs = wrapper.findAll('button');
        const integrationsTab = tabs.find(t => t.text().includes('Integrations'));
        if (integrationsTab) await integrationsTab.trigger('click');

        // Find input text by class
        const inputText = wrapper.findComponent('.gemini-api-key-input');
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

        // Switch to account tab
        const tabs = wrapper.findAll('button');
        const accountTab = tabs.find(t => t.text().includes('Account'));
        if (accountTab) await accountTab.trigger('click');

        const toggles = wrapper.findAllComponents({ name: 'ToggleSwitch' });
        const autoReLoginToggle = toggles[0];
        
        await autoReLoginToggle.vm.$emit('update:modelValue', true);
        expect(store.autoReLogin).toBe(true);
    });
});
