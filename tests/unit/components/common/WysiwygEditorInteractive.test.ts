import { mount } from '@vue/test-utils';
import WysiwygEditor from '../../../../src/components/common/WysiwygEditor.vue';
import Editor from 'primevue/editor';
import { describe, it, expect } from 'vitest';

// We just want to see if changing the internal htmlValue triggers an emit
describe('Interactive Check', () => {
    it('works', async () => {
        const wrapper = mount(WysiwygEditor, {
            props: { modelValue: '' },
            global: {
                components: { Editor },
                directives: { tooltip: () => { } }
            }
        });

        // The text change emits update:modelValue with the HTML.
        const editor = wrapper.findComponent(Editor);
        await editor.vm.$emit('update:modelValue', '<p>Test</p>');

        // Let's check if WysiwygEditor emitted update:modelValue
        console.log(wrapper.emitted('update:modelValue'));
    });
});
