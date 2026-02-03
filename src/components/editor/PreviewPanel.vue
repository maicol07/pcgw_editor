<script setup lang="ts">
import { computed } from 'vue';
import { usePreview, PreviewMode } from '../../composables/usePreview';
import SelectButton from 'primevue/selectbutton';
import { Loader2, AlertTriangle, Monitor, Sparkles, RefreshCw } from 'lucide-vue-next';

// This component accepts the logic from usePreview as props or we can bind v-models?
// Ideally, the parent owns the composable and passes the state down.
const props = defineProps<{
    html: string;
    loading: boolean;
    error: string;
    previewMode: PreviewMode;
}>();

const emit = defineEmits<{
    (e: 'update:previewMode', value: PreviewMode): void;
}>();

const previewOptions = ['Local', 'API'];

</script>

<template>
    <div class="flex flex-col h-full bg-surface-50 dark:bg-surface-950 border-l border-surface-200 dark:border-surface-700">
        <!-- Floating Header -->
        <!-- Floating Header -->
        <div class="flex items-center justify-between p-2 border-b border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-900 sticky top-0 z-10 glass">
            <div class="flex items-center gap-2">
                 <Monitor class="w-4 h-4 text-surface-500" />
                 <span class="text-xs font-bold uppercase tracking-wider text-surface-500">Preview</span>
            </div>
            
            <SelectButton 
                :modelValue="previewMode" 
                @update:modelValue="emit('update:previewMode', $event)" 
                :options="previewOptions" 
                :allowEmpty="false" 
                size="small" 
                class="scale-90 origin-right transition-fast" 
            />
        </div>

        <!-- Content -->
        <div class="flex-1 relative min-h-0">
             <!-- Loading Overlay -->
             <!-- Loading Overlay -->
             <div v-if="loading" class="absolute inset-0 bg-surface-0/50 dark:bg-surface-950/50 backdrop-blur-sm z-50 flex items-center justify-center transition-all duration-300">
                 <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-xl rounded-xl p-4 flex flex-col items-center gap-3">
                     <div class="flex items-center gap-1.5 h-8">
                         <div class="w-2.5 h-2.5 rounded-full bg-primary-500 animate-[bounce_1s_infinite]"></div>
                         <div class="w-2.5 h-2.5 rounded-full bg-primary-500 animate-[bounce_1s_infinite_100ms]"></div>
                         <div class="w-2.5 h-2.5 rounded-full bg-primary-500 animate-[bounce_1s_infinite_200ms]"></div>
                     </div>
                     <span class="text-xs font-semibold text-surface-500 uppercase tracking-wide">Rendering</span>
                 </div>
             </div>

             <!-- Scrollable Area -->
             <div class="h-full overflow-auto p-4 custom-scrollbar">
                 <div v-if="error" class="p-4 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 flex items-center gap-2 mb-4 text-sm">
                     <AlertTriangle class="w-5 h-5 flex-shrink-0" />
                     <span>{{ error }}</span>
                 </div>

                 <div 
                    class="prose dark:prose-invert max-w-none text-sm pcgw-content rendered-view" 
                    v-html="html || '<span class=\'text-surface-400 italic\'>Preview will appear here...</span>'"
                ></div>
             </div>
        </div>
    </div>
</template>

<style>
/* We might need some global pcgw types styles imported here or in App if scoped styles don't work well with v-html */
</style>
