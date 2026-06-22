<script setup lang="ts">
import { ref } from 'vue';
import Textarea from 'primevue/textarea';
import { Download, Info, ChevronDown } from 'lucide-vue-next';

defineProps<{
  modelValue: string;
}>();

const emit = defineEmits(['update:modelValue']);

const examplesOpen = ref(false);

const EXAMPLE_ENTRIES = `* [https://example.com/patch Official Patch 1.05] - fixes crashes and adds widescreen support.
* {{ii|Skip Intro Videos}} - delete or rename the intro video files in <code>\\Movies</code> to skip startup logos.
* [https://www.nexusmods.com/ Community Bugfix Mod] - resolves common stability issues left unpatched.`;
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-2">
      <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 border-b border-surface-200 dark:border-surface-700 pb-2 flex items-center gap-2">
        <Download class="w-5 h-5 text-primary" />
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

      <div class="rounded-md border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50">
        <button type="button" @click="examplesOpen = !examplesOpen"
          class="w-full flex items-center gap-2 p-2 text-xs font-medium text-surface-600 dark:text-surface-300 text-left">
          <Info class="w-4 h-4 shrink-0" />
          <span class="flex-1">Show example entries</span>
          <ChevronDown class="w-4 h-4 shrink-0 transition-transform" :class="{ 'rotate-180': examplesOpen }" />
        </button>
        <div v-if="examplesOpen" class="px-3 pb-3 flex flex-col gap-2">
          <pre class="whitespace-pre-wrap font-mono text-xs text-surface-600 dark:text-surface-300 bg-surface-0 dark:bg-surface-800/50 p-2 rounded border border-surface-200 dark:border-surface-700">{{ EXAMPLE_ENTRIES }}</pre>
          <span class="text-[11px] text-surface-400 dark:text-surface-500">Use basic wikitext formatting (bullet points, links). Fixes for bugs or feature support should go in their respective sections instead.</span>
        </div>
      </div>
    </div>
  </div>
</template>
