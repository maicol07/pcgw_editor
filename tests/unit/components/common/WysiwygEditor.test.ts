import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import WysiwygEditor from '../../../../src/components/common/WysiwygEditor.vue';
import Editor from 'primevue/editor';

describe('WysiwygEditor.vue', () => {
    it('initializes with correct html from wikitext', () => {
        const wrapper = mount(WysiwygEditor, {
            props: {
                modelValue: "'''Bold''' text"
            },
            global: {
                components: { Editor },
                directives: {
                    tooltip: () => { }
                }
            }
        });

        const editorNode = wrapper.findComponent(Editor);
        expect(editorNode.props('modelValue')).toBe('<p><strong>Bold</strong> text</p>');
    });

    it('emits updated wikitext when html changes', async () => {
        const wrapper = mount(WysiwygEditor, {
            props: {
                modelValue: "Init"
            },
            global: {
                components: { Editor },
                directives: {
                    tooltip: () => { }
                }
            }
        });

        const editorNode = wrapper.findComponent(Editor);
        // Simulate an edit in the UI
        await editorNode.vm.$emit('text-change', {
            htmlValue: '<p><strong>Bold</strong> Edit</p>',
            source: 'user'
        });

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted![0]).toEqual(["'''Bold''' Edit"]);
    });

    it('updates html when modelValue prop is updated externally', async () => {
        const wrapper = mount(WysiwygEditor, {
            props: {
                modelValue: "Init"
            },
            global: {
                components: { Editor },
                directives: {
                    tooltip: () => { }
                }
            }
        });

        await wrapper.setProps({ modelValue: "New ''Italic'' text" });

        const editorNode = wrapper.findComponent(Editor);
        expect(editorNode.props('modelValue')).toBe('<p>New <em>Italic</em> text</p>');
    });
});
