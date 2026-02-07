<script setup lang="ts">
import GenericListForm, { ListItem } from '../common/GenericListForm.vue';
import { DataSource } from '../AutocompleteField.vue';
import Checkbox from 'primevue/checkbox';
import InputText from 'primevue/inputtext';

const props = defineProps<{
    modelValue: ListItem[];
    label?: string;
    dataSource?: DataSource;
    placeholder?: string;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: ListItem[]): void;
}>();

const updateModel = (val: ListItem[]) => {
    emit('update:modelValue', val);
};
</script>

<template>
    <GenericListForm 
        v-bind="$attrs"
        :modelValue="modelValue"
        @update:modelValue="updateModel"
        :label="label || 'Developers'"
        :hideLabel="true"
        :dataSource="dataSource || 'companies'"
        :placeholder="placeholder"
    >
        <template #actions="{ item, index, update }">
             <div class="h-4 w-px bg-surface-300 dark:bg-surface-600 mx-1"></div>
             <label class="text-[10px] uppercase font-bold text-surface-400 cursor-pointer" :for="'porter-'+index">Porter</label>
             <Checkbox 
                :inputId="'porter-'+index"
                :modelValue="item.type === 'porter'" 
                @update:modelValue="v => update(index, 'type', v ? 'porter' : 'developer')" 
                :binary="true" 
            />
        </template>
        <template #extra="{ item, index, update }">
             <span class="text-[10px] uppercase font-bold text-surface-500">{{ item.type === 'porter' ? 'OS' : 'Subtitle' }}</span>
             <InputText 
                :modelValue="item.extra || ''" 
                @update:modelValue="v => update(index, 'extra', v)" 
                :placeholder="item.type === 'porter' ? 'e.g. Linux' : 'e.g. Main game'" 
                class="text-xs p-1 h-8" 
            />
        </template>
    </GenericListForm>
</template>
