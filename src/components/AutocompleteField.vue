<script setup lang="ts">
import { ref, watch } from 'vue';
import MultiSelect from 'primevue/multiselect';
import AutoComplete from 'primevue/autocomplete';
import Button from 'primevue/button';
import { pcgwApi } from '../services/pcgwApi';

export type DataSource = 'companies' | 'engines' | 'series' | 'genres' | 'themes' | 'perspectives' | 'files' | 'pacing' | 'controls' | 'sports' | 'vehicles' | 'artStyles' | 'monetization' | 'microtransactions' | 'modes' | 'pages';

interface Props {
    modelValue: string | string[];
    dataSource: DataSource;
    multiple?: boolean;
    placeholder?: string;
    display?: 'chip' | 'comma';
    inputClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
    multiple: true,
    placeholder: 'Search...',
    display: 'chip',
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: string | string[]): void;
    (e: 'suggestions-update', value: string[]): void;
}>();

const localValue = ref<any>(Array.isArray(props.modelValue) ? [...props.modelValue] : props.modelValue);

// Initialize suggestions with current value to ensure they are displayed
const initialSuggestions = Array.isArray(props.modelValue) ? [...props.modelValue] : (props.modelValue ? [props.modelValue] : []);
const suggestions = ref<string[]>(initialSuggestions);
const loading = ref(false);
const searchTimeout = ref<number>();
const filterText = ref('');
const initialSuggestionsCache = ref<string[]>([]);

const loadInitialSuggestions = async () => {
    if (initialSuggestionsCache.value.length > 0) {
        return initialSuggestionsCache.value;
    }
    loading.value = true;
    try {
        let results: string[] = [];
        switch (props.dataSource) {
            case 'companies':
                results = await pcgwApi.searchCompanies();
                break;
            case 'engines':
                results = await pcgwApi.searchEngines();
                break;
            case 'series':
                results = await pcgwApi.searchSeries();
                break;
            case 'genres':
                results = await pcgwApi.searchGenres();
                break;
            case 'themes':
                results = await pcgwApi.searchThemes();
                break;
            case 'perspectives':
                results = await pcgwApi.searchPerspectives();
                break;
            case 'files':
                results = await pcgwApi.searchFiles();
                break;
            case 'pacing':
                results = await pcgwApi.searchPacing();
                break;
            case 'controls':
                results = await pcgwApi.searchControls();
                break;
            case 'sports':
                results = await pcgwApi.searchSports();
                break;
            case 'vehicles':
                results = await pcgwApi.searchVehicles();
                break;
            case 'artStyles':
                results = await pcgwApi.searchArtStyles();
                break;
            case 'monetization':
                results = await pcgwApi.searchMonetizations();
                break;
            case 'microtransactions':
                results = await pcgwApi.searchMicrotransactions();
                break;
            case 'modes':
                results = await pcgwApi.searchModes();
                break;
            case 'pages':
                results = await pcgwApi.searchPages();
                break;
        }
        initialSuggestionsCache.value = results;
        return results;
    } catch (error) {
        console.error('Error loading initial suggestions:', error);
        return [];
    } finally {
        loading.value = false;
    }
};

const onShow = async () => {
    if (!filterText.value || filterText.value.length < 2) {
        const initial = await loadInitialSuggestions();
        const selectedSet = new Set(Array.isArray(localValue.value) ? localValue.value : []);
        
        let filtered = initial;
        if (filterText.value) {
            filtered = initial.filter(item => item.toLowerCase().includes(filterText.value.toLowerCase()));
        }
        
        const mergedSet = new Set([...filtered, ...selectedSet]);
        suggestions.value = Array.from(mergedSet);
    }
};

const addCustomAutocompleteValue = () => {
    const newVal = filterText.value.trim();
    if (!newVal) return;
    
    if (!suggestions.value.includes(newVal)) {
        suggestions.value.push(newVal);
    }
    
    const current = Array.isArray(localValue.value) ? [...localValue.value] : [];
    if (!current.includes(newVal)) {
        current.push(newVal);
        localValue.value = current;
    }
    
    filterText.value = '';
};

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
    filterText.value = query;

    // Always include currently selected values in options for MultiSelect
    const selectedSet = new Set(Array.isArray(localValue.value) ? localValue.value : []);

    if (!query || query.length < 2) {
        const initial = await loadInitialSuggestions();
        let filtered = initial;
        if (query) {
            filtered = initial.filter(item => item.toLowerCase().includes(query.toLowerCase()));
        }

        if (props.multiple) {
            const mergedSet = new Set([...filtered, ...selectedSet]);
            suggestions.value = Array.from(mergedSet);
        } else {
            suggestions.value = filtered;
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
                case 'pages':
                    results = await pcgwApi.searchPages(query);
                    break;
            }

            if (props.multiple) {
                // Merge results with selected values to prevent them from disappearing in MultiSelect
                const mergedSet = new Set([...results, ...selectedSet]);
                suggestions.value = Array.from(mergedSet);
            } else {
                suggestions.value = results;
            }
            emit('suggestions-update', suggestions.value);
        } catch (error) {
            console.error('Autocomplete search error:', error);
            suggestions.value = props.multiple ? Array.from(selectedSet) : [];
            emit('suggestions-update', suggestions.value);
        } finally {
            loading.value = false;
        }
    }, 300); // 300ms debounce
};
</script>

