import { mount } from '@vue/test-utils';
import WysiwygEditor from '../../../../src/components/common/WysiwygEditor.vue';
import Editor from 'primevue/editor';
import { describe, it, expect } from 'vitest';

// Define a stub for CodeEditor to easily check its modelValue in tests
const CodeEditorStub = {
    template: '<div class="code-editor-stub" :data-value="modelValue"></div>',
    props: ['modelValue']
};

describe('WysiwygEditor Interactive Check', () => {
    it('updates wikitext source when WYSIWYG editor changes and switches to source mode', async () => {
        const wrapper = mount(WysiwygEditor, {
            props: { modelValue: '' },
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

        // WYSIWYG editor is present initially
        const editor = wrapper.findComponent(Editor);
        expect(editor.exists()).toBe(true);

        // Emulate typing in PrimeVue editor
        await editor.vm.$emit('text-change', {
            htmlValue: '<p>Test <strong>Bold</strong></p>',
            textValue: 'Test Bold',
            delta: {},
            source: 'user'
        });

        // Check the emitted value from WysiwygEditor
        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        const emitted = wrapper.emitted('update:modelValue')!;
        const newModelValue = String(emitted[0][0]);
        expect(newModelValue).toBe("Test '''Bold'''");

        // Manually update the prop to simulate v-model reaction from parent
        await wrapper.setProps({ modelValue: newModelValue });

        // Toggle Source Mode by clicking the button
        const sourceButton = wrapper.findAll('button-stub').find(b => b.text().includes('Source Mode'));
        if (sourceButton) {
            await sourceButton.trigger('click');
        } else {
            // fallback if stub doesn't render text properly
            wrapper.vm.showSource = true;
            await wrapper.vm.$nextTick();
        }

        // Check the CodeEditor stub (the wikitext source)
        const codeEditor = wrapper.find('.code-editor-stub');
        expect(codeEditor.exists()).toBe(true);
        expect(codeEditor.attributes('data-value')).toBe("Test '''Bold'''");
    });
});
