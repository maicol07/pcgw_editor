
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import EssentialImprovementsForm from '../../../src/components/EssentialImprovementsForm.vue';

// Mock PrimeVue Components
// Textarea is similar to InputText but as textarea element
const TextareaStub = {
    template: '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" class="p-inputtextarea" />',
    props: ['modelValue'],
    emits: ['update:modelValue']
};

// Mock Lucide icons
vi.mock('lucide-vue-next', () => ({
    Download: { template: '<span class="icon-download"></span>' },
    Info: { template: '<span class="icon-info"></span>' }
}));

describe('EssentialImprovementsForm.vue', () => {
    const setupWrapper = (modelValue = 'Initial improvements') => {
        return {
            wrapper: mount(EssentialImprovementsForm, {
                props: { modelValue },
                global: {
                    stubs: {
                        Textarea: TextareaStub
                    }
                }
            })
        };
    };

    it('renders initial value', () => {
        const { wrapper } = setupWrapper();
        const textarea = wrapper.findComponent(TextareaStub);
        expect(textarea.props('modelValue')).toBe('Initial improvements');
    });

    it('updates value', async () => {
        const { wrapper } = setupWrapper();
        const textarea = wrapper.findComponent(TextareaStub);

        await textarea.vm.$emit('update:modelValue', 'New content');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted![0][0]).toBe('New content');
    });

    it('renders helper text', () => {
        const { wrapper } = setupWrapper();
        expect(wrapper.text()).toContain('Required or highly recommended downloads');
        expect(wrapper.text()).toContain('Use basic wikitext formatting');
    });
});
