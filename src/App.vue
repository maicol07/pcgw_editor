<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent } from 'vue';
import { useWorkspaceStore } from './stores/workspace';
import { storeToRefs } from 'pinia';
import WorkspaceSidebar from './components/WorkspaceSidebar.vue';
import { generateWikitext } from './utils/wikitext';
import { parseWikitext } from './utils/parser';
import { renderWikitextToHtml } from './utils/renderer';
import { useAutoTheme } from './composables/useAutoTheme';
import InfoboxForm from './components/InfoboxForm.vue';
import AvailabilityForm from './components/AvailabilityForm.vue';
import MonetizationForm from './components/MonetizationForm.vue';
import GameDataForm from './components/GameDataForm.vue';
// Lazy load CodeEditor only when switching to Code mode
const CodeEditor = defineAsyncComponent(() => import('./components/CodeEditor.vue'));
import StateForm from './components/StateForm.vue';
import SectionGallery from './components/SectionGallery.vue';
import GeneralInfoForm from './components/GeneralInfoForm.vue';
import DLCForm from './components/DLCForm.vue';
import LocalizationsForm from './components/LocalizationsForm.vue';
import EssentialImprovementsForm from './components/EssentialImprovementsForm.vue';
import SystemRequirementsForm from './components/SystemRequirementsForm.vue';
import IssuesForm from './components/IssuesForm.vue';

import VideoForm from './components/VideoForm.vue';
import InputForm from './components/InputForm.vue';
import AudioForm from './components/AudioForm.vue';
import NetworkForm from './components/NetworkForm.vue';
import VRSupportForm from './components/VRSupportForm.vue';
import APIForm from './components/APIForm.vue';
import MiddlewareForm from './components/MiddlewareForm.vue';

import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import Textarea from 'primevue/textarea';
import SelectButton from 'primevue/selectbutton';
import Panel from 'primevue/panel';
import InputText from 'primevue/inputtext';
import Toolbar from 'primevue/toolbar';
import Button from 'primevue/button';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import iconBulletDocument from './assets/icons/bullet-document.svg';
import { reactive, provide } from 'vue';

// Modes
type EditorMode = 'Visual' | 'Code';
const editorMode = ref<EditorMode>('Visual');
const isModeSwitching = ref(false);
const isCodeEditorLoaded = ref(false);
type PreviewMode = 'Local' | 'API';
const previewMode = ref<PreviewMode>('API');

// Progressive rendering - defer heavy components
const isInitialLoad = ref(true);

// After initial mount, defer rendering of collapsed panels
import { onMounted } from 'vue';
onMounted(() => {
    // Small delay to let the page render first
    requestAnimationFrame(() => {
        setTimeout(() => {
            isInitialLoad.value = false;
        }, 100);
    });
});

// Auto theme based on system preference
// Auto theme based on system preference
useAutoTheme();

const store = useWorkspaceStore();
// Use storeToRefs for reactive access to store state if needed, but activeGameData is a computed ref returned by store
const { activeGameData } = storeToRefs(store);

// Map gameData to store
const gameData = activeGameData; 

// baseWikitext is now stored in the workspace store, accessed via activePage
const baseWikitext = computed({
    get: () => store.activePage?.baseWikitext || '',
    set: (val) => {
        if (store.activePage) {
            store.activePage.baseWikitext = val;
            store.activePage.lastModified = Date.now();
        }
    }
});

// Page Title mapping
const pageTitle = computed({
    get: () => store.activePage?.title || '',
    set: (val) => {
        if (store.activePage) store.renamePage(store.activePage.id, val);
    }
});

const sidebarVisible = ref(false);

// Computed
const wikitext = computed(() => generateWikitext(gameData.value, baseWikitext.value));

// Logic for active wikitext source
const manualWikitext = ref(wikitext.value);

const currentWikitext = computed(() => {
    return editorMode.value === 'Visual' ? wikitext.value : manualWikitext.value;
});

