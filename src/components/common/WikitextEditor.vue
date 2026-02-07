<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import Textarea from 'primevue/textarea';
import Toolbar from 'primevue/toolbar';
import Button from 'primevue/button';
import { Link, List, Code } from 'lucide-vue-next';
import { useWikitextEditor } from '../../composables/useWikitextEditor';
import { renderWikitextToHtml } from '../../utils/renderer';

const props = defineProps<{
    modelValue: string;
    rows?: number;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
}>();

const { insertFormatting, insertList } = useWikitextEditor();
const textareaRef = ref<any>(null);
const localValue = ref(props.modelValue || '');
const previewHtml = ref('');

watch(() => props.modelValue, (val) => {
    if (val !== localValue.value) {
        localValue.value = val || '';
        updatePreview();
    }
});

watch(localValue, (val) => {
    emit('update:modelValue', val);
    updatePreview();
});

const updatePreview = () => {
    if (localValue.value) {
        previewHtml.value = renderWikitextToHtml(localValue.value);
    } else {
        previewHtml.value = '';
    }
};

const applyFormat = (formatType: 'bold' | 'italic' | 'link' | 'code') => {
    const el = textareaRef.value?.$el as HTMLTextAreaElement;
    if (!el) return;

    let res;
    if (formatType === 'bold') res = insertFormatting(el, localValue.value, "'''", "'''");
    else if (formatType === 'italic') res = insertFormatting(el, localValue.value, "''", "''");
    else if (formatType === 'link') res = insertFormatting(el, localValue.value, "[[", "]]", "link");
    else if (formatType === 'code') res = insertFormatting(el, localValue.value, "<code>", "</code>", "code");

    if (res) {
        localValue.value = res.text;
        nextTick(() => {
            el.focus();
            el.setSelectionRange(res!.newCursorPos, res!.newCursorPos);
        });
    }
};

const applyList = (listType: '*' | '#') => {
    const el = textareaRef.value?.$el as HTMLTextAreaElement;
    if (!el) return;
    
    const res = insertList(el, localValue.value, listType);
    if (res) {
        localValue.value = res.text;
        nextTick(() => {
            el.focus();
            el.setSelectionRange(res!.newCursorPos, res!.newCursorPos);
        });
    }
};

// Initial preview
updatePreview();
</script>

<template>
    <div class="flex flex-col gap-3">
        <Toolbar class="p-2! border! rounded!">
            <template #start>
                <div class="flex gap-1 flex-wrap">
                    <Button label="B" text size="small" severity="secondary" @click="applyFormat('bold')" class="font-bold! min-w-8!" />
                    <Button label="I" text size="small" severity="secondary" @click="applyFormat('italic')" class="italic! min-w-8!" />
                    <Button text size="small" severity="secondary" @click="applyFormat('link')" v-tooltip.top="'Link'"><template #icon><Link class="w-4 h-4" /></template></Button>
                    <div class="h-6 w-px bg-surface-300 dark:bg-surface-600 mx-1"></div>
                    <Button text size="small" severity="secondary" @click="applyList('*')" v-tooltip.top="'Bullet List'"><template #icon><List class="w-4 h-4" /></template></Button>
                    <Button label="1." text size="small" severity="secondary" @click="applyList('#')" class="min-w-8!" v-tooltip.top="'Numbered List'" />
                    <Button text size="small" severity="secondary" @click="applyFormat('code')" v-tooltip.top="'Code'"><template #icon><Code class="w-4 h-4" /></template></Button>
                </div>
            </template>
        </Toolbar>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 transition-all">
            <div class="flex flex-col gap-1">
                <label class="text-xs font-semibold text-surface-600 dark:text-surface-300">Wikitext Source</label>
                <Textarea ref="textareaRef" v-model="localValue" :rows="rows || 8" class="w-full font-mono! text-sm!" autoResize />
            </div>
            <div class="flex flex-col gap-1">
                <label class="text-xs font-semibold text-surface-600 dark:text-surface-300">Preview</label>
                <div class="border border-surface-300 dark:border-surface-600 rounded p-3 min-h-[150px] bg-surface-50 dark:bg-surface-900 overflow-auto prose dark:prose-invert prose-sm max-w-none" v-html="previewHtml"></div>
            </div>
        </div>
    </div>
</template>
