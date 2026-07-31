<script setup lang="ts">
import IconField from 'openvue/iconfield';
import InputIcon from 'openvue/inputicon';
import InputText from 'openvue/inputtext';
import { Search, FoldVertical, UnfoldVertical } from 'lucide-vue-next';
import { usePlatform } from '../../composables/usePlatform';
import { useUiStore } from '../../stores/ui';
import { sectionKeysInOrder } from '../../config/sections';

const { shortcutLabel } = usePlatform();
const uiStore = useUiStore();

defineProps<{
    searchQuery: string;
}>();

const emit = defineEmits<{
    (e: 'update:searchQuery', value: string): void;
}>();
</script>

<template>
    <div
        class="flex items-center gap-2 glass glass-border p-2 rounded-xl shadow-soft sticky top-0 z-20 animate-slide-in-down backdrop-blur-md border-b border-surface-200/70 dark:border-surface-700/60 shadow-md">
        <IconField iconPosition="left" class="flex-1">
            <InputIcon>
                <Search class="w-4 h-4 text-surface-400" />
            </InputIcon>
            <InputText id="search-input" :modelValue="searchQuery"
                @update:modelValue="emit('update:searchQuery', $event ?? '')" placeholder="Search fields…"
                class="w-full !text-sm" />
        </IconField>
        <span class="text-2xs text-surface-400 dark:text-surface-500 pr-1 hidden sm:inline shrink-0">{{ shortcutLabel }}</span>

        <div class="flex items-center gap-1 pl-1 border-l border-surface-200/80 dark:border-surface-700/80">
            <button
                type="button"
                @click="uiStore.collapseAllSections(sectionKeysInOrder)"
                v-tooltip.bottom="'Collapse all sections'"
                aria-label="Collapse all sections"
                class="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-surface-600 dark:text-surface-300 hover:text-primary-500 hover:bg-surface-200/60 dark:hover:bg-surface-800/60 transition-colors">
                <FoldVertical class="w-4 h-4" />
                <span class="hidden md:inline">Collapse all</span>
            </button>
            <button
                type="button"
                @click="uiStore.expandAllSections()"
                v-tooltip.bottom="'Expand all sections'"
                aria-label="Expand all sections"
                class="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-surface-600 dark:text-surface-300 hover:text-primary-500 hover:bg-surface-200/60 dark:hover:bg-surface-800/60 transition-colors">
                <UnfoldVertical class="w-4 h-4" />
                <span class="hidden md:inline">Expand all</span>
            </button>
        </div>
    </div>
</template>