// Preview State
const renderedHtml = ref('');
const isLoading = ref(false);
const error = ref('');

// Simple Debounce
const debounce = (fn: Function, delay: number) => {
    let timeoutId: any;
    return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

// API Fetcher
const fetchPreview = async (text: string) => {
    if (previewMode.value === 'Local') {
        renderedHtml.value = renderWikitextToHtml(text);
        return;
    }

    isLoading.value = true;
    error.value = '';
    
    // Direct POST request to PCGamingWiki API
    // We use POST to avoid URL length limits.
    const params = new URLSearchParams({
        action: 'parse',
        format: 'json',
        contentmodel: 'wikitext',
        prop: 'text',
        disablelimitreport: 'true',
        origin: '*', // Required for CORS
        text: text,
        title: pageTitle.value || 'Main Page' // Include title for {{PAGENAME}} context
    });

    try {
        const response = await fetch('https://www.pcgamingwiki.com/w/api.php', {
            method: 'POST',
            body: params
        });

        if (!response.ok) {
             const body = await response.text();
             throw new Error(`HTTP ${response.status}: ${body.substring(0, 100)}`);
        }
        
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.info || 'API Error');
        }
        renderedHtml.value = data.parse.text['*'];
    } catch (e: any) {
        console.error("Preview fetch failed:", e);
        error.value = `Failed to load preview: ${e.message}. Using local renderer.`;
        // Fallback to local on hard failure
        renderedHtml.value = renderWikitextToHtml(text); 
    } finally {
        isLoading.value = false;
    }
};

// Debounced Watcher - Faster for better UX
const debouncedFetch = debounce((newText: string) => {
    fetchPreview(newText);
}, 500); // 500ms delay for snappier feel

watch(currentWikitext, (newVal) => {
    debouncedFetch(newVal);
}, { immediate: true });

watch(previewMode, () => {
    fetchPreview(currentWikitext.value);
});

// Watch title change to update preview if in API mode
watch(pageTitle, () => {
    if (previewMode.value === 'API') {
       debouncedFetch(currentWikitext.value);
    }
});

async function handleModeChange(newMode: EditorMode) {
    const oldMode = editorMode.value === newMode ? (newMode === 'Visual' ? 'Code' : 'Visual') : editorMode.value;
    
    if (newMode === 'Code' && oldMode === 'Visual') {
        // Fast: just copy the generated wikitext
        manualWikitext.value = wikitext.value;
        // Mark that CodeEditor is being loaded (lazy)
        if (!isCodeEditorLoaded.value) {
            isCodeEditorLoaded.value = true;
        }
    } else if (newMode === 'Visual' && oldMode === 'Code') {
        // Show skeleton during parsing and rendering
        isInitialLoad.value = true;
        isModeSwitching.value = true;
        
        // Use setTimeout to allow UI to update before heavy parsing
        await new Promise(resolve => setTimeout(resolve, 50));
        
        try {
            const parsedData = parseWikitext(manualWikitext.value);
            gameData.value = parsedData;
            baseWikitext.value = manualWikitext.value;
        } catch (e) {
            console.error("Failed to parse wikitext:", e);
        } finally {
            isModeSwitching.value = false;
            // Keep skeleton visible a bit longer while components mount
            await new Promise(resolve => setTimeout(resolve, 100));
            isInitialLoad.value = false;
        }
    }
}



// ... existing imports

// Panel State for Expand/Collapse
const panelState = reactive({
    articleState: true,
    infobox: true,
    introduction: true,
    availability: true,
    monetization: true,
    dlc: true,
    essentialImprovements: true,
    gameData: true,
    video: true,
    input: true,
    audio: true,
    network: true,
    vr: true,
    issues: true,
    other: true,
    systemReq: true,
    l10n: true,
    general: true,
});

