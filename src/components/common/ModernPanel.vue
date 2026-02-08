<script setup lang="ts">
import Panel from 'primevue/panel';
import { ChevronDown } from 'lucide-vue-next';

// Use defineModel for seamless v-model support (Vue 3.4+)
const collapsed = defineModel<boolean>('collapsed');
</script>

<template>
    <Panel toggleable v-model:collapsed="collapsed" class="panel-modern shadow-soft hover-lift">
        <template #header>
            <slot name="header"></slot>
        </template>

        <template #togglericon="{ collapsed: isCollapsed }">
            <ChevronDown
                class="w-5 h-5 text-surface-400 group-hover:text-surface-600 dark:text-surface-500 dark:group-hover:text-surface-300 transition-transform duration-200"
                :class="{ '-rotate-90': isCollapsed }" />
        </template>

        <slot></slot>
    </Panel>
</template>
