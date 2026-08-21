import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import PreviewPanel from '../../../src/components/editor/PreviewPanel.vue';
import { useUiStore } from '../../../src/stores/ui';
import SelectButton from 'openvue/selectbutton';
import Button from 'openvue/button';

vi.mock('@lucide/vue', () => {
    const icons = ['Monitor', 'AlertTriangle', 'Globe', 'Link2', 'Link2Off', 'List', 'X'];
    const mock: any = {};
    icons.forEach(icon => {
        mock[icon] = { template: `<span class="${icon.toLowerCase()}-icon"></span>` };
    });
    return mock;
});

describe('PreviewPanel.vue', () => {
    const setupWrapper = (props = {}) => {
        const pinia = createPinia();
        setActivePinia(pinia);
        const store = useUiStore();

        const wrapper = mount(PreviewPanel, {
            props: {
                html: '<h2 id="video">Video</h2><p>Content</p>',
                loading: false,
                error: '',
                previewMode: 'API' as const,
                ...props
            },
            global: {
                plugins: [pinia],
                components: { SelectButton, Button },
                directives: {
                    tooltip: {}
                }
            }
        });

        return { wrapper, store };
    };

    it('renders preview content and sync scroll toggle', () => {
        const { wrapper, store } = setupWrapper();
        expect(wrapper.text()).toContain('Preview');
        expect(wrapper.text()).toContain('Video');
        expect(store.syncScroll).toBe(true);
    });

    it('toggles uiStore.syncScroll when toggle button is clicked', async () => {
        const { wrapper, store } = setupWrapper();
        const toggleBtn = wrapper.find('button[aria-label="Disable scroll sync"]');
        expect(toggleBtn.exists()).toBe(true);

        await toggleBtn.trigger('click');
        expect(store.syncScroll).toBe(false);

        const enableBtn = wrapper.find('button[aria-label="Enable scroll sync"]');
        expect(enableBtn.exists()).toBe(true);

        await enableBtn.trigger('click');
        expect(store.syncScroll).toBe(true);
    });
});