// Lazy rendering - only render panel content if expanded or has been expanded
const panelsRendered = ref<Record<string, boolean>>({});

// Initialize: only render panels that are initially expanded (collapsed=false)
Object.keys(panelState).forEach(key => {
    panelsRendered.value[key] = !(panelState as any)[key];
});

// Watch for panel expansions to trigger rendering
watch(panelState, (newState) => {
    Object.keys(newState).forEach(key => {
        if (!(newState as any)[key] && !panelsRendered.value[key]) {
            panelsRendered.value[key] = true;
        }
    });
});

// Global Event Bus for deep components
const uiBus = reactive({
    expandAllCount: 0,
    collapseAllCount: 0
});
provide('uiBus', uiBus);

const expandAll = () => {
    Object.keys(panelState).forEach(k => (panelState as any)[k] = false);
    uiBus.expandAllCount++;
};

const collapseAll = () => {
    Object.keys(panelState).forEach(k => (panelState as any)[k] = true);
    uiBus.collapseAllCount++;
};

const searchQuery = ref('');
const performSearch = () => {
    const q = searchQuery.value.toLowerCase();
    if (!q) return;
    
    // Map keywords to panels
    const keywords: Record<string, string[]> = {
        infobox: ['cover', 'developer', 'publisher', 'engine', 'genre', 'taxonomy'],
        video: ['resolution', 'fps', 'widescreen', 'hdr', 'ray tracing', 'fov'],
        input: ['mouse', 'keyboard', 'controller', 'remap', 'bind'],
        audio: ['surround', 'volume', 'voice', 'mute'],
        network: ['multiplayer', 'server', 'p2p', 'crossplay'],
        vr: ['hmd', 'trackir', 'oculus', 'vive'],
        systemReq: ['requirement', 'ram', 'gpu', 'cpu', 'os'],
        availability: ['store', 'drm', 'launcher'],
        // ... add more as needed
    };

    // Simple search: check keys and keywords
    Object.keys(panelState).forEach(key => {
        const matchKey = key.toLowerCase().includes(q);
        const matchKeywords = keywords[key]?.some(k => k.includes(q)) ?? false;
        
        if (matchKey || matchKeywords) {
            (panelState as any)[key] = false; // Expand matches
        }
    });
};

provide('searchQuery', searchQuery);

watch(searchQuery, (val) => {
    if (val.length > 2) performSearch();
});

const editorModeOptions = ref(['Visual', 'Code']);
const previewOptions = ref(['Local', 'API']);

</script>

