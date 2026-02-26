import { describe, it } from 'vitest';
import { mount } from '@vue/test-utils';
import WysiwygEditor from '../../../../src/components/common/WysiwygEditor.vue';
import Editor from 'primevue/editor';

describe('Marker styles', () => {
    it('checks if p-editor-content li has decimal list-style by getting computed style', async () => {
        const wrapper = mount(WysiwygEditor, {
            props: { modelValue: "* Item 1" }
        });
        await wrapper.vm.$nextTick();
        const html = wrapper.find('.p-editor-content').html();
        console.log("HTML:", html);
    });
});
