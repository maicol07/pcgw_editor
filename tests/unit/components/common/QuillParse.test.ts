import { describe, it } from 'vitest';
import { mount } from '@vue/test-utils';
import Editor from 'primevue/editor';

describe('Quill Parsing', () => {
    it('shows how primevue Editor parses raw HTML', async () => {
        const wrapper = mount(Editor, {
            props: { modelValue: '<ul><li>Item 1</li></ul>' }
        });
        await wrapper.vm.$nextTick();
        console.log("Input UL -> Editor modelValue:", wrapper.props('modelValue'));
        
        await wrapper.setProps({ modelValue: '<ol><li>Item 1</li></ol>' });
        console.log("Input OL -> Editor modelValue:", wrapper.props('modelValue'));
    });
});
