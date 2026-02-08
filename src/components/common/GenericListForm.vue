<script setup lang="ts">
import AutocompleteField, { DataSource } from '../AutocompleteField.vue';
import NotesButton from '../NotesButton.vue';
import { Info } from 'lucide-vue-next';

export interface ListItem {
    name: string;
    note?: string;
    // Allow flexible extra properties
    [key: string]: any;
}

const props = defineProps<{
    modelValue: ListItem[];
    label: string;
    tooltip?: string;
    dataSource: DataSource; // for Autocomplete
    placeholder?: string;
    highlight?: boolean;
    hideLabel?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: ListItem[]): void;
}>();

const updateList = (names: string[]) => {
    const existing = props.modelValue;
    const newList = names.map(name => {
        // preserve existing extra data if name matches
        const found = existing.find(item => item.name === name);
        return found ? { ...found } : { name };
    });
    emit('update:modelValue', newList);
};

const updateItem = (index: number, field: string, value: any) => {
    const newList = [...props.modelValue];
    newList[index] = { ...newList[index], [field]: value };
    emit('update:modelValue', newList);
};

// We don't have explicit remove button for items in Autocomplete list mode, 
// the AutocompleteField handles adding/removing names. 
// But we might want specific controls for the items in the list below.

</script>

<template>
    <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2" v-if="!hideLabel">
            <label class="text-sm font-semibold text-surface-700 dark:text-surface-200"
                :class="{ 'text-primary-600 dark:text-primary-400': highlight }">
                {{ label }}
            </label>
            <Info v-if="tooltip" class="text-surface-400 w-3.5 h-3.5" v-tooltip.top="tooltip" />
        </div>

        <AutocompleteField :modelValue="modelValue.map(i => i.name)" @update:modelValue="updateList"
            :data-source="dataSource" :placeholder="placeholder || `Search ${label}...`" />

        <div v-if="modelValue.length > 0" class="flex flex-col gap-2 mt-1">
            <div v-for="(item, index) in modelValue" :key="item.name"
                class="group flex flex-col gap-2 p-3 rounded-lg bg-surface-50 dark:bg-surface-800/40 border border-transparent hover:border-surface-300 dark:hover:border-surface-600 transition-all relative pl-3">
                <!-- Left accent bar -->
                <div
                    class="absolute left-0 top-3 bottom-3 w-1 bg-surface-200 dark:bg-surface-700 rounded-r transition-colors group-hover:bg-primary-500">
                </div>

                <div class="flex items-center justify-between gap-3 pl-2">
                    <div class="text-sm font-bold text-surface-800 dark:text-surface-100 truncate">{{ item.name }}</div>
                    <div class="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <slot name="actions" :item="item" :index="index" :update="updateItem">
                            <!-- Default actions if needed -->
                        </slot>
                        <NotesButton :modelValue="item.note" @update:modelValue="v => updateItem(index, 'note', v)"
                            type="note" class="w-7 h-7" />
                    </div>
                </div>

                <!-- Extra Fields Slot -->
                <div class="flex flex-col gap-2 pl-2" v-if="$slots.extra">
                    <slot name="extra" :item="item" :index="index" :update="updateItem"></slot>
                </div>
            </div>
        </div>
    </div>
</template>
