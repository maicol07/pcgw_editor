<script setup lang="ts">
import { computed } from 'vue';
import Select from 'primevue/select';
import { type RatingValue, ratingMetadata } from '../utils/ratings';

interface Props {
    disableAlwaysOn?: boolean;
}

const props = defineProps<Props>();
const model = defineModel<RatingValue>({ required: true });

const options = computed(() => {
    const allOptions: RatingValue[] = ['true', 'limited', 'always on', 'false', 'hackable', 'n/a', 'unknown'];
    return props.disableAlwaysOn
        ? allOptions.filter(opt => opt !== 'always on')
        : allOptions;
});

const optionItems = computed(() => {
    return options.value.map(value => ({
        value,
        ...ratingMetadata[value]
    }));
});

</script>

<template>
    <div class="rating-select-wrapper">
        <Select v-model="model" :options="optionItems" optionLabel="label" optionValue="value" class="min-w-32"
            size="small">
            <template #value="slotProps">
                <div v-if="slotProps.value" class="flex items-center gap-2">
                    <img :src="ratingMetadata[slotProps.value as RatingValue].icon" :alt="slotProps.value" class="w-5 h-5 shrink-0 object-contain" />
                    <span class="leading-none mt-0.5">{{ ratingMetadata[slotProps.value as RatingValue].label }}</span>
                </div>
                <span v-else>{{ slotProps.placeholder }}</span>
            </template>
            <template #option="slotProps">
                <div class="flex flex-col gap-1 py-1">
                    <div class="flex items-center gap-2">
                        <img :src="slotProps.option.icon" :alt="slotProps.option.label" class="w-5 h-5 shrink-0 object-contain" />
                        <span class="font-medium leading-none mt-0.5">{{ slotProps.option.label }}</span>
                    </div>
                    <div class="text-xs text-surface-500 dark:text-surface-400 pl-7 leading-tight">
                        {{ slotProps.option.description }}
                    </div>
                </div>
            </template>
        </Select>
    </div>
</template>