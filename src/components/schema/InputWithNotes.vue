<script setup lang="ts">
import { computed } from 'vue';
import InputText from 'primevue/inputtext';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import NotesButton from '../NotesButton.vue';

const props = defineProps<{
    modelValue: Record<string, any>; // The parent object (e.g. input)
    field: string; // The base key e.g. 'playstationConnectionModes'
    label?: string;
    placeholder?: string;
    icon?: any;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', val: Record<string, any>): void;
}>();

const updateProperty = (key: string, value: any) => {
    const newState = { ...props.modelValue, [key]: value };
    emit('update:modelValue', newState);
};

const value = computed({
    get: () => props.modelValue?.[props.field],
    set: (val) => updateProperty(props.field, val)
});

const notes = computed({
    get: () => props.modelValue?.[props.field + 'Notes'] ?? '',
    set: (val) => updateProperty(props.field + 'Notes', val)
});

// Stable id derived from the field key for label/input association
const inputId = computed(() => `iwn-${props.field.replace(/[^a-zA-Z0-9_-]/g, '-')}`);
</script>

<template>
    <div class="flex flex-col gap-2">
        <label v-if="label" :for="inputId" class="text-sm font-medium text-surface-600 dark:text-surface-300 flex items-center gap-2">
            <component :is="icon" class="w-4 h-4 text-primary-500" v-if="icon" />
            {{ label }}
        </label>
        <InputGroup class="h-10"> <!-- Standard height for inputs -->
            <InputText :id="inputId" v-model="value" :placeholder="placeholder" class="w-full" />
            <InputGroupAddon class="p-0 min-w-[3rem]">
                <NotesButton v-model="notes" type="note" class="w-full h-full !rounded-none !border-none" />
            </InputGroupAddon>
        </InputGroup>
    </div>
</template>
