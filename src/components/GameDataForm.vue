<script setup lang="ts">
import { GameDataConfig } from '../models/GameData';
import Select from 'openvue/select';
import GameDataPathForm from './GameDataPathForm.vue';
import { Settings2 } from '@lucide/vue';

import { computed, inject, reactive, watch } from 'vue';

const props = defineProps<{
  modelValue: GameDataConfig;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: GameDataConfig): void;
}>();

// This component used to write straight into modelValue.* from the template. It happened to work
// because the object is reactive, but it bypasses the parent's update:modelValue contract — so a
// parent holding an immutable copy (DynamicSection rebuilds state with updateDeep) could silently
// miss the change. Each field now round-trips through the emit.
const field = <K extends keyof GameDataConfig>(key: K) => computed({
  get: () => props.modelValue?.[key],
  set: (value) => emit('update:modelValue', { ...props.modelValue, [key]: value }),
});

const configFiles = field('configFiles');
const saveData = field('saveData');
const xdg = field('xdg');
const xdgOptions = [
  { label: 'Supported', value: true },
  { label: 'Not Supported', value: false },
  { label: 'N/A', value: null }
];

// Panel logic
const sectionState = reactive({
  paths: true,
});

const uiBus = inject<{ expandAllCount: number, collapseAllCount: number }>('uiBus');

if (uiBus) {
  watch(() => uiBus.expandAllCount, () => {
    sectionState.paths = false;
  });
  watch(() => uiBus.collapseAllCount, () => {
    sectionState.paths = true;
  });
}
// Panel logic and sectionState usage for paths removed

// uiBus logic removed as it was tied to sectionState.paths

</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Game Data Paths -->
    <div class="flex flex-col gap-8">
      <GameDataPathForm v-model:rows="configFiles" title="Configuration Locations" icon="folder"
        description="Where the game stores its configuration files (ini, xml, cfg, etc.)" />

      <div
        class="flex items-center gap-4 p-4 border-y border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/20">
        <div class="p-2 bg-surface-100 dark:bg-surface-800 rounded-full text-surface-500 dark:text-surface-400">
          <Settings2 class="w-5 h-5" />
        </div>
        <div class="flex-1">
          <label class="block text-sm font-semibold text-surface-700 dark:text-surface-200">
            XDG Base Directory Support
          </label>
          <p class="text-xs text-surface-500 dark:text-surface-400">Does the game respect XDG standards on Linux?</p>
        </div>
        <Select v-model="xdg" :options="xdgOptions" optionLabel="label" optionValue="value"
          placeholder="Select..." class="w-48" />
      </div>

      <GameDataPathForm v-model:rows="saveData" title="Save Game Locations" icon="save"
        description="Where the game stores its save files." />
    </div>


  </div>
</template>
