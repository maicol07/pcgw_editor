<script setup lang="ts">
import { ref, inject, type Ref, computed, watch } from 'vue';
import { useWorkspaceStore } from '../../stores/workspace';
import { useUiStore } from '../../stores/ui';
import { hasGoogleKey } from '../../services/ai/aiConfig';
import { metadataFillerService, ExtractedMetadata, IGDBGameCandidate } from '../../services/MetadataFillerService';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import ToggleSwitch from 'primevue/toggleswitch';
import { 
    Sparkles, Search, AlertCircle, Info, Database, 
    Twitch, Cpu, ChevronRight
} from 'lucide-vue-next';

const visible = defineModel<boolean>('visible', { default: false });

const workspaceStore = useWorkspaceStore();
const uiStore = useUiStore();
const twitchClientId = inject<Ref<string>>('twitchClientId');
const twitchClientSecret = inject<Ref<string>>('twitchClientSecret');
const rawgApiKey = inject<Ref<string>>('rawgApiKey');

const searchTitle = ref('');
const isSearching = ref(false);
const isFetchingDetails = ref(false);
const candidates = ref<IGDBGameCandidate[]>([]);
const selectedCandidates = ref<IGDBGameCandidate[]>([]);

const useIGDB = ref(localStorage.getItem('autofill_use_igdb') !== 'false');
const useRAWG = ref(localStorage.getItem('autofill_use_rawg') !== 'false');
const useVNDB = ref(localStorage.getItem('autofill_use_vndb') !== 'false');
const useGemini = ref(localStorage.getItem('autofill_use_gemini') !== 'false');

const hasTwitch = computed(() => !!(twitchClientId?.value && twitchClientSecret?.value));
const hasRawg = computed(() => !!rawgApiKey?.value);
// Web-grounded autofill is Google-only — gate it on the Google key regardless of the chat provider.
const hasGemini = computed(() => hasGoogleKey());

watch(useIGDB, (newVal) => {
    localStorage.setItem('autofill_use_igdb', newVal.toString());
});

watch(useRAWG, (newVal) => {
    localStorage.setItem('autofill_use_rawg', newVal.toString());
});

watch(useVNDB, (newVal) => {
    localStorage.setItem('autofill_use_vndb', newVal.toString());
});

watch(useGemini, (newVal) => {
    localStorage.setItem('autofill_use_gemini', newVal.toString());
});

// Detailed comparison rows
interface ComparisonRow {
    fieldKey: string;
    fieldName: string;
    currentVal: string;
    proposedVal: string;
    source: 'IGDB' | 'RAWG' | 'VNDB API' | 'Steam' | 'Gemini AI' | null;
    selected: boolean;
    type: 'link' | 'reception';
    aggregator?: 'Metacritic' | 'OpenCritic' | 'IGDB';
    // Raw parsed values to write when applied
    rawVal?: any; 
    found: boolean;
}

const comparisonRows = ref<ComparisonRow[]>([]);
const searchPerformed = ref(false);

const openSettings = () => {
    visible.value = false;
    uiStore.isSettingsOpen = true;
};

// Initialize search query with page title
watch(visible, (val) => {
    if (val) {
        searchTitle.value = workspaceStore.activePage?.title || '';
        candidates.value = [];
        selectedCandidates.value = [];
        comparisonRows.value = [];
        searchPerformed.value = false;
        
        if (!hasGoogleKey()) {
            useGemini.value = false;
        } else {
            useGemini.value = localStorage.getItem('autofill_use_gemini') !== 'false';
        }

        if (!hasTwitch.value) {
            useIGDB.value = false;
        } else {
            useIGDB.value = localStorage.getItem('autofill_use_igdb') !== 'false';
        }

        if (!hasRawg.value) {
            useRAWG.value = false;
        } else {
            useRAWG.value = localStorage.getItem('autofill_use_rawg') !== 'false';
        }

        useVNDB.value = localStorage.getItem('autofill_use_vndb') !== 'false';
    }
});

