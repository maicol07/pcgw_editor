<script setup lang="ts">
import { computed } from 'vue';
import RatingRow from '../RatingRow.vue'; // Check path

const props = defineProps<{
    modelValue: Record<string, any>;
    field: string; // The base key e.g. 'separateVolume'
    label?: string;
    icon?: any;
    iconClass?: string;
    tooltip?: string;
    notesField?: string;
    refField?: string;
    freeText?: boolean;
    compact?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', val: Record<string, any>): void;
}>();

// Helper to update a single property in the object and emit the new object
const updateProperty = (key: string, value: any) => {
    // Deep clone to ensure we don't mutate props and lose reactivity or cause proxy issues
    const current = props.modelValue ? JSON.parse(JSON.stringify(props.modelValue)) : {};
    const newState = { ...current, [key]: value };
    emit('update:modelValue', newState);
};

const value = computed({
    get: () => props.modelValue?.[props.field],
    set: (val) => updateProperty(props.field, val)
});

const notes = computed({
    get: () => props.modelValue?.[props.notesField || (props.field + 'Notes')] ?? '',
    set: (val) => updateProperty(props.notesField || (props.field + 'Notes'), val)
});

const reference = computed({
    get: () => props.modelValue?.[props.refField || (props.field + 'Ref')] ?? '',
    set: (val) => updateProperty(props.refField || (props.field + 'Ref'), val)
});
</script>

<template>
    <RatingRow 
        v-bind="$attrs"
        :label="label"
        :tooltip="tooltip"
        :icon="icon"
        v-model:value="value"
        v-model:notes="notes"
        v-model:reference="reference"
        :free-text="freeText"
        :compact="compact"
    />
</template>
