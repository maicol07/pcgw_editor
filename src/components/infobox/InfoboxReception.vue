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
        { aggregator: '', score: '', id: '' }
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
        <div v-if="modelValue.length === 0" class="text-surface-500 italic text-sm p-4 border border-dashed rounded text-center">
             No reception scores added.
        </div>
        
        <div class="flex flex-col gap-3">
             <div v-for="(row, index) in modelValue" :key="index" class="p-3 border border-surface-200 dark:border-surface-700 rounded bg-surface-50/50 dark:bg-surface-800/50 relative">
                 <div class="flex gap-2 items-start mb-1">
                      <Select 
                        :modelValue="row.aggregator" 
                        @update:modelValue="v => updateRow(index, 'aggregator', v)"
                        :options="['Metacritic', 'OpenCritic', 'IGDB']" 
                        placeholder="Aggregator" 
                        class="w-36"
                        size="small"
                      />
                      <InputText 
                        :modelValue="row.id" 
                        @update:modelValue="v => updateRow(index, 'id', v || '')"
                        placeholder="ID/Slug" 
                        class="flex-1"
                        size="small"
                      />
                      <InputText 
                        :modelValue="row.score" 
                        @update:modelValue="v => updateRow(index, 'score', v || '')"
                        placeholder="Score" 
                        class="w-20 font-bold text-center"
                        size="small"
                      />
                      <Button 
                        severity="danger" 
                        text 
                        rounded
                        @click="removeRow(index)"
                        size="small"
                        class="!w-8 !h-8 !p-0"
                      >
                        <template #icon><Trash2 class="w-4 h-4" /></template>
                      </Button>
                 </div>
                 <p class="text-[10px] text-surface-400 pl-1">
                  Aggregator name, ID from URL, and current score (e.g. 85 or 85/100).
                </p>
             </div>
        </div>

        <Button 
            label="Add Reception Row" 
            severity="secondary" 
            size="small" 
            @click="addRow"
        >
            <template #icon><Plus class="w-4 h-4" /></template>
        </Button>
    </div>
</template>
