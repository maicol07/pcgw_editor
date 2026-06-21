<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Checkbox from 'primevue/checkbox';
import CodeDiffView from './diff/CodeDiffView.vue';
import { UploadCloud, GitCompare, Wand2 } from 'lucide-vue-next';

const props = defineProps<{
    visible: boolean;
    localWikitext: string;
    onlineWikitext: string;
    pageTitle?: string;
    isPublishing: boolean;
    isGeneratingSummary?: boolean;
    suggestedSummary?: string;
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'publish', payload: { summary: string; minor: boolean }): void;
    (e: 'requestAiSummary'): void;
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

watch(() => props.suggestedSummary, (val) => {
    if (val) {
        summary.value = val;
    }
});

const cancel = () => {
    visibleState.value = false;
};

const publish = () => {
    emit('publish', { summary: summary.value, minor: isMinorEdit.value });
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
                <div class="flex-1 w-full border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-lg overflow-hidden">
                    <CodeDiffView :original="onlineWikitext" :modified="localWikitext"
                        originalLabel="Online (PCGamingWiki)" modifiedLabel="Local (yours)" />
                </div>
            </div>

            <!-- Publish Form underneath the diff viewer -->
            <div class="bg-surface-50 dark:bg-surface-900/50 p-4 rounded-lg border border-surface-200 dark:border-surface-700 flex flex-col gap-3">
                <div class="flex flex-col gap-2">
                    <label class="text-xs font-bold text-surface-500 uppercase">Edit Summary</label>
                    <div class="flex gap-2">
                        <InputText v-model="summary" placeholder="What did you change?" class="w-full" :disabled="isPublishing || isGeneratingSummary" @keyup.enter="publish" />
                        <Button @click="emit('requestAiSummary')" :loading="isGeneratingSummary" :disabled="isPublishing" severity="secondary" v-tooltip.top="'Generate summary with AI'">
                            <template #icon>
                                <Wand2 class="w-4 h-4" />
                            </template>
                        </Button>
                    </div>
                    <p class="text-xs text-surface-400">This summary will appear in the page history on PCGW.</p>
                </div>
                
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <Checkbox v-model="isMinorEdit" inputId="minorEditDiff" :binary="true" :disabled="isPublishing" />
                        <label for="minorEditDiff" class="text-sm cursor-pointer select-none">This is a minor edit</label>
                    </div>

                    <div class="flex items-center gap-2">
                        <Button label="Cancel" text @click="cancel" :disabled="isPublishing" />
                        <Button label="Publish Changes" icon="lucide-upload-cloud" @click="publish" :loading="isPublishing" severity="warning">
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

