<script setup lang="ts">
import Dialog from 'openvue/dialog';
import Button from 'openvue/button';
import Textarea from 'openvue/textarea';
import { X, Sparkles, Loader2, Copy, Settings } from '@lucide/vue';
import { useUiStore } from '../../stores/ui';

defineProps<{
    shareSummaryVisible: boolean;
    isGeneratingSummary: boolean;
    shareSummaryText: string;
}>();

const emit = defineEmits<{
    (e: 'update:shareSummaryVisible', value: boolean): void;
    (e: 'copyShareSummary'): void;
}>();

const uiStore = useUiStore();

const openSettings = () => {
    uiStore.openSettings('integrations');
};
</script>

<template>
    <!-- Share Summary Dialog -->
    <Dialog :visible="shareSummaryVisible" @update:visible="emit('update:shareSummaryVisible', $event)" modal
        :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }" :draggable="false">
        <template #header>
            <div class="flex items-center gap-2">
                <Sparkles class="text-primary-500 w-5 h-5" />
                <span class="font-bold text-lg">Generate AI Summary</span>
            </div>
        </template>

        <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
                <p class="text-surface-600 dark:text-surface-400 text-sm">
                    AI-generated summary ready to share!
                </p>
                <Button text @click="openSettings" severity="secondary" aria-label="AI Settings">
                    <template #icon>
                        <Settings class="w-5! h-5!" />
                    </template>
                </Button>
            </div>

            <div v-if="isGeneratingSummary" class="flex items-center justify-center p-8">
                <div class="flex flex-col items-center gap-3">
                    <Loader2 class="w-8 h-8 animate-spin text-primary-500" />
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Generating summary with
                        AI...</span>
                </div>
            </div>

            <Textarea v-else :modelValue="shareSummaryText" :autoResize="true" rows="12"
                class="w-full font-mono text-sm" readonly />

            <div class="flex gap-2 justify-end">
                <Button label="Copy to Clipboard" @click="emit('copyShareSummary')" severity="primary"
                    :disabled="isGeneratingSummary || !shareSummaryText">
                    <template #icon>
                        <Copy class="w-4 h-4 mr-2" />
                    </template>
                </Button>
                <Button label="Close" @click="emit('update:shareSummaryVisible', false)" severity="secondary" outlined>
                    <template #icon>
                        <X class="w-4 h-4 mr-2" />
                    </template>
                </Button>
            </div>
        </div>
    </Dialog>
</template>
