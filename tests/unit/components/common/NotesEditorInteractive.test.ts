import { mount } from '@vue/test-utils';
import NotesEditorDialog from '../../../../src/components/common/NotesEditorDialog.vue';
import WysiwygEditor from '../../../../src/components/common/WysiwygEditor.vue';
import Editor from 'primevue/editor';
import { describe, it, expect } from 'vitest';

// Define a stub for CodeEditor to easily check its modelValue in tests
const CodeEditorStub = {
    template: '<div class="code-editor-stub" :data-value="modelValue"></div>',
    props: ['modelValue']
};

describe('NotesEditorDialog Interactive Check', () => {
    it('updates wikitext source when WYSIWYG editor changes', async () => {
        const wrapper = mount(NotesEditorDialog, {
            props: { visible: true, type: 'note', modelValue: '' },
            global: {
                stubs: {
                    Dialog: { template: '<div><slot></slot></div>' },
                    Button: true,
                    InputGroup: true,
                    InputGroupAddon: true,
                    InputText: true,
                    AutoComplete: true,
                    CodeEditor: CodeEditorStub
                },
                directives: { tooltip: () => { } }
            }
        });

        // WYSIWYG editor is present
        const wysiwyg = wrapper.findComponent(WysiwygEditor);
        expect(wysiwyg.exists()).toBe(true);

        // Find the PrimeVue editor internally
        const editor = wysiwyg.findComponent(Editor);

        // Emulate typing in PrimeVue editor
        await editor.vm.$emit('text-change', {
            htmlValue: '<p>Test <strong>Bold</strong></p>',
            textValue: 'Test Bold',
            delta: {},
            source: 'user'
        });

        // Check the CodeEditor stub (the wikitext source)
        const codeEditor = wrapper.find('.code-editor-stub');
        expect(codeEditor.attributes('data-value')).toBe("Test '''Bold'''");
    });
});
