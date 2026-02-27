<script setup lang="ts">
import { computed } from 'vue';
import Select from 'primevue/select';

export type RatingValue = 'true' | 'limited' | 'always on' | 'false' | 'hackable' | 'n/a' | 'unknown';

interface Props {
    disableAlwaysOn?: boolean;
}

const props = defineProps<Props>();
const model = defineModel<RatingValue>({ required: true });

// Icons
import iconTcTrue from '../assets/icons/tc-true.svg';
import iconTcFalse from '../assets/icons/tc-false.svg';
import iconTcUnknown from '../assets/icons/tc-unknown.svg';
import iconTcHackable from '../assets/icons/tc-hackable.svg';
import iconTcNa from '../assets/icons/tc-not-applicable.svg';

const iconTcLimited = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 250 250'%3E%3Ccircle cx='125' cy='125' r='121' fill='%231db288'/%3E%3Cpath fill='%23fff' d='m121,189c-4,5-7,8.5-14,8.5-14,0-61-51-63-57-2,-6 4,-10 8-12 9-5 17.5,1 23,7.5 25.5,33 34,13.5 51-11l41.5-61c5.5-7.5 13,-11.5 22.5-5 7.5,5.5 6,12 2,18.5z'/%3E%3Cpath style='fill:%23ffffff;stroke:%23f89842;stroke-width:8.22652245' d='m 116.89174,180.43528 8.9032,-27.4839 c 20.516,7.2261 35.4192,13.4841 44.7096,18.7742 -2.4517,-23.3545 -3.742,-39.419 -3.871,-48.1935 h 28.0645 c -0.3872,12.7745 -1.8711,28.7744 -4.4516,48 13.2902,-6.7095 28.516,-12.903 45.6773,-18.5807 l 8.9033,27.4839 c -16.3872,5.4195 -32.4517,9.0324 -48.1935,10.8387 7.8708,6.8389 18.9676,19.0324 33.2903,36.5806 l -23.2258,16.4515 c -7.484,-10.1933 -16.3227,-24.0642 -26.5161,-41.6128 -9.5484,18.1937 -17.9355,32.0647 -25.1613,41.6128 l -22.8386,-16.4515 c 14.9676,-18.4514 25.6773,-30.6449 32.129,-36.5806 -16.6452,-3.2256 -32.4516,-6.8385 -47.4193,-10.8387 z'/%3E%3C/svg%3E";
const iconTcAlwaysOn = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 250 250'%3E%3Ccircle cx='125' cy='125' r='121' fill='%23a0a11c'/%3E%3Crect ry='35.501' rx='35.501' height='106.501' width='71.001' y='62.874' x='89.499' fill='none' stroke='%23fff' stroke-width='17.75'/%3E%3Crect ry='8.875' rx='8.875' height='88.751' width='106.501' y='107.25' x='71.749' fill='%23fff'/%3E%3C/svg%3E";

// SVG icons map to src
const icons: Record<RatingValue, string> = {
    'true': iconTcTrue,
    'limited': iconTcLimited,
    'always on': iconTcAlwaysOn,
    'false': iconTcFalse,
    'hackable': iconTcHackable,
    'n/a': iconTcNa,
    'unknown': iconTcUnknown,
};

const labels: Record<RatingValue, string> = {
    'true': 'True',
    'limited': 'Limited',
    'always on': 'Always On',
    'false': 'False',
    'hackable': 'Hackable',
    'n/a': 'N/A',
    'unknown': 'Unknown',
};

const descriptions: Record<RatingValue, string> = {
    'true': 'Feature is available and configurable natively (in-game or through launcher/config tool)',
    'limited': 'Feature is available but in a limited way (limited support or limited configuration options)',
    'always on': 'Feature is always active and cannot be configured natively by the user',
    'false': 'Feature is not present and cannot be configured natively',
    'hackable': 'Feature can be added/configured via modifications, console commands, or other workarounds',
    'n/a': 'This concept does not apply to this type of game',
    'unknown': 'Support for this feature has not been verified (default)',
};

const options = computed(() => {
    const allOptions: RatingValue[] = ['true', 'limited', 'always on', 'false', 'hackable', 'n/a', 'unknown'];
    return props.disableAlwaysOn
        ? allOptions.filter(opt => opt !== 'always on')
        : allOptions;
});

const optionItems = computed(() => {
    return options.value.map(value => ({
        label: labels[value],
        value: value,
        icon: icons[value],
        description: descriptions[value],
    }));
});

</script>

<template>
    <div class="rating-select-wrapper">
        <Select v-model="model" :options="optionItems" optionLabel="label" optionValue="value" class="min-w-[8rem]"
            size="small">
            <template #value="slotProps">
                <div v-if="slotProps.value" class="flex items-center gap-2">
                    <img :src="icons[slotProps.value as RatingValue]" :alt="slotProps.value" class="rating-icon" />
                    <span>{{ labels[slotProps.value as RatingValue] }}</span>
                </div>
                <span v-else>{{ slotProps.placeholder }}</span>
            </template>
            <template #option="slotProps">
                <div class="flex flex-col gap-1 py-1">
                    <div class="flex items-center gap-2">
                        <img :src="slotProps.option.icon" :alt="slotProps.option.label" class="rating-icon" />
                        <span class="font-medium">{{ slotProps.option.label }}</span>
                    </div>
                    <div class="text-xs text-surface-500 dark:text-surface-400 pl-6">
                        {{ slotProps.option.description }}
                    </div>
                </div>
            </template>
        </Select>
    </div>
</template>

<style scoped>
.rating-select-wrapper :deep(.rating-icon) {
    width: 20px;
    height: 20px;
    object-fit: contain;
    vertical-align: middle;
}
</style>