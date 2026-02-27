<script setup lang="ts">
import { LocalizationRow } from '../models/GameData';
import RatingSelect from './RatingSelect.vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
// import Checkbox from 'primevue/checkbox';
// import Select from 'primevue/select';
// Actually best to just remove lines or comment them out.
// Removing them.
import { Trash2, Plus, GripVertical } from 'lucide-vue-next';
import { FlagIcon } from '@placetopay/flagicons-vue';
import { VueDraggable } from 'vue-draggable-plus';
import { computed } from 'vue';

const localizations = defineModel<LocalizationRow[]>('localizations', { required: true });

const dragList = computed({
    get: () => localizations.value || [],
    set: (val) => localizations.value = val
});

const idMap = new WeakMap<LocalizationRow, number>();
let nextId = 0;
function getRowId(row: LocalizationRow) {
    if (!idMap.has(row)) idMap.set(row, nextId++);
    return idMap.get(row)!;
}

const addRow = () => {
    localizations.value = [...localizations.value, {
        language: '',
        interface: 'false',
        audio: 'unknown',
        subtitles: 'unknown',
        notes: '',
        fan: false,
        ref: ''
    }];
};

const removeRow = (index: number) => {
    localizations.value = localizations.value.filter((_, i) => i !== index);
};

// Common languages map to ISO codes for flag icons
const commonLanguages = [
    { label: 'English', value: 'English', code: 'GB' },
    { label: 'French', value: 'French', code: 'FR' },
    { label: 'Italian', value: 'Italian', code: 'IT' },
    { label: 'German', value: 'German', code: 'DE' },
    { label: 'Spanish', value: 'Spanish', code: 'ES' },
    { label: 'Japanese', value: 'Japanese', code: 'JP' },
    { label: 'Korean', value: 'Korean', code: 'KR' },
    { label: 'Portuguese', value: 'Portuguese', code: 'PT' },
    { label: 'Brazilian Portuguese', value: 'Brazilian Portuguese', code: 'BR' },
    { label: 'Russian', value: 'Russian', code: 'RU' },
    { label: 'Chinese (Simplified)', value: 'Chinese (Simplified)', code: 'CN' },
    { label: 'Chinese (Traditional)', value: 'Chinese (Traditional)', code: 'TW' },
    { label: 'Polish', value: 'Polish', code: 'PL' },
    { label: 'Czech', value: 'Czech', code: 'CZ' },
    { label: 'Turkish', value: 'Turkish', code: 'TR' },
    { label: 'Ukrainian', value: 'Ukrainian', code: 'UA' },
    { label: 'Hungarian', value: 'Hungarian', code: 'HU' },
    { label: 'Dutch', value: 'Dutch', code: 'NL' },
    { label: 'Swedish', value: 'Swedish', code: 'SE' },
    { label: 'Norwegian', value: 'Norwegian', code: 'NO' },
    { label: 'Danish', value: 'Danish', code: 'DK' },
    { label: 'Finnish', value: 'Finnish', code: 'FI' },
];

const getFlagCode = (lang: string) => {
    const found = commonLanguages.find(l => l.value === lang);
    return found ? found.code : undefined;
};
</script>

<template>
    <div class="flex flex-col gap-2">
        <VueDraggable v-model="dragList" :animation="150" handle=".drag-handle" class="flex flex-col gap-2">
            <div v-for="(row, index) in dragList" :key="getRowId(row)"
                class="p-4 border rounded border-surface-200 dark:border-surface-700 flex flex-col gap-2 relative group mt-1 ml-1">

                <div class="absolute -left-3 -top-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button class="drag-handle cursor-grab active:cursor-grabbing" severity="secondary" rounded
                        aria-label="Drag" size="small">
                        <template #icon>
                            <GripVertical class="w-3 h-3 text-surface-500" />
                        </template>
                    </Button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-2 items-end">
                    <!-- Language -->
                    <div class="md:col-span-4 lg:col-span-3 flex flex-col gap-1">
                        <label class="text-xs font-bold text-surface-500">Language</label>
                        <div class="flex gap-2">
                            <Select v-model="row.language" :options="commonLanguages" optionLabel="label"
                                optionValue="value" editable placeholder="Select or type..." class="w-full">
                                <template #value="slotProps">
                                    <div class="flex items-center gap-2" v-if="slotProps.value">
                                        <FlagIcon :flag="getFlagCode(slotProps.value) as any"
                                            v-if="getFlagCode(slotProps.value)" size="M" class="rounded" />
                                        <span v-else>🏳️</span>
                                        <span>{{ slotProps.value }}</span>
                                    </div>
                                    <span v-else>{{ slotProps.placeholder }}</span>
                                </template>
                                <template #option="slotProps">
                                    <div class="flex items-center gap-2">
                                        <FlagIcon :flag="slotProps.option.code" size="M" class="rounded" />
                                        <span>{{ slotProps.option.label }}</span>
                                    </div>
                                </template>
                            </Select>
                        </div>
                    </div>

                    <!-- Interface -->
                    <div class="md:col-span-2 lg:col-span-1 flex flex-col gap-1 items-center">
                        <label class="text-xs font-bold text-surface-500">UI</label>
                        <div
                            class="h-10 flex items-center justify-center border border-surface-300 dark:border-surface-600 rounded bg-surface-50 dark:bg-surface-900 w-full">
                            <Checkbox v-model="row.interface" true-value="true" false-value="false" />
                        </div>
                    </div>

                    <!-- Audio -->
                    <div class="md:col-span-3 lg:col-span-2 flex flex-col gap-1">
                        <label class="text-xs font-bold text-surface-500">Audio</label>
                        <RatingSelect v-model="row.audio" />
                    </div>

                    <!-- Subtitles -->
                    <div class="md:col-span-3 lg:col-span-2 flex flex-col gap-1">
                        <label class="text-xs font-bold text-surface-500">Subtitles</label>
                        <RatingSelect v-model="row.subtitles" />
                    </div>

                    <!-- Notes & Fan -->
                    <div class="md:col-span-10 lg:col-span-3 flex gap-2 items-end">
                        <div class="flex-1 flex flex-col gap-1">
                            <label class="text-xs font-bold text-surface-500">Notes</label>
                            <InputText v-model="row.notes" class="w-full" placeholder="Notes..." />
                        </div>
                        <div class="flex flex-col gap-1 items-center pb-2" title="Fan Translation">
                            <label class="text-[10px] font-bold text-surface-400">FAN</label>
                            <Checkbox v-model="row.fan" binary />
                        </div>
                    </div>

                    <!-- Delete Button (Last column) -->
                    <div class="md:col-span-2 lg:col-span-1 flex justify-end pb-1">
                        <Button severity="danger" text @click="removeRow(index)" title="Remove Language">
                            <template #icon>
                                <Trash2 class="w-4 h-4" />
                            </template>
                        </Button>
                    </div>
                </div>
            </div>
        </VueDraggable>

        <Button label="Add Language" @click="addRow" outlined class="w-full border-dashed mt-2">
            <template #icon>
                <Plus class="w-4 h-4" />
            </template>
        </Button>
    </div>
</template>
