<script setup lang="ts">
import Button from 'primevue/button';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import { Search, ChevronsDown, ChevronsUp } from 'lucide-vue-next';

defineProps<{
    searchQuery: string;
}>();

const emit = defineEmits<{
    (e: 'update:searchQuery', value: string): void;
    (e: 'expandAll'): void;
    (e: 'collapseAll'): void;
}>();
</script>

<template>
    <div
        class="flex items-center justify-between glass glass-border p-2.5 rounded-lg shadow-soft sticky top-0 z-20 animate-slide-in-down">
        <div class="flex items-center gap-1.5">
            <Button label="Expand" text size="small" @click="emit('expandAll')" severity="secondary"
                class="!text-xs !px-2 !py-1 hover-scale">
                <template #icon>
                    <ChevronsDown class="w-3 h-3 mr-1" />
                </template>
            </Button>
            <Button label="Collapse" text size="small" @click="emit('collapseAll')" severity="secondary"
                class="!text-xs !px-2 !py-1 hover-scale">
                <template #icon>
                    <ChevronsUp class="w-3 h-3 mr-1" />
                </template>
            </Button>
            <div class="h-4 w-px bg-surface-300 dark:bg-surface-600 mx-1"></div>
            <span class="text-2xs text-surface-500 dark:text-surface-400 hidden sm:inline">⌘K to search</span>
        </div>
        <div class="flex items-center gap-2">
            <IconField iconPosition="left">
                <InputIcon>
                    <Search class="w-4 h-4 text-surface-400" />
                </InputIcon>
                <InputText :modelValue="searchQuery" @update:modelValue="emit('update:searchQuery', $event)"
                    placeholder="Search..." size="small" class="w-40 sm:w-48 lg:w-64 !text-sm" />
            </IconField>
        </div>
    </div>
</template>
