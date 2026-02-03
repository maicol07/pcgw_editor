<script setup lang="ts">
import { ref, watch, inject } from 'vue';
import { GameInfobox } from '../../models/GameData';
import { pcgwApi } from '../../services/pcgwApi';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import AutocompleteField from '../AutocompleteField.vue';
import { Image, Info, Upload, Loader2, ExternalLink, TriangleAlert, IdCard } from 'lucide-vue-next';

// License options
const licenseOptions = [
  { label: 'Commercial', value: 'commercial', description: 'Proprietary software sold commercially' },
  { label: 'Freeware', value: 'freeware', description: 'Free to use but proprietary' },
  { label: 'Open Source / Free Software', value: 'open source', description: 'Free and open source licensed' },
  { label: 'Abandonware', value: 'abandonware', description: 'No longer supported or sold' },
  { label: 'Donationware', value: 'donationware', description: 'Free with optional donations' },
  { label: 'Shareware', value: 'shareware', description: 'Try before you buy' },
];

const props = defineProps<{
  cover: string;
  license: string;
}>();

const emit = defineEmits<{
  (e: 'update:cover', value: string): void;
  (e: 'update:license', value: string): void;
}>();

// Cover image preview logic
const coverImageLoading = ref(false);
const coverImageError = ref(false);
const coverImageUrl = ref('');

watch(() => props.cover, async (newCover) => {
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
    <div class="flex flex-col gap-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Cover Image Field -->
            <div class="flex flex-col gap-2">
                <div class="flex items-center gap-1">
                    <label class="text-sm font-medium text-surface-600 dark:text-surface-300 flex items-center gap-2">
                        <Image class="text-primary-500 w-4 h-4" /> Cover Image Filename
                    </label>
                    <Info class="text-surface-400 w-3 h-3" v-tooltip.top="'Search PCGW files or enter name. Click Upload to add new.'" />
                </div>
                <div class="flex flex-wrap gap-2">
                    <AutocompleteField 
                        :modelValue="cover || ''" 
                        @update:modelValue="emit('update:cover', $event as string)"
                        data-source="files" 
                        :multiple="false"
                        placeholder="e.g. GAME TITLE cover.jpg"
                        class="flex-1 min-w-[200px]"
                    />
                    <Button label="Upload" severity="secondary" @click="openUploadPage" size="small">
                        <template #icon><Upload class="w-4 h-4" /></template>
                    </Button>
                </div>
                <!-- Image Preview -->
                <div v-if="cover" class="mt-2 p-4 border border-surface-200 dark:border-surface-700 rounded bg-surface-50 dark:bg-surface-800">
                    <div v-if="coverImageLoading" class="flex items-center justify-center py-8">
                        <Loader2 class="text-2xl text-surface-400 animate-spin w-8 h-8" />
                    </div>
                    <div v-else-if="!coverImageError && coverImageUrl" class="flex flex-col gap-3">
                        <div class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300">
                            <Image class="text-lg w-5 h-5" />
                            <span class="font-medium">{{ cover }}</span>
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

            <!-- License Field -->
            <div class="flex flex-col gap-2">
                <div class="flex items-center gap-1">
                    <label class="text-sm font-medium text-surface-600 dark:text-surface-300 flex items-center gap-2">
                        <IdCard class="text-orange-500 w-4 h-4" /> License
                    </label>
                    <Info class="text-surface-400 w-3 h-3" v-tooltip.top="'Software distribution license type'" />
                </div>
                <Select 
                    :modelValue="license" 
                    @update:modelValue="emit('update:license', $event)"
                    :options="licenseOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select license type" 
                    class="w-full"
                >
                    <template #option="slotProps">
                        <div class="flex flex-col gap-1 py-1">
                            <span class="font-medium">{{ slotProps.option.label }}</span>
                            <span class="text-xs text-surface-500 dark:text-surface-400">{{ slotProps.option.description }}</span>
                        </div>
                    </template>
                </Select>
            </div>
        </div>
    </div>
</template>
