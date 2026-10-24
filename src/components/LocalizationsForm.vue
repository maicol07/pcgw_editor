<script setup lang="ts">
import { ref, toRaw } from 'vue';
import { LocalizationRow, RatingValue } from '../models/GameData';
import RatingSelect from './RatingSelect.vue';
import NotesButton from './NotesButton.vue';
import Button from 'openvue/button';
import Select from 'openvue/select';
import Checkbox from 'openvue/checkbox';
import MultiSelect from 'openvue/multiselect';
import Popover from 'openvue/popover';
import { Trash2, Plus, GripVertical, Languages } from '@lucide/vue';
import FlagIcon from './common/FlagIcon.vue';
import { VueDraggable } from 'vue-draggable-plus';

const localizations = defineModel<LocalizationRow[]>('localizations', { required: true });

const idMap = new WeakMap<LocalizationRow, number>();
let nextId = 0;
function getRowId(row: LocalizationRow) {
    row = toRaw(row);
    if (!idMap.has(row)) idMap.set(row, nextId++);
    return idMap.get(row)!;
}

const updateRow = <K extends keyof LocalizationRow>(index: number, key: K, value: LocalizationRow[K]) => {
    const row = localizations.value[index];
    const updated = { ...row, [key]: value };
    idMap.set(updated, getRowId(row));
    localizations.value = localizations.value.map((item, i) => i === index ? updated : item);
};

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
    { label: 'Chuvash', value: 'Chuvash' },
    { label: 'Gothic', value: 'Gothic' },
    { label: 'Võro', value: 'Võro' },
];

const getFlagCode = (lang: string) => {
    const found = commonLanguages.find(l => l.value === lang);
    return found ? found.code : undefined;
};

// Add common languages multi-select
const addLangPopover = ref();
const selectedLanguages = ref<string[]>([]);

const openAddLanguages = (event: Event) => {
    selectedLanguages.value = [];
    addLangPopover.value.toggle(event);
};

const addSelectedLanguages = () => {
    const existing = new Set(localizations.value.map(r => r.language));
    const newRows = selectedLanguages.value
        .filter(lang => !existing.has(lang))
        .map((lang): LocalizationRow => ({
            language: lang,
            interface: 'false',
            audio: 'unknown',
            subtitles: 'unknown',
            notes: '',
            fan: false,
            ref: ''
        }));
    if (newRows.length) {
        localizations.value = [...localizations.value, ...newRows];
    }
    addLangPopover.value.hide();
};

// "Set all" column toggles
const setAllColumn = (column: 'interface' | 'audio' | 'subtitles', value: RatingValue) => {
    localizations.value = localizations.value.map(r => ({ ...r, [column]: value }));
};

const ratingOptions: { label: string; value: RatingValue }[] = [
    { label: 'True', value: 'true' },
    { label: 'Limited', value: 'limited' },
    { label: 'Always on', value: 'always on' },
    { label: 'False', value: 'false' },
    { label: 'Hackable', value: 'hackable' },
    { label: 'N/A', value: 'n/a' },
    { label: 'Unknown', value: 'unknown' },
];
</script>

