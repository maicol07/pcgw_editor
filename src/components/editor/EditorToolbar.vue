<script setup lang="ts">
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import SelectButton from 'primevue/selectbutton';
import Slider from 'primevue/slider';
import Toolbar from 'primevue/toolbar';
import { Menu, Wand2, Loader2, LayoutList } from 'lucide-vue-next';
import { ref } from 'vue';
import { useUiStore } from '../../stores/ui';

export type EditorMode = 'Visual' | 'Code';

const props = defineProps<{
    title: string;
    editorMode: EditorMode;
    isGeneratingSummary?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:title', value: string): void;
    (e: 'update:editorMode', value: EditorMode): void;
    (e: 'toggleSidebar'): void;
    (e: 'generateSummary'): void;
}>();

const uiStore = useUiStore();
const editorModeOptions = ['Visual', 'Code'];

// Density mode mapping
const densityModes: Array<'normal' | 'comfortable' | 'compact'> = ['normal', 'comfortable', 'compact'];
const densityLabels = ['Normale', 'Comfortable', 'Compatta'];

const densityValue = ref(densityModes.indexOf(uiStore.densityMode));
const densityLabel = ref(densityLabels[densityValue.value]);

const updateDensity = (value: number | number[]) => {
    const index = Array.isArray(value) ? value[0] : value;
    uiStore.densityMode = densityModes[index];
    densityLabel.value = densityLabels[index];
};


</script>

<template>
    <Toolbar
        class="!border-b !border-0 !rounded-none glass glass-border shadow-soft z-20 !p-1.5 sticky top-0 bg-surface-0/80 dark:bg-surface-900/80 backdrop-blur-md">
        <template #start>
            <div class="flex items-center gap-2 md:gap-3">
                <Button text @click="emit('toggleSidebar')" class="lg:hidden hover-scale h-8! w-8! p-0!"
                    severity="secondary">
                    <template #icon>
                        <Menu class="w-5! h-5!" />
                    </template>
                </Button>

                <span
                    class="font-bold text-base md:text-lg bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent select-none">
                    PCGamingWiki Editor
                </span>

                <span class="text-surface-300 dark:text-surface-600 hidden lg:block text-xs">•</span>

                <InputText :modelValue="title" @update:modelValue="emit('update:title', $event || '')"
                    placeholder="Page Title..."
                    class="w-48 lg:w-64 py-1.5! px-2.5! text-sm hidden md:block transition-all focus:w-72" />

                <Button text size="small" @click="emit('generateSummary')" severity="secondary"
                    class="text-xs! px-2! py-1! hover-scale ml-1" v-tooltip.bottom="'Generate summary with AI'"
                    :disabled="isGeneratingSummary">
                    <template #icon>
                        <Loader2 v-if="isGeneratingSummary" class="w-4 h-4 animate-spin text-primary-500" />
                        <Wand2 v-else class="w-4 h-4" />
                    </template>
                </Button>
            </div>
        </template>

        <template #end>
            <div class="flex items-center gap-2">
                <div class="flex items-center gap-2" v-tooltip.bottom="'Densità UI: Normale ⟷ Comfortable ⟷ Compatta'">
                    <LayoutList class="w-4 h-4 text-surface-500 dark:text-surface-400" />
                    <Slider v-model="densityValue" :min="0" :max="2" :step="1" class="w-20"
                        @update:modelValue="updateDensity" />
                    <span class="text-xs text-surface-600 dark:text-surface-400 min-w-20 select-none">
                        {{ densityLabel }}
                    </span>
                </div>

                <div class="w-px h-4 bg-surface-200 dark:bg-surface-700 mx-1"></div>

                <SelectButton :modelValue="editorMode" @update:modelValue="emit('update:editorMode', $event)"
                    :options="editorModeOptions" :allowEmpty="false" size="small" class="transition-fast" />
            </div>
        </template>
    </Toolbar>
</template>
