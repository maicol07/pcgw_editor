<script setup lang="ts">
import { AvailabilityRow } from '../models/GameData';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Select from 'primevue/select';
import SelectButton from 'primevue/selectbutton';
import MultiSelect from 'primevue/multiselect';
import { getIconSrc } from '../utils/icons';
import {
    Box, Code, Building2, Plus, Trash2, GripVertical, ShoppingCart, Store, Globe
} from 'lucide-vue-next';
import { VueDraggable } from 'vue-draggable-plus';

const dragList = defineModel<AvailabilityRow[]>({ default: () => [] });

const idMap = new WeakMap<AvailabilityRow, number>();
let nextId = 0;
function getRowId(row: AvailabilityRow) {
    if (!idMap.has(row)) idMap.set(row, nextId++);
    return idMap.get(row)!;
}

const storefrontOptions = [
    { label: 'Amazon', value: 'amazon', icon: ShoppingCart },
    { label: 'Amazon.com', value: 'amazon.com', icon: ShoppingCart },
    { label: 'Amazon.co.uk', value: 'amazon.co.uk', icon: ShoppingCart },
    { label: 'Amazon.co.jp', value: 'amazon.co.jp', icon: ShoppingCart },
    { label: 'Amazon.es', value: 'amazon.es', icon: ShoppingCart },
    { label: 'Amazon.fr', value: 'amazon.fr', icon: ShoppingCart },
    { label: 'Amazon.de', value: 'amazon.de', icon: ShoppingCart },
    { label: 'Amazon.it', value: 'amazon.it', icon: ShoppingCart },
    { label: 'Battle.net', value: 'battle.net' },
    { label: 'Bethesda.net (obsolete)', value: 'bethesda.net (obsolete)' },
    { label: 'Discord', value: 'discord' },
    { label: 'EA App', value: 'ea app' },
    { label: 'EA Desktop', value: 'ea desktop' },
    { label: 'Epic Games Launcher', value: 'epic games launcher' },
    { label: 'Epic Games Store Subpage', value: 'epic games store subpage' },
    { label: 'GamersGate', value: 'gamersgate' },
    { label: 'Games for Windows Marketplace', value: 'games for windows marketplace' },
    { label: 'Gamesplanet', value: 'gamesplanet' },
    { label: 'GFW Marketplace', value: 'gfw marketplace' },
    { label: 'GFWL Marketplace', value: 'gfwl marketplace' },
    { label: 'GOG GALAXY', value: 'gog galaxy' },
    { label: 'GMG', value: 'gmg' },
    { label: 'Humble Store', value: 'humble store' },
    { label: 'itch.io', value: 'itch.io', icon: Store },
    { label: 'MacApp', value: 'macapp' },
    { label: 'Mac App Store', value: 'mac app store' },
    { label: 'Meta Store', value: 'meta store' },
    { label: 'Microsoft Store', value: 'microsoft store' },
    { label: 'Official Website', value: 'official', icon: Globe },
    { label: 'Origin', value: 'origin' },
    { label: 'Steam', value: 'steam' },
    { label: 'Steam Bundle', value: 'steam-bundle' },
    { label: 'Steam Sub', value: 'steam-sub' },
    { label: 'Twitch', value: 'twitch' },
    { label: 'Ubisoft Connect', value: 'ubisoft connect' },
    { label: 'Viveport', value: 'viveport' },
    { label: 'ZOOM Platform', value: 'zoom' },
    { label: 'ZOOM Platform', value: 'zoom-platform' },
    { label: 'Download', value: 'download' },
    { label: 'Retail', value: 'retail', icon: Box },
    { label: 'Developer', value: 'developer', icon: Code },
    { label: 'Publisher', value: 'publisher', icon: Building2 },
];

function normalizeStoreOption(val: string): string {
    if (!val) return '';
    const v = val.toLowerCase().trim();
    
    // Find exact or case-insensitive match in our storefrontOptions array
    const matched = storefrontOptions.find(o => o.value.toLowerCase() === v);
    if (matched) return matched.value;
    
    // Fallbacks for common legacy names if not directly matched
    if (v === 'gog.com') return 'gog galaxy';
    if (v === 'epic games store') return 'epic games launcher';
    if (v === 'uplay' || v === 'ubisoft store' || v === 'ubisoft') return 'ubisoft connect';
    if (v === 'xbox') return 'microsoft store';
    if (v === 'oculus') return 'meta store';
    if (v === 'bethesda') return 'bethesda.net (obsolete)';
    if (v === 'humble') return 'humble store';
    
    return val;
}

