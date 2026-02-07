<script setup lang="ts">
import { computed } from 'vue';
import { GameInfobox } from '../models/GameData';
import { fieldsConfig } from '../config/fields';
import DynamicSection from './schema/DynamicSection.vue';

const props = defineProps<{
  modelValue: GameInfobox;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: GameInfobox): void;
}>();

// Find the Infobox schema definition
const infoboxSchema = computed(() => fieldsConfig.find(s => s.id === 'infobox'));

const handleUpdate = (newValue: any) => {
    emit('update:modelValue', newValue as GameInfobox);
};
</script>

<template>
    <div v-if="infoboxSchema" class="infobox-form-wrapper">
         <DynamicSection 
            :section="infoboxSchema" 
            :modelValue="modelValue" 
            @update:modelValue="handleUpdate"
         />
    </div>
    <div v-else class="p-4 text-red-500 border border-red-200 rounded">
         Error: Infobox schema configuration not found.
    </div>
</template>
