<script setup lang="ts">
import { InfoboxListItem } from '../../models/GameData';
import AutocompleteField from '../AutocompleteField.vue';
import NotesButton from '../NotesButton.vue';
import InputText from 'primevue/inputtext';

const model = defineModel<InfoboxListItem[]>({ default: () => [] });

const updateList = (names: string[]) => {
  const existing = model.value;
  const newList = names.map(name => {
    const found = existing.find(item => item.name === name);
    return found ? { ...found } : { name };
  });
  model.value = newList;
};

const updateParam = (index: number, param: keyof InfoboxListItem, value: any) => {
  const newList = [...model.value];
  newList[index] = { ...newList[index], [param]: value };
  model.value = newList;
};
</script>

<template>
  <div class="flex flex-col gap-2">
    <AutocompleteField :modelValue="model.map(e => e.name)" @update:modelValue="updateList" data-source="engines"
      placeholder="Search engines..." />
    <div v-if="model.length > 0" class="flex flex-col gap-2 mt-2">
      <div v-for="(eng, index) in model" :key="eng.name"
        class="p-3 border border-surface-200 dark:border-surface-700 rounded bg-surface-50 dark:bg-surface-800/50 flex flex-col gap-3">
        <div class="flex items-center justify-between gap-2">
          <div class="text-xs font-bold">{{ eng.name }}</div>
          <div class="flex items-center gap-1">
            <NotesButton :modelValue="eng.note" @update:modelValue="v => updateParam(index, 'note', v)" type="note"
              class="w-7 h-7" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div class="flex flex-col gap-1">
            <span class="text-[10px] uppercase font-bold text-surface-500">Display Name</span>
            <InputText :modelValue="eng.displayName || ''"
              @update:modelValue="v => updateParam(index, 'displayName', v)" placeholder="e.g. Unity 2017"
              class="text-xs p-1" />
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-[10px] uppercase font-bold text-surface-500">Build/Version</span>
            <InputText :modelValue="eng.build || ''" @update:modelValue="v => updateParam(index, 'build', v)"
              placeholder="e.g. 2017.4.19f1" class="text-xs p-1" />
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[10px] uppercase font-bold text-surface-500">Used For</span>
          <InputText :modelValue="eng.extra || ''" @update:modelValue="v => updateParam(index, 'extra', v)"
            placeholder="e.g. Original release" class="text-xs p-1" />
        </div>
      </div>
    </div>
  </div>
</template>
