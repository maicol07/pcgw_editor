<script setup lang="ts">
import { computed } from 'vue';
import AutocompleteField from '../AutocompleteField.vue';
import NotesButton from '../NotesButton.vue';

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
        <div class="flex items-center w-full">
            <AutocompleteField :modelValue="arrayValue" @update:modelValue="updateArray"
                :data-source="(dataSource as any)" :placeholder="placeholder" class="flex-1 min-w-0 taxonomy-input" />
            <NotesButton :modelValue="modelValue?.note" @update:modelValue="updateNote" type="note"
                class="border border-surface-300 dark:border-surface-600 rounded-r-md bg-surface-50 dark:bg-surface-800 flex items-center justify-center w-10 h-10 shrink-0 shadow-sm hover:border-surface-400 dark:hover:border-surface-500 transition-colors -ml-px z-0" />
        </div>
    </div>
</template>

<style scoped>
:deep(.taxonomy-input .p-multiselect),
:deep(.taxonomy-input .p-autocomplete),
:deep(.taxonomy-input .p-inputtext) {
    border-top-right-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
}

/* Force center the icon inside the button */
/* Force center the icon inside the button */
:deep(button svg) {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    margin-top: 3px;
}
</style>
