<script setup lang="ts">
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { Key, TriangleAlert, Trash, X, Check, Sparkles, Loader2, Copy, Settings } from 'lucide-vue-next';

defineProps<{
    showApiKeyDialog: boolean;
    shareSummaryVisible: boolean;
    isGeneratingSummary: boolean;
    geminiApiKey: string;
    shareSummaryText: string;
    tempApiKey: string;
}>();

const emit = defineEmits<{
    (e: 'update:showApiKeyDialog', value: boolean): void;
    (e: 'update:shareSummaryVisible', value: boolean): void;
    (e: 'update:tempApiKey', value: string): void;
    (e: 'saveApiKey'): void;
    (e: 'clearApiKey'): void;
    (e: 'copyShareSummary'): void;
    (e: 'openApiKeyDialog'): void;
}>();

const handleApiKeyKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') emit('saveApiKey');
};
</script>

<template>
    <!-- Gemini API Key Settings Dialog -->
    <Dialog :visible="showApiKeyDialog" @update:visible="emit('update:showApiKeyDialog', $event)" modal
        :style="{ width: '35rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
        <template #header>
            <div class="flex items-center gap-2">
                <Key class="text-primary-500 w-5 h-5" />
                <span class="font-bold text-lg">Gemini API Key</span>
            </div>
        </template>

        <div class="flex flex-col gap-4">
            <p class="text-surface-600 dark:text-surface-400 text-sm">
                To generate AI-powered summaries, please provide your Gemini API key.
                This feature uses the <strong>Gemini 3 Flash</strong> model, which is free to use.
                Get one for free at <a href="https://aistudio.google.com/apikey" target="_blank"
                    class="text-primary-500 hover:underline">Google AI Studio</a>.
            </p>

            <div class="p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div class="flex gap-2">
                    <TriangleAlert class="text-orange-500 w-4 h-4 mt-0.5" />
                    <div class="flex-1">
                        <p class="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1">Security Notice</p>
                        <p class="text-xs text-orange-700 dark:text-orange-300">
                            Your API key will be stored in plain text in your browser's local storage.
                            Only use this on trusted devices.
                        </p>
                    </div>
                </div>
            </div>

            <div class="flex flex-col gap-2">
                <label class="font-medium text-sm">API Key</label>
                <InputText :modelValue="tempApiKey" @update:modelValue="emit('update:tempApiKey', $event)"
                    type="password" placeholder="Enter your Gemini API key..." class="w-full"
                    @keydown="handleApiKeyKeydown" />
            </div>

            <div class="flex gap-2 justify-end">
                <Button v-if="geminiApiKey" label="Clear Key" @click="emit('clearApiKey')" severity="danger" outlined>
                    <template #icon>
                        <Trash class="w-4 h-4 mr-2" />
                    </template>
                </Button>
                <Button label="Cancel" @click="emit('update:showApiKeyDialog', false)" severity="secondary" outlined>
                    <template #icon>
                        <X class="w-4 h-4 mr-2" />
                    </template>
                </Button>
                <Button label="Save" @click="emit('saveApiKey')" severity="primary" :disabled="!tempApiKey.trim()">
                    <template #icon>
                        <Check class="w-4 h-4 mr-2" />
                    </template>
                </Button>
            </div>
        </div>
    </Dialog>

    <!-- Share Summary Dialog -->
    <Dialog :visible="shareSummaryVisible" @update:visible="emit('update:shareSummaryVisible', $event)" modal
        :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
        <template #header>
            <div class="flex items-center gap-2">
                <Sparkles class="text-primary-500 w-5 h-5" />
                <span class="font-bold text-lg">Generate AI Summary</span>
            </div>
        </template>

        <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
                <p class="text-surface-600 dark:text-surface-400 text-sm">
                    {{ geminiApiKey ? 'AI-generated summary ready to share!' : 'Copy this summary to share!' }}
                </p>
                <Button v-if="geminiApiKey" text @click="emit('openApiKeyDialog')" severity="secondary">
                    <template #icon>
                        <Settings class="!w-5 !h-5" />
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
