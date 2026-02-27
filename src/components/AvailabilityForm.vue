<script setup lang="ts">
import { AvailabilityRow } from '../models/GameData';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Select from 'primevue/select';
import SelectButton from 'primevue/selectbutton';
import {
    Monitor, ShoppingBag, Zap, ShoppingCart, Shield, Play,
    Gift, Heart, Command, AppWindow, Globe, Box, Code,
    Building2, Plus, Trash2, GripVertical
} from 'lucide-vue-next';
import { VueDraggable } from 'vue-draggable-plus';
import { computed } from 'vue';

const props = defineProps<{
    modelValue: AvailabilityRow[];
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: AvailabilityRow[]): void;
}>();

const dragList = computed({
    get: () => props.modelValue || [],
    set: (val) => emit('update:modelValue', val)
});

const idMap = new WeakMap<AvailabilityRow, number>();
let nextId = 0;
function getRowId(row: AvailabilityRow) {
    if (!idMap.has(row)) idMap.set(row, nextId++);
    return idMap.get(row)!;
}

const storefrontOptions = [
    { label: 'Steam', value: 'Steam', icon: Monitor },
    { label: 'GOG.com', value: 'GOG.com', icon: ShoppingBag },
    { label: 'Epic Games Store', value: 'Epic Games Store', icon: Zap },
    { label: 'Amazon.com', value: 'Amazon.com', icon: ShoppingCart },
    { label: 'Amazon.co.uk', value: 'Amazon.co.uk', icon: ShoppingCart },
    { label: 'Battle.net', value: 'Battle.net', icon: Shield },
    { label: 'EA app', value: 'EA app', icon: Play },
    { label: 'Humble Store', value: 'Humble Store', icon: Gift },
    { label: 'itch.io', value: 'itch.io', icon: Heart },
    { label: 'Mac App Store', value: 'MacApp', icon: Command },
    { label: 'Microsoft Store', value: 'Microsoft Store', icon: AppWindow },
    { label: 'Ubisoft Store', value: 'Ubisoft Store', icon: Globe },
    { label: 'Retail', value: 'Retail', icon: Box },
    { label: 'Developer', value: 'Developer', icon: Code },
    { label: 'Publisher', value: 'Publisher', icon: Building2 },
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
            <h3 class="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">Availability
                Table</h3>
            <Button label="Add Store" size="small" @click="addRow" severity="primary" class="h-7 text-xs">
                <template #icon>
                    <Plus class="w-3.5 h-3.5" />
                </template>
            </Button>
        </div>

        <VueDraggable v-model="dragList" :animation="150" handle=".drag-handle" class="flex flex-col gap-3">
            <div v-for="(row, index) in dragList" :key="getRowId(row)"
                class="p-3 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 flex flex-col gap-3 transition-all group relative mt-2 ml-1">

                <div class="absolute -left-3 -top-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button class="drag-handle cursor-grab active:cursor-grabbing" severity="secondary" rounded
                        aria-label="Drag" size="small">
                        <template #icon>
                            <GripVertical class="w-3 h-3 text-surface-500" />
                        </template>
                    </Button>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                    <Select :modelValue="row.distribution" @update:modelValue="v => updateRow(index, 'distribution', v)"
                        :options="storefrontOptions" optionLabel="label" optionValue="value" placeholder="Select Store"
                        class="w-full sm:w-44 text-xs! flex-none h-9! flex! items-center!" size="small" editable>
                        <template #value="slotProps">
                            <div v-if="slotProps.value" class="flex items-center gap-2">
                                <component :is="storefrontOptions.find(o => o.value === slotProps.value)?.icon || Box"
                                    class="w-3.5 h-3.5"
                                    :class="{ 'text-surface-400': !storefrontOptions.find(o => o.value === slotProps.value) }" />
                                <span class="text-xs truncate">{{storefrontOptions.find(o => o.value ===
                                    slotProps.value)?.label || slotProps.value}}</span>
                            </div>
                            <span v-else class="text-xs">Select Store</span>
                        </template>
                        <template #option="slotProps">
                            <div class="flex items-center gap-2">
                                <component :is="slotProps.option.icon" class="w-3.5 h-3.5" />
                                <span class="text-xs">{{ slotProps.option.label }}</span>
                            </div>
                        </template>
                    </Select>

                    <SelectButton :modelValue="row.state || 'normal'"
                        @update:modelValue="v => updateRow(index, 'state', v || 'normal')" :options="stateOptions"
                        optionLabel="label" optionValue="value" size="small"
                        class="flex-1 min-w-min whitespace-nowrap compact-select-button" :pt="{
                            root: { class: 'flex' },
                            button: { class: '!px-2 !py-0.5 !text-[10px] flex-1' },
                            label: { class: '!font-semibold' }
                        }" />

                    <Button text severity="danger" size="small" @click="removeRow(index)"
                        class="ml-auto !p-2 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-md">
                        <template #icon>
                            <Trash2 class="w-4 h-4 text-red-500" />
                        </template>
                    </Button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-bold uppercase text-surface-400">Product ID</label>
                        <InputText :value="row.id"
                            @input="updateRow(index, 'id', ($event.target as HTMLInputElement).value)"
                            :placeholder="getProductIdHelp(row.distribution)" class="w-full !text-xs !p-2" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-bold uppercase text-surface-400">DRM Used</label>
                        <InputText :value="row.drm"
                            @input="updateRow(index, 'drm', ($event.target as HTMLInputElement).value)"
                            placeholder="e.g. Steam, DRM-free" class="w-full !text-xs !p-2" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-bold uppercase text-surface-400">Supported OS</label>
                        <InputText :value="row.os"
                            @input="updateRow(index, 'os', ($event.target as HTMLInputElement).value)"
                            placeholder="e.g. Windows, OS X, Linux" class="w-full !text-xs !p-2" />
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-bold uppercase text-surface-400">Extra Keys</label>
                        <InputText :value="row.keys"
                            @input="updateRow(index, 'keys', ($event.target as HTMLInputElement).value)"
                            placeholder="e.g. Steam" class="w-full !text-xs !p-2" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-bold uppercase text-surface-400">Notes</label>
                        <InputText :value="row.notes"
                            @input="updateRow(index, 'notes', ($event.target as HTMLInputElement).value)"
                            placeholder="e.g. Includes all DLC" class="w-full !text-xs !p-2" />
                    </div>
                </div>
            </div>
        </VueDraggable>
    </div>
</template>
