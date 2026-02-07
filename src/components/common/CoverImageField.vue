<script setup lang="ts">
import { ref, watch } from 'vue';
import { pcgwApi } from '../../services/pcgwApi';
import AutocompleteField from '../AutocompleteField.vue';
import Button from 'primevue/button';

import { Image, Info, Upload, Loader2, ExternalLink, TriangleAlert } from 'lucide-vue-next';

const props = defineProps<{
  modelValue: string;
  label?: string;
  tooltip?: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

// Cover image preview logic
const coverImageLoading = ref(false);
const coverImageError = ref(false);
const coverImageUrl = ref('');

watch(() => props.modelValue, async (newCover) => {
  if (!newCover) {
    coverImageUrl.value = '';
    return;
  }
  coverImageLoading.value = true;
  coverImageError.value = false;
  try {
    const url = await pcgwApi.getImageUrl(newCover);
    if (url) coverImageUrl.value = url;
    else coverImageError.value = true;
  } catch (error) {
    console.error('Failed to load cover image:', error);
    coverImageError.value = true;
  } finally {
    coverImageLoading.value = false;
  }
}, { immediate: true });

const openUploadPage = () => {
  window.open('https://www.pcgamingwiki.com/wiki/Special:Upload', '_blank', 'noopener,noreferrer');
};
</script>

<template>
    <div class="flex flex-col gap-2">
        <div class="flex flex-wrap gap-2">
            <AutocompleteField 
                :modelValue="modelValue || ''" 
                @update:modelValue="emit('update:modelValue', $event as string)"
                data-source="files" 
                :multiple="false"
                :placeholder="placeholder || 'e.g. GAME TITLE cover.jpg'"
                class="flex-1 min-w-[200px]"
            />
            <Button label="Upload" severity="secondary" @click="openUploadPage" size="small">
                <template #icon><Upload class="w-4 h-4" /></template>
            </Button>
        </div>
        <!-- Image Preview -->
        <div v-if="modelValue" class="mt-2 p-4 border border-surface-200 dark:border-surface-700 rounded bg-surface-50 dark:bg-surface-800">
            <div v-if="coverImageLoading" class="flex items-center justify-center py-8">
                <Loader2 class="text-2xl text-surface-400 animate-spin w-8 h-8" />
            </div>
            <div v-else-if="!coverImageError && coverImageUrl" class="flex flex-col gap-3">
                <div class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300">
                    <Image class="text-lg w-5 h-5" />
                    <span class="font-medium">{{ modelValue }}</span>
                </div>
                <a :href="coverImageUrl" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors">
                    <ExternalLink class="w-4 h-4" /> View Cover on PCGW
                </a>
                <p class="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1">
                    <Info class="w-3 h-3" /> Preview not available due to CORS policy. Click above to view.
                </p>
            </div>
            <div v-else class="text-sm text-red-500 dark:text-red-400 py-4 text-center flex flex-col items-center gap-2">
                <TriangleAlert class="w-6 h-6" /> Image not found on PCGW
            </div>
        </div>
    </div>
</template>