const isCandidateSelected = (cand: IGDBGameCandidate) => {
    return selectedCandidates.value.some(c => c.id === cand.id && (c as any).source === (cand as any).source);
};

const toggleCandidateSelection = (cand: IGDBGameCandidate) => {
    const idx = selectedCandidates.value.findIndex(c => c.id === cand.id && (c as any).source === (cand as any).source);
    if (idx > -1) {
        selectedCandidates.value.splice(idx, 1);
    } else {
        selectedCandidates.value.push(cand);
    }
};

const handleSearch = async () => {
    if (!searchTitle.value.trim()) return;
    isSearching.value = true;
    candidates.value = [];
    selectedCandidates.value = [];
    comparisonRows.value = [];
    searchPerformed.value = true;

    try {
        let igdbCandidates: IGDBGameCandidate[] = [];
        let rawgCandidates: IGDBGameCandidate[] = [];

        if (useIGDB.value && hasTwitch.value) {
            igdbCandidates = await metadataFillerService.searchIGDB(
                searchTitle.value,
                twitchClientId!.value,
                twitchClientSecret!.value
            );
            igdbCandidates.forEach(c => (c as any).source = 'IGDB');
        }

        if (useRAWG.value && hasRawg.value) {
            rawgCandidates = await metadataFillerService.searchRAWG(
                searchTitle.value,
                rawgApiKey!.value
            );
            rawgCandidates.forEach(c => (c as any).source = 'RAWG');
        }

        candidates.value = [...igdbCandidates, ...rawgCandidates];

        // Fallback to Steam search if no candidates found
        if (candidates.value.length === 0) {
            const fallback = await metadataFillerService.searchGeneralStoreFallback(searchTitle.value);
            if (fallback) {
                candidates.value = [{
                    id: -1,
                    name: searchTitle.value,
                    slug: '',
                    source: 'Steam' as any
                }];
                // Auto-select fallback
                selectedCandidates.value = [candidates.value[0]];
                await handleFetchDetailsForSelected();
            }
        }
    } catch (e) {
        console.error('Autofill search error:', e);
    } finally {
        isSearching.value = false;
    }
};

