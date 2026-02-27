<script setup lang="ts">
import { GameInfobox } from '../../models/GameData';
import AutocompleteField from '../AutocompleteField.vue';
import { Tag, Gamepad2, Settings2, ShieldCheck, DollarSign } from 'lucide-vue-next';

const model = defineModel<GameInfobox['taxonomy']>({ required: true });

const getFieldValue = (key: string) => {
    return model.value[key as keyof GameInfobox['taxonomy']] as unknown as string[];
};

const updateField = (key: string, value: any) => {
    model.value = {
        ...model.value,
        [key]: value
    };
};

const taxonomyGroups = [
    {
        icon: DollarSign,
        label: 'Monetization',
        color: 'text-green-500',
        fields: [
            { key: 'monetization', label: 'Monetization', source: 'monetization' },
            { key: 'microtransactions', label: 'Microtransactions', source: 'microtransactions' },
        ]
    },
    {
        icon: Gamepad2,
        label: 'Gameplay',
        color: 'text-purple-500',
        fields: [
            { key: 'modes', label: 'Modes', source: 'modes' },
            { key: 'pacing', label: 'Pacing', source: 'pacing' },
            { key: 'perspectives', label: 'Perspectives', source: 'perspectives' },
            { key: 'controls', label: 'Controls', source: 'controls' },
        ]
    },
    {
        icon: Tag,
        label: 'Classification',
        color: 'text-blue-500',
        fields: [
            { key: 'genres', label: 'Genres', source: 'genres' },
            { key: 'sports', label: 'Sports', source: 'sports' },
            { key: 'vehicles', label: 'Vehicles', source: 'vehicles' },
            { key: 'artStyles', label: 'Art Styles', source: 'artStyles' },
            { key: 'themes', label: 'Themes', source: 'themes' },
        ]
    },
    {
        icon: Settings2,
        label: 'Series',
        color: 'text-orange-500',
        fields: [
            { key: 'series', label: 'Series', source: 'series' }
        ]
    }
];

</script>

<template>
    <div class="flex flex-col gap-6">
        <div v-for="(group, idx) in taxonomyGroups" :key="idx" class="flex flex-col gap-3">
            <h4
                class="text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 flex items-center gap-2 border-b border-surface-100 dark:border-surface-800 pb-1">
                <component :is="group.icon" class="w-3 h-3" :class="group.color" /> {{ group.label }}
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div v-for="field in group.fields" :key="field.key" class="flex flex-col gap-1">
                    <label class="text-xs font-medium text-surface-500 dark:text-surface-400">{{ field.label }}</label>
                    <AutocompleteField :modelValue="getFieldValue(field.key)"
                        @update:modelValue="v => updateField(field.key, v)" :data-source="field.source"
                        :placeholder="'Select ' + field.label..." class="w-full" />
                </div>
            </div>
        </div>
    </div>
</template>