<template>
  <div class="h-screen w-screen overflow-hidden bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-0 transition-colors duration-200">
    <WorkspaceSidebar v-model:visible="sidebarVisible" />
    <Splitter style="height: 100vh" class="border-none !mb-0 !rounded-none bg-transparent splitter-modern">
      <SplitterPanel class="flex flex-col overflow-hidden relative" :size="50" :minSize="30">
        <Toolbar class="!border-b !border-0 !rounded-none glass glass-border shadow-soft z-20 !p-1.5 sticky top-0">
            <template #start>
                <div class="flex items-center gap-2 md:gap-3">
                    <Button icon="pi pi-bars" text rounded @click="sidebarVisible = true" severity="secondary" class="hover-scale" />
                    <h2 class="font-bold text-base md:text-lg bg-gradient-to-r from-primary-500 via-primary-600 to-violet-600 bg-clip-text text-transparent shrink-0 tracking-tight">PCGW EDITOR</h2>
                    <span class="text-surface-300 dark:text-surface-600 hidden lg:block text-xs">•</span>
                    <InputText v-model="pageTitle" placeholder="Page Title..." class="w-48 lg:w-64 !py-1.5 !px-2.5 text-sm hidden md:block" />
                </div>
            </template>
            <template #end>
                <SelectButton v-model="editorMode" :options="editorModeOptions" :allowEmpty="false" size="small" @update:modelValue="handleModeChange" class="transition-fast" />
            </template>
        </Toolbar>
        
        <!-- Loading Overlay for Mode Switching -->
        <Transition name="fade-fast">
            <div v-if="isModeSwitching" class="absolute inset-0 bg-surface-0/80 dark:bg-surface-950/80 backdrop-blur-sm z-30 flex items-center justify-center">
                <div class="flex flex-col items-center gap-3">
                    <i class="pi pi-spin pi-spinner text-4xl text-primary-500"></i>
                    <span class="text-surface-600 dark:text-surface-300 font-medium">Parsing wikitext...</span>
                </div>
            </div>
        </Transition>
        
        <div class="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-b from-surface-50 to-surface-100 dark:from-surface-950 dark:to-surface-900">
          <Transition name="fade" mode="out-in">
            <!-- Skeleton Screen during initial load -->
            <div v-if="editorMode === 'Visual' && isInitialLoad" class="p-4 md:p-5 max-w-6xl mx-auto flex flex-col gap-4" key="skeleton">
                <div class="h-12 bg-surface-200 dark:bg-surface-700 rounded-lg animate-pulse"></div>
                <div class="h-32 bg-surface-200 dark:bg-surface-700 rounded-lg animate-pulse"></div>
                <div class="h-24 bg-surface-200 dark:bg-surface-700 rounded-lg animate-pulse"></div>
                <div class="h-48 bg-surface-200 dark:bg-surface-700 rounded-lg animate-pulse"></div>
                <div class="h-32 bg-surface-200 dark:bg-surface-700 rounded-lg animate-pulse"></div>
                <div class="flex items-center justify-center h-32">
                    <div class="flex flex-col items-center gap-3">
                        <i class="pi pi-spin pi-spinner text-3xl text-primary-500"></i>
                        <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Loading editor...</span>
                    </div>
                </div>
            </div>
            
            <!-- Actual Visual Editor -->
            <div v-else-if="editorMode === 'Visual'" class="p-4 md:p-5 max-w-6xl mx-auto flex flex-col gap-4" key="visual">
              
              <!-- Quick Actions Toolbar -->
              <div class="flex items-center justify-between glass glass-border p-2.5 rounded-lg shadow-soft sticky top-0 z-20 animate-slide-in-down">
                  <div class="flex items-center gap-1.5">
                       <Button icon="pi pi-angle-double-down" label="Expand" text size="small" @click="expandAll" severity="secondary" class="!text-xs !px-2 !py-1 hover-scale" />
                       <Button icon="pi pi-angle-double-up" label="Collapse" text size="small" @click="collapseAll" severity="secondary" class="!text-xs !px-2 !py-1 hover-scale" />
                       <div class="h-4 w-px bg-surface-300 dark:bg-surface-600 mx-1"></div>
                       <span class="text-2xs text-surface-500 dark:text-surface-400 hidden sm:inline">⌘K to search</span>
                  </div>
                  <div class="flex items-center gap-2">
                       <IconField iconPosition="left">
                            <InputIcon class="pi pi-search text-surface-400" />
                            <InputText v-model="searchQuery" placeholder="Search..." size="small" class="w-40 sm:w-48 lg:w-64 !text-sm" />
                       </IconField>
                  </div>
              </div>

              <Panel toggleable v-model:collapsed="panelState.articleState" class="panel-modern shadow-soft hover-lift">
                  <template #header>
                      <div class="flex items-center gap-2">
                          <i class="pi pi-file text-primary-500 text-sm"></i>
                          <span class="font-semibold text-sm">Article State</span>
                      </div>
                  </template>
                  <StateForm v-if="panelsRendered.articleState" v-model="gameData.articleState" :gameData="gameData" />
              </Panel>

              <Panel toggleable v-model:collapsed="panelState.infobox" class="panel-modern shadow-soft hover-lift">
                  <template #header>
                      <div class="flex items-center gap-2">
                          <i class="pi pi-info-circle text-accent-teal-500 text-sm"></i>
                          <span class="font-semibold text-sm">Infobox</span>
                      </div>
                  </template>
                  <InfoboxForm v-if="panelsRendered.infobox" v-model="gameData.infobox" />
              </Panel>

              <Panel toggleable v-model:collapsed="panelState.introduction" class="panel-modern shadow-soft hover-lift">
                  <template #header>
                      <div class="flex items-center gap-2">
                          <i class="pi pi-align-left text-accent-orange-500 text-sm"></i>
                          <span class="font-semibold text-sm">Introduction</span>
                      </div>
                  </template>
                <div class="flex flex-col gap-4">
                    <p class="text-2xs text-surface-500 dark:text-surface-400 italic bg-surface-100 dark:bg-surface-800/50 p-2 rounded">
                        The first instance of the game title in introduction should be written as <code class="text-primary-600 dark:text-primary-400">'''''Title'''''</code>.
                    </p>
                    <div class="flex flex-col gap-1.5">
                        <label class="font-medium text-xs text-surface-600 dark:text-surface-300 flex items-center gap-1.5">
                           <span class="px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded text-[10px] uppercase font-bold tracking-wider">Introduction</span>
                        </label>
                        <Textarea v-model="gameData.introduction.introduction" rows="4" autoResize class="w-full !text-sm !p-2.5" placeholder="'''''Title''''' is a..." />
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div class="flex flex-col gap-1.5">
                             <label class="font-medium text-xs text-surface-600 dark:text-surface-300 flex items-center gap-1.5">
                                <span class="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-[10px] uppercase font-bold tracking-wider">Release History</span>
                            </label>
                            <Textarea v-model="gameData.introduction.releaseHistory" rows="3" autoResize class="w-full !text-sm !p-2.5" placeholder="Game was first released on..." />
                        </div>
                        <div class="flex flex-col gap-1.5">
                             <label class="font-medium text-xs text-surface-600 dark:text-surface-300 flex items-center gap-1.5">
                                <span class="px-1.5 py-0.5 bg-accent-teal-50 dark:bg-teal-900/30 text-accent-teal-600 dark:text-accent-teal-400 rounded text-[10px] uppercase font-bold tracking-wider">Current State</span>
                            </label>
                            <Textarea v-model="gameData.introduction.currentState" rows="3" autoResize class="w-full !text-sm !p-2.5" placeholder="Current major issues..." />
                        </div>
                    </div>
                </div>
              </Panel>

              <Panel toggleable v-model:collapsed="panelState.availability" class="panel-modern shadow-soft hover-lift">
                  <template #header>
                      <div class="flex items-center gap-2">
                          <i class="pi pi-shopping-cart text-accent-emerald-500 text-sm"></i>
                          <span class="font-semibold text-sm">Availability</span>
                      </div>
                  </template>
                <AvailabilityForm v-model="gameData.availability" />
              </Panel>

              <Panel toggleable v-model:collapsed="panelState.monetization" class="panel-modern shadow-soft hover-lift">
                  <template #header>
                      <div class="flex items-center gap-2">
                          <i class="pi pi-dollar text-accent-orange-500 text-sm"></i>
                          <span class="font-semibold text-sm">Monetization</span>
                      </div>
                  </template>
                <MonetizationForm :monetization="gameData.monetization" :microtransactions="gameData.microtransactions" />
              </Panel>

              <Panel toggleable v-model:collapsed="panelState.dlc" class="panel-modern shadow-soft hover-lift">
                  <template #header>
                      <div class="flex items-center gap-2">
                          <i class="pi pi-plus-circle text-primary-600 text-sm"></i>
                          <span class="font-semibold text-sm">DLC & Expansions</span>
                      </div>
                  </template>
                <DLCForm v-model="gameData.dlc" />
              </Panel>

              <Panel toggleable v-model:collapsed="panelState.essentialImprovements" class="panel-modern shadow-soft hover-lift">
                  <template #header>
                      <div class="flex items-center gap-2">
                          <i class="pi pi-star text-yellow-500 text-sm"></i>
                          <span class="font-semibold text-sm">Essential Improvements</span>
                      </div>
                  </template>
                  <EssentialImprovementsForm v-model="gameData.essentialImprovements" />
              </Panel>

              <Panel toggleable v-model:collapsed="panelState.gameData" class="panel-modern shadow-soft hover-lift">
                  <template #header>
                      <div class="flex items-center gap-2">
                          <i class="pi pi-save text-indigo-500 text-sm"></i>
                          <span class="font-semibold text-sm">Game Data (Config, Saves, Cloud)</span>
                      </div>
                  </template>
                  <GameDataForm :config="gameData.config" />
              </Panel>

              <Panel toggleable v-model:collapsed="panelState.video" class="panel-modern shadow-soft hover-lift">
                  <template #header>
                      <div class="flex items-center gap-2">
                          <i class="pi pi-desktop text-blue-500 text-sm"></i>
                          <span class="font-semibold text-sm">Video</span>
                      </div>
                  </template>
                  <div class="flex flex-col gap-6">
                    <SectionGallery v-model="gameData.galleries.video" section="video" />
                    <VideoForm :video="gameData.video" />
                  </div>
              </Panel>

              <Panel toggleable v-model:collapsed="panelState.input" class="panel-modern shadow-soft hover-lift">
                  <template #header>
                      <div class="flex items-center gap-2">
                          <i class="pi pi-keyboard text-sm"></i>
                          <span class="font-semibold text-sm">Input</span>
                      </div>
                  </template>
                  <div class="flex flex-col gap-6">
                    <SectionGallery v-model="gameData.galleries.input" section="input" />
                    <InputForm :input="gameData.input" />
                  </div>
              </Panel>

              <Panel toggleable v-model:collapsed="panelState.audio" class="panel-modern shadow-soft hover-lift">
                  <template #header>
                      <div class="flex items-center gap-2">
                          <i class="pi pi-volume-up text-sm"></i>
                          <span class="font-semibold text-sm">Audio</span>
                      </div>
                  </template>
                  <div class="flex flex-col gap-6">
                    <SectionGallery v-model="gameData.galleries.audio" section="audio" />
                    <AudioForm :audio="gameData.audio" />
                  </div>
              </Panel>

              <Panel toggleable v-model:collapsed="panelState.network" class="panel-modern shadow-soft hover-lift">
                  <template #header>
                      <div class="flex items-center gap-2">
                          <i class="pi pi-wifi text-sm"></i>
                          <span class="font-semibold text-sm">Network</span>
                      </div>
                  </template>
                  <div class="flex flex-col gap-6">
                    <SectionGallery v-model="gameData.galleries.network" section="network" />
                    <NetworkForm :network="gameData.network" />
                  </div>
              </Panel>

              <Panel toggleable v-model:collapsed="panelState.vr" class="panel-modern shadow-soft hover-lift">
                  <template #header>
                      <div class="flex items-center gap-2">
                          <i class="pi pi-eye text-sm"></i>
                          <span class="font-semibold text-sm">VR Support</span>
                      </div>
                  </template>
                  <div class="flex flex-col gap-6">
                    <SectionGallery v-model="gameData.galleries.vr" section="vr" />
                    <VRSupportForm :vr="gameData.vr" />
                  </div>
              </Panel>

              <Panel toggleable v-model:collapsed="panelState.issues" class="panel-modern shadow-soft hover-lift">
                  <template #header>
                      <div class="flex items-center gap-2">
                          <i class="pi pi-exclamation-triangle text-sm"></i>
                          <span class="font-semibold text-sm">Issues</span>
                      </div>
                  </template>
                  <div class="flex flex-col gap-6">
                    <SectionGallery v-model="gameData.galleries.issues" section="issues" />
                    <IssuesForm v-model="gameData.issues" />
                  </div>
              </Panel>

              <Panel toggleable v-model:collapsed="panelState.other" class="panel-modern shadow-soft hover-lift">
                  <template #header>
                      <div class="flex items-center gap-2">
                          <i class="pi pi-cog text-sm"></i>
                          <span class="font-semibold text-sm">Other Information (API, Middleware)</span>
                      </div>
                  </template>
                  <div class="flex flex-col gap-6">
                    <SectionGallery v-model="gameData.galleries.other" section="other" />
                    <APIForm :api="gameData.api" />
                    <MiddlewareForm :middleware="gameData.middleware" />
                  </div>
              </Panel>

              <Panel toggleable v-model:collapsed="panelState.systemReq" class="panel-modern shadow-soft hover-lift">
                  <template #header>
                      <div class="flex items-center gap-2">
                          <i class="pi pi-microchip text-sm"></i>
                          <span class="font-semibold text-sm">System Requirements</span>
                      </div>
                  </template>
                  <div class="flex flex-col gap-6">
                    <SectionGallery v-model="gameData.galleries.systemReq" section="systemReq" />
                    <SystemRequirementsForm v-model="gameData.requirements" />
                  </div>
              </Panel>

              <Panel toggleable v-model:collapsed="panelState.l10n" class="panel-modern shadow-soft hover-lift">
                  <template #header>
                      <div class="flex items-center gap-2">
                          <i class="pi pi-globe text-sm"></i>
                          <span class="font-semibold text-sm">Localizations</span>
                      </div>
                  </template>
                  <LocalizationsForm :localizations="gameData.localizations" />
              </Panel>

              <Panel toggleable v-model:collapsed="panelState.general" class="panel-modern shadow-soft hover-lift">
                  <template #header>
                      <div class="flex items-center gap-2">
                          <i class="pi pi-list text-sm"></i>
                          <span class="font-semibold text-sm">General Information</span>
                      </div>
                  </template>
                  <GeneralInfoForm v-model="gameData.generalInformation" />
              </Panel>
            </div>
            
            <div v-else class="h-full flex flex-col" key="code">
                <Suspense>
                    <template #default>
                        <CodeEditor v-model="manualWikitext" />
                    </template>
                    <template #fallback>
                        <div class="h-full w-full p-4 animate-pulse">
                            <div class="h-full w-full bg-surface-100 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 flex items-center justify-center">
                                <div class="flex flex-col items-center gap-3">
                                    <i class="pi pi-spin pi-spinner text-3xl text-primary-500"></i>
                                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Loading Code Editor...</span>
                                </div>
                            </div>
                        </div>
                    </template>
                </Suspense>
            </div>
          </Transition>
        </div>
      </SplitterPanel>
      
      <SplitterPanel class="flex flex-col overflow-hidden bg-surface-0 dark:bg-surface-900 border-l border-surface-200 dark:border-surface-700 relative" :size="50" :minSize="30">
        <header class="px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-0/80 dark:bg-surface-900/80 backdrop-blur-md flex justify-between items-center z-10">
          <h2 class="font-semibold text-lg text-surface-700 dark:text-surface-200">PREVIEW</h2>
          <div class="flex items-center gap-2">
             <SelectButton v-model="previewMode" :options="previewOptions" :allowEmpty="false" size="small" />
          </div>
        </header>
        
        <div class="flex-1 overflow-y-auto custom-scrollbar relative">
           <!-- Loading Overlay -->
           <div v-if="isLoading" class="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-50 flex items-center justify-center backdrop-blur-sm">
                <div class="flex flex-col items-center">
                    <i class="pi pi-spin pi-spinner text-4xl text-primary-500 mb-2"></i>
                    <span class="text-surface-600 dark:text-surface-300 font-medium">Rendering Preview...</span>
                </div>
           </div>

          <div v-if="error" class="p-4 m-4 bg-red-100 text-red-700 rounded border border-red-300">
             {{ error }}
          </div>
          <div class="rendered-view mw-body mw-body-with-ads mw-parser-output p-8 max-w-none" v-html="renderedHtml"></div>
        </div>
      </SplitterPanel>
    </Splitter>
  </div>
