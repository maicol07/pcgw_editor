<script setup lang="ts">
import { computed } from 'vue';
import { DLCRow } from '../models/GameData';
import { useWorkspaceStore } from '../stores/workspace';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import MultiSelect from 'primevue/multiselect';
import { X, Plus, Info, GripVertical, MonitorCheck } from 'lucide-vue-next';
import { VueDraggable } from 'vue-draggable-plus';
import { getIconSrc } from '../utils/icons';

const dragList = defineModel<DLCRow[]>({ default: () => [] });

const workspaceStore = useWorkspaceStore();

// Derive the game's platforms from availability + release dates (feature 10).
const gamePlatforms = computed<string[]>(() => {
  const data = workspaceStore.activeGameData;
  const set = new Set<string>();
  const known = osOptions.map(o => o.value.toLowerCase());
  data?.availability?.forEach((a) => {
    (a.os || '').split(',').map(s => s.trim()).filter(Boolean).forEach(p => set.add(p));
  });
  data?.infobox?.releaseDates?.forEach((rd) => {
    if (rd.platform && rd.platform.trim()) set.add(rd.platform.trim());
  });
  // Keep only recognised OS values, mapped to their canonical casing.
  return Array.from(set).filter(p => known.includes(p.toLowerCase()))
    .map(p => osOptions.find(o => o.value.toLowerCase() === p.toLowerCase())!.value);
});

function applyGameOs(index: number) {
  const newRows = [...dragList.value];
  newRows[index].os = gamePlatforms.value.join(', ');
  dragList.value = newRows;
}

// Duplicate DLC-name detection (feature 10).
const duplicateRowIds = computed(() => {
  const counts: Record<string, number> = {};
  dragList.value.forEach((row) => {
    const n = (row.name || '').trim().toLowerCase();
    if (n) counts[n] = (counts[n] || 0) + 1;
  });
  const set = new Set<number>();
  dragList.value.forEach((row) => {
    const n = (row.name || '').trim().toLowerCase();
    if (n && counts[n] > 1) set.add(getRowId(row));
  });
  return set;
});

const idMap = new WeakMap<DLCRow, number>();
let nextId = 0;
function getRowId(row: DLCRow) {
  if (!idMap.has(row)) idMap.set(row, nextId++);
  return idMap.get(row)!;
}

const osOptions = [
  { name: 'Windows', value: 'Windows' },
  { name: 'DOS', value: 'DOS' },
  { name: 'Windows 3.x', value: 'Windows 3.x' },
  { name: 'Mac OS', value: 'Mac OS' },
  { name: 'OS X', value: 'OS X' },
  { name: 'Linux', value: 'Linux' },
  { name: 'PC booter', value: 'PC booter' }
];

function addRow() {
  dragList.value = [...dragList.value, { name: '', notes: '', os: '' }];
}

function removeRow(index: number) {
  dragList.value = dragList.value.filter((_, i) => i !== index);
}

function handleOsChange(index: number, selectedValues: string[]) {
  const newRows = [...dragList.value];
  newRows[index].os = selectedValues.join(', ');
  dragList.value = newRows;
}

function getOsArray(osString: string): string[] {
  return osString ? osString.split(',').map(s => s.trim()) : [];
}

</script>

