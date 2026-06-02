<script setup lang="ts">
import { DLCRow } from '../models/GameData';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import MultiSelect from 'primevue/multiselect';
import { X, Plus, Info, GripVertical } from 'lucide-vue-next';
import { VueDraggable } from 'vue-draggable-plus';
import { getIconSrc } from '../utils/icons';

const dragList = defineModel<DLCRow[]>({ default: () => [] });

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
        class="p-4 border border-surface-200 dark:border-surface-700 rounded-lg bg-surface-0 dark:bg-surface-900/50 flex flex-col gap-4 relative group transition-all hover:border-primary-300 dark:hover:border-primary-700">

        <div class="absolute -left-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Button class="drag-handle cursor-grab active:cursor-grabbing" severity="secondary" rounded aria-label="Drag"
            size="small">
            <template #icon>
              <GripVertical class="w-3 h-3 text-surface-500" />
            </template>
          </Button>
        </div>

        <div class="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Button severity="danger" rounded aria-label="Remove" size="small" @click="removeRow(index)">
            <template #icon>
              <X class="w-3 h-3" />
            </template>
          </Button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold uppercase text-surface-500 tracking-wider">DLC/Expansion Name</label>
            <InputText v-model="row.name" class="w-full text-sm" placeholder="e.g. Return to Na Pali" />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold uppercase text-surface-500 tracking-wider">Operating Systems</label>
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
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-bold uppercase text-surface-500 tracking-wider">Notes</label>
          <InputText v-model="row.notes" class="w-full text-sm" placeholder="e.g. Included with Unreal Gold." />
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
