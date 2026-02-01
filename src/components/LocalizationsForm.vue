<script setup lang="ts">
import { LocalizationRow } from '../models/GameData';
import RatingSelect from './RatingSelect.vue';
import Panel from 'primevue/panel';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Checkbox from 'primevue/checkbox';
import Select from 'primevue/select';

const props = defineProps<{
  localizations: LocalizationRow[];
}>();

const addRow = () => {
  props.localizations.push({
    language: '',
    interface: false,
    audio: 'unknown',
    subtitles: 'unknown',
    notes: '',
    fan: false,
    ref: ''
  });
};

const removeRow = (index: number) => {
  props.localizations.splice(index, 1);
};

// Common languages map to flags
const commonLanguages = [
    { label: 'English', value: 'English', flag: '🇬🇧' },
    { label: 'French', value: 'French', flag: '🇫🇷' },
    { label: 'Italian', value: 'Italian', flag: '🇮🇹' },
    { label: 'German', value: 'German', flag: '🇩🇪' },
    { label: 'Spanish', value: 'Spanish', flag: '🇪🇸' },
    { label: 'Japanese', value: 'Japanese', flag: '🇯🇵' },
    { label: 'Korean', value: 'Korean', flag: '🇰🇷' },
    { label: 'Portuguese', value: 'Portuguese', flag: '🇵🇹' },
    { label: 'Russian', value: 'Russian', flag: '🇷🇺' },
    { label: 'Chinese (Simplified)', value: 'Chinese (Simplified)', flag: '🇨🇳' },
    { label: 'Chinese (Traditional)', value: 'Chinese (Traditional)', flag: '🇹🇼' },
    { label: 'Polish', value: 'Polish', flag: '🇵🇱' },
    { label: 'Czech', value: 'Czech', flag: '🇨🇿' },
    { label: 'Turkish', value: 'Turkish', flag: '🇹🇷' },
    { label: 'Ukrainian', value: 'Ukrainian', flag: '🇺🇦' },
];

const getFlag = (lang: string) => {
    const found = commonLanguages.find(l => l.value === lang);
    return found ? found.flag : '🏳️';
};
</script>

<template>
  <div class="flex flex-col gap-4">
    <Panel header="Localizations" toggleable>
      <div v-for="(row, index) in localizations" :key="index" class="p-4 mb-4 border rounded border-surface-200 dark:border-surface-700 flex flex-col gap-4">
        <div class="flex justify-between items-center">
             <div class="font-bold">Language #{{ index + 1 }}</div>
             <Button icon="pi pi-trash" severity="danger" text @click="removeRow(index)" />
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-start">
            <!-- Language -->
            <div class="lg:col-span-4 flex flex-col gap-1">
                <label class="text-xs font-bold text-surface-500">Language</label>
                <div class="flex gap-2">
                    <Select 
                        v-model="row.language" 
                        :options="commonLanguages" 
                        optionLabel="label" 
                        optionValue="value"
                        editable 
                        placeholder="Select or type..." 
                        class="w-full"
                    >
                        <template #value="slotProps">
                            <div class="flex items-center gap-2" v-if="slotProps.value">
                                <span>{{ getFlag(slotProps.value) }}</span>
                                <span>{{ slotProps.value }}</span>
                            </div>
                            <span v-else>{{ slotProps.placeholder }}</span>
                        </template>
                        <template #option="slotProps">
                            <div class="flex items-center gap-2">
                                <span>{{ slotProps.option.flag }}</span>
                                <span>{{ slotProps.option.label }}</span>
                            </div>
                        </template>
                    </Select>
                </div>
            </div>
            
            <!-- Interface -->
            <div class="lg:col-span-1 flex flex-col gap-1 items-center">
                <label class="text-xs font-bold text-surface-500">UI</label>
                <div class="h-10 flex items-center justify-center border border-surface-300 dark:border-surface-600 rounded bg-surface-50 dark:bg-surface-900 w-full">
                    <Checkbox v-model="row.interface" binary />
                </div>
            </div>

            <!-- Audio -->
            <div class="lg:col-span-2 flex flex-col gap-1">
                 <label class="text-xs font-bold text-surface-500">Audio</label>
                 <RatingSelect v-model="row.audio" />
            </div>

            <!-- Subtitles -->
            <div class="lg:col-span-2 flex flex-col gap-1">
                 <label class="text-xs font-bold text-surface-500">Subtitles</label>
                 <RatingSelect v-model="row.subtitles" />
            </div>
            
             <!-- Notes & Fan -->
            <div class="lg:col-span-3 flex gap-2 items-end">
                 <div class="flex-1 flex flex-col gap-1">
                     <label class="text-xs font-bold text-surface-500">Notes</label>
                     <InputText v-model="row.notes" class="w-full" placeholder="Notes..." />
                 </div>
                 <div class="flex flex-col gap-1 items-center pb-2" title="Fan Translation">
                      <label class="text-[10px] font-bold text-surface-400">FAN</label>
                      <Checkbox v-model="row.fan" binary />
                 </div>
            </div>
        </div>
      </div>
      
      <Button label="Add Language" icon="pi pi-plus" @click="addRow" />
    </Panel>
  </div>
</template>
