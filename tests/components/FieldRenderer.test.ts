/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import DynamicField from '../../src/components/schema/DynamicField.vue';
import InputText from 'primevue/inputtext';

// Helper to mount with components
const mountField = (component: any, options: any = {}) => {
    return mount(component, {
        ...options,
        global: {
            components: { InputText, ...(options.global?.components || {}) },
            ...options.global
        }
    });
};

const simpleField = {
    key: 'test.field',
    label: 'Test Field',
    component: 'InputText',
    wikitextParam: 'test_param',
    componentProps: { placeholder: 'Enter text' }
};

describe('DynamicField.vue', () => {

    it('renders the correct component based on schema', () => {
        const wrapper = mountField(DynamicField, {
            props: {
                field: simpleField,
                modelValue: ''
            }
        });

        expect(wrapper.findComponent(InputText).exists()).toBe(true);
        expect(wrapper.text()).toContain('Test Field');
    });

    it('passes modelValue to child component', () => {
        const wrapper = mountField(DynamicField, {
            props: {
                field: simpleField,
                modelValue: 'Initial Value'
            }
        });

        const input = wrapper.findComponent(InputText);
        expect(input.props('modelValue')).toBe('Initial Value');
    });

    it('emits update:modelValue when child updates', async () => {
        const wrapper = mountField(DynamicField, {
            props: {
                field: simpleField,
                modelValue: ''
            }
        });

        const input = wrapper.findComponent(InputText);
        await input.vm.$emit('update:modelValue', 'New Value');

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')![0]).toEqual(['New Value']);
    });
});
