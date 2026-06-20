<script setup lang="ts">
import GenericListForm, { ListItem } from '../common/GenericListForm.vue';
import { DataSource } from '../AutocompleteField.vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { ArrowDownAZ } from 'lucide-vue-next';

const model = defineModel<ListItem[]>({ default: () => [] });

const sortAZ = () => {
    model.value = [...model.value].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
};
</script>

<template>
    <div class="flex flex-col gap-2">
    <div v-if="model.length > 1" class="flex justify-end">
        <Button label="Sort A–Z" severity="secondary" text size="small" class="text-xs h-7" @click="sortAZ">
            <template #icon><ArrowDownAZ class="w-3.5 h-3.5" /></template>
        </Button>
    </div>
    <GenericListForm v-bind="$attrs" v-model="model" :label="$attrs.label as string || 'Publishers'" :hideLabel="true"
        :dataSource="($attrs.dataSource as DataSource) || 'companies'" :placeholder="$attrs.placeholder as string">
        <template #extra="{ item, index, update }">
            <span class="text-xs uppercase font-bold text-surface-500">Subtitle</span>
            <InputText :modelValue="item.extra || ''" @update:modelValue="v => update(index, 'extra', v)"
                placeholder="Subtitle" class="text-xs p-1 h-8" />
        </template>
    </GenericListForm>
    </div>
</template>
