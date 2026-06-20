<script setup lang="ts">
import GenericListForm, { ListItem } from '../common/GenericListForm.vue';
import { DataSource } from '../AutocompleteField.vue';
import Checkbox from 'primevue/checkbox';
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
    <GenericListForm v-bind="$attrs" v-model="model" :label="$attrs.label as string || 'Developers'" :hideLabel="true"
        :dataSource="($attrs.dataSource as DataSource) || 'companies'" :placeholder="$attrs.placeholder as string">
        <template #actions="{ item, index, update }">
            <div class="h-4 w-px bg-surface-300 dark:bg-surface-600 mx-1"></div>
            <label class="text-xs uppercase font-bold text-surface-400 cursor-pointer"
                :for="'porter-' + index">Porter</label>
            <Checkbox :inputId="'porter-' + index" :modelValue="item.type === 'porter'"
                @update:modelValue="v => update(index, 'type', v ? 'porter' : 'developer')" :binary="true" />
        </template>
        <template #extra="{ item, index, update }">
            <span class="text-xs uppercase font-bold text-surface-500">{{ item.type === 'porter' ? 'OS' : 'Subtitle'
                }}</span>
            <InputText :modelValue="item.extra || ''" @update:modelValue="v => update(index, 'extra', v)"
                :placeholder="item.type === 'porter' ? 'e.g. Linux' : 'e.g. Main game'" class="text-xs p-1 h-8" />
        </template>
    </GenericListForm>
    </div>
</template>
