import { describe, it } from 'vitest';
import { mount } from '@vue/test-utils';
import Editor from 'primevue/editor';

describe('Quill Lists', () => {
    it('shows how Quill parses ul and ol', async () => {
        const wrapper = mount(Editor, {
            props: { modelValue: '<ul><li>Item 1</li></ul>' }
        });
        await wrapper.vm.$nextTick();
        console.log("Input UL -> Quill HTML:", wrapper.html());
        
        await wrapper.setProps({ modelValue: '<ol><li>Item 1</li></ol>' });
        console.log("Input OL -> Quill HTML:", wrapper.html());
    });
});