<template>
  <div class="flex flex-col gap-4">
    <VueDraggable v-model="dragList" :animation="150" handle=".drag-handle" class="flex flex-col gap-4">
      <div v-for="(row, index) in dragList" :key="getRowId(row)"
        class="@container rounded-lg border bg-surface-0 dark:bg-surface-900/50 overflow-hidden flex flex-col transition-all group"
        :class="duplicateRowIds.has(getRowId(row))
          ? 'border-red-400 dark:border-red-500'
          : 'border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700'">

        <!-- Header: drag · name · delete -->
        <div class="flex items-center gap-2 px-2.5 py-2 bg-surface-50 dark:bg-surface-800/60 border-b border-surface-200 dark:border-surface-700">
          <button type="button"
            class="drag-handle cursor-grab active:cursor-grabbing text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 shrink-0 p-1 -ml-1 rounded transition-colors"
            aria-label="Drag to reorder">
            <GripVertical class="w-4 h-4" />
          </button>
          <InputText v-model="row.name" class="flex-1 min-w-0 !text-sm h-9!" aria-label="DLC/Expansion name"
            placeholder="DLC/Expansion name, e.g. Return to Na Pali"
            :class="{ '!border-red-400': duplicateRowIds.has(getRowId(row)) }" />
          <Button text severity="danger" size="small" @click="removeRow(index)" aria-label="Remove DLC"
            class="shrink-0 !p-2 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-md">
            <template #icon>
              <X class="w-4 h-4 text-red-500" />
            </template>
          </Button>
        </div>

        <p v-if="duplicateRowIds.has(getRowId(row))" class="text-xs text-red-500 px-3 pt-2">Duplicate DLC name.</p>

        <!-- Body: OS · notes -->
        <div class="p-3 grid grid-cols-1 @2xl:grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between gap-2">
              <label class="text-xs font-bold uppercase text-surface-500 tracking-wider">Operating Systems</label>
              <Button v-if="gamePlatforms.length" label="OS same as game" severity="secondary" text size="small"
                class="text-2xs h-6 !py-0" @click="applyGameOs(index)"
                v-tooltip.top="`Prefill: ${gamePlatforms.join(', ')}`">
                <template #icon><MonitorCheck class="w-3.5 h-3.5" /></template>
              </Button>
            </div>
            <MultiSelect :modelValue="getOsArray(row.os)" @update:modelValue="(val) => handleOsChange(index, val)"
              :options="osOptions" optionLabel="name" optionValue="value" placeholder="Select OS" :maxSelectedLabels="3"
              class="w-full text-sm">
              <template #value="slotProps">
                <div class="flex items-center gap-1 flex-nowrap overflow-hidden w-full"
                  v-if="slotProps.value && slotProps.value.length">
                  <div v-for="option in slotProps.value" :key="option"
                    class="flex items-center bg-surface-100 dark:bg-surface-700 rounded px-1.5 py-0.5 gap-1 shrink-0">
                    <img v-if="getIconSrc(option, 'os')" :src="getIconSrc(option, 'os')" :alt="option" class="w-3.5 h-3.5" />
                    <span class="text-xs">{{ option }}</span>
                  </div>
                </div>
                <span v-else class="text-surface-400 text-sm">{{ slotProps.placeholder }}</span>
              </template>
              <template #option="slotProps">
                <div class="flex items-center">
                  <img v-if="getIconSrc(slotProps.option.value, 'os')" :src="getIconSrc(slotProps.option.value, 'os')" :alt="slotProps.option.name"
                    class="w-4 h-4 mr-2" />
                  <span class="text-sm">{{ slotProps.option.name }}</span>
                </div>
              </template>
            </MultiSelect>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold uppercase text-surface-500 tracking-wider">Notes</label>
            <InputText v-model="row.notes" class="w-full text-sm" placeholder="e.g. Included with Unreal Gold." />
          </div>
        </div>
      </div>
    </VueDraggable>

    <Button label="Add DLC/Expansion" severity="secondary" outlined class="w-full border-dashed" @click="addRow">
      <template #icon>
        <Plus class="w-4 h-4" />
      </template>
    </Button>

    <div
      class="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800 flex gap-3 text-xs text-blue-700 dark:text-blue-300">
      <Info class="w-4 h-4 mt-0.5" />
      <div>
        <p class="font-bold mb-1">Naming Conventions:</p>
        <ul class="list-disc pl-4 flex flex-col gap-1">
          <li>Retail expansions should use the full name (e.g. Unreal Mission Pack 1: Return to Na Pali).</li>
          <li>Digital DLC should only use the sub-name (e.g. "Revolution" instead of "Call of Duty: Black Ops II -
            Revolution").</li>
        </ul>
      </div>
    </div>
  </div>
</template>
