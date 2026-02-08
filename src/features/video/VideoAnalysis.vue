<script setup lang="ts">
import { ref } from 'vue';
import Button from 'primevue/button';
import { Upload, Sparkles as SparklesIcon, X, Loader2 } from 'lucide-vue-next';

defineProps<{
    isAnalyzing: boolean;
    error: string;
    analysisSuccess: boolean;
    geminiApiKey: string | null;
}>();

const emit = defineEmits<{
    (e: 'analyze', file: File): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
    fileInput.value?.click();
};

const handleFileChange = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        emit('analyze', target.files[0]);
    }
    if (target.value) target.value = '';
};
</script>

<template>
    <div v-if="geminiApiKey"
        class="glass glass-border p-4 rounded-xl flex flex-col gap-4 relative overflow-hidden group transition-all duration-300">
        <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <SparklesIcon class="w-24 h-24 text-primary-500" />
        </div>

        <div class="flex items-center justify-between relative z-10">
            <div class="flex items-center gap-3">
                <div
                    class="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                    <SparklesIcon class="w-5 h-5" />
                </div>
                <div>
                    <h3 class="text-sm font-bold text-surface-900 dark:text-surface-100">AI Screenshot Analysis</h3>
                    <p class="text-xs text-surface-500 dark:text-surface-400">Paste or upload a settings screenshot to
                        auto-fill</p>
                </div>
            </div>

            <input type="file" ref="fileInput" accept="image/*" class="hidden" @change="handleFileChange" />

            <Button label="Analyze Image" size="small" @click="triggerFileInput" :loading="isAnalyzing"
                :disabled="isAnalyzing" severity="primary" outlined>
                <template #icon>
                    <Upload class="w-4 h-4 mr-2" />
                </template>
            </Button>
        </div>

        <!-- Analysis Feedback -->
        <Transition name="fade">
            <div v-if="error"
                class="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded flex items-center gap-2">
                <X class="w-3 h-3" />
                {{ error }}
            </div>
            <div v-else-if="analysisSuccess"
                class="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded flex items-center gap-2">
                <SparklesIcon class="w-3 h-3" />
                Settings updated from screenshot!
            </div>
        </Transition>
    </div>

    <div v-else
        class="glass glass-border p-3 rounded-xl flex items-center justify-between gap-3 opacity-70 hover:opacity-100 transition-opacity">
        <div class="flex items-center gap-3">
            <div class="p-2 bg-surface-100 dark:bg-surface-800 rounded-lg">
                <SparklesIcon class="w-4 h-4 text-surface-400" />
            </div>
            <span class="text-xs font-medium text-surface-500">Add Gemini API Key to enable AI screenshot
                analysis</span>
        </div>
    </div>
</template>
