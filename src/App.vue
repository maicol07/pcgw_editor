<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent, reactive, provide, onMounted } from 'vue';
import { useWorkspaceStore } from './stores/workspace';
import { GameData, initialGameData } from './models/GameData';
import { parseWikitext } from './utils/parser';
import { GoogleGenAI } from '@google/genai';

// Composables
import { useAutoTheme } from './composables/useAutoTheme';
import { useSearch } from './composables/useSearch';
import { usePreview } from './composables/usePreview';

// Layout & UI
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import Panel from 'primevue/panel';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import SelectButton from 'primevue/selectbutton';
import Dialog from 'primevue/dialog';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import { 
    File, Info, AlignLeft, ShoppingCart, DollarSign, PlusCircle, 
    Star, Save, Monitor, Keyboard, Volume2, Wifi, Eye, 
    TriangleAlert, Settings, Cpu, Search, ChevronsDown, ChevronsUp,
    Loader2, Key, Trash, X, Check, Sparkles, Copy, Globe,
    Server, MessageCircle, AppWindow, Box, Cloud
} from 'lucide-vue-next';

import WorkspaceSidebar from './components/WorkspaceSidebar.vue';
import EditorToolbar, { EditorMode } from './components/editor/EditorToolbar.vue';
import PreviewPanel from './components/editor/PreviewPanel.vue';

// Forms
// Forms - Lazy Loaded
const InfoboxForm = defineAsyncComponent(() => import('./components/InfoboxForm.vue'));
const AvailabilityForm = defineAsyncComponent(() => import('./components/AvailabilityForm.vue'));
const MonetizationForm = defineAsyncComponent(() => import('./components/MonetizationForm.vue'));
const GameDataForm = defineAsyncComponent(() => import('./components/GameDataForm.vue'));
const StateForm = defineAsyncComponent(() => import('./components/StateForm.vue'));
const SectionGallery = defineAsyncComponent(() => import('./components/SectionGallery.vue'));
const DLCForm = defineAsyncComponent(() => import('./components/DLCForm.vue'));
const EssentialImprovementsForm = defineAsyncComponent(() => import('./components/EssentialImprovementsForm.vue'));
const VideoForm = defineAsyncComponent(() => import('./components/VideoForm.vue'));
const InputForm = defineAsyncComponent(() => import('./components/InputForm.vue'));
const AudioForm = defineAsyncComponent(() => import('./components/AudioForm.vue'));
const NetworkForm = defineAsyncComponent(() => import('./components/NetworkForm.vue'));
const VRSupportForm = defineAsyncComponent(() => import('./components/VRSupportForm.vue'));
const APIForm = defineAsyncComponent(() => import('./components/APIForm.vue'));
const MiddlewareForm = defineAsyncComponent(() => import('./components/MiddlewareForm.vue'));
const IssuesForm = defineAsyncComponent(() => import('./components/IssuesForm.vue'));
const SystemRequirementsForm = defineAsyncComponent(() => import('./components/SystemRequirementsForm.vue'));
const LocalizationsForm = defineAsyncComponent(() => import('./components/LocalizationsForm.vue'));

// Lazy load CodeEditor
const CodeEditor = defineAsyncComponent(() => import('./components/CodeEditor.vue'));

// --- Initialization ---
useAutoTheme();
const store = useWorkspaceStore();

const uiBus = reactive({
    expandAllCount: 0,
    collapseAllCount: 0
});
provide('uiBus', uiBus);

// --- State ---
const sidebarVisible = ref(false);
const editorMode = ref<EditorMode>('Visual');
const isModeSwitching = ref(false);
const isCodeEditorLoaded = ref(false);
const isInitialLoad = ref(true);

// API Keys
const geminiApiKey = ref(localStorage.getItem('gemini-api-key') || '');
provide('geminiApiKey', geminiApiKey);

// Game Data & Sync
const gameData = ref<GameData>(initialGameData);
let isSyncingFromStore = false;