const stateOptions = [
    { label: 'Normal', value: 'normal' },
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'Unavailable', value: 'unavailable' }
];

function addRow() {
    const newRow: AvailabilityRow = { distribution: 'steam', id: '', drm: 'steam', os: 'Windows', keys: '', notes: '', state: 'normal' };
    dragList.value = [...dragList.value, newRow];
}

function removeRow(index: number) {
    const newVal = [...dragList.value];
    newVal.splice(index, 1);
    dragList.value = newVal;
}

function updateRow(index: number, field: keyof AvailabilityRow, val: any) {
    dragList.value[index][field] = val;
    dragList.value = [...dragList.value];
}

const getProductIdHelp = (source: string) => {
    const s = source ? source.toLowerCase().trim() : '';
    if (s === 'steam') return 'AppID (e.g. 2310)';
    if (s === 'gog galaxy' || s === 'gog.com' || s === 'gog') return 'Slug (e.g. system_shock_2)';
    if (s === 'epic games launcher' || s === 'epic games store' || s === 'epic') return 'Namespace/Slug (e.g. darksiders3)';
    if (s === 'meta store' || s === 'macapp') return 'AppID (e.g. id468808410)';
    if (s === 'microsoft store') return 'ID (e.g. 9wzdncrfhwfh)';
    return 'Store specific ID or full URL';
};

const osOptions = [
  { name: 'Windows', value: 'Windows' },
  { name: 'DOS', value: 'DOS' },
  { name: 'Windows 3.x', value: 'Windows 3.x' },
  { name: 'Mac OS', value: 'Mac OS' },
  { name: 'OS X', value: 'OS X' },
  { name: 'Linux', value: 'Linux' },
  { name: 'PC booter', value: 'PC booter' }
];

function handleOsChange(index: number, selectedValues: string[]) {
  updateRow(index, 'os', selectedValues.join(', '));
}

function getOsArray(osString: string): string[] {
  return osString ? osString.split(',').map(s => s.trim()) : [];
}

const drmOptions = [
  { name: 'DRM-free', value: 'drm-free' },
  { name: 'Account', value: 'account' },
  { name: 'Activation', value: 'activation' },
  { name: 'Activation limit', value: 'actlimit' },
  { name: 'Disc', value: 'disc' },
  { name: 'Key', value: 'key' },
  { name: 'Online', value: 'online' },
  { name: 'Physical', value: 'physical' },
  { name: 'Floppy', value: 'floppy' },
  { name: 'Dongle', value: 'dongle' },
  { name: 'Unknown', value: 'unknown' },
  { name: 'Battle.net', value: 'battle.net' },
  { name: 'Bethesda.net', value: 'bethesda' },
  { name: 'EA App', value: 'ea app' },
  { name: 'Epic Games Launcher', value: 'epic games launcher' },
  { name: 'GFWL', value: 'gfwl' },
  { name: 'GOG GALAXY', value: 'gog' },
  { name: 'Mac App Store', value: 'macapp' },
  { name: 'Meta Store', value: 'meta store' },
  { name: 'Microsoft Store', value: 'microsoft store' },
  { name: 'Rockstar Games Launcher', value: 'rockstar games launcher' },
  { name: 'Steam', value: 'steam' },
  { name: 'Twitch', value: 'twitch' },
  { name: 'Ubisoft Connect', value: 'ubisoft connect' }
];

function handleDrmChange(index: number, selectedValues: string[]) {
  updateRow(index, 'drm', selectedValues.join(', '));
}

function getDrmArray(drmString: string): string[] {
  return drmString ? drmString.split(',').map(s => s.trim()) : [];
}