<template>
    <div class="w-full relative">
        <!-- Multiple Selection Mode -->
        <MultiSelect v-if="multiple" v-model="localValue" :options="suggestions" :loading="loading"
            :placeholder="placeholder" filter filterPlaceholder="Search..." autoFilterFocus :filterMatchMode="'contains'" @filter="onFilter"
            @show="onShow"
            class="w-full" :display="display" :showToggleAll="false" :inputClass="inputClass">
            <template #value="slotProps">
                <div class="flex items-center gap-1 flex-wrap w-full overflow-hidden" v-if="slotProps.value && slotProps.value.length">
                    <template v-if="display === 'chip'">
                        <div v-for="option in slotProps.value" :key="option"
                            class="flex items-center bg-surface-100 dark:bg-surface-700 rounded px-1.5 py-0.5 gap-1 shrink-0">
                            <span class="text-xs">{{ option }}</span>
                        </div>
                    </template>
                    <template v-else>
                        <span class="text-sm text-surface-900 dark:text-surface-0">{{ slotProps.value.join(', ') }}</span>
                    </template>
                </div>
                <span v-else class="text-surface-400 dark:text-surface-500 text-sm">{{ placeholder }}</span>
            </template>
            <template #option="slotProps">
                <slot name="option" :option="slotProps.option" :index="slotProps.index">
                    {{ slotProps.option }}
                </slot>
            </template>
            <template #footer>
                <div>
                    <div v-if="filterText && filterText.length >= 2" class="p-2 border-t border-surface-200 dark:border-surface-700 flex justify-end">
                        <Button 
                            class="p-button-text p-button-sm text-xs text-primary-500"
                            @click="addCustomAutocompleteValue"
                        >
                            + Add '{{ filterText }}'
                        </Button>
                    </div>
                    <div v-if="!filterText || filterText.length < 2" class="p-2 text-xs text-surface-500 dark:text-surface-400 text-center border-t border-surface-200 dark:border-surface-700">
                        Type at least 2 characters to search for more options
                    </div>
                </div>
            </template>
        </MultiSelect>

        <!-- Single Selection Mode -->
        <AutoComplete v-else v-model="localValue" :suggestions="suggestions" :loading="loading"
            :placeholder="placeholder" :dropdown="false" :forceSelection="false" completeOnFocus class="w-full"
            @complete="onFilter" :inputClass="['w-full', inputClass]">
            <template #item="slotProps">
                <slot name="item" :item="slotProps.item" :index="slotProps.index">
                    {{ slotProps.item }}
                </slot>
            </template>
            <template #option="slotProps">
                <slot name="option" :option="slotProps.option" :index="slotProps.index">
                    {{ slotProps.option }}
                </slot>
            </template>
            <template #footer>
                <div v-if="!filterText || filterText.length < 2" class="p-2 text-xs text-surface-500 dark:text-surface-400 text-center border-t border-surface-200 dark:border-surface-700">
                    Type at least 2 characters to search for more options
                </div>
            </template>
        </AutoComplete>
    </div>
</template>

<style scoped>
/* Ensure multiselect fills width and adapts vertically */
:deep(.p-multiselect) {
    width: 100%;
    /* Override fixed heights from global styles for this specific component to allow vertical expansion */
    height: auto !important;
    min-height: 2rem;
}

/* Ensure autocomplete and its input fill the container width */
:deep(.p-autocomplete) {
    width: 100%;
}
:deep(.p-autocomplete-input) {
    width: 100%;
}

/* Allow chips to wrap onto new lines instead of expanding horizontally */
:deep(.p-multiselect-label) {
    flex-wrap: wrap;
    gap: 0.25rem;
    overflow: hidden;
    /* Prevent horizontal scrollbars if any */
}

/* Adjust compact mode minimum height if needed */
:global(.compact-mode) :deep(.p-multiselect) {
    min-height: 1.6rem;
}
</style>
