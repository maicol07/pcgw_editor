<script setup lang="ts">
import { computed } from 'vue';
import { GameInfobox } from '../../models/GameData';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { Trash2, Plus } from 'lucide-vue-next';

const model = defineModel<GameInfobox['reception']>({ default: () => [] });

const addRow = () => {
  model.value = [
    ...model.value,
    { aggregator: '' as any, score: '', id: '' }
  ];
};

const removeRow = (index: number) => {
  const newVal = [...model.value];
  newVal.splice(index, 1);
  model.value = newVal;
};

const updateRow = (index: number, field: keyof GameInfobox['reception'][0], value: string) => {
  const newVal = [...model.value];
  newVal[index] = { ...newVal[index], [field]: value };
  model.value = newVal;
};

// Duplicate-aggregator detection: flag rows whose aggregator appears more than once.
const duplicateAggregatorIndexes = computed(() => {
  const counts: Record<string, number> = {};
  model.value.forEach((row) => {
    const a = (row.aggregator || '').trim();
    if (a) counts[a] = (counts[a] || 0) + 1;
  });
  const set = new Set<number>();
  model.value.forEach((row, i) => {
    const a = (row.aggregator || '').trim();
    if (a && counts[a] > 1) set.add(i);
  });
  return set;
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="model.length === 0"
      class="text-surface-500 italic text-sm p-8 border border-dashed border-surface-300 dark:border-surface-700 rounded-lg text-center bg-surface-50 dark:bg-surface-800/20">
      No reception scores added.
    </div>

    <div v-else class="flex flex-col border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
      <!-- Header -->
      <div
        class="grid grid-cols-12 gap-4 bg-surface-50 dark:bg-surface-800 p-3 text-xs font-semibold text-surface-500 uppercase tracking-wider border-b border-surface-200 dark:border-surface-700">
        <div class="col-span-4">Aggregator</div>
        <div class="col-span-5">ID / Slug</div>
        <div class="col-span-2 text-center">Score</div>
        <div class="col-span-1"></div>
      </div>

      <!-- Rows -->
      <div v-for="(row, index) in model" :key="index"
        class="grid grid-cols-12 gap-4 px-3 py-2 items-center border-b last:border-0 border-surface-100 dark:border-surface-700/50 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors"
        :class="{ 'bg-red-500/5': duplicateAggregatorIndexes.has(index) }">
        <div class="col-span-4">
          <Select :modelValue="row.aggregator" @update:modelValue="v => updateRow(index, 'aggregator', v)"
            :options="['Metacritic', 'OpenCritic', 'IGDB']" placeholder="Select..." class="w-full" size="small"
            :class="{ '[&_.p-select]:!border-red-400': duplicateAggregatorIndexes.has(index) }" />
          <p v-if="duplicateAggregatorIndexes.has(index)" class="text-xs text-red-500 mt-1">
            Duplicate aggregator
          </p>
        </div>
        <div class="col-span-5">
          <InputText :modelValue="row.id" @update:modelValue="v => updateRow(index, 'id', v || '')"
            placeholder="e.g. game-title" class="w-full" size="small" />
        </div>
        <div class="col-span-2">
          <InputText :modelValue="row.score" @update:modelValue="v => updateRow(index, 'score', v || '')"
            class="w-full font-bold text-center px-1!" size="small" />
        </div>
        <div class="col-span-1 flex justify-center">
          <Button severity="danger" text rounded @click="removeRow(index)" size="small"
            class="w-8! h-8! p-0!" v-tooltip.top="'Remove row'" aria-label="Remove row">
            <template #icon>
              <Trash2 class="w-4 h-4" />
            </template>
          </Button>
        </div>
      </div>
    </div>

    <Button label="Add Reception Row" severity="secondary" outlined size="small"
      class="w-full border-dashed hover:border-solid" @click="addRow">
      <template #icon>
        <Plus class="w-4 h-4" />
      </template>
    </Button>
  </div>
</template>
