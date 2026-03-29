<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Checkbox from 'primevue/checkbox';
import { MisMerge2 } from '@mismerge/vue';
import { DefaultDarkColors, DefaultLightColors } from '@mismerge/core/colors';
import { UploadCloud, GitCompare } from 'lucide-vue-next';
import { codeToHtml } from 'shiki';
import '@mismerge/core/styles.css';

const props = defineProps<{
    visible: boolean;
    localWikitext: string;
    onlineWikitext: string;
    pageTitle?: string;
    isPublishing: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'publish', payload: { summary: string; minor: boolean }): void;
}>();

const visibleState = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
});

const summary = ref('Updated via PCGW Editor');
const isMinorEdit = ref(false);

// Reset form when dialog opens
watch(() => props.visible, (newVal) => {
    if (newVal) {
        summary.value = 'Updated via PCGW Editor';
        isMinorEdit.value = false;
    }
});

const cancel = () => {
    visibleState.value = false;
};

const publish = () => {
    emit('publish', { summary: summary.value, minor: isMinorEdit.value });
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

const shikiHighlighter = async (text: string) => {
    if (!text) return '';
    return await codeToHtml(text, {
        lang: 'wikitext',
        theme: isDark.value ? 'min-dark' : 'min-light'
    });
};
</script>

<template>
    <Dialog v-model:visible="visibleState" :header="`Publish to PCGamingWiki: ${pageTitle || 'Unknown'}`"
        :style="{ width: '90vw', maxWidth: '1400px' }" modal :closable="!isPublishing" :draggable="false">
        
        <div class="flex flex-col gap-4 h-[75vh]">
            
            <div class="flex items-center gap-3 bg-primary-50 dark:bg-primary-900/10 p-3 rounded-xl border border-primary-100 dark:border-primary-900/20">
                <div class="p-2 bg-primary-500 rounded-lg shadow-sm">
                    <UploadCloud class="w-5 h-5 text-white" />
                </div>
                <div>
                    <div class="text-sm font-bold">{{ pageTitle }}</div>
                    <div class="text-xs text-surface-500">Please review your changes before publishing. Online version is on the left, your local version is on the right.</div>
                </div>
            </div>

            <!-- Diff Viewer -->
            <div class="flex-1 min-h-0 flex flex-col gap-2">
                <div class="flex items-center gap-2 px-1 text-xs text-surface-500 font-medium">
                    <GitCompare class="w-4 h-4" />
                    <span>Wikitext Diff Viewer</span>
                </div>
                <div class="flex-1 w-full border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-lg overflow-hidden relative">
                    <MisMerge2 :lhs="onlineWikitext" :rhs="localWikitext"
                        :colors="mismergeColors"
                        :highlight="shikiHighlighter"
                        :lhsEditable="false"
                        :rhsEditable="false"
                        class="h-full w-full absolute inset-0" />
                </div>
            </div>

            <!-- Publish Form underneath the diff viewer -->
            <div class="bg-surface-50 dark:bg-surface-900/50 p-4 rounded-lg border border-surface-200 dark:border-surface-700 flex flex-col gap-3">
                <div class="flex flex-col gap-2">
                    <label class="text-xs font-bold text-surface-500 uppercase">Edit Summary</label>
                    <InputText v-model="summary" placeholder="What did you change?" class="w-full" :disabled="isPublishing" @keyup.enter="publish" />
                    <p class="text-[10px] text-surface-400">This summary will appear in the page history on PCGW.</p>
                </div>
                
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <Checkbox v-model="isMinorEdit" inputId="minorEditDiff" :binary="true" :disabled="isPublishing" />
                        <label for="minorEditDiff" class="text-sm cursor-pointer select-none">This is a minor edit</label>
                    </div>

                    <div class="flex items-center gap-2">
                        <Button label="Cancel" text @click="cancel" :disabled="isPublishing" />
                        <Button label="Publish Changes" icon="lucide-upload-cloud" @click="publish" :loading="isPublishing" severity="primary">
                            <template #icon>
                                <UploadCloud class="w-4 h-4 mr-2" />
                            </template>
                        </Button>
                    </div>
                </div>
            </div>
            
        </div>
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
    font-size: 0.875rem !important; /* text-sm */
    line-height: 1.5 !important;
}

:deep(.msm__highlight-overlay .shiki) {
    background-color: transparent !important;
}

:deep(.msm__header) {
    background-color: var(--p-surface-50) !important;
    border-bottom: 1px solid var(--p-surface-200) !important;
}

@media (prefers-color-scheme: dark) {
    :deep(.msm__header) {
        background-color: var(--p-surface-900) !important;
        border-bottom: 1px solid var(--p-surface-700) !important;
    }
}
</style>
