<script setup lang="ts">
import Select from 'primevue/select';
import MultiSelect from 'primevue/multiselect';
import InputText from 'primevue/inputtext';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import NotesButton from './NotesButton.vue';
import { Info } from 'lucide-vue-next';
import { computed } from 'vue';

import { getIconSrc } from '../utils/icons';

const props = defineProps<{
  label: string;
  value?: string;
  notes?: string;
  reference?: string;
  options?: string[];
  icon?: any;
  title?: string;
  compact?: boolean;
  freeText?: boolean;
  tooltip?: string;
  multiple?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:value', value: string): void;
  (e: 'update:notes', value: string): void;
  (e: 'update:reference', value: string): void;
}>();

const defaultOptions = ['true', 'false', 'unknown', 'hackable', 'limited', 'always on', 'n/a'];
const ratingOptions = computed(() => props.options || defaultOptions);

// Handle multiple values (comma separated string <-> array)
const multiValue = computed({
  get: () => {
    if (!props.value) return [];
    return props.value.split(',').map(s => s.trim()).filter(Boolean);
  },
  set: (val: string[]) => {
    emit('update:value', val.join(', '));
  }
});

// Compute styles based on value for visual feedback
const statusColor = computed(() => {
  if (props.freeText || props.multiple) return 'text-surface-600 dark:text-surface-400';
  switch (props.value?.toLowerCase()) {
    case 'true': return 'text-green-600 dark:text-green-400';
    case 'false': return 'text-red-600 dark:text-red-400';
    case 'hackable': return 'text-yellow-600 dark:text-yellow-400';
    case 'limited': return 'text-orange-600 dark:text-orange-400';
    // Add specific colors for inputs if needed, or default
    default: return 'text-surface-600 dark:text-surface-400';
  }
});
</script>

<template>
  <div>
    <InputGroup class="h-8">
      <InputGroupAddon class="!justify-start font-medium text-sm bg-surface-50 dark:bg-surface-800 transition-all gap-2"
        :class="[statusColor, compact ? 'w-28 text-xs' : 'w-48']" :title="label">
        <component v-if="icon" :is="icon" class="w-4 h-4 text-surface-400 group-hover:text-primary-500" />
        <span class="truncate">{{ label }}</span>
        <Info v-if="tooltip" class="w-3.5 h-3.5 text-surface-400 hover:text-primary-500 cursor-help shrink-0"
          v-tooltip.top="tooltip" />
      </InputGroupAddon>

      <InputText v-if="freeText" :modelValue="value" @update:modelValue="emit('update:value', $event || '')"
        class="w-full rounded-none! border-l-0! border-r-0!" :placeholder="label + '...'" />

      <MultiSelect v-else-if="multiple" v-model="multiValue" :options="ratingOptions"
        class="w-full rounded-none! border-l-0! border-r-0! flex items-center" placeholder="Select..." display="chip"
        :maxSelectedLabels="3">
        <template #value="slotProps">
          <div class="flex items-center gap-1 flex-nowrap overflow-hidden w-full"
            v-if="slotProps.value && slotProps.value.length">
            <div v-for="option in slotProps.value" :key="option"
              class="flex items-center bg-surface-100 dark:bg-surface-700 rounded px-1.5 py-0.5 gap-1 shrink-0">
              <img v-if="getIconSrc(option)" :src="getIconSrc(option)" :alt="option" class="w-3.5 h-3.5" />
              <span class="text-xs">{{ option }}</span>
            </div>
          </div>
          <span v-else class="text-surface-400 text-sm">{{ slotProps.placeholder }}</span>
        </template>
        <template #option="slotProps">
          <div class="flex items-center">
            <img v-if="getIconSrc(slotProps.option)" :src="getIconSrc(slotProps.option)" :alt="slotProps.option"
              class="w-4 h-4 mr-2" />
            <span class="text-sm">{{ slotProps.option }}</span>
          </div>
        </template>
      </MultiSelect>

      <Select v-else :modelValue="value" @update:modelValue="emit('update:value', $event)" :options="ratingOptions"
        class="w-full rounded-none! border-l-0! border-r-0!" placeholder="Select...">
        <template #value="slotProps">
          <div class="flex items-center" v-if="slotProps.value">
            <img v-if="getIconSrc(slotProps.value)" :src="getIconSrc(slotProps.value)" :alt="slotProps.value"
              class="w-4 h-4 mr-2" />
            <span class="text-sm">{{ slotProps.value }}</span>
          </div>
          <span v-else class="text-surface-400 text-sm">{{ slotProps.placeholder }}</span>
        </template>
        <template #option="slotProps">
          <div class="flex items-center">
            <img v-if="getIconSrc(slotProps.option)" :src="getIconSrc(slotProps.option)" :alt="slotProps.option"
              class="w-4 h-4 mr-2" />
            <span class="text-sm">{{ slotProps.option }}</span>
          </div>
        </template>
      </Select>
      <InputGroupAddon class="p-0 min-w-12">
        <NotesButton :notes="notes" :reference="reference" @update:notes="emit('update:notes', $event)"
          @update:reference="emit('update:reference', $event)" class="w-full h-full rounded-none! border-none!" />
      </InputGroupAddon>
    </InputGroup>
  </div>
</template>
