import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import QuickActions from '../../../src/components/layout/QuickActions.vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

// Mock Lucide icons
vi.mock('lucide-vue-next', () => ({
    Search: { template: '<span class="search-icon"></span>' },
    ChevronsDown: { template: '<span class="expand-icon"></span>' },
    ChevronsUp: { template: '<span class="collapse-icon"></span>' }
}));

describe('QuickActions.vue', () => {
    const setupWrapper = (props = {}) => {
        return mount(QuickActions, {
            props: {
                searchQuery: '',
                ...props
            },
            global: {
                components: { InputText, Button }
            }
        });
    };

    it('renders search input with correct placeholder', () => {
        const wrapper = setupWrapper();
        const input = wrapper.findComponent(InputText);
        expect(input.exists()).toBe(true);
        expect(input.attributes('placeholder')).toBe('Search...');
    });

    it('emits update:searchQuery when input changes', async () => {
        const wrapper = setupWrapper();
        const input = wrapper.findComponent(InputText);

        await input.vm.$emit('update:modelValue', 'test query');

        expect(wrapper.emitted('update:searchQuery')).toBeTruthy();
        expect(wrapper.emitted('update:searchQuery')![0]).toEqual(['test query']);
    });

    it('emits expandAll and collapseAll events', async () => {
        const wrapper = setupWrapper();
        const buttons = wrapper.findAllComponents(Button);

        // Expand is first button
        await buttons[0].trigger('click');
        expect(wrapper.emitted('expandAll')).toBeTruthy();

        // Collapse is second button
        await buttons[1].trigger('click');
        expect(wrapper.emitted('collapseAll')).toBeTruthy();
    });

    it('displays the platform-specific shortcut label', () => {
        const wrapper = setupWrapper();
        const label = wrapper.find('.text-2xs');
        expect(label.exists()).toBe(true);
        // By default on Linux it should be Ctrl+K or ⌘K depending on environment, 
        // but we just check if it contains "to search"
        expect(label.text()).toContain('to search');
    });
});
