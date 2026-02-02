<script setup lang="ts">
import { ref, watch, inject, computed } from 'vue';
import { GameInfobox } from '../models/GameData';
import { pcgwApi } from '../services/pcgwApi';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Button from 'primevue/button';
import DatePicker from 'primevue/datepicker';
import AutocompleteField from './AutocompleteField.vue';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
import Checkbox from 'primevue/checkbox';
import NotesButton from './NotesButton.vue';
import { 
  Image, Info, Upload, Loader2, ExternalLink, TriangleAlert, 
  IdCard, ShoppingCart, ShoppingBag, Globe, Trash2, Plus, Terminal, Box 
} from 'lucide-vue-next';

// Search
const searchQuery = inject('searchQuery', ref(''));
const isMatch = (text: string) => {
    if (!searchQuery.value || searchQuery.value.length < 3) return false;
    return text.toLowerCase().includes(searchQuery.value.toLowerCase());
};
const highlightClass = (text: string) => isMatch(text) ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/10 px-1 rounded' : '';

const props = defineProps<{
  modelValue: GameInfobox;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: GameInfobox): void;
}>();

// License options with descriptions
const licenseOptions = [
  { label: 'Commercial', value: 'commercial', description: 'Proprietary software sold commercially' },
  { label: 'Freeware', value: 'freeware', description: 'Free to use but proprietary' },
  { label: 'Open Source / Free Software', value: 'open source', description: 'Free and open source licensed' },
  { label: 'Abandonware', value: 'abandonware', description: 'No longer supported or sold' },
  { label: 'Donationware', value: 'donationware', description: 'Free with optional donations' },
  { label: 'Shareware', value: 'shareware', description: 'Try before you buy' },
];

// Cover image preview
const coverImageLoading = ref(false);
const coverImageError = ref(false);
const coverImageUrl = ref('');

// Watch for cover changes and fetch real URL
watch(() => props.modelValue.cover, async (newCover) => {
  if (!newCover) {
    coverImageUrl.value = '';
    return;
  }

  coverImageLoading.value = true;
  coverImageError.value = false;
  
  try {
    const url = await pcgwApi.getImageUrl(newCover);
    if (url) {
      coverImageUrl.value = url;
    } else {
      coverImageError.value = true;
    }
  } catch (error) {
    console.error('Failed to load cover image:', error);
    coverImageError.value = true;
  } finally {
    coverImageLoading.value = false;
  }
}, { immediate: true });

// Basic Information helpers
const platformOptions = [
  'Windows', 'macOS', 'Linux', 'Android', 'iOS', 
  'Nintendo Switch', 'PlayStation 4', 'PlayStation 5', 
  'Xbox One', 'Xbox Series X|S'
];

interface StructuredReleaseDate {
  platform: string;
  date: Date | null;
  rawDate?: string; // For things like TBA, EA, etc.
  ref?: string;
}

const structuredDates = ref<StructuredReleaseDate[]>([]);

// Watch for external changes to parse them
watch(() => props.modelValue.releaseDates, (val) => {
  if (!val || val.length === 0) {
    if (structuredDates.value.length > 0) structuredDates.value = [];
    return;
  }
  
  const newStructured = val.map(rd => {
    const d = new Date(rd.date);
    return {
      platform: rd.platform,
      date: isNaN(d.getTime()) ? null : d, // Store Date object if valid, else handled by raw string if needed
      rawDate: rd.date, // Store the actual string for special states like TBA/EA
      ref: rd.ref || ''
    };
  });
  
  // Only update if different to avoid cycles
  const currentStr = JSON.stringify(structuredDates.value);
  const newStr = JSON.stringify(newStructured);
  if (currentStr !== newStr) {
    structuredDates.value = newStructured;
  }
}, { immediate: true });

// Sync changes back to the model array
watch(structuredDates, (newDates) => {
  const newModelDates = newDates
    .filter(d => d.platform && (d.date || d.rawDate))
    .map(d => {
      let dateStr = d.rawDate || '';
      if (d.date && !d.rawDate) {
        dateStr = d.date.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        });
      }
      return {
        platform: d.platform,
        date: dateStr,
        ref: d.ref
      };
    });
  
  // Compare contents to avoid recursive loops
  if (JSON.stringify(newModelDates) !== JSON.stringify(props.modelValue.releaseDates)) {
    updateField('releaseDates', newModelDates);
  }
}, { deep: true });

const addReleaseDate = () => {
  structuredDates.value.push({ platform: 'Windows', date: null, rawDate: '', ref: '' });
};

