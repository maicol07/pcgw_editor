<script setup lang="ts">
import { computed } from 'vue';
import AutocompleteField from '../AutocompleteField.vue';
import NotesButton from '../NotesButton.vue';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';

interface TaxonomyValue {
    value: string;
    note?: string;
    ref?: string;
}

const props = defineProps<{
    modelValue: TaxonomyValue;
    label: string;
    dataSource?: string;
    placeholder?: string;
    tooltip?: string;
    highlight?: boolean;
    icon?: any;
    iconClass?: string;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: TaxonomyValue): void;
}>();

const arrayValue = computed(() => {
    const val = props.modelValue?.value || '';
    if (!val) return [];
    return val.split(',').map(s => s.trim()).filter(Boolean);
});

const updateArray = (newValue: string[]) => {
    const joined = newValue.join(', ');
    emit('update:modelValue', { ...props.modelValue, value: joined });
};

const updateNote = (note: string) => {
    emit('update:modelValue', { ...props.modelValue, note });
};
</script>

<template>
    <div class="flex flex-col gap-2">
        <InputGroup class="w-full">
            <AutocompleteField 
                :modelValue="arrayValue"
                @update:modelValue="updateArray"
                :data-source="(dataSource as any)"
                :placeholder="placeholder" 
                class="flex-1"
            />
            <InputGroupAddon class="p-0 min-w-[3rem]">
                <NotesButton :modelValue="modelValue?.note" @update:modelValue="updateNote" type="note" class="w-full h-full !rounded-none !border-none" />
            </InputGroupAddon>
        </InputGroup>
    </div>
</template>