const keyOptions = [
  { name: 'Battle.net', value: 'battle.net' },
  { name: 'Bethesda.net (obsolete)', value: 'bethesda.net (obsolete)' },
  { name: 'EA App', value: 'ea app' },
  { name: 'Epic Games Launcher', value: 'epic games launcher' },
  { name: 'GamersGate', value: 'gamersgate' },
  { name: 'GOG GALAXY', value: 'gog galaxy' },
  { name: 'GMG', value: 'gmg' },
  { name: 'Humble Store', value: 'humble store' },
  { name: 'Microsoft Store', value: 'microsoft store' },
  { name: 'Meta Store', value: 'meta store' },
  { name: 'Steam', value: 'steam' },
  { name: 'Ubisoft Connect', value: 'ubisoft connect' },
  { name: 'Download', value: 'download' }
];

function normalizeKeyOption(val: string): string {
  const v = val.toLowerCase().trim();
  if (v === 'bethesda.net (obsolete)' || v === 'bethesda.net' || v === 'bethesda') return 'bethesda.net (obsolete)';
  if (v === 'ea app' || v === 'origin' || v === 'ea desktop' || v === 'ea') return 'ea app';
  if (v === 'epic games launcher' || v === 'epic games store' || v === 'epic') return 'epic games launcher';
  if (v === 'gamersgate') return 'gamersgate';
  if (v === 'gog galaxy' || v === 'goggalaxy' || v === 'gog.com' || v === 'galaxy' || v === 'gog') return 'gog galaxy';
  if (v === 'gmg') return 'gmg';
  if (v === 'humble store' || v === 'humble') return 'humble store';
  if (v === 'microsoft store' || v === 'xbox') return 'microsoft store';
  if (v === 'meta store' || v === 'oculus') return 'meta store';
  if (v === 'steam') return 'steam';
  if (v === 'ubisoft connect' || v === 'uplay' || v === 'ubisoft') return 'ubisoft connect';
  if (v === 'download') return 'download';
  return val;
}

function handleKeysChange(index: number, selectedValues: string[]) {
  updateRow(index, 'keys', selectedValues.join(', '));
}

