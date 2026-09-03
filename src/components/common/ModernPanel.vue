<script setup lang="ts">
import { computed, ref, watch, onUnmounted, defineAsyncComponent } from 'vue';
import { useUiStore } from '../../stores/ui';
import { useWorkspaceStore } from '../../stores/workspace';
import { getSectionWikitext, setSectionWikitext } from '../../utils/sectionWikitext';
import { ChevronDown, Eye, EyeOff, Trash2, Code2, FileText, Loader2 } from '@lucide/vue';

import { getActivePinia } from 'pinia';

const CodeEditor = defineAsyncComponent(() => import('../CodeEditor.vue'));

const uiStore = getActivePinia() ? useUiStore() : null;
const workspaceStore = getActivePinia() ? useWorkspaceStore() : null;

const props = withDefaults(defineProps<{
    sectionKey?: string;
    collapsible?: boolean;
    hidable?: boolean;
    deletable?: boolean;
    codeable?: boolean;
}>(), {
    collapsible: true,
    hidable: true,
    deletable: true,
    codeable: true,
});

const emit = defineEmits<{
    (e: 'toggle-collapse'): void;
    (e: 'toggle-hide'): void;
    (e: 'toggle-code'): void;
    (e: 'delete', target: HTMLElement): void;
}>();

const isCollapsed = computed(() => {
    if (props.sectionKey && uiStore) {
        return uiStore.isSectionCollapsed(props.sectionKey);
    }
    return false;
});

const isHidden = computed(() => {
    if (props.sectionKey && uiStore) {
        return uiStore.isSectionHidden(props.sectionKey);
    }
    return false;
});

const isCodeMode = computed(() => {
    if (props.sectionKey && uiStore) {
        return uiStore.isSectionCode(props.sectionKey);
    }
    return false;
});

const sectionWikitext = ref('');
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const loadSectionWikitext = () => {
    if (!props.sectionKey || !workspaceStore?.activePage) return;
    const full = workspaceStore.activePage.wikitext;
    sectionWikitext.value = getSectionWikitext(
        props.sectionKey,
        full,
        workspaceStore.activeGameData
    );
};

// Sync state when entering or exiting code mode
watch(isCodeMode, (newVal, oldVal) => {
    if (newVal) {
        loadSectionWikitext();
    } else if (oldVal && props.sectionKey) {
        // Exiting code mode: ensure activeGameData is refreshed immediately
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
        }
        if (workspaceStore?.activePage) {
            workspaceStore.syncFromWikitext(workspaceStore.activePage.wikitext);
        }
    }
}, { immediate: true });

// Listen to external wikitext modifications
watch(() => workspaceStore?.activePage?.wikitext, (newFull) => {
    if (!isCodeMode.value || !props.sectionKey || !newFull) return;
    const currentExtracted = getSectionWikitext(
        props.sectionKey,
        newFull,
        workspaceStore?.activeGameData
    );
    if (currentExtracted !== sectionWikitext.value) {
        sectionWikitext.value = currentExtracted;
    }
});

