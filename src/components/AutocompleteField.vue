<script setup lang="ts">
import { ref, watch } from 'vue';
import MultiSelect from 'primevue/multiselect';
import AutoComplete from 'primevue/autocomplete';
import { pcgwApi } from '../services/pcgwApi';

export type DataSource = 'companies' | 'engines' | 'series' | 'genres' | 'themes' | 'perspectives' | 'files' | 'pacing' | 'controls' | 'sports' | 'vehicles' | 'artStyles' | 'monetization' | 'microtransactions' | 'modes';

interface Props {
    modelValue: string | string[];
    dataSource: DataSource;
    multiple?: boolean;
    placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
    multiple: true,
    placeholder: 'Search...',
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: string[]): void;
}>();

const localValue = ref<any>(props.modelValue);

// Initialize suggestions with current value to ensure they are displayed
const initialSuggestions = Array.isArray(props.modelValue) ? props.modelValue : (props.modelValue ? [props.modelValue] : []);
const suggestions = ref<string[]>(initialSuggestions);
const loading = ref(false);
const searchTimeout = ref<number>();

watch(() => props.modelValue, (newVal) => {
    if (JSON.stringify(newVal) !== JSON.stringify(localValue.value)) {
        localValue.value = Array.isArray(newVal) ? [...newVal] : newVal;
    }
}, { deep: true });

watch(localValue, (newVal) => {
    if (JSON.stringify(newVal) !== JSON.stringify(props.modelValue)) {
        emit('update:modelValue', newVal);
    }
}, { deep: true });

/**
 * Filter function with debouncing for remote search
 */
const onFilter = async (event: { value?: string, query?: string }) => {
    const query = (event.value || event.query || '').trim();
    
    // Always include currently selected values in options for MultiSelect
    const selectedSet = new Set(Array.isArray(localValue.value) ? localValue.value : []);
    
    if (!query || query.length < 2) {
        if (props.multiple) {
            suggestions.value = Array.from(selectedSet);
        } else {
            suggestions.value = [];
        }
        return;
    }

    // Debounce API calls
    if (searchTimeout.value) {
        clearTimeout(searchTimeout.value);
    }

    searchTimeout.value = window.setTimeout(async () => {
        loading.value = true;
        
        try {
            let results: string[] = [];
            
            switch (props.dataSource) {
                case 'companies':
                    results = await pcgwApi.searchCompanies(query);
                    break;
                case 'engines':
                    results = await pcgwApi.searchEngines(query);
                    break;
                case 'series':
                    results = await pcgwApi.searchSeries(query);
                    break;
                case 'genres':
                    results = await pcgwApi.searchGenres(query);
                    break;
                case 'themes':
                    results = await pcgwApi.searchThemes(query);
                    break;
                case 'perspectives':
                    results = await pcgwApi.searchPerspectives(query);
                    break;
                case 'files':
                    results = await pcgwApi.searchFiles(query);
                    break;
                case 'pacing':
                    results = await pcgwApi.searchPacing(query);
                    break;
                case 'controls':
                    results = await pcgwApi.searchControls(query);
                    break;
                case 'sports':
                    results = await pcgwApi.searchSports(query);
                    break;
                case 'vehicles':
                    results = await pcgwApi.searchVehicles(query);
                    break;
                case 'artStyles':
                    results = await pcgwApi.searchArtStyles(query);
                    break;
                case 'monetization':
                    results = await pcgwApi.searchMonetizations(query);
                    break;
                case 'microtransactions':
                    results = await pcgwApi.searchMicrotransactions(query);
                    break;
                case 'modes':
                    results = await pcgwApi.searchModes(query);
                    break;
            }
            
            if (props.multiple) {
                // Merge results with selected values to prevent them from disappearing in MultiSelect
                const mergedSet = new Set([...results, ...selectedSet]);
                suggestions.value = Array.from(mergedSet);
            } else {
                suggestions.value = results;
            }
        } catch (error) {
            console.error('Autocomplete search error:', error);
            suggestions.value = props.multiple ? Array.from(selectedSet) : [];
        } finally {
            loading.value = false;
        }
    }, 300); // 300ms debounce
};
</script>

<template>
    <!-- Multiple Selection Mode -->
    <MultiSelect
        v-if="multiple"
        v-model="localValue"
        :options="suggestions"
        :loading="loading"
        :placeholder="placeholder"
        filter
        autoFilterFocus
        :filterMatchMode="'contains'"
        @filter="onFilter"
        class="w-full"
        display="chip"
        :showToggleAll="false"
    />

    <!-- Single Selection Mode -->
    <AutoComplete
        v-else
        v-model="localValue"
        :suggestions="suggestions"
        :loading="loading"
        :placeholder="placeholder"
        :dropdown="false"
        :forceSelection="false"
        completeOnFocus
        class="w-full"
        @complete="onFilter"
    />
</template>

<style scoped>
/* Ensure multiselect fills width */
:deep(.p-multiselect) {
    width: 100%;
}
</style>
