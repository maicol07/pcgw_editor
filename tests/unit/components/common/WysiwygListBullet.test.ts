import { describe, it } from 'vitest';
import { mount } from '@vue/test-utils';
import WysiwygEditor from '../../../../src/components/common/WysiwygEditor.vue';
import Editor from 'primevue/editor';

describe('WysiwygEditor Bullet', () => {
    it('shows HTML for bullet list', async () => {
        const wrapper = mount(WysiwygEditor, {
            props: { modelValue: "* Item 1\n* Item 2" },
            global: {
                components: { Editor },
                directives: { tooltip: () => {} }
            }
        });
        await wrapper.vm.$nextTick();
        
        const editorNode = wrapper.findComponent(Editor);
        console.log("WysiwygEditor internal modelValue:", editorNode.props('modelValue'));
    });
});