const handleFetchDetailsForSelected = async () => {
    if (selectedCandidates.value.length === 0) return;
    isFetchingDetails.value = true;
    comparisonRows.value = [];

    try {
        const mergedMetadata: ExtractedMetadata = {};

        // Loop through all selected candidates and fetch/merge details
        for (const candidate of selectedCandidates.value) {
            const source = (candidate as any).source || 'IGDB';
            let candMetadata: ExtractedMetadata | null = null;

            if (candidate.id !== -1) {
                if (source === 'IGDB' && useIGDB.value && hasTwitch.value) {
                    candMetadata = await metadataFillerService.fetchIGDBGameDetails(
                        candidate.id,
                        twitchClientId!.value,
                        twitchClientSecret!.value
                    );
                } else if (source === 'RAWG' && useRAWG.value && hasRawg.value) {
                    candMetadata = await metadataFillerService.fetchRAWGGameDetails(
                        candidate.id,
                        rawgApiKey!.value
                    );
                }
            } else {
                // Fetch direct Steam details fallback
                candMetadata = await metadataFillerService.searchGeneralStoreFallback(searchTitle.value);
            }

            if (candMetadata) {
                // Merge data sequentially: prioritize fields that are not yet filled
                Object.keys(candMetadata).forEach((key) => {
                    const k = key as keyof ExtractedMetadata;
                    const val = candMetadata![k];
                    if (val && (!mergedMetadata[k] || mergedMetadata[k] === '')) {
                        mergedMetadata[k] = val;
                        // Tag specific source for this merged field
                        (mergedMetadata as any)[k + '_source'] = source;
                    }
                });
            }
        }

        // Query VNDB if enabled and not already populated
        if (useVNDB.value && !mergedMetadata.vndb) {
            const queryName = selectedCandidates.value[0]?.name || searchTitle.value;
            const vndbData = await metadataFillerService.fetchVNDBMetadata(queryName);
            if (vndbData && vndbData.vndb) {
                mergedMetadata.vndb = vndbData.vndb;
                (mergedMetadata as any)['vndb_source'] = 'VNDB API';
            }
        }

        // Query Steam AppDetails for Metacritic info if steamAppId exists but Metacritic score/ID is missing
        if (mergedMetadata.steamAppId && (!mergedMetadata.metacriticScore || !mergedMetadata.metacriticId)) {
            const steamDetails = await metadataFillerService.fetchSteamDetails(mergedMetadata.steamAppId);
            Object.keys(steamDetails).forEach((key) => {
                const k = key as keyof ExtractedMetadata;
                const val = steamDetails[k];
                if (val && (!mergedMetadata[k] || mergedMetadata[k] === '')) {
                    mergedMetadata[k] = val;
                    (mergedMetadata as any)[k + '_source'] = 'Steam';
                }
            });
        }

        // Fetch from Gemini Grounding if enabled
        if (useGemini.value && hasGoogleKey()) {
            const queryName = selectedCandidates.value[0]?.name || searchTitle.value;
            const geminiData = await metadataFillerService.fetchMetadataWithGemini(queryName);

            if (geminiData) {
                Object.keys(geminiData).forEach((key) => {
                    const k = key as keyof ExtractedMetadata;
                    const val = geminiData[k];
                    if (val && (!mergedMetadata[k] || mergedMetadata[k] === '')) {
                        mergedMetadata[k] = val;
                        (mergedMetadata as any)[k + '_source'] = 'Gemini AI';
                    }
                });
            }
        }

        // Build comparison table
        buildComparison(mergedMetadata);
    } catch (e) {
        console.error('Failed to load candidate details:', e);
    } finally {
        isFetchingDetails.value = false;
    }
};

