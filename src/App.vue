<script setup lang="ts">
import { computed, provide, onMounted, ref, defineAsyncComponent, watch } from 'vue';
import { useWorkspaceStore } from './stores/workspace';
import { useUiStore } from './stores/ui';
import { GameData, initialGameData } from './models/GameData';
import { fieldsConfig } from './config/fields';
import { searchKeywords, panelKeys } from './config/searchKeywords';

// Composables
import { useAutoTheme } from './composables/useAutoTheme';
import { useSearch } from './composables/useSearch';
import { usePreview } from './composables/usePreview';
import { useEditor } from './features/editor/useEditor';
import { useGeminiSummary } from './features/ai/useGeminiSummary';

// Layout & UI
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import ModernPanel from './components/common/ModernPanel.vue';
import WorkspaceSidebar from './components/WorkspaceSidebar.vue';
import EditorToolbar from './components/editor/EditorToolbar.vue';
import PreviewPanel from './components/editor/PreviewPanel.vue';
import QuickActions from './components/layout/QuickActions.vue';
import GeminiDialogs from './features/ai/GeminiDialogs.vue';
import EditorSkeleton from './components/layout/EditorSkeleton.vue';
import DynamicSection from './components/schema/DynamicSection.vue';

// Icons
import {
    File, Info, AlignLeft, ShoppingCart, DollarSign, PlusCircle,
    Star, Save, Monitor, Keyboard, Volume2, Wifi, Eye, Settings, Cpu, Globe
} from 'lucide-vue-next';

// Async Components
const SectionGallery = defineAsyncComponent(() => import('./components/SectionGallery.vue'));
const CodeEditor = defineAsyncComponent(() => import('./components/CodeEditor.vue'));

// --- Initialization ---
useAutoTheme();
const workspaceStore = useWorkspaceStore();
const uiStore = useUiStore();

const uiBus = {
    expandAllCount: ref(0),
    collapseAllCount: ref(0)
};
provide('uiBus', uiBus);

// --- API Keys ---
const geminiApiKey = ref(localStorage.getItem('gemini-api-key') || '');
provide('geminiApiKey', geminiApiKey);

// --- Game Data & Sync ---
const gameData = ref<GameData>(initialGameData);
let isSyncingFromStore = false;

watch(() => workspaceStore.activeGameData, (newData) => {
    isSyncingFromStore = true;
    gameData.value = structuredClone(newData);
    setTimeout(() => { isSyncingFromStore = false; }, 0);
}, { immediate: true, deep: true });

watch(gameData, (newData) => {
    if (!isSyncingFromStore) {
        workspaceStore.activeGameData = newData;
    }
}, { deep: true });

// --- Page & Wikitext Logic ---
const pageTitle = computed({
    get: () => workspaceStore.activePage?.title || '',
    set: (val) => { if (workspaceStore.activePage) workspaceStore.renamePage(workspaceStore.activePage.id, val); }
});

const wikitext = computed(() => workspaceStore.activePage?.wikitext || '');

// --- Feature Logic (Composables) ---
const {
    editorMode, isModeSwitching, manualWikitext,
    currentWikitext, handleModeChange
} = useEditor(gameData, wikitext);

const {
    previewMode, renderedHtml, isLoading: isPreviewLoading, error: previewError
} = usePreview(() => currentWikitext.value, () => pageTitle.value);

const { searchQuery, panelVisibility } = useSearch(panelKeys, searchKeywords, (key) => {
    uiStore.panelState[key as keyof typeof uiStore.panelState] = false;
});
provide('searchQuery', searchQuery);

const {
    isGeneratingSummary, shareSummaryVisible, shareSummaryText,
    showApiKeyDialog, tempApiKey, saveApiKey, clearApiKey,
    generateShareSummary, copyShareSummary
} = useGeminiSummary(pageTitle, gameData);

// --- Schema Helpers ---
const getSchema = (id: string) => computed(() => fieldsConfig.find(s => s.id === id));

const schemas = {
    articleState: getSchema('article_state'),
    infobox: getSchema('infobox'),
    introduction: getSchema('introduction'),
    availability: getSchema('availability'),
    monetization: getSchema('monetization'),
    microtransactions: getSchema('microtransactions'),
    dlc: getSchema('dlc'),
    essentialImprovements: getSchema('essentialImprovements'),
    gameData: getSchema('game_data'),
    video: getSchema('video'),
    input: getSchema('input'),
    audio: getSchema('audio'),
    network: getSchema('network'),
    vr: getSchema('vr'),
    api: getSchema('api'),
    middleware: getSchema('middleware'),
    systemReq: getSchema('system_requirements'),
    l10n: getSchema('localizations'),
};

