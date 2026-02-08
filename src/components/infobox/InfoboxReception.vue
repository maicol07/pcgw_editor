<script setup lang="ts">
import { GameInfobox } from '../../models/GameData';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { Trash2, Plus } from 'lucide-vue-next';

const props = defineProps<{
  modelValue: GameInfobox['reception'];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: GameInfobox['reception']): void;
}>();

const addRow = () => {
  emit('update:modelValue', [
    ...props.modelValue,
    { aggregator: '' as any, score: '', id: '' }
  ]);
};

const removeRow = (index: number) => {
  const newVal = [...props.modelValue];
  newVal.splice(index, 1);
  emit('update:modelValue', newVal);
};

const updateRow = (index: number, field: keyof GameInfobox['reception'][0], value: string) => {
  const newVal = [...props.modelValue];
  newVal[index] = { ...newVal[index], [field]: value };
  emit('update:modelValue', newVal);
};
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="modelValue.length === 0"
      class="text-surface-500 italic text-sm p-8 border border-dashed border-surface-300 dark:border-surface-700 rounded-lg text-center bg-surface-50 dark:bg-surface-800/20">
      No reception scores added.
    </div>

    <div v-else class="flex flex-col border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
      <!-- Header -->
      <div
        class="grid grid-cols-12 gap-4 bg-surface-50 dark:bg-surface-800 p-3 text-xs font-semibold text-surface-500 uppercase tracking-wider border-b border-surface-200 dark:border-surface-700">
        <div class="col-span-4">Aggregator</div>
        <div class="col-span-6">ID / Slug</div>
        <div class="col-span-2 text-center">Score</div>
      </div>

      <!-- Rows -->
      <div v-for="(row, index) in modelValue" :key="index"
        class="grid grid-cols-12 gap-4 p-3 items-start border-b last:border-0 border-surface-100 dark:border-surface-700/50 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors group relative">
        <div class="col-span-4">
          <Select :modelValue="row.aggregator" @update:modelValue="v => updateRow(index, 'aggregator', v)"
            :options="['Metacritic', 'OpenCritic', 'IGDB']" placeholder="Select..." class="w-full" size="small" />
        </div>
        <div class="col-span-6">
          <InputText :modelValue="row.id" @update:modelValue="v => updateRow(index, 'id', v || '')"
            placeholder="e.g. game-title" class="w-full" size="small" />
        </div>
        <div class="col-span-2 relative">
          <InputText :modelValue="row.score" @update:modelValue="v => updateRow(index, 'score', v || '')"
            class="w-full font-bold text-center px-1!" size="small" />

          <!-- Remove Button (Absolute positioning for cleaner look) -->
          <Button severity="danger" text rounded @click="removeRow(index)" size="small"
            class="w-6! h-6! p-0! absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm bg-surface-0 dark:bg-surface-800"
            v-tooltip.top="'Remove row'">
            <template #icon>
              <Trash2 class="w-3 h-3" />
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
