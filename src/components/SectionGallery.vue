<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import AutocompleteField from './AutocompleteField.vue';
import Button from 'primevue/button';
import { VueDraggable } from 'vue-draggable-plus';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import InputText from 'primevue/inputtext';
import { Images, Plus, Image, ExternalLink, Pencil, Trash2, PanelRight, Grid } from 'lucide-vue-next';
import { pcgwApi } from '../services/pcgwApi';
import type { GalleryImage } from '../models/GameData';

interface Props {
    modelValue: (GalleryImage | string)[];
    section: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: (GalleryImage | string)[]): void;
}>();

const newImage = ref('');
const displayImages = computed({
    get: () => {
        const raw = props.modelValue || [];
        return raw.map((item: GalleryImage | string) => {
            if (typeof item === 'string') {
                return { name: item, caption: '' };
            }
            return item;
        });
    },
    set: (val) => {
        emit('update:modelValue', val);
    }
});

// Caption Edit State
const editingImage = ref<GalleryImage | null>(null);
const editingCaption = ref('');
const showCaptionDialog = ref(false);

const addImage = () => {
    if (newImage.value) {
        // Handle both single and multiple selections from Autocomplete
        const items = Array.isArray(newImage.value) ? newImage.value : [newImage.value];
        const newImages: GalleryImage[] = items.map((name: string) => ({ name: name, caption: '', position: 'gallery' }));
        emit('update:modelValue', [...(props.modelValue || []), ...newImages]);
        newImage.value = '';
    }
};

const removeImage = (index: number) => {
    const newValue = [...(props.modelValue || [])];
    newValue.splice(index, 1);
    emit('update:modelValue', newValue);
};

const togglePosition = (index: number) => {
    const newValue = [...(props.modelValue || [])];
    const item = newValue[index];

    if (typeof item === 'string') {
        // Upgrade string to object and set to lateral
        newValue[index] = { name: item, caption: '', position: 'lateral' };
    } else {
        // Toggle
        const newPos = item.position === 'lateral' ? 'gallery' : 'lateral';
        newValue[index] = { ...item, position: newPos };
    }
    emit('update:modelValue', newValue);
};

const openCaptionDialog = (img: GalleryImage) => {
    editingImage.value = img;
    editingCaption.value = img.caption || '';
    showCaptionDialog.value = true;
};

const saveCaption = () => {
    if (editingImage.value) {
        editingImage.value.caption = editingCaption.value;
        // Trigger update to ensure reactivity if needed, though objects are mutable
        emit('update:modelValue', [...props.modelValue]);
    }
    showCaptionDialog.value = false;
};

const openPcgwImage = (filename: string) => {
    const url = `https://www.pcgamingwiki.com/wiki/File:${encodeURIComponent(filename)}`;
    window.open(url, '_blank');
};



// We can use a map to store resolved URLs
const resolvedUrls = ref<Record<string, string>>({});

// Fetch URLs for images
watchEffect(() => {
    props.modelValue?.forEach(async (img) => {
        const name = typeof img === 'string' ? img : img.name;
        if (!resolvedUrls.value[name]) {
            const url = await pcgwApi.getImageUrl(name);
            if (url) {
                resolvedUrls.value[name] = url;
            }
        }
    });
});
</script>

