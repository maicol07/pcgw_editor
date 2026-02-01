<script setup lang="ts">
import { GameMiddleware, MiddlewareRow } from '../models/GameData';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Panel from 'primevue/panel';

const props = defineProps<{
  middleware: GameMiddleware;
}>();

const middlewareTypes = [
  { key: 'physics', label: 'Physics' },
  { key: 'audio', label: 'Audio' },
  { key: 'interface', label: 'Interface' },
  { key: 'input', label: 'Input' },
  { key: 'cutscenes', label: 'Cutscenes' },
  { key: 'multiplayer', label: 'Multiplayer' },
  { key: 'anticheat', label: 'Anticheat' },
] as const;

const addRow = (type: keyof GameMiddleware) => {
  props.middleware[type].push({
    name: '',
    notes: ''
  });
};

const removeRow = (type: keyof GameMiddleware, index: number) => {
  props.middleware[type].splice(index, 1);
};
</script>

<template>
  <div class="flex flex-col gap-6">
    <Panel v-for="type in middlewareTypes" :key="type.key" :header="type.label" toggleable collapsed>
      <div v-if="middleware[type.key].length === 0" class="text-sm text-surface-500 italic mb-4">
        No {{ type.label.toLowerCase() }} middleware added.
      </div>
      
      <div v-for="(row, index) in middleware[type.key]" :key="index" class="p-4 mb-4 border rounded border-surface-200 dark:border-surface-700 flex flex-col gap-4">
        <div class="flex justify-between items-center">
             <div class="font-bold text-sm">#{{ index + 1 }}</div>
             <Button icon="pi pi-trash" severity="danger" text @click="removeRow(type.key, index)" size="small" />
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
                <label class="text-sm">Name</label>
                <InputText v-model="row.name" placeholder="Name of middleware..." />
            </div>
            
            <div class="flex flex-col gap-2">
                 <label class="text-sm">Notes</label>
                 <InputText v-model="row.notes" placeholder="Optional notes..." />
            </div>
        </div>
      </div>
      
      <Button label="Add Middleware" icon="pi pi-plus" size="small" @click="addRow(type.key)" />
    </Panel>
  </div>
</template>