onMounted(() => {
    setTimeout(() => { uiStore.isInitialLoad = false; }, 100);
});
</script>

<template>
    <div
        class="h-screen w-screen overflow-hidden bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-0 transition-colors duration-200">
        <WorkspaceSidebar v-model:visible="uiStore.sidebarVisible" />

        <Splitter style="height: 100vh" class="border-none !mb-0 !rounded-none bg-transparent splitter-modern">
            <!-- Left Panel: Editor -->
            <SplitterPanel class="flex flex-col overflow-hidden relative" :size="50" :minSize="30">
                <EditorToolbar :title="pageTitle" @update:title="pageTitle = $event" :editorMode="editorMode"
                    @update:editorMode="handleModeChange" :isGeneratingSummary="isGeneratingSummary"
                    @toggleSidebar="uiStore.sidebarVisible = true" @generateSummary="generateShareSummary" />

                <div
                    class="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-b from-surface-50 to-surface-100 dark:from-surface-950 dark:to-surface-900 relative">
                    <!-- Loading Overlay for Mode Switching -->
                    <Transition name="fade-fast">
                        <div v-if="isModeSwitching"
                            class="absolute inset-0 bg-surface-0/80 dark:bg-surface-950/80 backdrop-blur-sm z-30 flex items-center justify-center">
                            <div class="flex flex-col items-center gap-3">
                                <Loader2 class="w-10 h-10 animate-spin text-primary-500" />
                                <span class="text-surface-600 dark:text-surface-300 font-medium">Parsing
                                    wikitext...</span>
                            </div>
                        </div>
                    </Transition>

                    <Transition name="fade" mode="out-in">
                        <EditorSkeleton v-if="editorMode === 'Visual' && uiStore.isInitialLoad" />

                        <div v-else-if="editorMode === 'Visual'"
                            class="p-4 md:p-5 max-w-6xl mx-auto flex flex-col gap-4" key="visual">
                            <QuickActions v-model:searchQuery="searchQuery" @expandAll="uiStore.expandAll()"
                                @collapseAll="uiStore.collapseAll()" />

                            <!-- Sections -->
                            <ModernPanel v-model:collapsed="uiStore.panelState.articleState"
                                v-show="panelVisibility.articleState">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <File class="text-slate-500 w-4 h-4" /><span
                                            class="font-semibold text-sm">Article State</span>
                                    </div>
                                </template>
                                <DynamicSection v-if="schemas.articleState.value" :section="schemas.articleState.value"
                                    v-model="gameData" />
                            </ModernPanel>

                            <ModernPanel v-model:collapsed="uiStore.panelState.infobox"
                                v-show="panelVisibility.infobox">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <Info class="text-blue-600 w-4 h-4" /><span
                                            class="font-semibold text-sm">Infobox</span>
                                    </div>
                                </template>
                                <DynamicSection v-if="schemas.infobox.value" :section="schemas.infobox.value"
                                    v-model="gameData.infobox" />
                            </ModernPanel>

                            <ModernPanel v-model:collapsed="uiStore.panelState.introduction"
                                v-show="panelVisibility.introduction">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <AlignLeft class="text-orange-500 w-4 h-4" /><span
                                            class="font-semibold text-sm">Introduction</span>
                                    </div>
                                </template>
                                <div class="flex flex-col gap-4">
                                    <p
                                        class="text-2xs text-surface-500 dark:text-surface-400 italic bg-surface-100 dark:bg-surface-800/50 p-2 rounded">
                                        The first instance of the game title in introduction should be written as <code
                                            class="text-primary-600 dark:text-primary-400">'''''Title'''''</code>.
                                    </p>
                                    <DynamicSection v-if="schemas.introduction.value"
                                        :section="schemas.introduction.value" v-model="gameData" />
                                </div>
                            </ModernPanel>

                            <ModernPanel v-model:collapsed="uiStore.panelState.availability"
                                v-show="panelVisibility.availability">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <ShoppingCart class="text-emerald-500 w-4 h-4" /><span
                                            class="font-semibold text-sm">Availability</span>
                                    </div>
                                </template>
                                <DynamicSection v-if="schemas.availability.value" :section="schemas.availability.value"
                                    v-model="gameData" />
                            </ModernPanel>

                            <ModernPanel v-model:collapsed="uiStore.panelState.monetization"
                                v-show="panelVisibility.monetization">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <DollarSign class="text-amber-500 w-4 h-4" /><span
                                            class="font-semibold text-sm">Monetization & Microtransactions</span>
                                    </div>
                                </template>
                                <div class="flex flex-col gap-6">
                                    <DynamicSection v-if="schemas.monetization.value"
                                        :section="schemas.monetization.value" v-model="gameData" />
                                    <div class="border-t border-surface-200 dark:border-surface-700"></div>
                                    <DynamicSection v-if="schemas.microtransactions.value"
                                        :section="schemas.microtransactions.value" v-model="gameData" />
                                </div>
                            </ModernPanel>

                            <ModernPanel v-model:collapsed="uiStore.panelState.dlc" v-show="panelVisibility.dlc">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <PlusCircle class="text-purple-500 w-4 h-4" /><span
                                            class="font-semibold text-sm">DLC & Expansions</span>
                                    </div>
                                </template>
                                <DynamicSection v-if="schemas.dlc.value" :section="schemas.dlc.value"
                                    v-model="gameData" />
                            </ModernPanel>

                            <ModernPanel v-model:collapsed="uiStore.panelState.essentialImprovements"
                                v-show="panelVisibility.essentialImprovements">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <Star class="text-yellow-500 w-4 h-4" /><span
                                            class="font-semibold text-sm">Essential Improvements</span>
                                    </div>
                                </template>
                                <DynamicSection v-if="schemas.essentialImprovements.value"
                                    :section="schemas.essentialImprovements.value" v-model="gameData" />
                            </ModernPanel>

                            <ModernPanel v-model:collapsed="uiStore.panelState.gameData"
                                v-show="panelVisibility.gameData">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <Save class="text-green-600 w-4 h-4" /><span class="font-semibold text-sm">Game
                                            Data (Config, Saves, Cloud)</span>
                                    </div>
                                </template>
                                <div class="flex flex-col gap-6">
                                    <SectionGallery v-model="gameData.galleries.game_data" section="game_data" />
                                    <DynamicSection v-if="schemas.gameData.value" :section="schemas.gameData.value"
                                        v-model="gameData" />
                                </div>
                            </ModernPanel>

                            <ModernPanel v-model:collapsed="uiStore.panelState.video" v-show="panelVisibility.video">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <Monitor class="text-sky-500 w-4 h-4" /><span
                                            class="font-semibold text-sm">Video</span>
                                    </div>
                                </template>
                                <DynamicSection v-if="schemas.video.value" :section="schemas.video.value"
                                    v-model="gameData" />
                            </ModernPanel>

                            <ModernPanel v-model:collapsed="uiStore.panelState.input" v-show="panelVisibility.input">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <Keyboard class="text-indigo-500 w-4 h-4" /><span
                                            class="font-semibold text-sm">Input</span>
                                    </div>
                                </template>
                                <div class="flex flex-col gap-6">
                                    <SectionGallery v-model="gameData.galleries.input" section="input" />
                                    <DynamicSection v-if="schemas.input.value" :section="schemas.input.value"
                                        v-model="gameData" />
                                </div>
                            </ModernPanel>

                            <ModernPanel v-model:collapsed="uiStore.panelState.audio" v-show="panelVisibility.audio">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <Volume2 class="text-violet-500 w-4 h-4" /><span
                                            class="font-semibold text-sm">Audio</span>
                                    </div>
                                </template>
                                <div class="flex flex-col gap-6">
                                    <SectionGallery v-model="gameData.galleries.audio" section="audio" />
                                    <DynamicSection v-if="schemas.audio.value" :section="schemas.audio.value"
                                        v-model="gameData" />
                                </div>
                            </ModernPanel>

                            <ModernPanel v-model:collapsed="uiStore.panelState.network"
                                v-show="panelVisibility.network">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <Wifi class="text-cyan-500 w-4 h-4" /><span
                                            class="font-semibold text-sm">Network</span>
                                    </div>
                                </template>
                                <div class="flex flex-col gap-6">
                                    <SectionGallery v-model="gameData.galleries.network" section="network" />
                                    <DynamicSection v-if="schemas.network.value" :section="schemas.network.value"
                                        v-model="gameData" />
                                </div>
                            </ModernPanel>

                            <ModernPanel v-model:collapsed="uiStore.panelState.vr" v-show="panelVisibility.vr">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <Eye class="text-pink-500 w-4 h-4" /><span class="font-semibold text-sm">VR
                                            Support</span>
                                    </div>
                                </template>
                                <div class="flex flex-col gap-6">
                                    <SectionGallery v-model="gameData.galleries.vr" section="vr" />
                                    <DynamicSection v-if="schemas.vr.value" :section="schemas.vr.value"
                                        v-model="gameData" />
                                </div>
                            </ModernPanel>

                            <ModernPanel v-model:collapsed="uiStore.panelState.other" v-show="panelVisibility.other">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <Settings class="text-slate-500 w-4 h-4" /><span
                                            class="font-semibold text-sm">Other Information (API, Middleware)</span>
                                    </div>
                                </template>
                                <div class="flex flex-col gap-6">
                                    <SectionGallery v-model="gameData.galleries.other" section="other" />
                                    <DynamicSection v-if="schemas.api.value" :section="schemas.api.value"
                                        v-model="gameData" />
                                    <DynamicSection v-if="schemas.middleware.value" :section="schemas.middleware.value"
                                        v-model="gameData" />
                                </div>
                            </ModernPanel>

                            <ModernPanel v-model:collapsed="uiStore.panelState.systemReq"
                                v-show="panelVisibility.systemReq">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <Cpu class="text-lime-500 w-4 h-4" /><span class="font-semibold text-sm">System
                                            Requirements</span>
                                    </div>
                                </template>
                                <div class="flex flex-col gap-6">
                                    <SectionGallery v-model="gameData.galleries.systemReq" section="systemReq" />
                                    <DynamicSection v-if="schemas.systemReq.value" :section="schemas.systemReq.value"
                                        v-model="gameData" />
                                </div>
                            </ModernPanel>

                            <ModernPanel v-model:collapsed="uiStore.panelState.l10n" v-show="panelVisibility.l10n">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <Globe class="text-teal-400 w-4 h-4" /><span
                                            class="font-semibold text-sm">Localizations</span>
                                    </div>
                                </template>
                                <DynamicSection v-if="schemas.l10n.value" :section="schemas.l10n.value"
                                    v-model="gameData" />
                            </ModernPanel>
                        </div>

                        <!-- Code Editor -->
                        <div v-else class="h-full flex flex-col" key="code">
                            <Suspense>
                                <template #default>
                                    <CodeEditor v-model="manualWikitext" class="flex-1" />
                                </template>
                                <template #fallback>
                                    <div class="h-full w-full p-4 animate-pulse">
                                        <div
                                            class="h-full w-full bg-surface-100 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 flex items-center justify-center">
                                            <div class="flex flex-col items-center gap-3">
                                                <Loader2 class="w-8 h-8 animate-spin text-primary-500" /><span
                                                    class="text-surface-500 dark:text-surface-400 text-sm font-medium">Loading
                                                    Code Editor...</span>
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
            <SplitterPanel
                class="flex flex-col overflow-hidden bg-surface-50 dark:bg-surface-950 border-l border-surface-200 dark:border-surface-700"
                :size="50" :minSize="30">
                <PreviewPanel :html="renderedHtml" :loading="isPreviewLoading" :error="previewError"
                    :previewMode="previewMode" @update:previewMode="previewMode = $event" />
            </SplitterPanel>
        </Splitter>

        <GeminiDialogs v-model:showApiKeyDialog="showApiKeyDialog" v-model:shareSummaryVisible="shareSummaryVisible"
            v-model:tempApiKey="tempApiKey" :isGeneratingSummary="isGeneratingSummary" :geminiApiKey="geminiApiKey"
            :shareSummaryText="shareSummaryText" @saveApiKey="saveApiKey" @clearApiKey="clearApiKey"
            @copyShareSummary="copyShareSummary" @openApiKeyDialog="showApiKeyDialog = true" />
    </div>
</template>

<style>
@import './styles/animations.css';

/* Splitter Modern Styling */
.splitter-modern :deep(.p-splitter-gutter) {
    background: linear-gradient(to right, transparent 0%, rgba(168, 85, 247, 0.1) 45%, rgba(168, 85, 247, 0.2) 50%, rgba(168, 85, 247, 0.1) 55%, transparent 100%);
    transition: all 0.2s ease;
    position: relative;
}

.splitter-modern :deep(.p-splitter-gutter):hover {
    background: linear-gradient(to right, transparent 0%, rgba(168, 85, 247, 0.15) 40%, rgba(168, 85, 247, 0.3) 50%, rgba(168, 85, 247, 0.15) 60%, transparent 100%);
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
    transition: opacity 0.1s ease-in;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