<template>
    <div
        class="flex flex-col gap-4 p-4 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl relative overflow-hidden">
        <!-- Decoration -->
        <div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Images class="w-24 h-24" />
        </div>

        <label class="font-bold text-sm text-surface-500 uppercase tracking-widest relative z-10 flex items-center">
            <Images class="mr-2 w-4 h-4" /> Gallery
        </label>

        <div class="flex gap-2 relative z-10">
            <AutocompleteField v-model="newImage" dataSource="files" placeholder="Search PCGW Files..." :multiple="true"
                class="flex-1" />
            <Button label="Add" @click="addImage" :disabled="!newImage || newImage.length === 0">
                <template #icon>
                    <Plus class="w-4 h-4" />
                </template>
            </Button>
        </div>

        <div v-if="displayImages.length > 0" class="w-full">
            <VueDraggable v-model="displayImages" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                ghost-class="opacity-50" :animation="200">
                <div v-for="(element, index) in displayImages"
                    :key="typeof element === 'string' ? element : element.name"
                    class="border border-surface-200 dark:border-surface-700 rounded p-3 bg-surface-0 dark:bg-surface-800 relative group flex flex-col h-full cursor-move hover:shadow-md transition-shadow">
                    <div
                        class="relative flex-1 flex items-center justify-center p-2 rounded bg-surface-100 dark:bg-surface-900 overflow-hidden min-h-[150px]">
                        <img v-if="resolvedUrls[element.name]" :src="resolvedUrls[element.name]" :alt="element.name"
                            loading="lazy" class="max-h-[150px] max-w-full object-contain pointer-events-none" />
                        <div v-else class="flex flex-col items-center justify-center text-surface-500 h-[150px]">
                            <Image class="w-8 h-8 mb-2" />
                            <span class="text-xs text-center break-all px-2">{{ element.name }}</span>
                        </div>

                        <!-- Caption Overlay -->
                        <div v-if="element.caption"
                            class="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 text-center truncate pointer-events-none">
                            {{ element.caption }}
                        </div>

                        <!-- Position Badge -->
                        <div v-if="element.position === 'lateral'"
                            class="absolute top-2 right-2 bg-primary-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                            <PanelRight class="w-3 h-3" /> Side
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex justify-between items-center mt-3 gap-2">
                        <div class="flex gap-1">
                            <Button text rounded v-tooltip="'View on PCGW'" @click="openPcgwImage(element.name)">
                                <template #icon>
                                    <ExternalLink style="width: 18px !important; height: 18px !important;" />
                                </template>
                            </Button>
                            <Button text rounded v-tooltip="'Edit Caption'"
                                :class="element.caption ? 'text-primary-500' : 'text-surface-500'"
                                @click="openCaptionDialog(element)">
                                <template #icon>
                                    <Pencil style="width: 18px !important; height: 18px !important;" />
                                </template>
                            </Button>
                            <Button text rounded
                                v-tooltip="element.position === 'lateral' ? 'Move to Gallery' : 'Move to Side'"
                                :class="element.position === 'lateral' ? 'text-primary-500' : 'text-surface-500'"
                                @click="togglePosition(index)">
                                <template #icon>
                                    <PanelRight v-if="element.position !== 'lateral'"
                                        style="width: 18px !important; height: 18px !important;" />
                                    <Grid v-else style="width: 18px !important; height: 18px !important;" />
                                </template>
                            </Button>
                        </div>
                        <Button severity="danger" text rounded @click="removeImage(index)">
                            <template #icon>
                                <Trash2 style="width: 18px !important; height: 18px !important;" />
                            </template>
                        </Button>
                    </div>
                </div>
            </VueDraggable>
        </div>

        <!-- Caption Dialog -->
        <Dialog v-model:visible="showCaptionDialog" header="Edit Caption" modal :style="{ width: '400px' }">
            <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                    <label class="font-bold text-sm">Image</label>
                    <InputText :value="editingImage?.name" disabled class="w-full bg-surface-100 dark:bg-surface-900" />
                </div>
                <div class="flex flex-col gap-2">
                    <label class="font-bold text-sm">Caption</label>
                    <Textarea v-model="editingCaption" rows="3" autoResize class="w-full"
                        placeholder="Enter caption..." />
                </div>
                <div class="flex justify-end gap-2 mt-2">
                    <Button label="Cancel" text @click="showCaptionDialog = false" />
                    <Button label="Save" @click="saveCaption" />
                </div>
            </div>
        </Dialog>
    </div>
</template>
