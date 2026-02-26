<script setup lang="ts">
import { ref, watch } from 'vue';
import Editor from 'primevue/editor';
import { wikitextToHtml, htmlToWikitext } from '../../utils/htmlWikitextConverter';

const props = defineProps<{
    modelValue: string;
    placeholder?: string;
    editorStyle?: string;
    readonly?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
}>();

const htmlValue = ref('');
const previousWikitext = ref('');
const editorRef = ref<any>(null);

watch(() => props.modelValue, (newVal) => {
    if (newVal !== previousWikitext.value) {
        htmlValue.value = wikitextToHtml(newVal || '');
        previousWikitext.value = newVal || '';
    }
}, { immediate: true });

const onTextChange = (e: any) => {
    if (e.source === 'user') {
        const wikitext = htmlToWikitext(e.htmlValue);
        previousWikitext.value = wikitext;
        emit('update:modelValue', wikitext);
    }
};

defineExpose({
    insertText: (text: string) => {
        const quill = editorRef.value?.quill;
        if (quill) {
            const range = quill.getSelection(true);
            quill.insertText(range.index, text, 'user');
            quill.setSelection(range.index + text.length);
        } else {
            htmlValue.value += text;
        }
    }
});
</script>

<template>
    <div class="wysiwyg-editor-container">
        <Editor ref="editorRef" v-model="htmlValue" :editorStyle="editorStyle || 'height: 250px'"
            :placeholder="placeholder" :readonly="readonly" @text-change="onTextChange">
            <template #toolbar>
                <span class="ql-formats">
                    <button class="ql-bold" v-tooltip.bottom="'Bold'"></button>
                    <button class="ql-italic" v-tooltip.bottom="'Italic'"></button>
                    <button class="ql-underline" v-tooltip.bottom="'Underline'"></button>
                    <button class="ql-strike" v-tooltip.bottom="'Strikethrough'"></button>
                </span>
                <span class="ql-formats">
                    <select class="ql-header" defaultValue="0" v-tooltip.bottom="'Heading'">
                        <option value="2">Heading 2</option>
                        <option value="3">Heading 3</option>
                        <option value="4">Heading 4</option>
                        <option value="5">Heading 5</option>
                        <option value="6">Heading 6</option>
                        <option value="false" selected>Normal</option>
                    </select>
                </span>
                <span class="ql-formats">
                    <button class="ql-link" v-tooltip.bottom="'Link'"></button>
                    <button class="ql-code-block" v-tooltip.bottom="'Code'"></button>
                    <button class="ql-blockquote" v-tooltip.bottom="'Blockquote'"></button>
                </span>
                <span class="ql-formats">
                    <button class="ql-list" value="ordered" v-tooltip.bottom="'Ordered List'"></button>
                    <button class="ql-list" value="bullet" v-tooltip.bottom="'Bullet List'"></button>
                </span>
                <span class="ql-formats">
                    <button class="ql-clean" v-tooltip.bottom="'Remove Formatting'"></button>
                </span>
                <!-- Custom extra toolbar items -->
                <slot name="custom-toolbar"></slot>
            </template>
        </Editor>
    </div>
</template>

<style>
/* Adjust toolbar to fit smaller spaces seamlessly */
.wysiwyg-editor-container .p-editor-toolbar {
    padding: 0.25rem 0.5rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
}

/* Ensure ql-formats wrap correctly without awkward gaps */
.wysiwyg-editor-container .p-editor-toolbar .ql-formats {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    margin-right: 0 !important;
}

/* Override Quill's strict 28x24px button sizing for our custom text buttons */
.wysiwyg-editor-container .p-editor-toolbar .ql-formats button.w-auto\! {
    width: auto !important;
    height: auto !important;
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
    margin-top: 0.125rem;
    margin-bottom: 0.125rem;
}

.ql-editor ol li[data-list='bullet']::before {
  content: '\2022';
}
</style>