watch(() => store.activeGameData, (newData) => {
    isSyncingFromStore = true;
    gameData.value = structuredClone(newData);

    setTimeout(() => { isSyncingFromStore = false; }, 0);
}, { immediate: true, deep: true });

watch(gameData, (newData) => {
    if (!isSyncingFromStore) {
        store.activeGameData = newData;
    }
}, { deep: true });

// Page Title
const pageTitle = computed({
    get: () => store.activePage?.title || '',
    set: (val) => { if (store.activePage) store.renamePage(store.activePage.id, val); }
});

// Wikitext Data
const wikitext = computed(() => store.activePage?.wikitext || '');
const manualWikitext = ref('');
const currentWikitext = computed(() => editorMode.value === 'Visual' ? wikitext.value : manualWikitext.value);

// --- Preview Logic (Extracted) ---
const { 
    previewMode, 
    renderedHtml, 
    isLoading: isPreviewLoading, 
    error: previewError 
} = usePreview(() => currentWikitext.value, () => pageTitle.value);

// --- Search Logic (Extracted) ---
const panelKeys = [
    'articleState', 'infobox', 'introduction', 'availability', 'monetization', 
    'dlc', 'essentialImprovements', 'gameData', 'video', 'input', 'audio', 
    'network', 'vr', 'issues', 'other', 'systemReq', 'l10n', 'general'
];

const searchKeywords: Record<string, string[]> = {
    articleState: ['stub', 'cleanup', 'delete', 'state', 'disambig'],
    infobox: ['cover', 'developer', 'publisher', 'engine', 'genre', 'taxonomy', 'release'],
    introduction: ['introduction', 'release history', 'current state', 'title'],
    availability: ['store', 'drm', 'launcher', 'steam', 'gog', 'notes'],
    monetization: ['ad', 'dlc', 'microtransactions', 'loot'],
    dlc: ['dlc', 'expansions'],
    essentialImprovements: ['patch', 'mod'],
    gameData: ['config', 'save', 'cloud', 'path'],
    video: ['res', 'fps', 'hdr', 'ray tracing', 'fov', 'upscaling'],
    input: ['mouse', 'keyboard', 'controller', 'bind', 'touch'],
    audio: ['surround', 'volume', 'voice', 'mute', 'subtitles'],
    network: ['multiplayer', 'server', 'p2p', 'crossplay', 'lan'],
    vr: ['hmd', 'trackir', 'oculus', 'vive', 'steamvr'],
    issues: ['bug', 'crash', 'freeze', 'fix'],
    other: ['api', 'middleware', 'directx', 'vulkan'],
    systemReq: ['requirement', 'ram', 'gpu', 'cpu', 'os'],
    l10n: ['lang', 'dub', 'sub', 'ui'],
    general: ['info']
};

const { searchQuery, panelVisibility, setSearchQuery } = useSearch(panelKeys, searchKeywords, (key) => {
    // Auto-expand found panels
    (panelState as any)[key] = false; 
});

provide('searchQuery', searchQuery);


// --- Panel State ---
const panelState = reactive({
    articleState: true, infobox: true, introduction: true, availability: true,
    monetization: true, dlc: true, essentialImprovements: true, gameData: true,
    video: true, input: true, audio: true, network: true, vr: true,
    issues: true, other: true, systemReq: true, l10n: true, general: true,
});

const panelsRendered = ref<Record<string, boolean>>({});

// Initialize panels logic
Object.keys(panelState).forEach(key => {
    panelsRendered.value[key] = !(panelState as any)[key];
});

watch(panelState, (newState) => {
    Object.keys(newState).forEach(key => {
        if (!(newState as any)[key] && !panelsRendered.value[key]) {
            panelsRendered.value[key] = true;
        }
    });
});

const expandAll = () => {
    Object.keys(panelState).forEach(k => (panelState as any)[k] = false);
    uiBus.expandAllCount++;
};
const collapseAll = () => {
    Object.keys(panelState).forEach(k => (panelState as any)[k] = true);
    uiBus.collapseAllCount++;
};


