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
    <div class="flex flex-col gap-2">
        <div class="flex items-center gap-1" v-if="!hideLabel">
            <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="{'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/10 px-1 rounded': highlight}">
                {{ label }}
            </label>
            <Info v-if="tooltip" class="text-surface-400 w-3 h-3" v-tooltip.top="tooltip" />
        </div>
        
        <AutocompleteField 
            :modelValue="modelValue.map(i => i.name)" 
            @update:modelValue="updateList"
            :data-source="dataSource"
            :placeholder="placeholder || `Search ${label}...`"
        />

        <div v-if="modelValue.length > 0" class="flex flex-col gap-2 mt-2">
            <div 
                v-for="(item, index) in modelValue" 
                :key="item.name" 
                class="p-3 border border-surface-200 dark:border-surface-700 rounded bg-surface-50 dark:bg-surface-800/50 flex flex-col gap-3 transition-colors hover:border-blue-300 dark:hover:border-blue-700"
            >
                <div class="flex items-center justify-between gap-2">
                    <div class="text-xs font-bold">{{ item.name }}</div>
                    <div class="flex items-center gap-1">
                        <slot name="actions" :item="item" :index="index" :update="updateItem">
                            <!-- Default actions if needed -->
                        </slot>
                         <NotesButton :modelValue="item.note" @update:modelValue="v => updateItem(index, 'note', v)" type="note" class="w-7 h-7" />
                    </div>
                </div>
                
                <!-- Extra Fields Slot -->
                <div class="flex flex-col gap-1">
                    <slot name="extra" :item="item" :index="index" :update="updateItem"></slot>
                </div>
            </div>
        </div>
    </div>
</template>
