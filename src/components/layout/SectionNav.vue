<script setup lang="ts">
import { sectionGroups } from '../../config/sections';

defineProps<{
    activeKey: string;
    // Visibility map from search filter; missing key => visible.
    panelVisibility?: Record<string, boolean>;
}>();

const emit = defineEmits<{ (e: 'navigate', key: string): void }>();

const isVisible = (vis: Record<string, boolean> | undefined, key: string) =>
    !vis || vis[key] !== false;
</script>

<template>
    <nav
        class="hidden md:flex flex-col gap-5 w-52 shrink-0 overflow-y-auto custom-scrollbar px-3 py-4 border-r border-surface-200/70 dark:border-surface-800/70 bg-surface-50/60 dark:bg-surface-950/40">
        <div v-for="group in sectionGroups" :key="group.label" class="flex flex-col gap-1">
            <div
                class="px-2.5 mb-0.5 text-[10px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 select-none">
                {{ group.label }}
            </div>
            <template v-for="item in group.items" :key="item.key">
                <button v-if="isVisible(panelVisibility, item.key)" type="button" @click="emit('navigate', item.key)"
                    class="group relative flex items-center gap-2.5 rounded-lg pl-3 pr-2 py-1.5 text-left transition-colors duration-150"
                    :class="activeKey === item.key
                        ? 'bg-primary-500/10 text-primary-600 dark:text-primary-300'
                        : 'text-surface-600 dark:text-surface-300 hover:bg-surface-200/60 dark:hover:bg-surface-800/50'">
                    <span
                        class="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-primary-500 transition-opacity duration-150"
                        :class="activeKey === item.key ? 'opacity-100' : 'opacity-0'" />
                    <component :is="item.icon" class="w-4 h-4 shrink-0"
                        :class="activeKey === item.key ? 'text-primary-500' : 'text-surface-400 dark:text-surface-500 group-hover:text-surface-600 dark:group-hover:text-surface-300'" />
                    <span class="text-[13px] font-medium truncate">{{ item.label }}</span>
                </button>
            </template>
        </div>
    </nav>
</template>
