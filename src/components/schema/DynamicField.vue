<script setup lang="ts">
import { computed } from 'vue';
import { FieldDefinition } from '../../types/schema';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import MultiSelect from 'primevue/multiselect';
import Checkbox from 'primevue/checkbox';
import RatingRow from '../RatingRow.vue';
import GenericListForm from '../common/GenericListForm.vue';
import CoverImageField from '../common/CoverImageField.vue';
import AutocompleteField from '../AutocompleteField.vue';
// --- Heavy Forms (Loaded Synchronously initially, converting some to Async) ---
import { defineAsyncComponent } from 'vue';
const AvailabilityForm = defineAsyncComponent(() => import('../AvailabilityForm.vue'));
const DLCForm = defineAsyncComponent(() => import('../DLCForm.vue'));
const GameDataForm = defineAsyncComponent(() => import('../GameDataForm.vue'));
const SystemRequirementsForm = defineAsyncComponent(() => import('../../components/SystemRequirementsForm.vue'));
const LocalizationsForm = defineAsyncComponent(() => import('../../components/LocalizationsForm.vue'));
const OperatingSystemSupportForm = defineAsyncComponent(() => import('./OperatingSystemSupportForm.vue'));

import { getIconSrc } from '../../utils/icons';

import InfoboxDevelopersEditor from '../infobox/InfoboxDevelopersEditor.vue';
import InfoboxPublishersEditor from '../infobox/InfoboxPublishersEditor.vue';
import InfoboxEnginesEditor from '../infobox/InfoboxEnginesEditor.vue';
import InfoboxReleaseDates from '../infobox/InfoboxReleaseDates.vue';
const InfoboxReception = defineAsyncComponent(() => import('../infobox/InfoboxReception.vue'));
import TaxonomyField from '../infobox/TaxonomyField.vue';
import CompoundRatingField from './CompoundRatingField.vue';
import Textarea from 'primevue/textarea';
import { Info } from 'lucide-vue-next';
import InputChips from 'primevue/inputchips';
import StubValidator from '../StubValidator.vue';
// (AvailabilityForm moved to async above)
import VideoAnalysis from '../video/VideoAnalysis.vue';
import SectionGallery from '../SectionGallery.vue';
import InputWithNotes from './InputWithNotes.vue';
import WikitextEditor from '../common/WikitextEditor.vue';

// (Async components moved to top)

const props = defineProps<{
    field: FieldDefinition;
    modelValue: any;
    formModel?: any; // The entire form model for conditional logic
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: any): void;
}>();

// Map of available components
const componentMap: Record<string, any> = {
    'InputText': InputText,
    'Select': Select,
    'MultiSelect': MultiSelect,
    'Checkbox': Checkbox,
    'InputChips': InputChips,
    'RatingRow': RatingRow,
    'InfoboxListEditor': GenericListForm,
    'CoverImageField': CoverImageField,
    'Autocomplete': AutocompleteField,
    'GameDataForm': GameDataForm,
    'AvailabilityForm': AvailabilityForm,
    'DLCForm': DLCForm,
    'VideoAnalysis': VideoAnalysis,
    'SectionGallery': SectionGallery,
    'CompoundRatingField': CompoundRatingField,
    'OperatingSystemSupportForm': OperatingSystemSupportForm,
    'InputWithNotes': InputWithNotes,

    'SystemRequirementsForm': SystemRequirementsForm,
    'LocalizationsForm': LocalizationsForm,
    'InfoboxDevelopersEditor': InfoboxDevelopersEditor,
    'InfoboxPublishersEditor': InfoboxPublishersEditor,
    'InfoboxEnginesEditor': InfoboxEnginesEditor,
    'InfoboxReleaseDates': InfoboxReleaseDates,
    'InfoboxReception': InfoboxReception,
    'TaxonomyField': TaxonomyField,
    'Textarea': Textarea,
    'StubValidator': StubValidator,
    'WikitextEditor': WikitextEditor,
};

const resolvedComponent = computed(() => {
    return componentMap[props.field.component] || InputText;
});

