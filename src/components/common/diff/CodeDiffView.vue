<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { MergeView } from '@codemirror/merge';
import { EditorState } from '@codemirror/state';
import Button from 'openvue/button';
import { UnfoldVertical, FoldVertical } from '@lucide/vue';
import { wikitextExtensions, isDark } from './cmWikitext';

const props = withDefaults(defineProps<{
    original: string;
    modified: string;
    originalLabel?: string;
    modifiedLabel?: string;
}>(), {
    originalLabel: 'Original',
    modifiedLabel: 'Modified',
});

const container = ref<HTMLDivElement | null>(null);
const collapseOn = ref(true);
let view: MergeView | null = null;

const cleanOriginal = computed(() => (props.original || '').replace(/\r/g, ''));
const cleanModified = computed(() => (props.modified || '').replace(/\r/g, ''));

const build = () => {
    if (!container.value) return;
    view?.destroy();
    const readOnly = [...wikitextExtensions(isDark()), EditorState.readOnly.of(true)];
    view = new MergeView({
        a: { doc: cleanOriginal.value, extensions: readOnly },
        b: { doc: cleanModified.value, extensions: readOnly },
        parent: container.value,
        collapseUnchanged: collapseOn.value ? { margin: 3, minSize: 6 } : undefined,
        highlightChanges: true,
        gutter: true,
        diffConfig: { scanLimit: 50000 },
    });
};

const toggleCollapse = () => { collapseOn.value = !collapseOn.value; build(); };

onMounted(() => {
    build();
    // Rebuild on theme toggle (cheap; diff views are short-lived dialogs).
    const observer = new MutationObserver(build);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    onUnmounted(() => observer.disconnect());
});

watch(() => [cleanOriginal.value, cleanModified.value], build);

onUnmounted(() => view?.destroy());
</script>

<template>
    <div class="flex flex-col h-full w-full">
        <div class="cm-toolbar flex items-center shrink-0 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50 text-xs font-medium text-surface-500">
            <div class="flex-1 px-3 py-1.5">{{ originalLabel }}</div>
            <div class="flex-1 px-3 py-1.5 border-l border-surface-200 dark:border-surface-700">{{ modifiedLabel }}</div>
            <Button size="small" severity="secondary" text rounded class="mr-1" @click="toggleCollapse"
                v-tooltip.bottom="collapseOn ? 'Expand all unchanged sections' : 'Collapse unchanged sections'">
                <template #icon><UnfoldVertical v-if="collapseOn" class="w-4 h-4" /><FoldVertical v-else class="w-4 h-4" /></template>
            </Button>
        </div>
        <div ref="container" class="flex-1 min-h-0 overflow-auto" />
    </div>
</template>

<style scoped>
:deep(.cm-mergeView),
:deep(.cm-editor) {
    height: 100%;
}

.cm-toolbar :deep(.p-button:not(:disabled):hover) {
    background-color: var(--p-content-hover-background);
    color: var(--p-text-color);
}
</style>
