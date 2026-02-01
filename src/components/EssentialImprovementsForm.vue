<script setup lang="ts">
import Textarea from 'primevue/textarea';

defineProps<{
  modelValue: string;
}>();

const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-2">
      <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 border-b border-surface-200 dark:border-surface-700 pb-2 flex items-center gap-2">
        <i class="pi pi-download text-primary" />
        Essential improvements
      </h3>
      <p class="text-sm text-surface-500 dark:text-surface-400">
        Required or highly recommended downloads: patches, intro skips, major mods, and game-specific utilities.
      </p>
    </div>

    <div class="flex flex-col gap-2">
      <Textarea
        :modelValue="modelValue"
        @update:modelValue="emit('update:modelValue', $event)"
        rows="8"
        autoResize
        placeholder="* Patches&#10;* Intro skip methods&#10;* Major community mods&#10;* Game-specific utilities"
        class="w-full font-mono text-sm"
      />
      <div class="flex items-start gap-2 text-[11px] text-surface-400 dark:text-surface-500 bg-surface-50 dark:bg-surface-900/50 p-2 rounded-md">
        <i class="pi pi-info-circle mt-0.5" />
        <span>Use basic wikitext formatting (bullet points, links). Fixes for bugs or feature support should go in their respective sections instead.</span>
      </div>
    </div>
  </div>
</template>