const computedModelValue = computed(() => {
    if (props.field.component === 'MultiSelect' && typeof props.modelValue === 'string') {
        return props.modelValue ? props.modelValue.split(', ').map((s: string) => s.trim()) : [];
    }
    if (props.field.component === 'RatingRow') return undefined;
    return props.modelValue !== undefined ? props.modelValue : props.field.defaultValue;
});

// Calculate props for the child component
const boundProps = computed(() => {
    const defaultProps: Record<string, any> = {
        label: props.field.label,
        tooltip: props.field.description,
        ...props.field.componentProps
    };

    // Special adaptations for specific components
    if (props.field.component === 'RatingRow') {
        const obj = props.modelValue || {};
        return {
            label: props.field.label,
            value: obj.value,
            notes: obj.notes,
            ...defaultProps
        };
    }

    if (props.field.component === 'GameDataForm') {
        return {
            modelValue: props.modelValue,
        }
    }

    if (props.field.component === 'LocalizationsForm') {
        return {
            localizations: props.modelValue || props.field.defaultValue || [],
        }
    }

    if (props.field.component === 'InfoboxListEditor' || props.field.component === 'InfoboxDevelopersEditor' || props.field.component === 'InfoboxPublishersEditor') {
        return {
            label: props.field.label,
            ...defaultProps
        };
    }

    if (props.field.component === 'CoverImageField') {
        return {
            label: props.field.label,
            ...defaultProps
        }
    }

    if (props.field.component === 'Select') {
        return {
            placeholder: `Select ${props.field.label}`,
            optionLabel: 'label',
            optionValue: 'value',
            class: 'w-full',
            ...defaultProps,
        }
    }

    if (props.field.component === 'MultiSelect') {
        return {
            placeholder: `Select ${props.field.label}`,
            class: 'w-full',
            display: 'chip',
            filter: true,
            optionLabel: undefined,
            ...defaultProps,
        }
    }

    if (props.field.component === 'Autocomplete') {
        return {
            placeholder: `Select ${props.field.label}`,
            class: 'w-full',
            ...defaultProps,
        }
    }

    if (props.field.component === 'StubValidator') {
        return {
            formModel: props.formModel,
            ...defaultProps
        }
    }

    if (props.field.component === 'InputText' || props.field.component === 'InputChips' || props.field.component === 'Textarea') {
        return {
            placeholder: props.field.label,
            class: 'w-full',
            ...defaultProps
        };
    }


    if (props.field.component === 'WikitextEditor') {
        return {
            label: props.field.label,
            rows: props.field.componentProps?.rows,
            ...defaultProps
        };
    }

    if (props.field.component === 'Checkbox') {
        // PrimeVue Checkbox doesn't like extra props like 'label' or 'tooltip' being passed as attrs if they conflict or pollute
        // We only pass componentProps (binary, etc.)
        return {
            ...props.field.componentProps
        };
    }

    if (props.field.component === 'AvailabilityForm') {
        return {
            modelValue: props.modelValue || props.field.defaultValue || []
        }
    }

    if (props.field.component === 'DLCForm') {
        return {
            modelValue: props.modelValue || props.field.defaultValue || []
        }
    }

    if (props.field.component === 'VideoAnalysis') {
        return {
            modelValue: props.modelValue
        }
    }

    if (props.field.component === 'SectionGallery') {
        return {
            section: props.field.componentProps?.section,
            modelValue: props.modelValue || []
        }
    }

    if (props.field.component === 'InputWithNotes') {
        // Expects parent object as modelValue (like 'input' or 'gameData.input')
        // And 'field' prop in componentProps
        return {
            modelValue: props.modelValue,
            label: props.field.label,
            icon: props.field.icon,
            ...props.field.componentProps
        }
    }

    if (props.field.component === 'CompoundRatingField') {
        return {
            modelValue: props.modelValue,
            label: props.field.label,
            icon: props.field.icon,
            ...props.field.componentProps
        }
    }

    if (props.field.component === 'OperatingSystemSupportForm') {
        return {
            modelValue: props.modelValue,
        }
    }

    return defaultProps;
});

// Event handling
const handleModelValueUpdate = (val: any) => {
    if (props.field.component === 'MultiSelect' && Array.isArray(val)) {
        emit('update:modelValue', val.join(', '));
        return;
    }
    emit('update:modelValue', val);
};

