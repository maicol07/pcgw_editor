<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  text?: string;
}>();
</script>

<template>
  <div v-if="text" class="relative group inline-flex ml-1 cursor-help">
    <i class="pi pi-question-circle text-surface-400 dark:text-surface-500 hover:text-primary-500 dark:hover:text-primary-400 text-sm transition-colors"></i>
    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-surface-900 dark:bg-surface-0 text-surface-0 dark:text-surface-900 text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
      {{ text }}
      <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-surface-900 dark:border-t-surface-0"></div>
    </div>
  </div>
</template>
