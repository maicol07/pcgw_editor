<script setup lang="ts">
import { computed } from 'vue';
import { useUiStore } from '../../stores/ui';
import { ChevronDown, Eye, EyeOff } from 'lucide-vue-next';

const uiStore = useUiStore();

const props = withDefaults(defineProps<{
    sectionKey?: string;
    collapsible?: boolean;
    hidable?: boolean;
}>(), {
    collapsible: true,
    hidable: true,
});

const emit = defineEmits<{
    (e: 'toggle-collapse'): void;
    (e: 'toggle-hide'): void;
}>();

const isCollapsed = computed(() => {
    if (props.sectionKey) {
        return uiStore.isSectionCollapsed(props.sectionKey);
    }
    return false;
});

const isHidden = computed(() => {
    if (props.sectionKey) {
        return uiStore.isSectionHidden(props.sectionKey);
    }
    return false;
});

const toggleCollapse = () => {
    if (props.sectionKey) {
        uiStore.toggleSectionCollapse(props.sectionKey);
    }
    emit('toggle-collapse');
};

const toggleHide = () => {
    if (props.sectionKey) {
        uiStore.toggleSectionHide(props.sectionKey);
    }
    emit('toggle-hide');
};
</script>

<template>
    <div class="section-hide-wrapper" :class="{ 'is-hidden': isHidden }">
        <section class="section-hide-inner scroll-mt-2">
            <header
                @dblclick="collapsible && toggleCollapse()"
                class="group flex items-center justify-between pb-3 mb-4 border-b border-surface-200/80 dark:border-surface-800/80 cursor-pointer select-none">
                <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-2.5">
                        <slot name="header"></slot>
                        <Transition name="scale-fade">
                            <span v-if="isCollapsed"
                                class="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-surface-200/80 dark:bg-surface-800/80 text-surface-500 dark:text-surface-400">
                                Collapsed
                            </span>
                        </Transition>
                    </div>
                    <p v-if="$slots.subtitle" class="text-xs text-surface-500 dark:text-surface-400">
                        <slot name="subtitle"></slot>
                    </p>
                </div>

                <!-- Controls -->
                <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                        v-if="hidable"
                        type="button"
                        @click.stop="toggleHide"
                        v-tooltip.top="isHidden ? 'Show section' : 'Hide section'"
                        :aria-label="isHidden ? 'Show section' : 'Hide section'"
                        class="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-200/60 dark:hover:bg-surface-800/60 transition-colors active:scale-95">
                        <component :is="isHidden ? EyeOff : Eye" class="w-4 h-4 transition-transform duration-200" />
                    </button>
                    <button
                        v-if="collapsible"
                        type="button"
                        @click.stop="toggleCollapse"
                        v-tooltip.top="isCollapsed ? 'Expand section' : 'Collapse section'"
                        :aria-label="isCollapsed ? 'Expand section' : 'Collapse section'"
                        class="p-1.5 rounded-lg text-surface-400 hover:text-primary-500 hover:bg-surface-200/60 dark:hover:bg-surface-800/60 transition-colors active:scale-95">
                        <ChevronDown class="w-4 h-4 transition-transform duration-300 ease-out" :class="{ '-rotate-90': isCollapsed }" />
                    </button>
                </div>
            </header>

            <div class="section-collapse-wrapper" :class="{ 'is-collapsed': isCollapsed }">
                <div class="section-collapse-inner pt-0.5 pb-1">
                    <slot></slot>
                </div>
            </div>
        </section>
    </div>
</template>