// Update page wikitext on section edit in code mode
watch(sectionWikitext, (newVal) => {
    if (!isCodeMode.value || !props.sectionKey || !workspaceStore?.activePage) return;

    const full = workspaceStore.activePage.wikitext;
    const currentExtracted = getSectionWikitext(props.sectionKey, full, workspaceStore.activeGameData);
    if (newVal === currentExtracted) return;

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

const toggleCollapse = () => {
    if (props.sectionKey && uiStore) {
        uiStore.toggleSectionCollapse(props.sectionKey);
    }
    emit('toggle-collapse');
};

const toggleHide = () => {
    if (props.sectionKey && uiStore) {
        uiStore.toggleSectionHide(props.sectionKey);
    }
    emit('toggle-hide');
};

const toggleCode = () => {
    if (props.sectionKey && uiStore) {
        uiStore.toggleSectionCode(props.sectionKey);
    }
    emit('toggle-code');
};

const handleDelete = (event: MouseEvent) => {
    const btn = (event.currentTarget as HTMLElement) || ((event.target as HTMLElement)?.closest('button') as HTMLElement);
    emit('delete', btn);
};
</script>

<template>
    <div class="section-hide-wrapper" :class="{ 'is-hidden': isHidden }">
        <section class="section-hide-inner scroll-mt-2">
            <header
                @dblclick="collapsible && toggleCollapse()"
                class="group flex items-center justify-between pb-3 mb-4 border-b border-surface-200/80 dark:border-surface-800/80 cursor-pointer select-none">
                <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-2.5">
                        <slot name="header"></slot>
                        <Transition name="scale-fade">
                            <span v-if="isCodeMode"
                                class="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-primary-500/10 text-primary-600 dark:text-primary-400">
                                Code
                            </span>
                        </Transition>
                        <Transition name="scale-fade">
                            <span v-if="isCollapsed"
                                class="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-surface-200/80 dark:bg-surface-800/80 text-surface-500 dark:text-surface-400">
                                Collapsed
                            </span>
                        </Transition>
                    </div>
                    <p v-if="$slots.subtitle" class="text-xs text-surface-500 dark:text-surface-400">
                        <slot name="subtitle"></slot>
                    </p>
                </div>

                <!-- Controls -->
                <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                        v-if="deletable"
                        type="button"
                        @click.stop="handleDelete"
                        v-tooltip.top="'Delete section'"
                        aria-label="Delete section"
                        class="p-1.5 rounded-lg text-surface-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors active:scale-95">
                        <Trash2 class="w-4 h-4 transition-transform duration-200" />
                    </button>
                    <button
                        v-if="codeable && sectionKey"
                        type="button"
                        @click.stop="toggleCode"
                        v-tooltip.top="isCodeMode ? 'Switch to visual editor' : 'Switch to code editor'"
                        :aria-label="isCodeMode ? 'Switch to visual editor' : 'Switch to code editor'"
                        class="p-1.5 rounded-lg transition-colors active:scale-95"
                        :class="isCodeMode
                            ? 'text-primary-600 dark:text-primary-400 bg-primary-500/10 hover:bg-primary-500/20'
                            : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-200/60 dark:hover:bg-surface-800/60'">
                        <Transition name="scale-fade" mode="out-in">
                            <component :is="isCodeMode ? FileText : Code2" :key="isCodeMode ? 'visual-icon' : 'code-icon'" class="w-4 h-4" />
                        </Transition>
                    </button>
                    <button
                        v-if="hidable"
                        type="button"
                        @click.stop="toggleHide"
                        v-tooltip.top="isHidden ? 'Show section' : 'Hide section'"
                        :aria-label="isHidden ? 'Show section' : 'Hide section'"
                        class="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-200/60 dark:hover:bg-surface-800/60 transition-colors active:scale-95">
                        <component :is="isHidden ? EyeOff : Eye" class="w-4 h-4 transition-transform duration-200" />
                    </button>
                    <button
                        v-if="collapsible"
                        type="button"
                        @click.stop="toggleCollapse"
                        v-tooltip.top="isCollapsed ? 'Expand section' : 'Collapse section'"
                        :aria-label="isCollapsed ? 'Expand section' : 'Collapse section'"
                        class="p-1.5 rounded-lg text-surface-400 hover:text-primary-500 hover:bg-surface-200/60 dark:hover:bg-surface-800/60 transition-colors active:scale-95">
                        <ChevronDown class="w-4 h-4 transition-transform duration-300 ease-out" :class="{ '-rotate-90': isCollapsed }" />
                    </button>
                </div>
            </header>

            <div class="section-collapse-wrapper" :class="{ 'is-collapsed': isCollapsed }">
                <div class="section-collapse-inner pt-0.5 pb-1">
                    <Transition name="editor-mode" mode="out-in">
                        <div v-if="isCodeMode" key="code" class="h-80 w-full rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-xs resize-y">
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
            </div>
        </section>
    </div>
</template>
