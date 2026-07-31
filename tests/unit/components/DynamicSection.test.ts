import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ToastService from 'openvue/toastservice';
import DynamicSection from '../../../src/components/schema/DynamicSection.vue';
import { SectionDefinition } from '../../../src/types/schema';

vi.mock('@lucide/vue', async (importOriginal) => {
    const actual: any = await importOriginal();
    const mockComponent = { template: '<span class="icon-mock"></span>' };
    return new Proxy(actual, {
        get: (target, prop) => {
            if (prop in target) return target[prop];
            if (typeof prop === 'string' && prop[0] === prop[0].toUpperCase()) {
                return mockComponent;
            }
            return target[prop];
        }
    });
});

describe('DynamicSection.vue - Multiple Compound Rating Rows', () => {
    const mockSection: SectionDefinition = {
        id: 'input',
        title: 'Input',
        order: 1,
        groups: [
            {
                title: 'Keyboard & Mouse',
                fields: [
                    {
                        key: 'input',
                        label: 'Key Remapping',
                        component: 'CompoundRatingField',
                        componentProps: { field: 'keyRemap' },
                        wikitextParam: 'key_remap'
                    },
                    {
                        key: 'input',
                        label: 'Keyboard/Mouse Prompts',
                        component: 'CompoundRatingField',
                        componentProps: { field: 'keyboardMousePrompts' },
                        wikitextParam: 'prompts_keyboard_mouse'
                    },
                    {
                        key: 'input',
                        label: 'Mouse Sensitivity',
                        component: 'CompoundRatingField',
                        componentProps: { field: 'mouseSensitivity' },
                        wikitextParam: 'mouse_sensitivity'
                    }
                ]
            }
        ]
    };

    it('renders unique rating rows for each field in group rather than repeating the first entry', () => {
        const modelValue = {
            input: {
                keyRemap: 'true',
                keyboardMousePrompts: 'false',
                mouseSensitivity: 'hackable'
            }
        };

        const wrapper = mount(DynamicSection, {
            props: {
                section: mockSection,
                modelValue
            },
            global: {
                plugins: [ToastService]
            }
        });

        const labels = wrapper.findAll('[title]').map(el => el.attributes('title'));
        expect(labels).toContain('Key Remapping');
        expect(labels).toContain('Keyboard/Mouse Prompts');
        expect(labels).toContain('Mouse Sensitivity');

        // Check text content of wrapper
        const text = wrapper.text();
        expect(text).toContain('Key Remapping');
        expect(text).toContain('Keyboard/Mouse Prompts');
        expect(text).toContain('Mouse Sensitivity');
    });
});
