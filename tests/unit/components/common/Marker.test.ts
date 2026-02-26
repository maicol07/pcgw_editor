import { describe, it } from 'vitest';
import { mount } from '@vue/test-utils';
import WysiwygEditor from '../../../../src/components/common/WysiwygEditor.vue';

describe('Marker styles', () => {
    it('checks DOM for nested ol and classes', async () => {
        const wrapper = mount(WysiwygEditor, {
            props: { modelValue: "* Item 1" }
        });
        await wrapper.vm.$nextTick();
        console.log(wrapper.html());
    });
});
