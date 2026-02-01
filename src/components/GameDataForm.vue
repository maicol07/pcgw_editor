<script setup lang="ts">
import { GameDataConfig } from '../models/GameData';
import Select from 'primevue/select';
import Panel from 'primevue/panel';
import GameDataPathForm from './GameDataPathForm.vue';
import RatingSelect from './RatingSelect.vue';
import RatingRow from './RatingRow.vue';
import HelpIcon from './HelpIcon.vue';
import NotesButton from './NotesButton.vue';

import { inject, reactive, watch } from 'vue';

// ... other imports

const props = defineProps<{
  config: GameDataConfig;
}>();

const xdgOptions = [
  { label: 'Supported', value: true },
  { label: 'Not Supported', value: false },
  { label: 'N/A', value: null }
];

// Panel logic
const sectionState = reactive({
    paths: true,
    cloud: true
});

const uiBus = inject<{ expandAllCount: number, collapseAllCount: number }>('uiBus');

if (uiBus) {
    watch(() => uiBus.expandAllCount, () => {
        sectionState.paths = false;
        sectionState.cloud = false;
    });
    watch(() => uiBus.collapseAllCount, () => {
        sectionState.paths = true;
        sectionState.cloud = true;
    });
}

const getCloudIcon = (key: string) => {
    const k = key.toLowerCase();
    if (k.includes('steam')) return 'pi pi-server'; // No specific steam icon in primeicons? defaults to generic
    if (k.includes('discord')) return 'pi pi-discord'; // if avail, otherwise generic
    if (k.includes('xbox')) return 'pi pi-microsoft';
    if (k.includes('gog')) return 'pi pi-box'; 
    if (k.includes('epic')) return 'pi pi-box';
    if (k.includes('ubisoft')) return 'pi pi-box';
    if (k.includes('ea')) return 'pi pi-box';
    return 'pi pi-cloud';
}

</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Game Data Paths -->
    <Panel header="Game Data Paths" toggleable v-model:collapsed="sectionState.paths">
        <div class="flex flex-col gap-6">
        <GameDataPathForm :rows="config.configFiles" title="Configuration file(s) location" />
        
        <div class="flex items-center gap-4 bg-surface-50 dark:bg-surface-900/50 p-4 rounded-lg border border-surface-200 dark:border-surface-800">
            <label class="flex items-center text-sm font-medium text-surface-600 dark:text-surface-300">
                XDG Base Directory Support
                <HelpIcon text="Does the game support XDG Base Directory standards on Linux?" />
            </label>
            <Select v-model="config.xdg" :options="xdgOptions" optionLabel="label" optionValue="value" placeholder="Select XDG support" class="w-64" />
        </div>

        <GameDataPathForm :rows="config.saveData" title="Save game data location" />
        </div>
    </Panel>

    <!-- Cloud Sync -->
    <Panel header="Save Game Cloud Syncing" toggleable v-model:collapsed="sectionState.cloud">
        <div class="flex flex-col gap-2">
            <RatingRow 
                v-for="(service, key) in config.cloudSync" 
                :key="key"
                :label="key.replace(/([A-Z])/g, ' $1').trim()"
                :icon="getCloudIcon(key)"
                v-model:value="service.status"
                v-model:notes="service.notes"
            />
        </div>
    </Panel>
  </div>
</template>



