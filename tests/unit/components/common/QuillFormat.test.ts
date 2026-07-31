import { describe, it } from 'vitest';
import { mount } from '@vue/test-utils';
import Editor from 'openvue/editor';

describe('Quill Formatting', () => {
    it('shows how quill renders bullet from button click', async () => {
        const wrapper = mount(Editor, {
            props: { modelValue: '<p>Test</p>' }
        });
        await wrapper.vm.$nextTick();
        
        // Find the bullet button
        const bulletBtn = wrapper.find('.ql-list[value="bullet"]');
        await bulletBtn.trigger('click');
        
        console.log("After bullet click:", wrapper.html());
    });
});
