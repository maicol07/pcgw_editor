<script setup lang="ts">
import { computed, ref, watch, onUnmounted, defineAsyncComponent } from 'vue';
import { useUiStore } from '../../stores/ui';
import { useWorkspaceStore } from '../../stores/workspace';
import { getSectionWikitext, setSectionWikitext } from '../../utils/sectionWikitext';
import { Loader2 } from '@lucide/vue';

import { getActivePinia } from 'pinia';

const CodeEditor = defineAsyncComponent(() => import('../CodeEditor.vue'));

const props = withDefaults(defineProps<{
    sectionKey?: string;
    heightClass?: string;
}>(), {
    sectionKey: '',
    heightClass: 'h-64',
});

const uiStore = getActivePinia() ? useUiStore() : null;
const workspaceStore = getActivePinia() ? useWorkspaceStore() : null;

const isCodeMode = computed(() => (props.sectionKey && uiStore) ? uiStore.isSectionCode(props.sectionKey) : false);
const sectionWikitext = ref('');
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const loadWikitext = () => {
    if (!workspaceStore?.activePage) return;
    sectionWikitext.value = getSectionWikitext(
        props.sectionKey,
        workspaceStore.activePage.wikitext,
        workspaceStore.activeGameData
    );
};

watch(isCodeMode, (newVal, oldVal) => {
    if (newVal) {
        loadWikitext();
    } else if (oldVal) {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
        }
        if (workspaceStore?.activePage) {
            workspaceStore.syncFromWikitext(workspaceStore.activePage.wikitext);
        }
    }
}, { immediate: true });

watch(() => workspaceStore?.activePage?.wikitext, (newFull) => {
    if (!isCodeMode.value || !newFull) return;
    const current = getSectionWikitext(props.sectionKey, newFull, workspaceStore?.activeGameData);
    if (current !== sectionWikitext.value) {
        sectionWikitext.value = current;
    }
});

watch(sectionWikitext, (newVal) => {
    if (!isCodeMode.value || !workspaceStore?.activePage) return;
    const full = workspaceStore.activePage.wikitext;
    const current = getSectionWikitext(props.sectionKey, full, workspaceStore.activeGameData);
    if (newVal === current) return;

    const updated = setSectionWikitext(props.sectionKey, newVal, full);
    workspaceStore.activePage.wikitext = updated;
    workspaceStore.activePage.baseWikitext = updated;
    workspaceStore.activePage.lastModified = Date.now();

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        if (workspaceStore?.activePage) {
            workspaceStore.syncFromWikitext(workspaceStore.activePage.wikitext);
        }
    }, 300);
});

onUnmounted(() => {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
    }
});

const toggleCode = () => {
    if (props.sectionKey && uiStore) {
        uiStore.toggleSectionCode(props.sectionKey);
    }
};

defineExpose({
    isCodeMode,
    toggleCode,
});
</script>

<template>
    <div class="subsection-code-wrapper flex flex-col gap-2">
        <slot name="header" :isCodeMode="isCodeMode" :toggleCode="toggleCode"></slot>

        <Transition name="editor-mode" mode="out-in">
            <div v-if="isCodeMode" key="code"
                :class="[heightClass, 'w-full rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-xs resize-y']">
                <Suspense>
                    <template #default>
                        <CodeEditor v-model="sectionWikitext" class="h-full w-full" />
                    </template>
                    <template #fallback>
                        <div class="h-full w-full flex items-center justify-center p-4">
                            <Loader2 class="w-6 h-6 animate-spin text-primary-500" />
                        </div>
                    </template>
                </Suspense>
            </div>
            <div v-else key="visual" class="w-full">
                <slot></slot>
            </div>
        </Transition>
    </div>
</template>
