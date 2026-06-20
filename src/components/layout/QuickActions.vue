<script setup lang="ts">
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import { Search } from 'lucide-vue-next';
import { usePlatform } from '../../composables/usePlatform';

const { shortcutLabel } = usePlatform();

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
        <span class="text-2xs text-surface-400 dark:text-surface-500 pr-1 hidden sm:inline shrink-0">{{ shortcutLabel
            }}</span>
    </div>
</template>
