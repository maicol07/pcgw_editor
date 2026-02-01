<script setup lang="ts">
import { AvailabilityRow } from '../models/GameData';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Select from 'primevue/select';
import SelectButton from 'primevue/selectbutton';

const props = defineProps<{
  modelValue: AvailabilityRow[];
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: AvailabilityRow[]): void;
}>();

const storefrontOptions = [
    { label: 'Steam', value: 'Steam', icon: 'pi pi-desktop' },
    { label: 'GOG.com', value: 'GOG.com', icon: 'pi pi-shopping-bag' },
    { label: 'Epic Games Store', value: 'Epic Games Store', icon: 'pi pi-bolt' },
    { label: 'Amazon.com', value: 'Amazon.com', icon: 'pi pi-amazon' },
    { label: 'Amazon.co.uk', value: 'Amazon.co.uk', icon: 'pi pi-amazon' },
    { label: 'Battle.net', value: 'Battle.net', icon: 'pi pi-shield' },
    { label: 'EA app', value: 'EA app', icon: 'pi pi-play' },
    { label: 'Humble Store', value: 'Humble Store', icon: 'pi pi-gift' },
    { label: 'itch.io', value: 'itch.io', icon: 'pi pi-heart-fill' },
    { label: 'Mac App Store', value: 'MacApp', icon: 'pi pi-apple' },
    { label: 'Microsoft Store', value: 'Microsoft Store', icon: 'pi pi-microsoft' },
    { label: 'Ubisoft Store', value: 'Ubisoft Store', icon: 'pi pi-globe' },
    { label: 'Retail', value: 'Retail', icon: 'pi pi-box' },
    { label: 'Developer', value: 'Developer', icon: 'pi pi-code' },
    { label: 'Publisher', value: 'Publisher', icon: 'pi pi-building' },
];

const stateOptions = [
    { label: 'Normal', value: 'normal' },
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'Unavailable', value: 'unavailable' }
];

function addRow() {
    const newRow: AvailabilityRow = { distribution: 'Steam', id: '', drm: 'Steam', notes: '', keys: '', os: 'Windows', state: 'normal' };
    emit('update:modelValue', [...props.modelValue, newRow]);
}

function removeRow(index: number) {
    const newVal = [...props.modelValue];
    newVal.splice(index, 1);
    emit('update:modelValue', newVal);
}

function updateRow(index: number, field: keyof AvailabilityRow, val: string) {
    const newVal = [...props.modelValue];
    newVal[index] = { ...newVal[index], [field]: val };
    emit('update:modelValue', newVal);
}

const getProductIdHelp = (source: string) => {
    switch (source) {
        case 'Steam': return 'AppID (e.g. 2310)';
        case 'GOG.com': return 'Slug (e.g. system_shock_2)';
        case 'Epic Games Store': return 'Namespace/Slug (e.g. darksiders3)';
        case 'Amazon.com':
        case 'Amazon.co.uk': return 'ASIN (e.g. B0002IBEJQ)';
        case 'MacApp': return 'AppID (e.g. id468808410)';
        case 'Microsoft Store': return 'ID (e.g. 9wzdncrfhwfh)';
        default: return 'Store specific ID or full URL';
    }
};
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex justify-between items-center">
        <h3 class="text-sm font-semibold uppercase tracking-wider text-surface-500">Availability Table</h3>
        <Button label="Add Store" icon="pi pi-plus" size="small" @click="addRow" severity="primary" class="h-8" />
    </div>
    
    <div v-for="(row, index) in modelValue" :key="index" class="p-4 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 flex flex-col gap-4">
        <div class="flex justify-between items-center">
            <div class="flex items-center gap-3">
                <Select 
                    :modelValue="row.distribution" 
                    @update:modelValue="v => updateRow(index, 'distribution', v)"
                    :options="storefrontOptions" 
                    optionLabel="label" 
                    optionValue="value"
                    placeholder="Select Store"
                    class="w-48 p-inputtext-sm"
                    size="small"
                >
                    <template #value="slotProps">
                        <div v-if="slotProps.value" class="flex items-center gap-2">
                            <i :class="storefrontOptions.find(o => o.value === slotProps.value)?.icon" class="text-xs"></i>
                            <span class="text-xs">{{ storefrontOptions.find(o => o.value === slotProps.value)?.label }}</span>
                        </div>
                        <span v-else class="text-xs">Select Store</span>
                    </template>
                    <template #option="slotProps">
                        <div class="flex items-center gap-2">
                            <i :class="slotProps.option.icon" class="text-xs"></i>
                            <span class="text-xs">{{ slotProps.option.label }}</span>
                        </div>
                    </template>
                </Select>
                
                <SelectButton 
                    :modelValue="row.state || 'normal'" 
                    @update:modelValue="v => updateRow(index, 'state', v || 'normal')"
                    :options="stateOptions" 
                    optionLabel="label" 
                    optionValue="value"
                    class="scale-75 origin-left"
                />
            </div>
            <Button icon="pi pi-trash" text severity="danger" size="small" @click="removeRow(index)" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="flex flex-col gap-1">
                <label class="text-[10px] font-bold uppercase text-surface-400">Product ID</label>
                <InputText 
                    :value="row.id" 
                    @input="updateRow(index, 'id', ($event.target as HTMLInputElement).value)" 
                    :placeholder="getProductIdHelp(row.distribution)"
                    class="w-full p-inputtext-sm text-xs" 
                />
            </div>
            <div class="flex flex-col gap-1">
                <label class="text-[10px] font-bold uppercase text-surface-400">DRM Used</label>
                <InputText :value="row.drm" @input="updateRow(index, 'drm', ($event.target as HTMLInputElement).value)" placeholder="e.g. Steam, DRM-free" class="w-full p-inputtext-sm text-xs" />
            </div>
            <div class="flex flex-col gap-1">
                <label class="text-[10px] font-bold uppercase text-surface-400">Supported OS</label>
                <InputText :value="row.os" @input="updateRow(index, 'os', ($event.target as HTMLInputElement).value)" placeholder="e.g. Windows, OS X, Linux" class="w-full p-inputtext-sm text-xs" />
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
                <label class="text-[10px] font-bold uppercase text-surface-400">Extra Keys</label>
                <InputText :value="row.keys" @input="updateRow(index, 'keys', ($event.target as HTMLInputElement).value)" placeholder="e.g. Steam" class="w-full p-inputtext-sm text-xs" />
            </div>
            <div class="flex flex-col gap-1">
                <label class="text-[10px] font-bold uppercase text-surface-400">Notes</label>
                <InputText :value="row.notes" @input="updateRow(index, 'notes', ($event.target as HTMLInputElement).value)" placeholder="e.g. Includes all DLC" class="w-full p-inputtext-sm text-xs" />
            </div>
        </div>
    </div>
  </div>
</template>


