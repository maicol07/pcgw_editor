<template>
  <div class="flex flex-col gap-4">
    <div v-for="(issue, index) in model" :key="index" class="p-4 border border-surface-200 dark:border-surface-700 rounded-lg bg-surface-50 dark:bg-surface-900/50">
      <div class="flex justify-between items-start mb-2">
        <h4 class="text-sm font-bold">Issue #{{ index + 1 }}</h4>
        <Button icon="pi pi-trash" severity="danger" text size="small" @click="removeIssue(index)" />
      </div>

      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-bold text-surface-500">Description</label>
          <InputText v-model="issue.description" placeholder="Brief description of the issue" class="w-full" />
        </div>

        <div class="flex flex-col gap-1" v-if="type === 'fixed'">
          <label class="text-xs font-bold text-surface-500">Fix</label>
          <Textarea v-model="issue.fix" rows="2" placeholder="How was it fixed?" class="w-full" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
             <label class="text-xs font-bold text-surface-500">OS</label>
             <Select v-model="issue.os" :options="osOptions" optionLabel="label" optionValue="value" placeholder="All" class="w-full p-inputtext-sm">
                <template #value="slotProps">
                    <div v-if="slotProps.value" class="flex items-center gap-2">
                        <i :class="osOptions.find(o => o.value === slotProps.value)?.icon"></i>
                        <span>{{ slotProps.value }}</span>
                    </div>
                    <span v-else>{{ slotProps.placeholder }}</span>
                </template>
                <template #option="slotProps">
                    <div class="flex items-center gap-2">
                        <i :class="slotProps.option.icon"></i>
                        <span>{{ slotProps.option.label }}</span>
                    </div>
                </template>
             </Select>
          </div>
          <div class="flex flex-col gap-1">
             <label class="text-xs font-bold text-surface-500">Reference</label>
             <InputText v-model="issue.ref" placeholder="<ref>...</ref>" class="w-full" />
          </div>
        </div>
      </div>
    </div>

    <Button label="Add Issue" icon="pi pi-plus" outlined size="small" @click="addIssue" />
  </div>
</template>

<script setup lang="ts">
import { Issue } from '../models/GameData';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Select from 'primevue/select';

const props = defineProps<{
  type: 'unresolved' | 'fixed';
}>();

const model = defineModel<Issue[]>({ required: true });

const osOptions = [
    { label: 'All', value: 'All', icon: 'pi pi-globe' },
    { label: 'Windows', value: 'Windows', icon: 'pi pi-microsoft' },
    { label: 'Mac', value: 'Mac', icon: 'pi pi-apple' },
    { label: 'Linux', value: 'Linux', icon: 'pi pi-linux' }
];

function addIssue() {
  model.value.push({
    description: '',
    fix: '',
    ref: '',
    os: 'All'
  });
}

function removeIssue(index: number) {
  model.value.splice(index, 1);
}
</script>
