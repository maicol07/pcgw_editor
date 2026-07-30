<script setup lang="ts">
import { sectionGroups, sectionKeysInOrder } from '../../config/sections';
import { useUiStore } from '../../stores/ui';
import { PanelLeftClose, PanelLeftOpen, ChevronDown, Eye, EyeOff, FoldVertical, UnfoldVertical } from 'lucide-vue-next';

defineProps<{
    activeKey: string;
    // Visibility map from search filter; missing key => visible.
    panelVisibility?: Record<string, boolean>;
}>();

const uiStore = useUiStore();
const collapsed = defineModel<boolean>('collapsed', { default: false });

const emit = defineEmits<{ (e: 'navigate', key: string): void }>();

const isVisible = (vis: Record<string, boolean> | undefined, key: string) =>
    !vis || vis[key] !== false;

const handleItemClick = (key: string) => {
    // If section was collapsed, automatically expand it on navigation so user can edit it
    if (uiStore.isSectionCollapsed(key)) {
        uiStore.toggleSectionCollapse(key);
    }
    emit('navigate', key);
};
</script>

<template>
    <nav
        class="hidden md:flex flex-col shrink-0 overflow-y-auto custom-scrollbar border-r border-surface-200/70 dark:border-surface-800/70 bg-surface-50/60 dark:bg-surface-950/40 transition-[width] duration-200"
        :class="collapsed ? 'w-14' : 'w-56'">
        <!-- Header / toggle -->
        <div class="flex items-center sticky top-0 z-10 bg-surface-50/80 dark:bg-surface-950/60 backdrop-blur-sm px-2 py-2.5 border-b border-surface-200/60 dark:border-surface-800/60"
            :class="collapsed ? 'justify-center' : 'justify-between'">
            <div v-if="!collapsed" class="flex items-center gap-1.5 pl-1.5">
                <span class="text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 select-none">
                    Sections
                </span>
            </div>

            <div class="flex items-center gap-1">
                <template v-if="!collapsed">
                    <button type="button"
                        @click="uiStore.collapseAllSections(sectionKeysInOrder)"
                        v-tooltip.top="'Collapse all sections'"
                        aria-label="Collapse all sections"
                        class="flex items-center justify-center w-6 h-6 rounded-md text-surface-400 hover:text-primary-500 hover:bg-surface-200/60 dark:hover:bg-surface-800/60 transition-colors">
                        <FoldVertical class="w-3.5 h-3.5" />
                    </button>
                    <button type="button"
                        @click="uiStore.expandAllSections()"
                        v-tooltip.top="'Expand all sections'"
                        aria-label="Expand all sections"
                        class="flex items-center justify-center w-6 h-6 rounded-md text-surface-400 hover:text-primary-500 hover:bg-surface-200/60 dark:hover:bg-surface-800/60 transition-colors">
                        <UnfoldVertical class="w-3.5 h-3.5" />
                    </button>
                    <div class="h-3.5 w-[1px] bg-surface-200 dark:bg-surface-800 mx-0.5" />
                </template>

                <button type="button" @click="collapsed = !collapsed"
                    :aria-label="collapsed ? 'Expand section rail' : 'Collapse section rail'"
                    v-tooltip.right="collapsed ? 'Expand section rail' : 'Collapse section rail'"
                    class="flex items-center justify-center w-7 h-7 rounded-lg text-surface-400 hover:text-primary-500 hover:bg-surface-200/60 dark:hover:bg-surface-800/60 transition-colors">
                    <component :is="collapsed ? PanelLeftOpen : PanelLeftClose" class="w-4 h-4" />
                </button>
            </div>
        </div>

        <div class="flex flex-col gap-5 px-2 py-4">
            <div v-for="group in sectionGroups" :key="group.label" class="flex flex-col gap-1">
                <div v-if="!collapsed"
                    class="px-2.5 mb-0.5 text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 select-none">
                    {{ group.label }}
                </div>
                <template v-for="item in group.items" :key="item.key">
                    <div
                        class="group relative flex items-center justify-between rounded-lg py-1 text-left transition-colors duration-150"
                        :class="[
                            collapsed ? 'justify-center px-0' : 'pl-2.5 pr-1.5',
                            !isVisible(panelVisibility, item.key) || uiStore.isSectionHidden(item.key) ? 'opacity-50' : '',
                            activeKey === item.key
                                ? 'bg-primary-500/10 text-primary-600 dark:text-primary-300'
                                : 'text-surface-600 dark:text-surface-300 hover:bg-surface-200/60 dark:hover:bg-surface-800/50'
                        ]">
                        <button type="button"
                            @click="handleItemClick(item.key)"
                            v-tooltip.right="collapsed ? item.label : (!isVisible(panelVisibility, item.key) ? 'Hidden by current search filter' : undefined)"
                            class="flex-1 flex items-center gap-2.5 min-w-0 text-left">
                            <span
                                class="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-primary-500 transition-opacity duration-150"
                                :class="activeKey === item.key ? 'opacity-100' : 'opacity-0'" />
                            <component :is="item.icon" class="w-4 h-4 shrink-0"
                                :class="activeKey === item.key ? 'text-primary-500' : 'text-surface-400 dark:text-surface-500 group-hover:text-surface-600 dark:group-hover:text-surface-300'" />
                            <span v-if="!collapsed" class="text-[13px] font-medium truncate"
                                :class="{ 'line-through': uiStore.isSectionHidden(item.key) }">
                                {{ item.label }}
                            </span>
                        </button>

                        <!-- Item-level action buttons (when rail is expanded) -->
                        <div v-if="!collapsed" class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <button type="button"
                                @click.stop="uiStore.toggleSectionHide(item.key)"
                                v-tooltip.top="uiStore.isSectionHidden(item.key) ? 'Show section' : 'Hide section'"
                                :aria-label="uiStore.isSectionHidden(item.key) ? 'Show section' : 'Hide section'"
                                class="p-1 rounded text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-200/80 dark:hover:bg-surface-700/80 transition-colors active:scale-95">
                                <component :is="uiStore.isSectionHidden(item.key) ? EyeOff : Eye" class="w-3.5 h-3.5 transition-transform duration-150" />
                            </button>
                            <button type="button"
                                @click.stop="uiStore.toggleSectionCollapse(item.key)"
                                v-tooltip.top="uiStore.isSectionCollapsed(item.key) ? 'Expand section' : 'Collapse section'"
                                :aria-label="uiStore.isSectionCollapsed(item.key) ? 'Expand section' : 'Collapse section'"
                                class="p-1 rounded text-surface-400 hover:text-primary-500 hover:bg-surface-200/80 dark:hover:bg-surface-700/80 transition-colors active:scale-95">
                                <ChevronDown class="w-3.5 h-3.5 transition-transform duration-250 ease-out" :class="{ '-rotate-90': uiStore.isSectionCollapsed(item.key) }" />
                            </button>
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </nav>
</template>

