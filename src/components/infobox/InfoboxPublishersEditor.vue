<script setup lang="ts">
import GenericListForm, { ListItem } from '../common/GenericListForm.vue';
import { DataSource } from '../AutocompleteField.vue';
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
        :label="label || 'Publishers'"
        :hideLabel="true"
        :dataSource="dataSource || 'companies'"
        :placeholder="placeholder"
    >
        <template #extra="{ item, index, update }">
             <span class="text-[10px] uppercase font-bold text-surface-500">Subtitle</span>
             <InputText 
                :modelValue="item.extra || ''" 
                @update:modelValue="v => update(index, 'extra', v)" 
                placeholder="Subtitle" 
                class="text-xs p-1 h-8" 
            />
        </template>
    </GenericListForm>
</template>