<template>
    <div class="flex flex-col gap-2 @container">
        <!-- Bulk actions -->
        <div v-if="localizations.length"
            class="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800/40 border border-surface-200 dark:border-surface-700">
            <span class="text-xs font-bold text-surface-500 uppercase tracking-wider">Set all</span>
            <div class="flex items-center gap-1.5">
                <label class="text-xs font-semibold text-surface-500">UI</label>
                <Select :modelValue="null" :options="ratingOptions" optionLabel="label" optionValue="value"
                    placeholder="—" size="small" class="w-28"
                    @update:modelValue="(v: RatingValue) => v && setAllColumn('interface', v)" />
            </div>
            <div class="flex items-center gap-1.5">
                <label class="text-xs font-semibold text-surface-500">Audio</label>
                <Select :modelValue="null" :options="ratingOptions" optionLabel="label" optionValue="value"
                    placeholder="—" size="small" class="w-28"
                    @update:modelValue="(v: RatingValue) => v && setAllColumn('audio', v)" />
            </div>
            <div class="flex items-center gap-1.5">
                <label class="text-xs font-semibold text-surface-500">Subtitles</label>
                <Select :modelValue="null" :options="ratingOptions" optionLabel="label" optionValue="value"
                    placeholder="—" size="small" class="w-28"
                    @update:modelValue="(v: RatingValue) => v && setAllColumn('subtitles', v)" />
            </div>
        </div>

        <VueDraggable v-model="localizations" :animation="150" handle=".drag-handle" class="flex flex-col gap-2">
            <div v-for="(row, index) in localizations" :key="getRowId(row)"
                class="localization-row p-3 border rounded-lg border-surface-200 dark:border-surface-700">

                <div class="localization-drag self-end">
                    <Button class="drag-handle cursor-grab active:cursor-grabbing w-8 h-8" severity="secondary" text
                        :aria-label="`Reorder ${row.language || 'language'}`" size="small">
                        <template #icon>
                            <GripVertical class="w-3 h-3 text-surface-500" />
                        </template>
                    </Button>
                </div>

                <!-- Language -->
                <div class="localization-language min-w-0 flex flex-col gap-1">
                    <label :for="`loc-lang-${getRowId(row)}`" class="text-xs font-bold uppercase tracking-wider text-surface-500">Language</label>
                    <Select :modelValue="row.language" @update:modelValue="updateRow(index, 'language', $event)" :inputId="`loc-lang-${getRowId(row)}`" :options="commonLanguages" optionLabel="label"
                        optionValue="value" filter placeholder="Select language..." size="small" class="w-full min-w-0">
                        <template #value="slotProps">
                            <div class="flex items-center gap-2 min-w-0" v-if="slotProps.value">
                                <FlagIcon :flag="getFlagCode(slotProps.value) as any"
                                    v-if="getFlagCode(slotProps.value)" size="M" class="rounded" />
                                <span v-else>🏳️</span>
                                <span class="truncate">{{ slotProps.value }}</span>
                            </div>
                            <span v-else>{{ slotProps.placeholder }}</span>
                        </template>
                        <template #option="slotProps">
                            <div class="flex items-center gap-2">
                                <FlagIcon :flag="slotProps.option.code" size="M" class="rounded" v-if="slotProps.option.code" />
                                <span v-else>🏳️</span>
                                <span>{{ slotProps.option.label }}</span>
                            </div>
                        </template>
                    </Select>
                </div>

                <div class="localization-ratings grid grid-cols-1 @sm:grid-cols-3 gap-3 min-w-0">
                    <!-- Interface -->
                    <div class="min-w-0 flex flex-col gap-1">
                        <label :for="`loc-ui-${getRowId(row)}`" class="text-xs font-bold uppercase tracking-wider text-surface-500">UI</label>
                        <RatingSelect :modelValue="row.interface" @update:modelValue="updateRow(index, 'interface', $event)" :inputId="`loc-ui-${getRowId(row)}`" />
                    </div>

                    <!-- Audio -->
                    <div class="min-w-0 flex flex-col gap-1">
                        <label :for="`loc-audio-${getRowId(row)}`" class="text-xs font-bold uppercase tracking-wider text-surface-500">Audio</label>
                        <RatingSelect :modelValue="row.audio" @update:modelValue="updateRow(index, 'audio', $event)" :inputId="`loc-audio-${getRowId(row)}`" />
                    </div>

                    <!-- Subtitles -->
                    <div class="min-w-0 flex flex-col gap-1">
                        <label :for="`loc-subs-${getRowId(row)}`" class="text-xs font-bold uppercase tracking-wider text-surface-500">Subtitles</label>
                        <RatingSelect :modelValue="row.subtitles" @update:modelValue="updateRow(index, 'subtitles', $event)" :inputId="`loc-subs-${getRowId(row)}`" />
                    </div>
                </div>

                <div class="localization-actions flex items-center justify-end gap-2 self-end h-8">
                    <label :for="`loc-fan-${getRowId(row)}`" class="flex items-center gap-2 cursor-pointer text-xs text-surface-600 dark:text-surface-300 whitespace-nowrap mr-1">
                        <Checkbox :inputId="`loc-fan-${getRowId(row)}`" :modelValue="row.fan" @update:modelValue="updateRow(index, 'fan', $event)" binary />
                        <span>Fan translation</span>
                    </label>
                    <NotesButton :modelValue="row.notes" @update:modelValue="updateRow(index, 'notes', $event)" type="note" title="Localization notes" class="w-8 h-8 shrink-0" />

                    <Button severity="danger" text size="small" class="w-8 h-8 shrink-0" @click="removeRow(index)" :aria-label="`Remove ${row.language || 'language'}`" title="Remove language">
                        <template #icon>
                            <Trash2 class="w-4 h-4" />
                        </template>
                    </Button>
                </div>
            </div>
        </VueDraggable>

        <div class="flex flex-col sm:flex-row gap-2 mt-2">
            <Button label="Add Language" @click="addRow" outlined class="flex-1 border-dashed">
                <template #icon>
                    <Plus class="w-4 h-4" />
                </template>
            </Button>
            <Button label="Add common languages" @click="openAddLanguages" outlined severity="secondary" class="flex-1">
                <template #icon>
                    <Languages class="w-4 h-4" />
                </template>
            </Button>
        </div>

        <Popover ref="addLangPopover">
            <div class="flex flex-col gap-3 w-72">
                <span class="text-sm font-semibold text-surface-700 dark:text-surface-200">Pick languages to add</span>
                <MultiSelect v-model="selectedLanguages" :options="commonLanguages" optionLabel="label"
                    optionValue="value" filter placeholder="Select languages..." class="w-full" :maxSelectedLabels="3">
                    <template #option="slotProps">
                        <div class="flex items-center gap-2">
                            <FlagIcon :flag="slotProps.option.code" size="M" class="rounded" v-if="slotProps.option.code" />
                            <span v-else>🏳️</span>
                            <span>{{ slotProps.option.label }}</span>
                        </div>
                    </template>
                </MultiSelect>
                <Button label="Add selected" size="small" :disabled="!selectedLanguages.length"
                    @click="addSelectedLanguages" />
            </div>
        </Popover>
    </div>
</template>

<style scoped>
.localization-row {
    display: grid;
    grid-template-columns: 2rem minmax(0, 1fr);
    grid-template-areas: "drag language" "actions actions" "ratings ratings";
    gap: 0.75rem;
}

.localization-drag { grid-area: drag; }
.localization-language { grid-area: language; }
.localization-ratings { grid-area: ratings; }
.localization-actions { grid-area: actions; }

@container (min-width: 36rem) {
    .localization-row {
        grid-template-columns: 2rem minmax(0, 1fr) auto;
        grid-template-areas: "drag language actions" "ratings ratings ratings";
    }
}

@container (min-width: 64rem) {
    .localization-row {
        grid-template-columns: 2rem minmax(12rem, 1.4fr) minmax(0, 3fr) auto;
        grid-template-areas: "drag language ratings actions";
    }
}
</style>