</template>


<style>
/* Modern Panel Styling */
.panel-modern {
    border-radius: 0.75rem;
    transition: all 0.2s ease-out;
    border: 1px solid rgb(226 232 240 / 0.6);
}

.dark .panel-modern {
    border-color: rgb(51 65 85 / 0.6);
}

.panel-modern:hover {
    border-color: rgba(168, 85, 247, 0.3);
}

/* Splitter Modern Styling */
.splitter-modern :deep(.p-splitter-gutter) {
    background: linear-gradient(
        to right,
        transparent 0%,
        rgba(168, 85, 247, 0.1) 45%,
        rgba(168, 85, 247, 0.2) 50%,
        rgba(168, 85, 247, 0.1) 55%,
        transparent 100%
    );
    transition: all 0.2s ease;
    position: relative;
}

.splitter-modern :deep(.p-splitter-gutter):hover {
    background: linear-gradient(
        to right,
        transparent 0%,
        rgba(168, 85, 247, 0.15) 40%,
        rgba(168, 85, 247, 0.3) 50%,
        rgba(168, 85, 247, 0.15) 60%,
        transparent 100%
    );
}

.splitter-modern :deep(.p-splitter-gutter)::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 2px;
    height: 32px;
    background: rgba(168, 85, 247, 0.4);
    border-radius: 1px;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.splitter-modern :deep(.p-splitter-gutter):hover::after {
    opacity: 1;
}

