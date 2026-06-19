<script setup lang="ts">
import { sectionGroups } from '../../config/sections';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-vue-next';

defineProps<{
    activeKey: string;
    // Visibility map from search filter; missing key => visible.
    panelVisibility?: Record<string, boolean>;
}>();

const collapsed = defineModel<boolean>('collapsed', { default: false });

const emit = defineEmits<{ (e: 'navigate', key: string): void }>();

const isVisible = (vis: Record<string, boolean> | undefined, key: string) =>
    !vis || vis[key] !== false;
</script>

<template>
    <nav
        class="hidden md:flex flex-col shrink-0 overflow-y-auto custom-scrollbar border-r border-surface-200/70 dark:border-surface-800/70 bg-surface-50/60 dark:bg-surface-950/40 transition-[width] duration-200"
        :class="collapsed ? 'w-14' : 'w-52'">
        <!-- Header / toggle -->
        <div class="flex items-center sticky top-0 z-10 bg-surface-50/80 dark:bg-surface-950/60 backdrop-blur-sm px-2 py-2.5 border-b border-surface-200/60 dark:border-surface-800/60"
            :class="collapsed ? 'justify-center' : 'justify-between'">
            <span v-if="!collapsed"
                class="pl-1.5 text-[10px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 select-none">
                Sections
            </span>
            <button type="button" @click="collapsed = !collapsed"
                :aria-label="collapsed ? 'Expand sections' : 'Collapse sections'"
                v-tooltip.right="collapsed ? 'Expand sections' : 'Collapse sections'"
                class="flex items-center justify-center w-7 h-7 rounded-lg text-surface-400 hover:text-primary-500 hover:bg-surface-200/60 dark:hover:bg-surface-800/60 transition-colors">
                <component :is="collapsed ? PanelLeftOpen : PanelLeftClose" class="w-4 h-4" />
            </button>
        </div>

        <div class="flex flex-col gap-5 px-2.5 py-4">
            <div v-for="group in sectionGroups" :key="group.label" class="flex flex-col gap-1">
                <div v-if="!collapsed"
                    class="px-2.5 mb-0.5 text-[10px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 select-none">
                    {{ group.label }}
                </div>
                <template v-for="item in group.items" :key="item.key">
                    <button v-if="isVisible(panelVisibility, item.key)" type="button"
                        @click="emit('navigate', item.key)"
                        v-tooltip.right="collapsed ? item.label : undefined"
                        class="group relative flex items-center rounded-lg py-1.5 text-left transition-colors duration-150"
                        :class="[
                            collapsed ? 'justify-center px-0' : 'gap-2.5 pl-3 pr-2',
                            activeKey === item.key
                                ? 'bg-primary-500/10 text-primary-600 dark:text-primary-300'
                                : 'text-surface-600 dark:text-surface-300 hover:bg-surface-200/60 dark:hover:bg-surface-800/50'
                        ]">
                        <span
                            class="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-primary-500 transition-opacity duration-150"
                            :class="activeKey === item.key ? 'opacity-100' : 'opacity-0'" />
                        <component :is="item.icon" class="w-4 h-4 shrink-0"
                            :class="activeKey === item.key ? 'text-primary-500' : 'text-surface-400 dark:text-surface-500 group-hover:text-surface-600 dark:group-hover:text-surface-300'" />
                        <span v-if="!collapsed" class="text-[13px] font-medium truncate">{{ item.label }}</span>
                    </button>
                </template>
            </div>
        </div>
    </nav>
</template>