const removeReleaseDate = (index: number) => {
  structuredDates.value.splice(index, 1);
};

const openUploadPage = () => {
  window.open('https://www.pcgamingwiki.com/wiki/Special:Upload', '_blank', 'noopener,noreferrer');
};

/**
 * Helper to handle taxonomy fields that are now objects
 */
const getTaxonomyArray = (field: keyof GameInfobox['taxonomy']): string[] => {
  const value = props.modelValue.taxonomy[field]?.value || '';
  if (!value) return [];
  return value.split(',').map(s => s.trim()).filter(Boolean);
};

/**
 * Generic helper to emit updates for any top-level field in GameInfobox
 */
const updateField = <K extends keyof GameInfobox>(field: K, value: GameInfobox[K]) => {
  emit('update:modelValue', { ...props.modelValue, [field]: value });
};

/**
 * Handle updates for taxonomy fields
 */
const setTaxonomyArray = (field: keyof GameInfobox['taxonomy'], value: string[]) => {
  const newTaxonomy = { ...props.modelValue.taxonomy };
  newTaxonomy[field] = { ...newTaxonomy[field], value: value.join(', ') };
  updateField('taxonomy', newTaxonomy);
};

const updateTaxonomyParam = (field: keyof GameInfobox['taxonomy'], param: 'note' | 'ref', value: string | undefined) => {
  const newTaxonomy = { ...props.modelValue.taxonomy };
  newTaxonomy[field] = { ...newTaxonomy[field], [param]: value || '' };
  updateField('taxonomy', newTaxonomy);
};

/**
 * Handle updates for list-based fields (developers, publishers, engines)
 */
const updateInfoboxList = (field: 'developers' | 'publishers' | 'engines', names: string[]) => {
  const existing = props.modelValue[field];
  const newList = names.map(name => {
    const found = existing.find(item => item.name === name);
    return found ? { ...found } : { name, type: (field === 'developers' ? 'developer' : undefined) as any };
  });
  updateField(field, newList);
};

const updateListParam = (field: 'developers' | 'publishers' | 'engines', index: number, param: 'note' | 'ref' | 'extra' | 'type' | 'displayName' | 'build', value: any) => {
  const newList = [...props.modelValue[field]];
  newList[index] = { ...newList[index], [param]: value };
  updateField(field, newList);
};

/**
 * Handle updates for reception rows
 */
const addReceptionRow = () => {
  const newList = [...props.modelValue.reception, { aggregator: 'Metacritic', id: '', score: '' }];
  updateField('reception', newList as any);
};

const removeReceptionRow = (index: number) => {
  const newList = props.modelValue.reception.filter((_, i) => i !== index);
  updateField('reception', newList);
};

const updateReceptionRow = (index: number, field: string, value: string) => {
  const newList = [...props.modelValue.reception];
  newList[index] = { ...newList[index], [field]: value } as any;
  updateField('reception', newList);
};

/**
 * Handle updates for links
 */
const updateLink = (field: keyof GameInfobox['links'], value: string | boolean) => {
  const newLinks = { ...props.modelValue.links, [field]: value };
  updateField('links', newLinks);
};
</script>

