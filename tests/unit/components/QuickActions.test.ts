import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import QuickActions from '../../../src/components/layout/QuickActions.vue';
import InputText from 'primevue/inputtext';

// Mock Lucide icons
vi.mock('lucide-vue-next', () => ({
    Search: { template: '<span class="search-icon"></span>' }
}));

describe('QuickActions.vue', () => {
    const setupWrapper = (props = {}) => {
        return mount(QuickActions, {
            props: {
                searchQuery: '',
                ...props
            },
            global: {
                stubs: {
                    IconField: { template: '<div><slot></slot></div>' },
                    InputIcon: { template: '<span><slot></slot></span>' }
                },
                components: { InputText }
            }
        });
    };

    it('renders search input with correct placeholder', () => {
        const wrapper = setupWrapper();
        const input = wrapper.findComponent(InputText);
        expect(input.exists()).toBe(true);
        expect(input.attributes('placeholder')).toBe('Search fields…');
    });

    it('emits update:searchQuery when input changes', async () => {
        const wrapper = setupWrapper();
        const input = wrapper.findComponent(InputText);

        await input.vm.$emit('update:modelValue', 'test query');

        expect(wrapper.emitted('update:searchQuery')).toBeTruthy();
        expect(wrapper.emitted('update:searchQuery')![0]).toEqual(['test query']);
    });

    it('displays the platform-specific shortcut label', () => {
        const wrapper = setupWrapper();
        const label = wrapper.find('.text-2xs');
        expect(label.exists()).toBe(true);
        // On non-Mac environments usePlatform yields "Ctrl+K", "⌘K" on Mac.
        expect(label.text()).toMatch(/Ctrl\+K|⌘K/);
    });
});