function getKeysArray(keysString: string): string[] {
  if (!keysString) return [];
  return keysString.split(',').map(s => normalizeKeyOption(s.trim()));
}
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
                    <Select :modelValue="normalizeStoreOption(row.distribution)" @update:modelValue="v => updateRow(index, 'distribution', v)"
                        :options="storefrontOptions" optionLabel="label" optionValue="value" placeholder="Select Store"
                        class="w-full sm:w-44 text-xs! flex-none h-9! flex! items-center!" size="small">
                        <template #value="slotProps">
                            <div v-if="slotProps.value" class="flex items-center gap-2">
                                <img v-if="getIconSrc(slotProps.value, ['store', 'drm'])" 
                                     :src="getIconSrc(slotProps.value, ['store', 'drm'])" 
                                     :alt="slotProps.value" class="w-4 h-4 shrink-0 object-contain" />
                                <component v-else :is="storefrontOptions.find(o => o.value === slotProps.value)?.icon || Box"
                                    class="w-3.5 h-3.5"
                                    :class="{ 'text-surface-400': !storefrontOptions.find(o => o.value === slotProps.value) }" />
                                <span class="text-xs truncate">{{storefrontOptions.find(o => o.value ===
                                    slotProps.value)?.label || slotProps.value}}</span>
                            </div>
                            <span v-else class="text-xs">Select Store</span>
                        </template>
                        <template #option="slotProps">
                            <div class="flex items-center gap-2">
                                <img v-if="getIconSrc(slotProps.option.value, ['store', 'drm'])" 
                                     :src="getIconSrc(slotProps.option.value, ['store', 'drm'])" 
                                     :alt="slotProps.option.label" class="w-4 h-4 shrink-0 object-contain" />
                                <component v-else :is="slotProps.option.icon || Box" class="w-3.5 h-3.5 text-surface-400" />
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
                        <MultiSelect :modelValue="getDrmArray(row.drm)" @update:modelValue="(val) => handleDrmChange(index, val)"
                            :options="drmOptions" optionLabel="name" optionValue="value" placeholder="Select DRM" :maxSelectedLabels="3"
                            class="w-full text-xs" pt:root:class="!h-9 !flex !items-center">
                            <template #value="slotProps">
                                <div class="flex items-center gap-1 flex-nowrap overflow-hidden w-full"
                                    v-if="slotProps.value && slotProps.value.length">
                                    <div v-for="option in slotProps.value" :key="option"
                                        class="flex items-center bg-surface-100 dark:bg-surface-700 rounded px-1.5 py-0.5 gap-1 shrink-0">
                                        <img v-if="getIconSrc(option, ['drm', 'store'])" :src="getIconSrc(option, ['drm', 'store'])" :alt="option" class="w-3.5 h-3.5" />
                                        <span class="text-xs">{{ drmOptions.find(o => o.value === option)?.name || option }}</span>
                                    </div>
                                </div>
                                <span v-else class="text-surface-400 text-xs">{{ slotProps.placeholder }}</span>
                            </template>
                            <template #option="slotProps">
                                <div class="flex items-center">
                                    <img v-if="getIconSrc(slotProps.option.value, ['drm', 'store'])" :src="getIconSrc(slotProps.option.value, ['drm', 'store'])" :alt="slotProps.option.name"
                                        class="w-4 h-4 mr-2" />
                                    <span class="text-xs">{{ slotProps.option.name }}</span>
                                </div>
                            </template>
                        </MultiSelect>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-bold uppercase text-surface-400">Supported OS</label>
                        <MultiSelect :modelValue="getOsArray(row.os)" @update:modelValue="(val) => handleOsChange(index, val)"
                            :options="osOptions" optionLabel="name" optionValue="value" placeholder="Select OS" :maxSelectedLabels="3"
                            class="w-full text-xs" pt:root:class="!h-9 !flex !items-center">
                            <template #value="slotProps">
                                <div class="flex items-center gap-1 flex-nowrap overflow-hidden w-full"
                                    v-if="slotProps.value && slotProps.value.length">
                                    <div v-for="option in slotProps.value" :key="option"
                                        class="flex items-center bg-surface-100 dark:bg-surface-700 rounded px-1.5 py-0.5 gap-1 shrink-0">
                                        <img v-if="getIconSrc(option, 'os')" :src="getIconSrc(option, 'os')" :alt="option" class="w-3.5 h-3.5" />
                                        <span class="text-xs">{{ option }}</span>
                                    </div>
                                </div>
                                <span v-else class="text-surface-400 text-xs">{{ slotProps.placeholder }}</span>
                            </template>
                            <template #option="slotProps">
                                <div class="flex items-center">
                                    <img v-if="getIconSrc(slotProps.option.value, 'os')" :src="getIconSrc(slotProps.option.value, 'os')" :alt="slotProps.option.name"
                                        class="w-4 h-4 mr-2" />
                                    <span class="text-xs">{{ slotProps.option.name }}</span>
                                </div>
                            </template>
                        </MultiSelect>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-bold uppercase text-surface-400">Extra Keys</label>
                        <MultiSelect :modelValue="getKeysArray(row.keys)" @update:modelValue="(val) => handleKeysChange(index, val)"
                            :options="keyOptions" optionLabel="name" optionValue="value" placeholder="Select Keys" :maxSelectedLabels="3"
                            class="w-full text-xs" pt:root:class="!h-9 !flex !items-center">
                            <template #value="slotProps">
                                <div class="flex items-center gap-1 flex-nowrap overflow-hidden w-full"
                                    v-if="slotProps.value && slotProps.value.length">
                                    <div v-for="option in slotProps.value" :key="option"
                                        class="flex items-center bg-surface-100 dark:bg-surface-700 rounded px-1.5 py-0.5 gap-1 shrink-0">
                                        <img v-if="getIconSrc(option, ['drm', 'store'])" :src="getIconSrc(option, ['drm', 'store'])" :alt="option" class="w-3.5 h-3.5" />
                                        <span class="text-xs">{{ keyOptions.find(o => o.value === option)?.name || option }}</span>
                                    </div>
                                </div>
                                <span v-else class="text-surface-400 text-xs">{{ slotProps.placeholder }}</span>
                            </template>
                            <template #option="slotProps">
                                <div class="flex items-center">
                                    <img v-if="getIconSrc(slotProps.option.value, ['drm', 'store'])" :src="getIconSrc(slotProps.option.value, ['drm', 'store'])" :alt="slotProps.option.name"
                                        class="w-4 h-4 mr-2" />
                                    <span class="text-xs">{{ slotProps.option.name }}</span>
                                </div>
                            </template>
                        </MultiSelect>
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