// --- Gemini Summary ---
const isGeneratingSummary = ref(false);
const shareSummaryVisible = ref(false);
const shareSummaryText = ref('');
const showApiKeyDialog = ref(false);
const tempApiKey = ref('');

const saveApiKey = () => {
    if (tempApiKey.value.trim()) {
        geminiApiKey.value = tempApiKey.value.trim();
        localStorage.setItem('gemini-api-key', geminiApiKey.value);
        showApiKeyDialog.value = false;
        tempApiKey.value = '';
    }
};

const clearApiKey = () => {
    geminiApiKey.value = '';
    localStorage.removeItem('gemini-api-key');
    tempApiKey.value = '';
};

const handleApiKeyKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') saveApiKey();
};

const copyShareSummary = async () => {
    if (shareSummaryText.value) {
        await navigator.clipboard.writeText(shareSummaryText.value);
        alert('Copied to clipboard!');
    }
};

const generateShareSummary = async () => {
    if (!geminiApiKey.value) {
        showApiKeyDialog.value = true;
        return;
    }
    
    isGeneratingSummary.value = true;
    shareSummaryVisible.value = true;
    
    try {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey.value });
        const prompt = `Create a feature list for "${pageTitle.value || 'Unknown'}". Data: ${JSON.stringify({ 
            video: gameData.value.video, input: gameData.value.input 
        })}. Format: Bullet points, factual.`;
        
        const response = await ai.models.generateContent({ model: 'gemini-1.5-flash', contents: prompt });
        shareSummaryText.value = response.text || 'No summary generated.';
    } catch (e: any) {
        shareSummaryText.value = 'Error generating summary: ' + e.message;
        if (e.message.includes('API key')) {
             localStorage.removeItem('gemini-api-key');
             geminiApiKey.value = '';
        }
    } finally {
        isGeneratingSummary.value = false;
    }
};

// --- Mode Switching ---
const handleModeChange = async (newMode: EditorMode) => {
    const oldMode = editorMode.value;
    editorMode.value = newMode;

    if (newMode === 'Code' && oldMode === 'Visual') {
        manualWikitext.value = wikitext.value;
        if (!isCodeEditorLoaded.value) isCodeEditorLoaded.value = true;
    } else if (newMode === 'Visual' && oldMode === 'Code') {
        isModeSwitching.value = true;
        try {
            await new Promise(r => setTimeout(r, 50));
            const parsed = parseWikitext(manualWikitext.value);
            gameData.value = parsed;
        } catch (e) {
            console.error("Parse error", e);
        } finally {
            isModeSwitching.value = false;
        }
    }
};

onMounted(() => {
    // Progressive rendering delay
    setTimeout(() => { isInitialLoad.value = false; }, 100);
});

</script>