<template>
    <div class="flex flex-col gap-6">
    <Accordion multiple>
      <!-- Basic Information -->
      <AccordionPanel value="0">
        <AccordionHeader>Basic Information</AccordionHeader>
        <AccordionContent>
          <div class="flex flex-col gap-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-1">
                    <label class="text-sm font-medium text-surface-600 dark:text-surface-300 flex items-center gap-2">
                         <Image class="text-primary-500 w-4 h-4" /> Cover Image Filename
                    </label>
                    <Info class="text-surface-400 w-3 h-3" v-tooltip.top="'Search PCGW files or enter name. Click Upload to add new.'" />
                </div>
                <div class="flex flex-wrap gap-2">
                  <AutocompleteField 
                    :modelValue="modelValue.cover || ''" 
                    @update:modelValue="v => updateField('cover', (v as any) as string)"
                    data-source="files" 
                    :multiple="false"
                    placeholder="e.g. GAME TITLE cover.jpg"
                    class="flex-1 min-w-[200px]"
                  />
                  <Button 
                    label="Upload" 
                    severity="secondary"
                    @click="openUploadPage"
                    size="small"
                  >
                    <template #icon><Upload class="w-4 h-4" /></template>
                  </Button>
                </div>
                <!-- Image Preview -->
                <div v-if="modelValue.cover" class="mt-2 p-4 border border-surface-200 dark:border-surface-700 rounded bg-surface-50 dark:bg-surface-800">
                  <div v-if="coverImageLoading" class="flex items-center justify-center py-8">
                    <Loader2 class="text-2xl text-surface-400 animate-spin w-8 h-8" />
                  </div>
                  <div v-else-if="!coverImageError && coverImageUrl" class="flex flex-col gap-3">
                    <div class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300">
                      <Image class="text-lg w-5 h-5" />
                      <span class="font-medium">{{ modelValue.cover }}</span>
                    </div>
                    <a 
                      :href="coverImageUrl" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                    >
                      <ExternalLink class="w-4 h-4" />
                      View Cover on PCGW
                    </a>
                    <p class="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1">
                      <Info class="w-3 h-3" /> Preview not available due to CORS policy. Click above to view.
                    </p>
                  </div>
                  <div v-else class="text-sm text-red-500 dark:text-red-400 py-4 text-center flex flex-col items-center gap-2">
                    <TriangleAlert class="w-6 h-6" /> Image not found on PCGW
                  </div>
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-1">
                    <label class="text-sm font-medium text-surface-600 dark:text-surface-300 flex items-center gap-2">
                        <IdCard class="text-orange-500 w-4 h-4" /> License
                    </label>
                    <Info class="text-surface-400 w-3 h-3" v-tooltip.top="'Software distribution license type'" />
                </div>
                <Select 
                  v-model="modelValue.license" 
                  :options="licenseOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select license type" 
                  class="w-full"
                >
                  <template #option="slotProps">
                    <div class="flex flex-col gap-1 py-1">
                      <span class="font-medium">{{ slotProps.option.label }}</span>
                      <span class="text-xs text-surface-500 dark:text-surface-400">{{ slotProps.option.description }}</span>
                    </div>
                  </template>
                </Select>
              </div>
            </div>
          </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-1">
                    <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('Developers')">Developers</label>
                    <Info class="text-surface-400 w-3 h-3" v-tooltip.top="'Search and select multiple developers'" />
                </div>
                <AutocompleteField 
                  :modelValue="modelValue.developers.map(d => d.name)"
                  @update:modelValue="updateInfoboxList('developers', $event)"
                  data-source="companies"
                  placeholder="Search developers..." 
                />
                <div v-if="modelValue.developers.length > 0" class="flex flex-col gap-2 mt-2">
                  <div v-for="(dev, index) in modelValue.developers" :key="dev.name" class="p-3 border border-surface-200 dark:border-surface-700 rounded bg-surface-50 dark:bg-surface-800/50 flex flex-col gap-3 transition-colors hover:border-blue-300 dark:hover:border-blue-700">
                    <div class="flex items-center justify-between gap-2">
                      <div class="text-xs font-bold">{{ dev.name }}</div>
                      <div class="flex items-center gap-1">
                        <NotesButton :modelValue="dev.note" @update:modelValue="v => updateListParam('developers', index, 'note', v)" type="note" />
                        <NotesButton :modelValue="dev.ref" @update:modelValue="v => updateListParam('developers', index, 'ref', v)" type="ref" />
                        <div class="h-4 w-px bg-surface-300 dark:bg-surface-600 mx-1"></div>
                        <label class="text-[10px] uppercase font-bold text-surface-400 cursor-pointer">Porter</label>
                        <Checkbox :modelValue="dev.type === 'porter'" @update:modelValue="v => updateListParam('developers', index, 'type', v ? 'porter' : 'developer')" :binary="true" />
                      </div>
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="text-[10px] uppercase font-bold text-surface-500">{{ dev.type === 'porter' ? 'OS' : 'Subtitle' }}</span>
                        <InputText :modelValue="dev.extra || ''" @update:modelValue="v => updateListParam('developers', index, 'extra', v)" :placeholder="dev.type === 'porter' ? 'e.g. Linux' : 'e.g. Main game'" class="text-xs p-1" />
                    </div>
                  </div>
                </div>

              </div>

              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-1">
                    <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('Publishers')">Publishers</label>
                    <Info class="text-surface-400 w-3 h-3" v-tooltip.top="'Search and select multiple publishers'" />
                </div>
                <AutocompleteField 
                  :modelValue="modelValue.publishers.map(p => p.name)"
                  @update:modelValue="updateInfoboxList('publishers', $event)"
                  data-source="companies"
                  placeholder="Search publishers..." 
                />
                <div v-if="modelValue.publishers.length > 0" class="flex flex-col gap-2 mt-2">
                  <div v-for="(pub, index) in modelValue.publishers" :key="pub.name" class="p-3 border border-surface-200 dark:border-surface-700 rounded bg-surface-50 dark:bg-surface-800/50 flex flex-col gap-3">
                    <div class="flex items-center justify-between gap-2">
                        <div class="text-xs font-bold">{{ pub.name }}</div>
                        <div class="flex items-center gap-1">
                           <NotesButton :modelValue="pub.note" @update:modelValue="v => updateListParam('publishers', index, 'note', v)" type="note" />
                           <NotesButton :modelValue="pub.ref" @update:modelValue="v => updateListParam('publishers', index, 'ref', v)" type="ref" />
                        </div>
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="text-[10px] uppercase font-bold text-surface-500">Subtitle</span>
                        <InputText :modelValue="pub.extra || ''" @update:modelValue="v => updateListParam('publishers', index, 'extra', v)" placeholder="Subtitle" class="text-xs p-1" />
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-1">
                     <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('Engines')">Engines</label>
                     <Info class="text-surface-400 w-3 h-3" v-tooltip.top="'Search and select game engine(s)'" />
                </div>
                <AutocompleteField 
                  :modelValue="modelValue.engines.map(e => e.name)"
                  @update:modelValue="updateInfoboxList('engines', $event)"
                  data-source="engines"
                  placeholder="Search engines..." 
                />
                <div v-if="modelValue.engines.length > 0" class="flex flex-col gap-2 mt-2">
                  <div v-for="(eng, index) in modelValue.engines" :key="eng.name" class="p-3 border border-surface-200 dark:border-surface-700 rounded bg-surface-50 dark:bg-surface-800/50 flex flex-col gap-3">
                    <div class="flex items-center justify-between gap-2">
                      <div class="text-xs font-bold">{{ eng.name }}</div>
                      <div class="flex items-center gap-1">
                           <NotesButton :modelValue="eng.note" @update:modelValue="v => updateListParam('engines', index, 'note', v)" type="note" />
                           <NotesButton :modelValue="eng.ref" @update:modelValue="v => updateListParam('engines', index, 'ref', v)" type="ref" />
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                      <div class="flex flex-col gap-1">
                        <span class="text-[10px] uppercase font-bold text-surface-500">Display Name</span>
                        <InputText :modelValue="eng.displayName || ''" @update:modelValue="v => updateListParam('engines', index, 'displayName', v)" placeholder="e.g. Unity 2017" class="text-xs p-1" />
                      </div>
                      <div class="flex flex-col gap-1">
                        <span class="text-[10px] uppercase font-bold text-surface-500">Build/Version</span>
                        <InputText :modelValue="eng.build || ''" @update:modelValue="v => updateListParam('engines', index, 'build', v)" placeholder="e.g. 2017.4.19f1" class="text-xs p-1" />
                      </div>
                    </div>
                    <div class="flex flex-col gap-1">
                      <span class="text-[10px] uppercase font-bold text-surface-500">Used For</span>
                      <InputText :modelValue="eng.extra || ''" @update:modelValue="v => updateListParam('engines', index, 'extra', v)" placeholder="e.g. Original release" class="text-xs p-1" />
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-1">
                  <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('Release Dates')">Release Dates</label>
                  <Info class="text-surface-400 w-3 h-3" v-tooltip.top="'Use the editor above for standard dates. Advanced options allow for special states like TBA/EA.'" />
              </div>
              <div class="flex flex-col gap-3 p-3 border border-surface-200 dark:border-surface-700 rounded bg-surface-50/50 dark:bg-surface-800/50">
                <div v-for="(rd, index) in structuredDates" :key="index" class="p-3 border border-surface-200 dark:border-surface-700 rounded bg-surface-50/50 dark:bg-surface-800/50 flex flex-col gap-3">
                  <div class="flex items-center justify-between gap-2">
                    <Select v-model="rd.platform" :options="platformOptions" placeholder="Platform" class="flex-1" size="small" />
                    <div class="flex items-center gap-1">
                        <NotesButton v-model="rd.ref" type="ref" />
                        <Button severity="danger" text @click="removeReleaseDate(index)" size="small">
                            <template #icon><Trash2 class="w-4 h-4" /></template>
                        </Button>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div class="flex flex-col gap-1">
                      <label class="text-[10px] uppercase font-bold text-surface-500">Release Date</label>
                      <DatePicker v-model="rd.date" dateFormat="dd MM yy" placeholder="Select Date" class="w-full" size="small" />
                      <div class="mt-1 flex items-center gap-2">
                        <span class="text-[10px] text-surface-400">Or special:</span>
                        <div class="flex gap-1 flex-wrap">
                          <Button v-for="s in ['TBA', 'EA', 'Unknown', 'LC', 'Cancelled']" :key="s" :label="s" class="text-[9px] p-1" text severity="secondary" @click="rd.rawDate = s; rd.date = null" />
                        </div>
                      </div>
                    </div>
                    <div class="flex flex-col gap-1">
                      <label class="text-[10px] uppercase font-bold text-surface-500">Raw/Special Date</label>
                      <InputText v-model="rd.rawDate" placeholder="e.g. TBA or Jan 2024" class="text-xs" />
                    </div>
                  </div>
                </div>
                <Button 
                  label="Add Release Date" 
                  severity="secondary" 
                  size="small" 
                  @click="addReleaseDate"
                  class="w-full"
                >
                    <template #icon><Plus class="w-4 h-4" /></template>
                </Button>
              </div>

            </div>

        </AccordionContent>
      </AccordionPanel>

      <!-- Taxonomy -->
      <AccordionPanel value="1">
        <AccordionHeader>Taxonomy</AccordionHeader>
        <AccordionContent>
          <div class="flex flex-col gap-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1">
                        <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('Monetization')">Monetization</label>
                        <Info class="text-surface-400 w-3 h-3" v-tooltip.top="'Primary business model(s)'" />
                    </div>
                    <div class="flex gap-1">
                        <NotesButton :modelValue="modelValue.taxonomy.monetization.note" @update:modelValue="v => updateTaxonomyParam('monetization', 'note', v)" type="note" />
                        <NotesButton :modelValue="modelValue.taxonomy.monetization.ref" @update:modelValue="v => updateTaxonomyParam('monetization', 'ref', v)" type="ref" />
                    </div>
                </div>
                <AutocompleteField 
                  :modelValue="getTaxonomyArray('monetization')"
                  @update:modelValue="setTaxonomyArray('monetization', $event)"
                  data-source="monetization"
                  placeholder="Search monetization..." 
                />

              </div>

              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1">
                        <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('Microtransactions')">Microtransactions</label>
                        <Info class="text-surface-400 w-3 h-3" v-tooltip.top="'Type of in-game purchases'" />
                    </div>
                    <div class="flex gap-1">
                        <NotesButton :modelValue="modelValue.taxonomy.microtransactions.note" @update:modelValue="v => updateTaxonomyParam('microtransactions', 'note', v)" type="note" />
                        <NotesButton :modelValue="modelValue.taxonomy.microtransactions.ref" @update:modelValue="v => updateTaxonomyParam('microtransactions', 'ref', v)" type="ref" />
                    </div>
                </div>
                <AutocompleteField 
                  :modelValue="getTaxonomyArray('microtransactions')"
                  @update:modelValue="setTaxonomyArray('microtransactions', $event)"
                  data-source="microtransactions"
                  placeholder="Search microtransactions..." 
                />

              </div>
              
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1">
                        <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('Modes')">Modes</label>
                        <Info class="text-surface-400 w-3 h-3" v-tooltip.top="'Available game modes'" />
                    </div>
                    <div class="flex gap-1">
                        <NotesButton :modelValue="modelValue.taxonomy.modes.note" @update:modelValue="v => updateTaxonomyParam('modes', 'note', v)" type="note" />
                        <NotesButton :modelValue="modelValue.taxonomy.modes.ref" @update:modelValue="v => updateTaxonomyParam('modes', 'ref', v)" type="ref" />
                    </div>
                </div>
                <AutocompleteField 
                  :modelValue="getTaxonomyArray('modes')"
                  @update:modelValue="setTaxonomyArray('modes', $event)"
                  data-source="modes"
                  placeholder="Search modes..." 
                />

              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="flex flex-col gap-2">
                 <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1">
                         <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('Pacing')">Pacing</label>
                         <Info class="text-surface-400 w-3 h-3" v-tooltip.top="'Game pacing type'" />
                    </div>
                    <div class="flex gap-1">
                        <NotesButton :modelValue="modelValue.taxonomy.pacing.note" @update:modelValue="v => updateTaxonomyParam('pacing', 'note', v)" type="note" />
                        <NotesButton :modelValue="modelValue.taxonomy.pacing.ref" @update:modelValue="v => updateTaxonomyParam('pacing', 'ref', v)" type="ref" />
                    </div>
                </div>
                <AutocompleteField 
                  :modelValue="getTaxonomyArray('pacing')"
                  @update:modelValue="setTaxonomyArray('pacing', $event)"
                  data-source="pacing"
                  placeholder="Search pacing..." 
                />

              </div>
              
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1">
                        <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('Perspectives')">Perspectives</label>
                        <Info class="text-surface-400 w-3 h-3" v-tooltip.top="'Camera perspectives'" />
                    </div>
                    <div class="flex gap-1">
                        <NotesButton :modelValue="modelValue.taxonomy.perspectives.note" @update:modelValue="v => updateTaxonomyParam('perspectives', 'note', v)" type="note" />
                        <NotesButton :modelValue="modelValue.taxonomy.perspectives.ref" @update:modelValue="v => updateTaxonomyParam('perspectives', 'ref', v)" type="ref" />
                    </div>
                </div>
                <AutocompleteField 
                  :modelValue="getTaxonomyArray('perspectives')"
                  @update:modelValue="setTaxonomyArray('perspectives', $event)"
                  data-source="perspectives"
                  placeholder="Search perspectives..." 
                />

              </div>
              
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1">
                        <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('Controls')">Controls</label>
                        <Info class="text-surface-400 w-3 h-3" v-tooltip.top="'Control scheme type'" />
                    </div>
                    <div class="flex gap-1">
                        <NotesButton :modelValue="modelValue.taxonomy.controls.note" @update:modelValue="v => updateTaxonomyParam('controls', 'note', v)" type="note" />
                        <NotesButton :modelValue="modelValue.taxonomy.controls.ref" @update:modelValue="v => updateTaxonomyParam('controls', 'ref', v)" type="ref" />
                    </div>
                </div>
                <AutocompleteField 
                  :modelValue="getTaxonomyArray('controls')"
                  @update:modelValue="setTaxonomyArray('controls', $event)"
                  data-source="controls"
                  placeholder="Search controls..." 
                />

              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1">
                        <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('Genres')">Genres</label>
                        <Info class="text-surface-400 w-3 h-3" v-tooltip.top="'Game genre(s)'" />
                    </div>
                    <div class="flex gap-1">
                        <NotesButton :modelValue="modelValue.taxonomy.genres.note" @update:modelValue="v => updateTaxonomyParam('genres', 'note', v)" type="note" />
                        <NotesButton :modelValue="modelValue.taxonomy.genres.ref" @update:modelValue="v => updateTaxonomyParam('genres', 'ref', v)" type="ref" />
                    </div>
                </div>
                <AutocompleteField 
                  :modelValue="getTaxonomyArray('genres')"
                  @update:modelValue="setTaxonomyArray('genres', $event)"
                  data-source="genres"
                  placeholder="Search genres..." 
                />

              </div>
              
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1">
                        <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('Sports')">Sports</label>
                        <Info class="text-surface-400 w-3 h-3" v-tooltip.top="'Sports category (if applicable)'" />
                    </div>
                     <div class="flex gap-1">
                        <NotesButton :modelValue="modelValue.taxonomy.sports.note" @update:modelValue="v => updateTaxonomyParam('sports', 'note', v)" type="note" />
                        <NotesButton :modelValue="modelValue.taxonomy.sports.ref" @update:modelValue="v => updateTaxonomyParam('sports', 'ref', v)" type="ref" />
                    </div>
                </div>
                <AutocompleteField 
                  :modelValue="getTaxonomyArray('sports')"
                  @update:modelValue="setTaxonomyArray('sports', $event)"
                  data-source="sports"
                  placeholder="Search sports..." 
                />

              </div>
              
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1">
                        <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('Vehicles')">Vehicles</label>
                        <Info class="text-surface-400 w-3 h-3" v-tooltip.top="'Vehicle types (if applicable)'" />
                    </div>
                    <div class="flex gap-1">
                        <NotesButton :modelValue="modelValue.taxonomy.vehicles.note" @update:modelValue="v => updateTaxonomyParam('vehicles', 'note', v)" type="note" />
                        <NotesButton :modelValue="modelValue.taxonomy.vehicles.ref" @update:modelValue="v => updateTaxonomyParam('vehicles', 'ref', v)" type="ref" />
                    </div>
                </div>
                <AutocompleteField 
                  :modelValue="getTaxonomyArray('vehicles')"
                  @update:modelValue="setTaxonomyArray('vehicles', $event)"
                  data-source="vehicles"
                  placeholder="Search vehicles..." 
                />

              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1">
                        <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('Art Styles')">Art Styles</label>
                        <Info class="text-surface-400 w-3 h-3" v-tooltip.top="'Visual art style'" />
                    </div>
                    <div class="flex gap-1">
                        <NotesButton :modelValue="modelValue.taxonomy.artStyles.note" @update:modelValue="v => updateTaxonomyParam('artStyles', 'note', v)" type="note" />
                        <NotesButton :modelValue="modelValue.taxonomy.artStyles.ref" @update:modelValue="v => updateTaxonomyParam('artStyles', 'ref', v)" type="ref" />
                    </div>
                </div>
                <AutocompleteField 
                  :modelValue="getTaxonomyArray('artStyles')"
                  @update:modelValue="setTaxonomyArray('artStyles', $event)"
                  data-source="artStyles"
                  placeholder="Search art styles..." 
                />

              </div>
              
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1">
                        <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('Themes')">Themes</label>
                        <Info class="text-surface-400 w-3 h-3" v-tooltip.top="'Story/setting themes'" />
                    </div>
                    <div class="flex gap-1">
                        <NotesButton :modelValue="modelValue.taxonomy.themes.note" @update:modelValue="v => updateTaxonomyParam('themes', 'note', v)" type="note" />
                        <NotesButton :modelValue="modelValue.taxonomy.themes.ref" @update:modelValue="v => updateTaxonomyParam('themes', 'ref', v)" type="ref" />
                    </div>
                </div>
                <AutocompleteField 
                  :modelValue="getTaxonomyArray('themes')"
                  @update:modelValue="setTaxonomyArray('themes', $event)"
                  data-source="themes"
                  placeholder="Search themes..." 
                />

              </div>
              
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1">
                        <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('Series')">Series</label>
                        <Info class="text-surface-400 w-3 h-3" v-tooltip.top="'Game series/franchise'" />
                    </div>
                    <div class="flex gap-1">
                        <NotesButton :modelValue="modelValue.taxonomy.series.note" @update:modelValue="v => updateTaxonomyParam('series', 'note', v)" type="note" />
                        <NotesButton :modelValue="modelValue.taxonomy.series.ref" @update:modelValue="v => updateTaxonomyParam('series', 'ref', v)" type="ref" />
                    </div>
                </div>
                <AutocompleteField 
                  :modelValue="getTaxonomyArray('series')"
                  @update:modelValue="setTaxonomyArray('series', $event)"
                  data-source="series"
                  placeholder="Search series..." 
                />

              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>

      <!-- External Links -->
      <AccordionPanel value="2">
        <AccordionHeader>External Links</AccordionHeader>
        <AccordionContent>
          <div class="flex flex-col gap-6">
            <!-- Storefronts & IDs -->
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-3 ml-1">Storefronts & Core IDs</h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium text-surface-600 dark:text-surface-300 flex items-center gap-2" :class="highlightClass('Steam App ID')">
                    <ShoppingCart class="text-blue-500 w-4 h-4" /> Steam App ID
                  </label>
                  <InputText v-model="modelValue.links.steamAppId" placeholder="e.g. 440" class="w-full" />
                  <div class="flex flex-col gap-2 mt-1">
                    <label for="steam-side" class="text-xs font-medium text-surface-500">Side Parameter</label>
                    <InputText :modelValue="(modelValue.links.steamAppIdSide as string)" @update:modelValue="v => updateLink('steamAppIdSide', v || '')" placeholder="e.g. Windows, macOS" class="w-full text-xs" id="steam-side" />
                  </div>
                  <p class="text-xs text-surface-400">Numeric ID from Steam URL</p>
                </div>
                
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium text-surface-600 dark:text-surface-300 flex items-center gap-2" :class="highlightClass('GOG.com ID')">
                    <ShoppingBag class="text-purple-500 w-4 h-4" /> GOG.com ID
                  </label>
                  <InputText v-model="modelValue.links.gogComId" placeholder="e.g. the_witcher_3_wild_hunt" class="w-full" />
                  <div class="flex flex-col gap-2 mt-1">
                    <label for="gog-side" class="text-xs font-medium text-surface-500">Side Parameter</label>
                    <InputText :modelValue="(modelValue.links.gogComIdSide as string)" @update:modelValue="v => updateLink('gogComIdSide', v || '')" placeholder="e.g. Windows, macOS" class="w-full text-xs" id="gog-side" />
                  </div>
                  <p class="text-xs text-surface-400">Game slug from GOG URL</p>
                </div>

                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium text-surface-600 dark:text-surface-300 flex items-center gap-2" :class="highlightClass('Official Site')">
                    <Globe class="text-green-500 w-4 h-4" /> Official Site
                  </label>
                  <InputText v-model="modelValue.links.officialSite" placeholder="https://..." class="w-full" />
                  <p class="text-xs text-surface-400">Full official website URL</p>
                </div>
              </div>
            </div>

            <!-- Databases & Wikis -->
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-3 ml-1">Databases & Metadata</h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('HLTB ID')">HLTB ID</label>
                  <InputText v-model="modelValue.links.hltb" placeholder="e.g. 10270" class="w-full" />
                </div>
                
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('IGDB Slug')">IGDB Slug</label>
                  <InputText v-model="modelValue.links.igdb" placeholder="e.g. the-witcher-3" class="w-full" />
                </div>
                
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('MobyGames Slug')">MobyGames Slug</label>
                  <InputText v-model="modelValue.links.mobygames" placeholder="e.g. half-life" class="w-full" />
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('StrategyWiki')">StrategyWiki</label>
                <InputText v-model="modelValue.links.strategyWiki" placeholder="Page title" class="w-full" />
              </div>
              
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('Wikipedia')">Wikipedia</label>
                <InputText v-model="modelValue.links.wikipedia" placeholder="Page title" class="w-full" />
              </div>

              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('VNDB ID')">VNDB ID</label>
                <InputText v-model="modelValue.links.vndb" placeholder="e.g. v17" class="w-full" />
              </div>
            </div>

            <!-- Linux & Emulation -->
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-3 ml-1">Compatibility & Specialized</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium text-surface-600 dark:text-surface-300 flex items-center gap-2" :class="highlightClass('Lutris Slug')">
                    <div class="flex items-center gap-2 font-bold mb-1">
                        <Terminal class="w-4 h-4 text-orange-500" /> Lutris Slug
                    </div>
                  </label>
                  <InputText v-model="modelValue.links.lutris" placeholder="e.g. half-life-2" class="w-full" />
                </div>
                
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium text-surface-600 dark:text-surface-300 flex items-center gap-2" :class="highlightClass('WineHQ Slug')">
                    <div class="flex items-center gap-2 font-bold mb-1">
                        <Box class="w-4 h-4 text-red-500" /> WineHQ Slug
                    </div>
                  </label>
                  <InputText v-model="modelValue.links.wineHq" placeholder="e.g. half-life" class="w-full" />
                  <div class="flex flex-col gap-2 mt-1">
                    <label for="winehq-side" class="text-xs font-medium text-surface-500">Side Parameter</label>
                    <InputText :modelValue="(modelValue.links.wineHqSide as string)" @update:modelValue="v => updateLink('wineHqSide', v || '')" placeholder="e.g. Windows" class="w-full text-xs" id="winehq-side" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>

      <!-- Reception -->
      <AccordionPanel value="3">
        <AccordionHeader>Reception</AccordionHeader>
        <AccordionContent>
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
              <div v-for="(row, index) in modelValue.reception" :key="index" class="p-3 border border-surface-200 dark:border-surface-700 rounded bg-surface-50/50 dark:bg-surface-800/50">
                <div class="flex gap-2 items-start mb-2">
                  <Select 
                    :modelValue="row.aggregator" 
                    @update:modelValue="v => updateReceptionRow(index, 'aggregator', v)"
                    :options="['Metacritic', 'OpenCritic', 'IGDB']" 
                    placeholder="Aggregator" 
                    class="w-32"
                    size="small"
                  />
                  <InputText 
                    :modelValue="row.id" 
                    @update:modelValue="v => updateReceptionRow(index, 'id', v || '')"
                    placeholder="ID/Slug" 
                    class="flex-1"
                    size="small"
                  />
                  <InputText 
                    :modelValue="row.score" 
                    @update:modelValue="v => updateReceptionRow(index, 'score', v || '')"
                    placeholder="Score" 
                    class="w-20 font-bold text-center"
                    size="small"
                  />
                  <Button 
                    label="Remove Reception Row" 
                    severity="danger" 
                    text 
                    rounded
                    @click="removeReceptionRow(index)"
                    size="small"
                  >
                    <template #icon><Trash2 class="w-4 h-4" /></template>
                  </Button>
                </div>
                <p class="text-[10px] text-surface-400">
                  Aggregator name, ID from URL, and current score (e.g. 85 or 85/100).
                </p>
              </div>
              <Button 
                label="Add Reception Row" 
                severity="secondary" 
                size="small" 
                @click="addReceptionRow"
              >
                <template #icon><Plus class="w-4 h-4" /></template>
              </Button>
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>
    </Accordion>
  </div>
</template>

