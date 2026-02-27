<script setup lang="ts">
import GenericListForm, { ListItem } from '../common/GenericListForm.vue';
import { DataSource } from '../AutocompleteField.vue';
import InputText from 'primevue/inputtext';

const model = defineModel<ListItem[]>({ default: () => [] });
</script>

<template>
    <GenericListForm v-bind="$attrs" v-model="model" :label="$attrs.label as string || 'Publishers'" :hideLabel="true"
        :dataSource="($attrs.dataSource as DataSource) || 'companies'" :placeholder="$attrs.placeholder as string">
        <template #extra="{ item, index, update }">
            <span class="text-[10px] uppercase font-bold text-surface-500">Subtitle</span>
            <InputText :modelValue="item.extra || ''" @update:modelValue="v => update(index, 'extra', v)"
                placeholder="Subtitle" class="text-xs p-1 h-8" />
        </template>
    </GenericListForm>
</template>
