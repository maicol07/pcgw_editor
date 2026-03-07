<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import { MisMerge3 } from '@mismerge/vue';
import { DefaultDarkColors, DefaultLightColors } from '@mismerge/core/colors';
import { usePreview } from '../../composables/usePreview';
import { Monitor, Code, AlertTriangle } from 'lucide-vue-next';
import '@mismerge/core/styles.css';

const props = defineProps<{
    visible: boolean;
    localWikitext: string;
    onlineWikitext: string;
    pageTitle?: string;
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'merge', mergedText: string): void;
}>();

const visibleState = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
});

const mergedText = ref(props.localWikitext);
const conflictsResolved = ref(false);

const { renderedHtml, isLoading, error } = usePreview(
    () => mergedText.value,
    () => props.pageTitle || 'Main Page'
);

const handleCtrChange = (value: string) => {
    mergedText.value = value;
};

const handleConflictsResolvedChange = (resolved: boolean) => {
    conflictsResolved.value = resolved;
};

const cancelMerge = () => {
    visibleState.value = false;
};

const finishMerge = () => {
    emit('merge', mergedText.value);
    visibleState.value = false;
};

// Check for dark mode to sync MisMerge colors
const isDark = ref(document.documentElement.classList.contains('dark'));
const mismergeColors = computed(() => isDark.value ? DefaultDarkColors : DefaultLightColors);

// Watch for manual theme changes
const observer = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains('dark');
});
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

onUnmounted(() => {
    observer.disconnect();
});

import { codeToHtml } from 'shiki';

const shikiHighlighter = async (text: string) => {
    return await codeToHtml(text, {
        lang: 'wikitext',
        theme: isDark.value ? 'min-dark' : 'min-light'
    });
};

</script>

<template>
    <Dialog v-model:visible="visibleState" :header="`Update Page: ${pageTitle || 'Unknown'}`"
        :style="{ width: '95vw', maxWidth: '1600px' }" modal :closable="false">
        <div class="flex flex-col gap-4 h-[80vh]">
            <Tabs value="0" class="flex flex-col h-full">
                <TabList>
                    <Tab value="0" class="flex items-center gap-2 py-2 px-4 text-sm!">
                        <Code class="w-4 h-4" />
                        <span>Merge Editor</span>
                    </Tab>
                    <Tab value="1" class="flex items-center gap-2 py-2 px-4 text-sm!">
                        <Monitor class="w-4 h-4" />
                        <span>Preview Result</span>
                        <div v-if="isLoading" class="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></div>
                    </Tab>
                </TabList>

                <TabPanels class="flex-1 min-h-0 p-0! mt-4">
                    <TabPanel value="0" class="h-full p-0!">
                        <div class="flex flex-col h-full gap-4">
                            <div class="text-xs text-surface-500 px-1">
                                Merging Changes from PCGamingWiki. Please resolve all conflicts using the editor before
                                finishing.
                                <br />
                                <span class="text-2xs opacity-70">Left: Local Version | Center: Merged Result | Right:
                                    Online Version</span>
                            </div>

                            <div
                                class="flex-1 w-full border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-lg overflow-hidden relative">
                                <MisMerge3 :lhs="localWikitext" :ctr="localWikitext" :rhs="onlineWikitext"
                                    :onCtrChange="handleCtrChange"
                                    :onConflictsResolvedChange="handleConflictsResolvedChange" :colors="mismergeColors"
                                    :ctrEditable="true" :highlight="shikiHighlighter"
                                    class="h-full w-full absolute inset-0" />
                            </div>
                        </div>
                    </TabPanel>

                    <TabPanel value="1" class="h-full p-0! overflow-hidden border border-surface-200 dark:border-surface-700 rounded-lg bg-white">
                        <div class="h-full overflow-auto p-6 custom-scrollbar scroll-smooth">
                            <div v-if="error"
                                class="p-4 rounded bg-red-50 text-red-600 border border-red-200 flex items-center gap-2 mb-4 text-sm">
                                <AlertTriangle class="w-5 h-5 shrink-0" />
                                <span>{{ error }}</span>
                            </div>

                            <div class="prose max-w-none text-sm pcgw-content rendered-view bg-white text-black"
                                v-html="renderedHtml || '<span class=\'text-surface-400 italic\'>Preview will appear here...</span>'">
                            </div>
                        </div>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </div>

        <template #footer>
            <div class="flex items-center justify-between w-full pt-2">
                <Button label="Cancel" text severity="secondary" @click="cancelMerge" />
                <div class="flex items-center gap-3">
                    <div v-if="!conflictsResolved" class="text-xs text-orange-500 font-medium">
                        Unresolved conflicts remaining
                    </div>
                    <Button label="Finish Merge" severity="primary" @click="finishMerge"
                        :disabled="!conflictsResolved" />
                </div>
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
/* Ensure MisMerge fills its container completely */
:deep(.mismerge) {
    height: 100%;
    width: 100%;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
}

:deep(.mismerge textarea),
:deep(.mismerge-code) {
    font-family: inherit !important;
    font-size: 0.875rem !important;
    /* text-sm */
    line-height: 1.5 !important;
}

:deep(.mismerge textarea) {
    caret-color: var(--p-text-color) !important;
}

:deep(.msm__highlight-overlay .shiki) {
    background-color: transparent !important;
}

:deep(footer.msm__footer) {
    background-color: var(--p-surface-0) !important;
    border-top: 1px solid var(--p-surface-200) !important;
}

@media (prefers-color-scheme: dark) {
    :deep(footer.msm__footer) {
        background-color: var(--p-surface-900) !important;
        border-top: 1px solid var(--p-surface-700) !important;
    }
}

/* Tabs styling to fix height issues */
:deep(.p-tabs) {
    display: flex;
    flex-direction: column;
}

:deep(.p-tabpanels) {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

:deep(.p-tabpanel) {
    flex: 1;
    min-height: 0;
}
</style>