const buildComparison = (metadata: ExtractedMetadata) => {
    const rows: ComparisonRow[] = [];
    const infobox = workspaceStore.activeGameData.infobox;

    // Helper to get current link value
    const getLinkVal = (key: keyof typeof infobox.links) => {
        return (infobox.links?.[key] || '') as string;
    };

    // Helper to get current reception value
    const getReceptionVal = (aggregator: 'Metacritic' | 'OpenCritic' | 'IGDB') => {
        const item = infobox.reception?.find(r => r.aggregator === aggregator);
        if (!item) return '';
        return `${item.score} (ID: ${item.id})`;
    };

    // Mapping fields
    const fields: Array<{
        key: keyof ExtractedMetadata;
        name: string;
        type: 'link' | 'reception';
        linkKey?: keyof typeof infobox.links;
        aggregator?: 'Metacritic' | 'OpenCritic' | 'IGDB';
    }> = [
        { key: 'steamAppId', name: 'Steam App ID', type: 'link', linkKey: 'steamAppId' },
        { key: 'gogComId', name: 'GOG.com Slug', type: 'link', linkKey: 'gogComId' },
        { key: 'epic', name: 'Epic Store Slug', type: 'link', linkKey: 'epic' },
        { key: 'microsoft', name: 'Microsoft Store ID', type: 'link', linkKey: 'microsoft' },
        { key: 'itch', name: 'Itch.io Slug', type: 'link', linkKey: 'itch' },
        { key: 'zoom', name: 'Zoom Platform Slug', type: 'link', linkKey: 'zoom' },
        { key: 'officialSite', name: 'Official Site URL', type: 'link', linkKey: 'officialSite' },
        { key: 'hltb', name: 'HLTB ID', type: 'link', linkKey: 'hltb' },
        { key: 'igdb', name: 'IGDB Slug', type: 'link', linkKey: 'igdb' },
        { key: 'wikipedia', name: 'Wikipedia Title', type: 'link', linkKey: 'wikipedia' },
        { key: 'vndb', name: 'VNDB ID', type: 'link', linkKey: 'vndb' },
        { key: 'lutris', name: 'Lutris Slug', type: 'link', linkKey: 'lutris' },
        { key: 'wineHq', name: 'WineHQ Slug', type: 'link', linkKey: 'wineHq' }
    ];

    // Add links
    fields.forEach((f) => {
        const foundVal = metadata[f.key];
        if (f.linkKey) {
            const current = getLinkVal(f.linkKey);
            const source = foundVal ? ((metadata as any)[f.key + '_source'] || 
                (f.key === 'steamAppId' && metadata.metacriticScore ? 'Steam' : (selectedCandidates.value[0]?.source || 'IGDB'))) : null;
            
            rows.push({
                fieldKey: `links.${f.linkKey}`,
                fieldName: f.name,
                currentVal: current,
                proposedVal: foundVal || '',
                source: source as any,
                selected: !!(foundVal && current !== foundVal),
                type: 'link',
                rawVal: foundVal || undefined,
                found: !!foundVal
            });
        }
    });

    // Add reception
    const receptionFields: Array<{
        scoreKey: 'metacriticScore' | 'opencriticScore' | 'igdbScore';
        idKey: 'metacriticId' | 'opencriticId' | 'igdb';
        name: string;
        aggregator: 'Metacritic' | 'OpenCritic' | 'IGDB';
    }> = [
        { scoreKey: 'metacriticScore', idKey: 'metacriticId', name: 'Metacritic Score', aggregator: 'Metacritic' },
        { scoreKey: 'opencriticScore', idKey: 'opencriticId', name: 'OpenCritic Score', aggregator: 'OpenCritic' },
        { scoreKey: 'igdbScore', idKey: 'igdb', name: 'IGDB Rating', aggregator: 'IGDB' }
    ];

    receptionFields.forEach((rf) => {
        const score = metadata[rf.scoreKey];
        const id = metadata[rf.idKey];
        const current = getReceptionVal(rf.aggregator);
        const proposedDisplay = score && id ? `${score} (ID: ${id})` : '';
        const source = (score && id) ? (((metadata as any)[rf.scoreKey + '_source'] || 
            (rf.aggregator === 'Metacritic' ? 'Steam' : (selectedCandidates.value[0]?.source || 'IGDB')))) : null;

        rows.push({
            fieldKey: `reception.${rf.aggregator}`,
            fieldName: rf.name,
            currentVal: current,
            proposedVal: proposedDisplay,
            source: source as any,
            selected: !!(score && id && current !== proposedDisplay),
            type: 'reception',
            aggregator: rf.aggregator,
            rawVal: score && id ? { score, id } : undefined,
            found: !!(score && id)
        });
    });

    comparisonRows.value = rows;
};

const hasChangesToApply = computed(() => {
    return comparisonRows.value.some(r => r.selected);
});

const groupedRows = computed(() => {
    const groups: Record<string, ComparisonRow[]> = {
        'IGDB API': [],
        'RAWG API': [],
        'VNDB API': [],
        'Steam API': [],
        'Gemini AI': [],
        'Not Found': []
    };
    
    comparisonRows.value.forEach(row => {
        if (!row.found) {
            groups['Not Found'].push(row);
        } else if (row.source === 'IGDB') {
            groups['IGDB API'].push(row);
        } else if (row.source === 'RAWG') {
            groups['RAWG API'].push(row);
        } else if (row.source === 'VNDB API') {
            groups['VNDB API'].push(row);
        } else if (row.source === 'Steam') {
            groups['Steam API'].push(row);
        } else if (row.source === 'Gemini AI') {
            groups['Gemini AI'].push(row);
        } else {
            groups['Not Found'].push(row);
        }
    });

    return Object.entries(groups)
        .filter(([_, items]) => items.length > 0)
        .map(([name, items]) => ({ name, items }));
});