<template>
  <div class="h-screen w-screen overflow-hidden bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-0 transition-colors duration-200">
    <WorkspaceSidebar v-model:visible="sidebarVisible" />

    <Splitter style="height: 100vh" class="border-none !mb-0 !rounded-none bg-transparent splitter-modern">
      
      <!-- Left Panel: Editor -->
      <SplitterPanel class="flex flex-col overflow-hidden relative" :size="50" :minSize="30">
        
        <EditorToolbar 
            :title="pageTitle"
            @update:title="pageTitle = $event"
            :editorMode="editorMode"
            @update:editorMode="handleModeChange"
            :isGeneratingSummary="isGeneratingSummary"
            @toggleSidebar="sidebarVisible = true"
            @generateSummary="generateShareSummary"
        />

        <div class="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-b from-surface-50 to-surface-100 dark:from-surface-950 dark:to-surface-900 relative">
            
            <!-- Loading Overlay for Mode Switching -->
            <Transition name="fade-fast">
                <div v-if="isModeSwitching" class="absolute inset-0 bg-surface-0/80 dark:bg-surface-950/80 backdrop-blur-sm z-30 flex items-center justify-center">
                    <div class="flex flex-col items-center gap-3">
                        <Loader2 class="w-10 h-10 animate-spin text-primary-500" />
                        <span class="text-surface-600 dark:text-surface-300 font-medium">Parsing wikitext...</span>
                    </div>
                </div>
            </Transition>

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
                            <Loader2 class="w-8 h-8 animate-spin text-primary-500" />
                            <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Loading editor...</span>
                        </div>
                    </div>
                </div>

                <!-- Actual Visual Editor -->
                <div v-else-if="editorMode === 'Visual'" class="p-4 md:p-5 max-w-6xl mx-auto flex flex-col gap-4" key="visual">
                  
                  <!-- Quick Actions Toolbar -->
                  <div class="flex items-center justify-between glass glass-border p-2.5 rounded-lg shadow-soft sticky top-0 z-20 animate-slide-in-down">
                      <div class="flex items-center gap-1.5">
                           <Button label="Expand" text size="small" @click="expandAll" severity="secondary" class="!text-xs !px-2 !py-1 hover-scale">
                               <template #icon>
                                   <ChevronsDown class="w-3 h-3" />
                               </template>
                           </Button>
                           <Button label="Collapse" text size="small" @click="collapseAll" severity="secondary" class="!text-xs !px-2 !py-1 hover-scale">
                               <template #icon>
                                   <ChevronsUp class="w-3 h-3" />
                               </template>
                           </Button>
                           <div class="h-4 w-px bg-surface-300 dark:bg-surface-600 mx-1"></div>
                           <span class="text-2xs text-surface-500 dark:text-surface-400 hidden sm:inline">⌘K to search</span>
                      </div>
                      <div class="flex items-center gap-2">
                           <IconField iconPosition="left">
                                <InputIcon>
                                    <Search class="w-4 h-4 text-surface-400" />
                                </InputIcon>
                                <InputText v-model="searchQuery" placeholder="Search..." size="small" class="w-40 sm:w-48 lg:w-64 !text-sm" />
                           </IconField>
                      </div>
                  </div>

                  <Panel toggleable v-model:collapsed="panelState.articleState" v-show="panelVisibility.articleState" class="panel-modern shadow-soft hover-lift">
                      <template #header>
                          <div class="flex items-center gap-2">
                              <File class="text-primary-500 w-4 h-4" />
                              <span class="font-semibold text-sm">Article State</span>
                          </div>
                      </template>
                      <StateForm v-if="panelsRendered.articleState" v-model="gameData.articleState" :gameData="gameData" />
                  </Panel>

                  <Panel toggleable v-model:collapsed="panelState.infobox" v-show="panelVisibility.infobox" class="panel-modern shadow-soft hover-lift">
                      <template #header>
                          <div class="flex items-center gap-2">
                              <Info class="text-accent-teal-500 w-4 h-4" />
                              <span class="font-semibold text-sm">Infobox</span>
                          </div>
                      </template>
                      <InfoboxForm v-if="panelsRendered.infobox" v-model="gameData.infobox" />
                  </Panel>

                  <Panel toggleable v-model:collapsed="panelState.introduction" v-show="panelVisibility.introduction" class="panel-modern shadow-soft hover-lift">
                      <template #header>
                          <div class="flex items-center gap-2">
                              <AlignLeft class="text-accent-orange-500 w-4 h-4" />
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

                  <Panel toggleable v-model:collapsed="panelState.availability" v-show="panelVisibility.availability" class="panel-modern shadow-soft hover-lift">
                      <template #header>
                          <div class="flex items-center gap-2">
                              <ShoppingCart class="text-accent-emerald-500 w-4 h-4" />
                              <span class="font-semibold text-sm">Availability</span>
                          </div>
                      </template>
                    <AvailabilityForm v-model="gameData.availability" />
                  </Panel>

                  <Panel toggleable v-model:collapsed="panelState.monetization" v-show="panelVisibility.monetization" class="panel-modern shadow-soft hover-lift">
                      <template #header>
                          <div class="flex items-center gap-2">
                              <DollarSign class="text-accent-orange-500 w-4 h-4" />
                              <span class="font-semibold text-sm">Monetization</span>
                          </div>
                      </template>
                    <MonetizationForm :monetization="gameData.monetization" :microtransactions="gameData.microtransactions" />
                  </Panel>

                  <Panel toggleable v-model:collapsed="panelState.dlc" v-show="panelVisibility.dlc" class="panel-modern shadow-soft hover-lift">
                      <template #header>
                          <div class="flex items-center gap-2">
                              <PlusCircle class="text-primary-600 w-4 h-4" />
                              <span class="font-semibold text-sm">DLC & Expansions</span>
                          </div>
                      </template>
                    <DLCForm v-model="gameData.dlc" />
                  </Panel>

                  <Panel toggleable v-model:collapsed="panelState.essentialImprovements" v-show="panelVisibility.essentialImprovements" class="panel-modern shadow-soft hover-lift">
                      <template #header>
                          <div class="flex items-center gap-2">
                              <Star class="text-yellow-500 w-4 h-4" />
                              <span class="font-semibold text-sm">Essential Improvements</span>
                          </div>
                      </template>
                      <EssentialImprovementsForm v-model="gameData.essentialImprovements" />
                  </Panel>

                  <Panel toggleable v-model:collapsed="panelState.gameData" v-show="panelVisibility.gameData" class="panel-modern shadow-soft hover-lift">
                      <template #header>
                          <div class="flex items-center gap-2">
                              <Save class="text-indigo-500 w-4 h-4" />
                              <span class="font-semibold text-sm">Game Data (Config, Saves, Cloud)</span>
                          </div>
                      </template>
                      <GameDataForm :config="gameData.config" />
                  </Panel>

                  <Panel toggleable v-model:collapsed="panelState.video" v-show="panelVisibility.video" class="panel-modern shadow-soft hover-lift">
                      <template #header>
                          <div class="flex items-center gap-2">
                              <Monitor class="text-blue-500 w-4 h-4" />
                              <span class="font-semibold text-sm">Video</span>
                          </div>
                      </template>
                      <div class="flex flex-col gap-6">
                        <SectionGallery v-model="gameData.galleries.video" section="video" />
                        <VideoForm :video="gameData.video" />
                      </div>
                  </Panel>

                  <Panel toggleable v-model:collapsed="panelState.input" v-show="panelVisibility.input" class="panel-modern shadow-soft hover-lift">
                      <template #header>
                          <div class="flex items-center gap-2">
                              <Keyboard class="w-4 h-4" />
                              <span class="font-semibold text-sm">Input</span>
                          </div>
                      </template>
                      <div class="flex flex-col gap-6">
                        <SectionGallery v-model="gameData.galleries.input" section="input" />
                        <InputForm :input="gameData.input" />
                      </div>
                  </Panel>

                  <Panel toggleable v-model:collapsed="panelState.audio" v-show="panelVisibility.audio" class="panel-modern shadow-soft hover-lift">
                      <template #header>
                          <div class="flex items-center gap-2">
                              <Volume2 class="w-4 h-4" />
                              <span class="font-semibold text-sm">Audio</span>
                          </div>
                      </template>
                      <div class="flex flex-col gap-6">
                        <SectionGallery v-model="gameData.galleries.audio" section="audio" />
                        <AudioForm :audio="gameData.audio" />
                      </div>
                  </Panel>

                  <Panel toggleable v-model:collapsed="panelState.network" v-show="panelVisibility.network" class="panel-modern shadow-soft hover-lift">
                      <template #header>
                          <div class="flex items-center gap-2">
                              <Wifi class="w-4 h-4" />
                              <span class="font-semibold text-sm">Network</span>
                          </div>
                      </template>
                      <div class="flex flex-col gap-6">
                        <SectionGallery v-model="gameData.galleries.network" section="network" />
                        <NetworkForm :network="gameData.network" />
                      </div>
                  </Panel>

                  <Panel toggleable v-model:collapsed="panelState.vr" v-show="panelVisibility.vr" class="panel-modern shadow-soft hover-lift">
                      <template #header>
                          <div class="flex items-center gap-2">
                              <Eye class="w-4 h-4" />
                              <span class="font-semibold text-sm">VR Support</span>
                          </div>
                      </template>
                      <div class="flex flex-col gap-6">
                        <SectionGallery v-model="gameData.galleries.vr" section="vr" />
                        <VRSupportForm :vr="gameData.vr" />
                      </div>
                  </Panel>

                  <Panel toggleable v-model:collapsed="panelState.issues" v-show="panelVisibility.issues" class="panel-modern shadow-soft hover-lift">
                      <template #header>
                          <div class="flex items-center gap-2">
                              <TriangleAlert class="w-4 h-4" />
                              <span class="font-semibold text-sm">Issues</span>
                          </div>
                      </template>
                      <div class="flex flex-col gap-6">
                        <SectionGallery v-model="gameData.galleries.issues" section="issues" />
                        <IssuesForm v-model="gameData.issues" />
                      </div>
                  </Panel>

                  <Panel toggleable v-model:collapsed="panelState.other" v-show="panelVisibility.other" class="panel-modern shadow-soft hover-lift">
                      <template #header>
                          <div class="flex items-center gap-2">
                              <Settings class="w-4 h-4" />
                              <span class="font-semibold text-sm">Other Information (API, Middleware)</span>
                          </div>
                      </template>
                      <div class="flex flex-col gap-6">
                        <SectionGallery v-model="gameData.galleries.other" section="other" />
                        <APIForm :api="gameData.api" />
                        <MiddlewareForm :middleware="gameData.middleware" />
                      </div>
                  </Panel>

                  <Panel toggleable v-model:collapsed="panelState.systemReq" v-show="panelVisibility.systemReq" class="panel-modern shadow-soft hover-lift">
                      <template #header>
                          <div class="flex items-center gap-2">
                              <Cpu class="w-4 h-4" />
                              <span class="font-semibold text-sm">System Requirements</span>
                          </div>
                      </template>
                      <div class="flex flex-col gap-6">
                        <SectionGallery v-model="gameData.galleries.systemReq" section="systemReq" />
                        <SystemRequirementsForm v-model="gameData.requirements" />
                      </div>
                  </Panel>

                  <Panel toggleable v-model:collapsed="panelState.l10n" v-show="panelVisibility.l10n" class="panel-modern shadow-soft hover-lift">
                      <template #header>
                          <div class="flex items-center gap-2">
                              <Globe class="w-4 h-4" />
                              <span class="font-semibold text-sm">Localizations</span>
                          </div>
                      </template>
                      <LocalizationsForm :localizations="gameData.localizations" />
                  </Panel>
                </div>
            
                <div v-else class="h-full flex flex-col" key="code">
                    <Suspense>
                        <template #default>
                             <CodeEditor v-model="manualWikitext" class="flex-1" />
                        </template>
                        <template #fallback>
                            <div class="h-full w-full p-4 animate-pulse">
                                <div class="h-full w-full bg-surface-100 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 flex items-center justify-center">
                                    <div class="flex flex-col items-center gap-3">
                                        <Loader2 class="w-8 h-8 animate-spin text-primary-500" />
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
      
      <!-- Right Panel: Preview -->
      <SplitterPanel class="flex flex-col overflow-hidden bg-surface-50 dark:bg-surface-950 border-l border-surface-200 dark:border-surface-700" :size="50" :minSize="30">
        <PreviewPanel 
          :html="renderedHtml"
          :loading="isPreviewLoading"
          :error="previewError"
          :previewMode="previewMode"
          @update:previewMode="previewMode = $event"
        />
      </SplitterPanel>

    </Splitter>

    <!-- Gemini API Key Settings Dialog -->
    <Dialog v-model:visible="showApiKeyDialog" modal :style="{ width: '35rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
        <template #header>
            <div class="flex items-center gap-2">
                <Key class="text-primary-500 w-5 h-5" />
                <span class="font-bold text-lg">Gemini API Key</span>
            </div>
        </template>
        
        <div class="flex flex-col gap-4">
            <p class="text-surface-600 dark:text-surface-400 text-sm">
                To generate AI-powered summaries, please provide your Gemini API key.
                This feature uses the <strong>Gemini 3 Flash</strong> model, which is free to use.
                Get one for free at <a href="https://aistudio.google.com/apikey" target="_blank" class="text-primary-500 hover:underline">Google AI Studio</a>.
            </p>
            
            <div class="p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div class="flex gap-2">
                    <TriangleAlert class="text-orange-500 w-4 h-4 mt-0.5" />
                    <div class="flex-1">
                        <p class="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1">Security Notice</p>
                        <p class="text-xs text-orange-700 dark:text-orange-300">
                            Your API key will be stored in plain text in your browser's local storage. 
                            Only use this on trusted devices. Anyone with access to your browser can read this key.
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="flex flex-col gap-2">
                <label class="font-medium text-sm">API Key</label>
                <InputText 
                    v-model="tempApiKey" 
                    type="password"
                    placeholder="Enter your Gemini API key..."
                    class="w-full"
                    @keydown="handleApiKeyKeydown"
                />
            </div>
            
            <div class="flex gap-2 justify-end">
                <Button 
                    v-if="geminiApiKey"
                    label="Clear Key" 
                    @click="clearApiKey"
                    severity="danger"
                    outlined
                >
                    <template #icon>
                        <Trash class="w-4 h-4 gap-2" />
                    </template>
                </Button>
                <Button 
                    label="Cancel" 
                    @click="showApiKeyDialog = false"
                    severity="secondary"
                    outlined
                >
                    <template #icon>
                        <X class="w-4 h-4 gap-2" />
                    </template>
                </Button>
                <Button 
                    label="Save" 
                    @click="saveApiKey"
                    severity="primary"
                    :disabled="!tempApiKey.trim()"
                >
                    <template #icon>
                        <Check class="w-4 h-4 gap-2" />
                    </template>
                </Button>
            </div>
        </div>
    </Dialog>
    
    <!-- Share Summary Dialog -->
    <Dialog v-model:visible="shareSummaryVisible" modal :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
        <template #header>
            <div class="flex items-center gap-2">
                <Sparkles class="text-primary-500 w-5 h-5" />
                <span class="font-bold text-lg">Generate AI Summary</span>
            </div>
        </template>
        
        <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
                <p class="text-surface-600 dark:text-surface-400 text-sm">
                    {{ geminiApiKey ? 'AI-generated summary ready to share!' : 'Copy this summary to share!' }}
                </p>
                <Button 
                    v-if="geminiApiKey"
                    text
                    @click="showApiKeyDialog = true; shareSummaryVisible = false"
                    severity="secondary"
                    v-tooltip.left="'API Settings'"
                >
                    <template #icon>
                        <Settings class="!w-5 !h-5" />
                    </template>
                </Button>
            </div>
            
            <div v-if="isGeneratingSummary" class="flex items-center justify-center p-8">
                <div class="flex flex-col items-center gap-3">
                    <Loader2 class="w-8 h-8 animate-spin text-primary-500" />
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Generating summary with AI...</span>
                </div>
            </div>
            
            <Textarea 
                v-else
                v-model="shareSummaryText" 
                :autoResize="true" 
                rows="12" 
                class="w-full font-mono text-sm"
                readonly
            />
            
            <div class="flex gap-2 justify-end">
                <Button 
                    label="Copy to Clipboard" 
                    @click="copyShareSummary"
                    severity="primary"
                    :disabled="isGeneratingSummary || !shareSummaryText"
                >
                    <template #icon>
                        <Copy class="w-4 h-4 gap-2" />
                    </template>
                </Button>
                <Button 
                    label="Close" 
                    @click="shareSummaryVisible = false"
                    severity="secondary"
                    outlined
                >
                    <template #icon>
                        <X class="w-4 h-4 gap-2" />
                    </template>
                </Button>
            </div>
        </div>
    </Dialog>
  </div>
</template>


<style>
/* Import custom animations */
@import './styles/animations.css';

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

