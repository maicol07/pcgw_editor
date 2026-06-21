<script setup lang="ts">
import { computed, watch } from 'vue';
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
const IssuesForm = defineAsyncComponent(() => import('./IssuesForm.vue'));

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
import AutoComplete from 'primevue/autocomplete';
import StubValidator from '../StubValidator.vue';
// (AvailabilityForm moved to async above)
import VideoAnalysis from '../video/VideoAnalysis.vue';
import SectionGallery from '../SectionGallery.vue';
import InputWithNotes from './InputWithNotes.vue';
import WikitextEditor from '../common/WikitextEditor.vue';
import WysiwygEditor from '../common/WysiwygEditor.vue';

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
    'InputChips': AutoComplete,
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
    'IssuesForm': IssuesForm,
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
    'WysiwygEditor': WysiwygEditor,
};

const resolvedComponent = computed(() => {
    return componentMap[props.field.component] || InputText;
});

// Stable id derived from the field key for label/input association
const fieldId = computed(() => `field-${props.field.key.replace(/[^a-zA-Z0-9_-]/g, '-')}`);

const isIgdbField = computed(() => props.field.key === 'links.igdb');

const igdbReceptionEntry = computed(() => {
    if (!isIgdbField.value || !props.formModel || !props.formModel.reception) {
        return null;
    }
    return props.formModel.reception.find((r: any) => r.aggregator === 'IGDB');
});

const isIgdbDisabled = computed(() => !!igdbReceptionEntry.value);

const computedDescription = computed(() => {
    if (isIgdbDisabled.value) {
        return 'This field is automatically compiled from the IGDB entry in the Reception section.';
    }
    return props.field.description;
});

if (props.field.key === 'links.igdb') {
    watch(() => igdbReceptionEntry.value ? igdbReceptionEntry.value.id : null, (newId) => {
        if (newId !== null && props.modelValue !== newId) {
            emit('update:modelValue', newId);
        }
    }, { immediate: true });
}

const computedModelValue = computed(() => {
    if (props.field.component === 'MultiSelect' && typeof props.modelValue === 'string') {
        return props.modelValue ? props.modelValue.split(', ').map((s: string) => s.trim()) : [];
    }

    if (isIgdbDisabled.value && igdbReceptionEntry.value) {
        return igdbReceptionEntry.value.id || '';
    }

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

    if (props.field.component === 'InfoboxDevelopersEditor' || props.field.component === 'InfoboxPublishersEditor') {
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



    if (props.field.component === 'StubValidator') {
        return {
            formModel: props.formModel,
            ...defaultProps
        }
    }

    if (props.field.component === 'InputText' || props.field.component === 'Textarea') {
        const extraProps: Record<string, any> = {};
        if (isIgdbDisabled.value) {
            extraProps.disabled = true;
        }
        return {
            // Empty inputs hint their purpose via the description; explicit componentProps.placeholder still wins.
            placeholder: props.field.description || props.field.label,
            class: 'w-full',
            ...defaultProps,
            ...extraProps
        };
    }

    if (props.field.component === 'InputChips') {
        // InputChips deprecated in PrimeVue v4 → AutoComplete in multiple + typeahead-off mode (same string[] v-model)
        return {
            multiple: true,
            typeahead: false,
            placeholder: props.field.label,
            class: 'w-full',
            ...(isIgdbDisabled.value ? { disabled: true } : {}),
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

    if (props.field.component === 'WysiwygEditor') {
        return {
            label: props.field.label,
            description: props.field.description,
            icon: props.field.icon,
            placeholder: props.field.componentProps?.placeholder,
            editorStyle: props.field.componentProps?.editorStyle,
            readonly: props.field.componentProps?.readonly,
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

    if (props.field.component === 'IssuesForm') {
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
    <div class="dynamic-field flex flex-col gap-1 w-full" v-if="isVisible">
        <!-- Checkbox rendered as a self-contained toggle card (icon + label + description) -->
        <label v-if="field.component === 'Checkbox'"
            class="flex items-start gap-3 w-full h-full p-3 rounded-lg border cursor-pointer transition-colors select-none"
            :class="computedModelValue
                ? 'border-primary-300 bg-primary-50/60 dark:border-primary-500/40 dark:bg-primary-500/10'
                : 'border-surface-200/70 dark:border-surface-700/55 hover:bg-surface-50 dark:hover:bg-surface-800/40'">
            <Checkbox :inputId="fieldId" binary :modelValue="computedModelValue"
                @update:modelValue="handleModelValueUpdate" class="mt-0.5 shrink-0" />
            <span class="flex flex-col gap-0.5 min-w-0">
                <span class="flex items-center gap-2 text-sm font-semibold text-surface-800 dark:text-surface-100">
                    <component :is="field.icon" class="w-4 h-4 shrink-0" :class="field.iconClass || 'text-primary-500'"
                        v-if="field.icon" />
                    {{ field.label }}
                </span>
                <span v-if="field.description" class="text-xs text-surface-500 dark:text-surface-400 leading-snug">
                    {{ field.description }}
                </span>
            </span>
        </label>

        <!-- Label for simple inputs (RatingRow, CoverImage have their own label handling) -->
        <label
            v-if="!['GameDataForm', 'AvailabilityForm', 'CompoundRatingField', 'StubValidator', 'Checkbox', 'InfoboxReception', 'SectionGallery', 'VideoAnalysis', 'IssuesForm', 'WysiwygEditor'].includes(field.component)"
            :for="fieldId"
            class="text-sm font-medium text-surface-600 dark:text-surface-300 flex items-center gap-2">
            <component :is="field.icon" class="w-4 h-4" :class="field.iconClass || 'text-primary-500'"
                v-if="field.icon" />
            {{ field.label }}
            <span v-if="computedDescription" v-tooltip.top="computedDescription"
                class="ml-auto text-surface-400 hover:text-primary-500 cursor-help">
                <Info class="w-4 h-4" />
            </span>
        </label>

        <component v-if="field.component !== 'Checkbox'" :is="resolvedComponent" v-bind="boundProps" :inputId="fieldId" :id="fieldId" :modelValue="computedModelValue"
            @update:modelValue="handleModelValueUpdate" @update:value="handleUpdateValue"
            @update:notes="handleUpdateNotes" class="w-full">

            <template v-if="['MultiSelect'].includes(field.component) && (field.componentProps as any)?.showIcons"
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
            <template v-if="['MultiSelect'].includes(field.component) && (field.componentProps as any)?.showIcons"
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

        <!-- Inline Helper Text for Disabled IGDB Field -->
        <span v-if="isIgdbDisabled" class="text-xs text-surface-500 dark:text-surface-400 mt-1">
            This field is automatically compiled from the IGDB entry in the Reception section.
        </span>

    </div>
</template>