/* Smooth Fade Transitions */
.fade-enter-active {
    transition: opacity 0.15s ease-out;
}

.fade-leave-active {
    transition: opacity 0.12s ease-in;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* Faster fade for loading overlays */
.fade-fast-enter-active {
    transition: opacity 0.1s ease-out;
}

.fade-fast-leave-active {
    transition: opacity 0.08s ease-in;
}

.fade-fast-enter-from,
.fade-fast-leave-to {
    opacity: 0;
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
    height: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(148, 163, 184, 0.3);
    border-radius: 4px;
    transition: background-color 0.15s ease;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(71, 85, 105, 0.5);
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(168, 85, 247, 0.6);
}

/* Force white background for preview in both light and dark modes */
.rendered-view {
    background-color: #ffffff !important;
    color: #000000 !important;
}

/* Fix CSS glitches requested */
.rendered-view .mw-parser-output h3 {
    margin-bottom: 0.3em;
    font-size: 1.2em;
    font-weight: bold;
    padding-top: 0.5em; /* Match PCGW */
    overflow: hidden;
    border-bottom: none;
    border-left: 5px solid #a2a9b1;
    padding-left: 10px;
}

.rendered-view .mw-parser-output .notice {
    padding: 0.5em !important;
    margin-bottom: 1em;
    border: 1px solid #a2a9b1;
    background-color: #f8f9fa;
    color: #202122; /* Dark text */
}

.rendered-view .mw-parser-output .more-info {
    font-size: 0.95em;
    font-style: italic;
    margin-bottom: 0.5em;
    background-image: v-bind("`url('${iconBulletDocument}')`"); /* Bind svg icon */
    background-repeat: no-repeat;
    background-position: left center;
    padding-left: 20px; /* Space for icon */
}

/* Ensure links are readable on white background */
.rendered-view a {
    color: #0645ad; /* Standard Wiki Link Blue */
}
.rendered-view a:visited {
    color: #0b0080;
}
.rendered-view a.new {
    color: #ba0000;
}

</style>