const handleUpdateValue = (val: string) => {
    const current = typeof props.modelValue === 'object' ? props.modelValue : {};
    emit('update:modelValue', { ...current, value: val });
};

const handleUpdateNotes = (val: string) => {
    const current = typeof props.modelValue === 'object' ? props.modelValue : {};
    emit('update:modelValue', { ...current, notes: val });
};

const isVisible = computed(() => {
    if (props.field.showIf && props.formModel) {
        return props.field.showIf(props.formModel);
    }
    return true;
});
</script>

<template>
    <div class="dynamic-field flex w-full"
        :class="field.component === 'Checkbox' ? 'flex-row items-center gap-3' : 'flex-col gap-1'" v-if="isVisible">
        <!-- Label for simple inputs (RatingRow, CoverImage have their own label handling) -->
        <label
            v-if="!['RatingRow', 'InfoboxListEditor', 'GameDataForm', 'AvailabilityForm', 'CompoundRatingField', 'StubValidator', 'Checkbox', 'InputWithNotes', 'InfoboxReception'].includes(field.component)"
            class="text-sm font-medium text-surface-600 dark:text-surface-300 flex items-center gap-2">
            <component :is="field.icon" class="w-4 h-4" :class="field.iconClass || 'text-primary-500'"
                v-if="field.icon" />
            {{ field.label }}
            <span v-if="field.description" v-tooltip.top="field.description"
                class="ml-auto text-surface-400 hover:text-primary-500 cursor-help">
                <Info class="w-3.5 h-3.5" />
            </span>
        </label>

        <component :is="resolvedComponent" v-bind="boundProps" :modelValue="computedModelValue"
            @update:modelValue="handleModelValueUpdate" @update:value="handleUpdateValue"
            @update:notes="handleUpdateNotes" class="w-full" :class="{ '!w-auto': field.component === 'Checkbox' }">

            <template v-if="['MultiSelect'].includes(field.component) && field.componentProps?.showIcons"
                #value="slotProps">
                <div class="flex items-center gap-1 flex-nowrap overflow-hidden w-full"
                    v-if="slotProps.value && slotProps.value.length">
                    <div v-for="option in slotProps.value" :key="option"
                        class="flex items-center bg-surface-100 dark:bg-surface-700 rounded px-1.5 py-0.5 gap-1 shrink-0">
                        <img v-if="getIconSrc(option)" :src="getIconSrc(option)" :alt="option" class="w-3.5 h-3.5" />
                        <span class="text-xs">{{ option }}</span>
                    </div>
                </div>
                <!-- Default placeholder handling if needed, though PrimeVue usually handles it -->
                <span v-else class="text-surface-400 text-sm">{{ slotProps.placeholder }}</span>
            </template>
            <template v-if="['MultiSelect'].includes(field.component) && field.componentProps?.showIcons"
                #option="slotProps">
                <div class="flex items-center">
                    <img v-if="getIconSrc(slotProps.option)" :src="getIconSrc(slotProps.option)" :alt="slotProps.option"
                        class="w-4 h-4 mr-2" />
                    <span class="text-sm">{{ slotProps.option }}</span>
                </div>
            </template>

            <!-- Pass children slots if any (e.g. for Select options) -->
            <template v-if="['Select'].includes(field.component)" #option="slotProps">
                <div class="flex flex-col gap-1 py-1">
                    <span class="font-medium">{{ slotProps.option.label || slotProps.option }}</span>
                    <span v-if="slotProps.option.description" class="text-xs text-surface-500 dark:text-surface-400">{{
                        slotProps.option.description }}</span>
                </div>
            </template>
        </component>

        <!-- Inline Label for Checkbox -->
        <label v-if="field.component === 'Checkbox'"
            class="text-sm font-medium text-surface-700 dark:text-surface-200 flex items-center gap-2 cursor-pointer"
            @click="handleModelValueUpdate(!modelValue)">
            <component :is="field.icon" class="w-4 h-4" :class="field.iconClass || 'text-primary-500'"
                v-if="field.icon" />
            {{ field.label }}
            <span v-if="field.description" v-tooltip.top="field.description"
                class="text-surface-400 hover:text-primary-500 cursor-help ml-1">
                <Info class="w-3.5 h-3.5" />
            </span>
        </label>
    </div>
</template>