const handleApply = () => {
    const infobox = workspaceStore.activeGameData.infobox;
    if (!infobox.links) infobox.links = {} as any;
    if (!infobox.reception) infobox.reception = [];

    comparisonRows.value.forEach((row) => {
        if (!row.selected) return;

        if (row.type === 'link') {
            const key = row.fieldKey.replace('links.', '') as keyof typeof infobox.links;
            (infobox.links as any)[key] = row.rawVal;
        } else if (row.type === 'reception' && row.aggregator) {
            const existing = infobox.reception.find(r => r.aggregator === row.aggregator);
            if (existing) {
                existing.score = row.rawVal.score;
                existing.id = row.rawVal.id;
            } else {
                infobox.reception.push({
                    aggregator: row.aggregator,
                    score: row.rawVal.score,
                    id: row.rawVal.id
                });
            }
        }
    });

    // Force sync back to store
    workspaceStore.syncToWikitext();

    visible.value = false;
};
</script>

<template>
    <Dialog v-model:visible="visible" modal header="Autofill Ratings & Links" :style="{ width: '680px' }" :draggable="false" class="p-fluid glass">
        <template #header>
            <div class="flex items-center gap-2">
                <Sparkles class="w-5 h-5 text-primary-500 animate-pulse" />
                <span class="font-bold text-lg">Autofill Ratings & Links</span>
            </div>
        </template>

        <div class="flex flex-col gap-5 py-2">
            <!-- Settings and Status Panel with Explanations (Scrollable) -->
            <div class="flex flex-col gap-3.5 p-4 bg-surface-50 dark:bg-surface-900/50 rounded-xl border border-surface-200 dark:border-surface-800 max-h-64 overflow-y-auto custom-scrollbar">
                
                <!-- IGDB API -->
                <div class="flex items-start justify-between gap-4 py-0.5">
                    <div class="flex flex-col gap-0.5">
                        <div class="flex items-center gap-2 text-xs font-semibold text-surface-900 dark:text-surface-100">
                            <Twitch class="w-3.5 h-3.5 text-purple-500 shrink-0" />
                            <span>IGDB API</span>
                        </div>
                        <p class="text-[11px] text-surface-500 leading-normal max-w-[480px]">
                            Retrieves store links (Steam, GOG, Epic, Itch, Xbox) and Wikipedia/official URLs.
                        </p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <template v-if="hasTwitch">
                            <ToggleSwitch v-model="useIGDB" class="scale-90" />
                            <span class="text-[11px] font-semibold w-10 text-right" :class="useIGDB ? 'text-purple-500' : 'text-surface-400'">
                                {{ useIGDB ? 'Active' : 'Off' }}
                            </span>
                        </template>
                        <template v-else>
                            <Button label="Configure" icon="pi pi-cog" severity="secondary" size="small" class="h-7 text-xs font-semibold py-0 px-2.5 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 border-0 transition-colors shrink-0" @click="openSettings" />
                        </template>
                    </div>
                </div>

                <div class="border-t border-surface-200 dark:border-surface-800/60"></div>

                <!-- RAWG API -->
                <div class="flex items-start justify-between gap-4 py-0.5">
                    <div class="flex flex-col gap-0.5">
                        <div class="flex items-center gap-2 text-xs font-semibold text-surface-900 dark:text-surface-100">
                            <Database class="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>RAWG.io API</span>
                        </div>
                        <p class="text-[11px] text-surface-500 leading-normal max-w-[480px]">
                            Retrieves Metacritic scores and storefront links (Steam, GOG, Epic, Itch, Xbox).
                        </p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <template v-if="hasRawg">
                            <ToggleSwitch v-model="useRAWG" class="scale-90" />
                            <span class="text-[11px] font-semibold w-10 text-right" :class="useRAWG ? 'text-rose-500' : 'text-surface-400'">
                                {{ useRAWG ? 'Active' : 'Off' }}
                            </span>
                        </template>
                        <template v-else>
                            <Button label="Configure" icon="pi pi-cog" severity="secondary" size="small" class="h-7 text-xs font-semibold py-0 px-2.5 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 border-0 transition-colors shrink-0" @click="openSettings" />
                        </template>
                    </div>
                </div>



                <div class="border-t border-surface-200 dark:border-surface-800/60"></div>

                <!-- VNDB API -->
                <div class="flex items-start justify-between gap-4 py-0.5">
                    <div class="flex flex-col gap-0.5">
                        <div class="flex items-center gap-2 text-xs font-semibold text-surface-900 dark:text-surface-100">
                            <Database class="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>VNDB API</span>
                        </div>
                        <p class="text-[11px] text-surface-500 leading-normal max-w-[480px]">
                            Retrieves visual novel database IDs directly from VNDB.org (no key required).
                        </p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <ToggleSwitch v-model="useVNDB" class="scale-90" />
                        <span class="text-[11px] font-semibold w-10 text-right" :class="useVNDB ? 'text-amber-500' : 'text-surface-400'">
                            {{ useVNDB ? 'Active' : 'Off' }}
                        </span>
                    </div>
                </div>

                <div class="border-t border-surface-200 dark:border-surface-800/60"></div>

                <!-- Gemini AI Service Row -->
                <div class="flex items-start justify-between gap-4 py-0.5">
                    <div class="flex flex-col gap-0.5">
                        <div class="flex items-center gap-2 text-xs font-semibold text-surface-900 dark:text-surface-100">
                            <Cpu class="w-3.5 h-3.5 text-sky-500 shrink-0" />
                            <span>Gemini AI Grounding</span>
                        </div>
                        <p class="text-[11px] text-surface-500 leading-normal max-w-[480px]">
                            Uses Google Search grounding to retrieve secondary database IDs (HLTB, Lutris, WineHQ, etc.).
                        </p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <template v-if="hasGemini">
                            <ToggleSwitch v-model="useGemini" class="scale-90" />
                            <span class="text-[11px] font-semibold w-10 text-right" :class="useGemini ? 'text-sky-500' : 'text-surface-400'">
                                {{ useGemini ? 'Active' : 'Off' }}
                            </span>
                        </template>
                        <template v-else>
                            <Button label="Configure" icon="pi pi-cog" severity="secondary" size="small" class="h-7 text-xs font-semibold py-0 px-2.5 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 border-0 transition-colors shrink-0" @click="openSettings" />
                        </template>
                    </div>
                </div>
            </div>

            <!-- Search Section -->
            <div class="flex gap-2">
                <div class="relative flex-1">
                    <InputText v-model="searchTitle" placeholder="Search game title..." class="w-full pl-9!" @keyup.enter="handleSearch" />
                    <Search class="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <Button label="Search" icon="pi pi-search" class="w-32!" @click="handleSearch" :loading="isSearching" />
            </div>

            <!-- Candidates Results List -->
            <div v-if="candidates.length > 0 && comparisonRows.length === 0" class="flex flex-col gap-2 max-h-68 overflow-y-auto custom-scrollbar border rounded-lg border-surface-200 dark:border-surface-800 bg-surface-50/20 dark:bg-surface-900/10">
                <div class="text-xs font-bold text-surface-400 dark:text-surface-500 uppercase px-3 pt-2">Matches Found</div>
                
                <div v-for="cand in candidates" :key="cand.id" 
                    @click="toggleCandidateSelection(cand)"
                    class="flex items-center justify-between p-3 border-b last:border-0 border-surface-100 dark:border-surface-800 hover:bg-surface-100/50 dark:hover:bg-surface-800/40 cursor-pointer transition-colors group">
                    <div class="flex items-center gap-3">
                        <Checkbox :modelValue="isCandidateSelected(cand)" :binary="true" class="pointer-events-none" />
                        <img v-if="cand.coverUrl" :src="cand.coverUrl" alt="Cover" class="w-8 h-10 object-cover rounded shadow-xs" />
                        <div v-else class="w-8 h-10 bg-surface-200 dark:bg-surface-800 rounded flex items-center justify-center">
                            <Database class="w-4 h-4 text-surface-400" />
                        </div>
                        <div class="flex flex-col gap-0.5">
                            <div class="flex items-center gap-2">
                                <span class="font-semibold text-sm group-hover:text-primary-500 transition-colors">{{ cand.name }}</span>
                                <span class="text-[9px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded-sm bg-surface-200 dark:bg-surface-800 text-surface-500 leading-none">
                                    {{ cand.source || 'IGDB' }}
                                </span>
                            </div>
                            <span class="text-xs text-surface-500" v-if="cand.releaseYear">Released: {{ cand.releaseYear }}</span>
                        </div>
                    </div>
                    <ChevronRight class="w-4 h-4 text-surface-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                
                <!-- Merge selection footer inside candidates container -->
                <div class="flex justify-end p-2.5 border-t border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/10">
                    <Button 
                        :label="selectedCandidates.length > 0 ? `Compare & Merge Selected (${selectedCandidates.length})` : 'Compare & Merge Selected'" 
                        icon="pi pi-clone" 
                        size="small" 
                        class="w-auto! bg-primary-600 border-primary-600 hover:bg-primary-700 hover:border-primary-700 font-semibold"
                        :disabled="selectedCandidates.length === 0"
                        @click="handleFetchDetailsForSelected" 
                    />
                </div>
            </div>

            <!-- Fetching Details Loader -->
            <div v-if="isFetchingDetails" class="flex flex-col items-center justify-center py-8 gap-3">
                <div class="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin"></div>
                <span class="text-xs text-surface-500 font-medium">Retrieving database IDs and ratings...</span>
            </div>

            <!-- No Results Message -->
            <div v-if="searchPerformed && candidates.length === 0 && !isSearching"
                class="flex items-start gap-2 p-3 bg-amber-500/5 text-amber-500 border border-amber-500/10 rounded-lg text-xs leading-normal">
                <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
                <div class="flex flex-col gap-1.5">
                    <span class="font-semibold">No matching games found.</span>
                    <ul class="list-disc pl-4 flex flex-col gap-0.5 text-amber-500/90">
                        <li>Try a shorter title (e.g. just the main name).</li>
                        <li>Remove articles like "The", "A", or "An".</li>
                        <li>Check alternate or regional names.</li>
                        <li>Enable more services in settings if available.</li>
                        <li>Otherwise, enter the IDs manually.</li>
                    </ul>
                </div>
            </div>

            <!-- Comparison Table -->
            <div v-if="comparisonRows.length > 0 && !isFetchingDetails" class="flex flex-col gap-3">
                <div class="text-xs font-bold text-surface-400 dark:text-surface-500 uppercase tracking-wider">Review proposed changes</div>

                <div class="border border-surface-200 dark:border-surface-800 rounded-xl overflow-hidden max-h-80 overflow-y-auto custom-scrollbar">
                    <table class="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr class="bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 font-semibold text-surface-500 dark:text-surface-400">
                                <th class="p-3 w-8"></th>
                                <th class="p-3">Field</th>
                                <th class="p-3">Current</th>
                                <th class="p-3">Proposed</th>
                                <th class="p-3 text-right">Source</th>
                            </tr>
                        </thead>
                        <tbody>
                            <template v-for="group in groupedRows" :key="group.name">
                                <!-- Group Header Row -->
                                <tr class="bg-surface-100/50 dark:bg-surface-900/30 text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                                    <td colspan="5" class="p-2.5 px-3 border-y border-surface-150 dark:border-surface-800/80">
                                        <div class="flex items-center gap-1.5">
                                            <span class="w-1.5 h-1.5 rounded-full"
                                                :class="{
                                                    'bg-purple-500': group.name === 'IGDB API',
                                                    'bg-rose-500': group.name === 'RAWG API',
                                                    'bg-green-500': group.name === 'MobyGames API',
                                                    'bg-amber-500': group.name === 'VNDB API',
                                                    'bg-blue-500': group.name === 'Steam API',
                                                    'bg-sky-500': group.name === 'Gemini AI',
                                                    'bg-surface-400 dark:bg-surface-600': group.name === 'Not Found'
                                                }"
                                            ></span>
                                            <span>{{ group.name }} ({{ group.items.length }})</span>
                                        </div>
                                    </td>
                                </tr>
                                <!-- Rows in this group -->
                                <tr v-for="row in group.items" :key="row.fieldKey"
                                    class="border-b last:border-0 border-surface-100 dark:border-surface-800 hover:bg-surface-50/50 dark:hover:bg-surface-800/10 transition-colors"
                                    :class="{ 'opacity-50 saturate-50 dark:opacity-40': row.found && row.currentVal === row.proposedVal }">
                                    <td class="p-3">
                                        <Checkbox v-model="row.selected" :binary="true" :disabled="!row.found" />
                                    </td>
                                    <td class="p-3 font-medium text-surface-900 dark:text-surface-100">{{ row.fieldName }}</td>
                                    <td class="p-3 text-surface-500 italic truncate max-w-[120px]">{{ row.currentVal || 'Empty' }}</td>
                                    <td class="p-3 truncate max-w-[180px]">
                                        <span v-if="row.found" class="font-semibold text-green-600 dark:text-green-400" v-tooltip="row.proposedVal" :title="row.proposedVal">
                                            {{ row.proposedVal }}
                                        </span>
                                        <span v-else class="text-surface-400 dark:text-surface-600 italic">
                                            Not found
                                        </span>
                                    </td>
                                    <td class="p-3 text-right">
                                        <span v-if="row.found && row.source" class="text-xs font-bold uppercase tracking-tight px-2 py-0.5 rounded-sm"
                                            :class="{
                                                'bg-purple-500/10 text-purple-500 border border-purple-500/20': row.source === 'IGDB',
                                                'bg-rose-500/10 text-rose-500 border border-rose-500/20': row.source === 'RAWG',
                                                'bg-amber-500/10 text-amber-500 border border-amber-500/20': row.source === 'VNDB API',
                                                'bg-blue-500/10 text-blue-500 border border-blue-500/20': row.source === 'Steam',
                                                'bg-sky-500/10 text-sky-500 border border-sky-500/20': row.source === 'Gemini AI'
                                            }">
                                            {{ row.source }}
                                        </span>
                                        <span v-else class="text-surface-400 dark:text-surface-600">
                                            &mdash;
                                        </span>
                                    </td>
                                </tr>
                            </template>
                        </tbody>
                    </table>
                </div>

                <div class="text-xs text-surface-400 dark:text-surface-500 flex items-center gap-1 ml-1 bg-surface-50 dark:bg-surface-900/30 p-2 rounded border border-surface-100 dark:bg-surface-800">
                    <Info class="w-3.5 h-3.5 shrink-0" />
                    Checking fields will overwrite their current values with proposed ones. Uncheck fields to skip updates.
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2 w-full">
                <Button label="Cancel" severity="secondary" text @click="visible = false" />
                <Button label="Apply Selected" icon="pi pi-check" @click="handleApply" :disabled="!hasChangesToApply || isFetchingDetails" class="bg-primary-600 border-primary-600 hover:bg-primary-700 hover:border-primary-700" />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
.glass {
    backdrop-filter: blur(12px);
    background: rgba(var(--surface-card-rgb), 0.85);
}
</style>
