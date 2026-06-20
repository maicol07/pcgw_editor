<script setup lang="ts">
import Button from 'primevue/button';
import type { RatingValue } from '../../utils/ratings';

const emit = defineEmits<{
  (e: 'set', value: RatingValue): void;
}>();

const actions: { label: string; value: RatingValue }[] = [
  { label: 'True', value: 'true' },
  { label: 'False', value: 'false' },
  { label: 'N/A', value: 'n/a' },
  { label: 'Unknown', value: 'unknown' },
];
</script>

<template>
  <div class="inline-flex items-center gap-1">
    <span class="text-xs text-surface-500 dark:text-surface-400 mr-1">Set all:</span>
    <Button v-for="action in actions" :key="action.value" :label="action.label" severity="secondary" text size="small"
      class="!py-0.5 !px-1.5 !text-xs" @click="emit('set', action.value)" />
  </div>
</template>
