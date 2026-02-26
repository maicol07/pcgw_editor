import { describe, it } from 'vitest';
import { mount } from '@vue/test-utils';
import Editor from 'primevue/editor';

describe('Quill HTML', () => {
    it('shows how PrimeVue Editor renders ul', async () => {
        const wrapper = mount(Editor, {
            props: { modelValue: '<ul><li>Item 1</li></ul>' }
        });
        
        // Wait for Quill to initialize
        await new Promise(r => setTimeout(r, 500));
        
        console.log("Input UL -> Editor HTML:", wrapper.find('.p-editor-content').html());
    });
});
