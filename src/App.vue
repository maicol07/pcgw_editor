<script setup lang="ts">
import { computed, provide, onMounted, onUnmounted, ref, defineAsyncComponent, watch } from 'vue';
import { useWindowSize } from '@vueuse/core';
import { useWorkspaceStore } from './stores/workspace';
import { useUiStore } from './stores/ui';
import { fieldsConfig } from './config/fields';
import { searchKeywords, panelKeys } from './config/searchKeywords';

// Composables
import { useAutoTheme } from './composables/useAutoTheme';
import { useSearch } from './composables/useSearch';
import { usePreview } from './composables/usePreview';
import { useEditor } from './features/editor/useEditor';
import { useGeminiSummary } from './features/ai/useGeminiSummary';
import { hasActiveKey } from './services/ai/aiConfig';
import { generateEditSummary } from './services/ai/AIService';

// Layout & UI
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import ModernPanel from './components/common/ModernPanel.vue';
import WorkspaceSidebar from './components/WorkspaceSidebar.vue';
import EditorToolbar from './components/editor/EditorToolbar.vue';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import PreviewPanel from './components/editor/PreviewPanel.vue';
import QuickActions from './components/layout/QuickActions.vue';
import GeminiDialogs from './features/ai/GeminiDialogs.vue';
import AppSettings from './components/settings/AppSettings.vue';
import GuidedTour from './components/layout/GuidedTour.vue';
import EditorSkeleton from './components/layout/EditorSkeleton.vue';
import SectionNav from './components/layout/SectionNav.vue';
import { sectionKeysInOrder } from './config/sections';
import DynamicSection from './components/schema/DynamicSection.vue';
import DiffMergerDialog from './components/common/DiffMergerDialog.vue';
import PublishDiffDialog from './components/common/PublishDiffDialog.vue';
import ReloadPrompt from './components/common/ReloadPrompt.vue';
import ReleaseNotesDialog from './components/common/ReleaseNotesDialog.vue';
import RateLimitNotice from './components/common/RateLimitNotice.vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import FileUpload from 'primevue/fileupload';
import { pcgwApi } from './services/pcgwApi';
import { start as startSync } from './services/sync/syncService';
import MetadataAutofillDialog from './components/infobox/MetadataAutofillDialog.vue';

// Icons
import {
    File, Info, AlignLeft, ShoppingCart, DollarSign, PlusCircle,
    Star, Save, Monitor, Keyboard, Volume2, Wifi, Eye, Settings, Cpu, Globe, Loader2, AlertCircle, RefreshCw, FileClock,
    Plus, Download
} from 'lucide-vue-next';

// Async Components
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
const twitchClientId = ref(localStorage.getItem('twitch-client-id') || '');
const twitchClientSecret = ref(localStorage.getItem('twitch-client-secret') || '');
provide('twitchClientId', twitchClientId);
provide('twitchClientSecret', twitchClientSecret);

const rawgApiKey = ref(localStorage.getItem('rawg-api-key') || '');
provide('rawgApiKey', rawgApiKey);

const isAutofillDialogVisible = ref(false);
provide('openAutofillDialog', () => {
    isAutofillDialogVisible.value = true;
});

// --- Game Data & Sync ---
// Use the store's game data directly as a shallow reference for the visual editor
// Any change in Visual editor will trigger store update.
const gameData = computed({
    get: () => workspaceStore.activeGameData,
    set: (val) => { workspaceStore.activeGameData = val; }
});

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
} = useEditor(gameData, wikitext, workspaceStore.syncFromWikitext);

const {
    previewMode, renderedHtml, isLoading: isPreviewLoading, error: previewError
} = usePreview(() => currentWikitext.value, () => pageTitle.value);

const { searchQuery, panelVisibility } = useSearch(panelKeys, searchKeywords);
provide('searchQuery', searchQuery);

const {
    isGeneratingSummary, shareSummaryVisible, shareSummaryText,
    showApiKeyDialog, tempApiKey, activeKey, saveApiKey, clearApiKey,
    generateShareSummary, copyShareSummary
} = useGeminiSummary(pageTitle, gameData);

// --- Diff Merger Logic ---
const isDiffMergerVisible = ref(false);
const diffMergerLocalWikitext = ref('');
const diffMergerBaseWikitext = ref('');
const diffMergerOnlineWikitext = ref('');
const diffMergerOnlineRevid = ref<number | undefined>();
const diffMergerPageTitle = ref('');
const workspaceSidebarRef = ref();

const handleUpdateFromPcgw = async (page: any) => {
    if (!page.pcgwPageTitle) return;

    // Fetch online wikitext
    const result = await pcgwApi.fetchWikitext(page.pcgwPageTitle);
    if (!result) {
        alert('Failed to fetch online page content from PCGW.');
        return;
    }

    diffMergerLocalWikitext.value = page.wikitext;
    // ponytail: base = baseWikitext; se diverge dall'antenato reale, fetchare il testo di
    // onlineRevisionId via pcgwApi.fetchWikitext(title, revid) come base — upgrade path se i conflitti risultano imprecisi.
    diffMergerBaseWikitext.value = page.baseWikitext ?? page.wikitext;
    diffMergerOnlineWikitext.value = result.content;
    diffMergerOnlineRevid.value = result.revid;
    diffMergerPageTitle.value = page.pcgwPageTitle;
    isDiffMergerVisible.value = true;
};

// --- Publish Logic ---
const isPublishDialogVisible = ref(false); // Kept for fallback or removed later
const isPublishDiffDialogVisible = ref(false);
const publishDiffOnlineWikitext = ref('');
const publishDiffLocalWikitext = ref('');
const isGeneratingEditSummary = ref(false);
const suggestedEditSummary = ref('');
const isConflictDialogVisible = ref(false);
const publishSummary = ref('Updated via PCGW Editor');
const isMinorEdit = ref(false);
const isPublishing = ref(false);
const toast = useToast();

const handleOpenPublishDialog = async () => {
    if (!workspaceStore.activePage || !workspaceStore.activePage.pcgwPageTitle) {
        toast.add({ severity: 'error', summary: 'Publish Error', detail: 'Page is not linked to PCGamingWiki.' });
        return;
    }
    
    toast.add({ severity: 'info', summary: 'Loading Diff', detail: 'Fetching latest online version...', life: 2000 });
    const result = await pcgwApi.fetchWikitext(workspaceStore.activePage.pcgwPageTitle);
    
    if (!result) {
        toast.add({ severity: 'error', summary: 'Fetch Error', detail: 'Failed to fetch online page content from PCGW.' });
        return;
    }
    
    publishDiffOnlineWikitext.value = result.content;
    publishDiffLocalWikitext.value = workspaceStore.activePage.wikitext;
    suggestedEditSummary.value = ''; // Reset suggested summary
    isPublishDiffDialogVisible.value = true;
};

const handleGenerateEditSummary = async () => {
    if (!hasActiveKey()) {
        showApiKeyDialog.value = true;
        return;
    }

    isGeneratingEditSummary.value = true;
    suggestedEditSummary.value = '';
    try {
        // Stream so the summary fills in progressively.
        suggestedEditSummary.value = await generateEditSummary(
            publishDiffOnlineWikitext.value,
            publishDiffLocalWikitext.value,
            (full) => { suggestedEditSummary.value = full; }
        );
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'AI Error', detail: 'Error generating summary: ' + e.message, life: 5000 });
        if (e.message.includes('API key') || e.message.includes('API_KEY')) {
            clearApiKey();
        }
    } finally {
        isGeneratingEditSummary.value = false;
    }
};

const handlePublishFromDialog = async (payload: { summary: string; minor: boolean }) => {
    publishSummary.value = payload.summary;
    isMinorEdit.value = payload.minor;
    await handlePublishToPcgw(false);
};

const handlePublishToPcgw = async (force: boolean = false) => {
    if (!workspaceStore.activePage) return;
    
    isPublishing.value = true;
    try {
        await workspaceStore.publishPage(workspaceStore.activePage.id, publishSummary.value, force, isMinorEdit.value);
        
        // Success
        isPublishDialogVisible.value = false;
        isPublishDiffDialogVisible.value = false;
        isConflictDialogVisible.value = false;
        toast.add({
            severity: 'success',
            summary: 'Published',
            detail: 'Changes pushed to PCGamingWiki successfully.',
            life: 5000
        });
    } catch (e: any) {
        console.error('Publish failed:', e);
        const isConflict = e.code === 'PUBLISH_CONFLICT' || 
                          e.message?.toLowerCase().includes('conflict') || 
                          e.message?.includes('CONFLICT');
        
        if (isConflict) {
            isConflictDialogVisible.value = true;
            isPublishDialogVisible.value = false;
            isPublishDiffDialogVisible.value = false;
        } else {
            toast.add({
                severity: 'error',
                summary: 'Publish Failed',
                detail: e.message || 'Unknown error during publish.',
                life: 5000
            });
        }
    } finally {
        isPublishing.value = false;
    }
};

const handleOpenMerge = () => {
    isConflictDialogVisible.value = false;
    if (workspaceStore.activePage) {
        handleUpdateFromPcgw(workspaceStore.activePage);
    }
};

const handleDiffMerge = async (mergedText: string) => {
    // Save to store
    await workspaceStore.syncFromWikitext(mergedText, diffMergerOnlineRevid.value);
};

// --- Responsive Splitter Layout ---
// Stack editor/preview vertically below the `lg` breakpoint (1024px) so the
// two panes aren't cramped on tablet/mobile; horizontal on larger screens.
const { width: windowWidth } = useWindowSize();
const splitterLayout = computed(() => (windowWidth.value < 1024 ? 'vertical' : 'horizontal'));

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
    issues: getSchema('issues'),
};

// --- Section navigation rail + scroll-spy ---
const scrollContainer = ref<HTMLElement>();
const activeSection = ref(sectionKeysInOrder[0]);

// While a click-driven scroll is animating, keep the clicked section active
// instead of letting scroll-spy hijack it (the target may sit near the bottom
// and never reach the top, which would otherwise highlight a higher section).
let suppressSpyUntil = 0;

const navigateToSection = (key: string) => {
    activeSection.value = key;
    suppressSpyUntil = performance.now() + 800;
    requestAnimationFrame(() => {
        const el = document.getElementById(`sec-${key}`);
        if (el && scrollContainer.value) {
            scrollContainer.value.scrollTo({ top: el.offsetTop - 12, behavior: 'smooth' });
        }
    });
};

let spyRaf = 0;
const onScrollSpy = () => {
    if (spyRaf || performance.now() < suppressSpyUntil) return;
    spyRaf = requestAnimationFrame(() => {
        spyRaf = 0;
        const container = scrollContainer.value;
        if (!container) return;
        const top = container.scrollTop + 80; // small offset so the section feels "active" before its top
        let current = sectionKeysInOrder[0];
        for (const key of sectionKeysInOrder) {
            const el = document.getElementById(`sec-${key}`);
            if (el && el.offsetTop <= top) current = key;
        }
        activeSection.value = current;
    });
};

const updateGameData = (path: string, value: any) => {
    const newData = { ...gameData.value };
    if (path === 'infobox') {
        newData.infobox = value;
    } else if (path.startsWith('galleries.')) {
        const galKey = path.split('.')[1] as keyof typeof newData.galleries;
        newData.galleries = { ...newData.galleries, [galKey]: value };
    }
    gameData.value = newData;
};

const handleCreateNewPageEmptyState = () => {
    uiStore.sidebarVisible = true;
    setTimeout(() => {
        workspaceSidebarRef.value?.openNewPageDialog();
    }, 150);
};

const onImportSelectEmptyState = (event: any) => {
    const file = event.files[0];
    if (file) {
        workspaceStore.importPage(file);
    }
};

watch(() => workspaceStore.pages.length, (newLength, oldLength) => {
    // Launch Part 2 when the first page is created/imported
    if (newLength > 0 && (!oldLength || oldLength === 0) && !uiStore.tourPart2Seen) {
        setTimeout(() => {
            uiStore.startTour('Editor Toolbar');
        }, 800);
    }
});

onMounted(() => {
    setTimeout(() => { uiStore.isInitialLoad = false; }, 100);
    pcgwApi.prewarmCache().catch(console.warn);
    startSync().catch(console.warn);



    if (!uiStore.tourPart1Seen) {
        setTimeout(() => {
            uiStore.startTour();
        }, 800);
    }

    const handleGlobalKeydown = (e: KeyboardEvent) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 ||
            navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
        const isK = e.key.toLowerCase() === 'k';
        const modifier = isMac ? e.metaKey : e.ctrlKey;

        if (modifier && isK) {
            e.preventDefault();
            const searchInput = document.getElementById('search-input');
            if (searchInput) searchInput.focus();
        }
    };

    window.addEventListener('keydown', handleGlobalKeydown);

    // Initial check for updates for all pages
    workspaceStore.checkAllPagesForUpdates().catch(console.warn);

    // Periodic check every 5 minutes
    const interval = setInterval(() => {
        workspaceStore.checkAllPagesForUpdates().catch(console.warn);
    }, 5 * 60 * 1000);

    onUnmounted(() => {
        clearInterval(interval);
        window.removeEventListener('keydown', handleGlobalKeydown);
    });
});
</script>

<template>
    <div class="h-screen w-screen overflow-hidden bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-0 transition-colors duration-200"
        :class="{
            'comfortable-mode': uiStore.densityMode === 'comfortable',
            'compact-mode': uiStore.densityMode === 'compact'
        }">
        <Toast />
        <WorkspaceSidebar ref="workspaceSidebarRef" v-model:visible="uiStore.sidebarVisible" />

        <Splitter v-if="workspaceStore.activePage" style="height: 100vh" class="border-none mb-0! rounded-none! bg-transparent splitter-modern"
            :layout="splitterLayout" stateKey="editor-splitter" stateStorage="local">
            <!-- Left Panel: Editor -->
            <SplitterPanel class="flex flex-col overflow-hidden relative" :size="50" :minSize="30">
                <EditorToolbar :title="pageTitle" @update:title="pageTitle = $event" :editorMode="editorMode"
                    @update:editorMode="handleModeChange" :isGeneratingSummary="isGeneratingSummary"
                    @toggleSidebar="uiStore.sidebarVisible = true" @generateSummary="generateShareSummary"
                    @updatePcgw="workspaceStore.activePage && handleUpdateFromPcgw(workspaceStore.activePage)"
                    @publishPcgw="handleOpenPublishDialog"
                    @linkPcgw="workspaceStore.activePage && workspaceSidebarRef?.openLinkDialog(workspaceStore.activePage)" />

                <RateLimitNotice />

                <div class="flex-1 flex overflow-hidden">
                    <!-- Section navigation rail (Visual mode only) -->
                    <SectionNav v-if="editorMode === 'Visual' && !uiStore.isInitialLoad" data-tour="section-nav"
                        v-model:collapsed="uiStore.navRailCollapsed"
                        :activeKey="activeSection" :panelVisibility="panelVisibility"
                        @navigate="navigateToSection" />

                    <div ref="scrollContainer" @scroll="onScrollSpy" data-tour="editor-sections"
                        class="flex-1 overflow-y-auto custom-scrollbar bg-linear-to-b from-surface-50 to-surface-100 dark:from-surface-950 dark:to-surface-900 relative">
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
                            class="p-4 md:p-6 max-w-6xl xl:max-w-7xl 2xl:max-w-none mx-auto flex flex-col gap-9" key="visual">
                            <QuickActions v-model:searchQuery="searchQuery" />

                            <!-- Sections -->
                            <ModernPanel id="sec-articleState"
                                v-show="panelVisibility.articleState">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <File class="text-slate-500 w-4 h-4" /><span
                                            class="section-eyebrow">Article State</span>
                                    </div>
                                </template>
                                <DynamicSection v-if="schemas.articleState.value"
                                    :section="schemas.articleState.value" v-model="gameData" />
                            </ModernPanel>

                            <ModernPanel id="sec-infobox"
                                v-show="panelVisibility.infobox">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <Info class="text-blue-600 w-4 h-4" />
                                        <span class="section-eyebrow">Infobox</span>
                                    </div>
                                </template>
                                <DynamicSection v-if="schemas.infobox.value"
                                    :section="schemas.infobox.value" :modelValue="gameData.infobox"
                                    @update:modelValue="val => updateGameData('infobox', val)" />
                            </ModernPanel>

                            <ModernPanel id="sec-introduction"
                                v-show="panelVisibility.introduction">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <AlignLeft class="text-orange-500 w-4 h-4" /><span
                                            class="section-eyebrow">Introduction</span>
                                    </div>
                                </template>
                                <div class="flex flex-col gap-4">
                                    <p
                                        class="text-2xs text-surface-500 dark:text-surface-400 italic bg-surface-100 dark:bg-surface-800/50 p-2 rounded">
                                        The first instance of the game title in introduction should be written as <code
                                            class="text-primary-600 dark:text-primary-400">'''''Title'''''</code>.
                                    </p>
                                    <DynamicSection
                                        v-if="schemas.introduction.value"
                                        :section="schemas.introduction.value" v-model="gameData" />
                                </div>
                            </ModernPanel>

                            <ModernPanel id="sec-availability"
                                v-show="panelVisibility.availability">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <ShoppingCart class="text-emerald-500 w-4 h-4" /><span
                                            class="section-eyebrow">Availability</span>
                                    </div>
                                </template>
                                <DynamicSection v-if="schemas.availability.value"
                                    :section="schemas.availability.value" v-model="gameData" />
                            </ModernPanel>

                            <ModernPanel id="sec-monetization"
                                v-show="panelVisibility.monetization">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <DollarSign class="text-amber-500 w-4 h-4" /><span
                                            class="section-eyebrow">Monetization & Microtransactions</span>
                                    </div>
                                </template>
                                <div class="flex flex-col gap-6">
                                    <div class="flex flex-col gap-4">
                                        <h3 class="flex items-center gap-2 text-sm font-semibold text-surface-700 dark:text-surface-200">
                                            <DollarSign class="w-4 h-4 text-amber-500" /> Monetization
                                        </h3>
                                        <DynamicSection
                                            v-if="schemas.monetization.value"
                                            :section="schemas.monetization.value" v-model="gameData" />
                                    </div>
                                    <div class="border-t border-surface-200 dark:border-surface-700"></div>
                                    <div class="flex flex-col gap-4">
                                        <h3 class="flex items-center gap-2 text-sm font-semibold text-surface-700 dark:text-surface-200">
                                            <ShoppingCart class="w-4 h-4 text-primary-500" /> Microtransactions
                                        </h3>
                                        <DynamicSection
                                            v-if="schemas.microtransactions.value"
                                            :section="schemas.microtransactions.value" v-model="gameData" />
                                    </div>
                                </div>
                            </ModernPanel>

                            <ModernPanel id="sec-dlc" v-show="panelVisibility.dlc">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <PlusCircle class="text-primary-500 w-4 h-4" /><span
                                            class="section-eyebrow">DLC & Expansions</span>
                                    </div>
                                </template>
                                <DynamicSection v-if="schemas.dlc.value"
                                    :section="schemas.dlc.value" v-model="gameData" />
                            </ModernPanel>

                            <ModernPanel id="sec-essentialImprovements"
                                v-show="panelVisibility.essentialImprovements">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <Star class="text-yellow-500 w-4 h-4" /><span
                                            class="section-eyebrow">Essential Improvements</span>
                                    </div>
                                </template>
                                <div class="flex flex-col gap-4">
                                    <p
                                        class="text-2xs text-surface-500 dark:text-surface-400 italic bg-surface-100 dark:bg-surface-800/50 p-2 rounded">
                                        Document official patches, intro-skip methods, major community mods, and
                                        game-specific utilities. Wrap downloads or fixes in a
                                        <code class="text-primary-600 dark:text-primary-400">Fixbox</code> (source mode
                                        <code class="text-primary-600 dark:text-primary-400">&lt;/&gt;</code>).
                                    </p>
                                    <DynamicSection
                                        v-if="schemas.essentialImprovements.value"
                                        :section="schemas.essentialImprovements.value" v-model="gameData" />
                                </div>
                            </ModernPanel>

                            <ModernPanel id="sec-gameData"
                                v-show="panelVisibility.gameData">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <Save class="text-green-600 w-4 h-4" /><span class="section-eyebrow">Game
                                            Data (Config, Saves, Cloud)</span>
                                    </div>
                                </template>
                                <DynamicSection v-if="schemas.gameData.value"
                                    :section="schemas.gameData.value" v-model="gameData" />
                            </ModernPanel>

                            <ModernPanel id="sec-video" v-show="panelVisibility.video">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <Monitor class="text-sky-500 w-4 h-4" /><span
                                            class="section-eyebrow">Video</span>
                                    </div>
                                </template>
                                <DynamicSection v-if="schemas.video.value"
                                    :section="schemas.video.value" v-model="gameData" />
                            </ModernPanel>

                            <ModernPanel id="sec-input" v-show="panelVisibility.input">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <Keyboard class="text-indigo-500 w-4 h-4" /><span
                                            class="section-eyebrow">Input</span>
                                    </div>
                                </template>
                                <DynamicSection v-if="schemas.input.value"
                                    :section="schemas.input.value" v-model="gameData" />
                            </ModernPanel>

                            <ModernPanel id="sec-audio" v-show="panelVisibility.audio">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <Volume2 class="text-primary-500 w-4 h-4" /><span
                                            class="section-eyebrow">Audio</span>
                                    </div>
                                </template>
                                <DynamicSection v-if="schemas.audio.value"
                                    :section="schemas.audio.value" v-model="gameData" />
                            </ModernPanel>

                            <ModernPanel id="sec-network"
                                v-show="panelVisibility.network">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <Wifi class="text-cyan-500 w-4 h-4" /><span
                                            class="section-eyebrow">Network</span>
                                    </div>
                                </template>
                                <DynamicSection v-if="schemas.network.value"
                                    :section="schemas.network.value" v-model="gameData" />
                            </ModernPanel>

                            <ModernPanel id="sec-vr" v-show="panelVisibility.vr">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <Eye class="text-pink-500 w-4 h-4" /><span class="section-eyebrow">VR
                                            Support</span>
                                    </div>
                                </template>
                                <DynamicSection v-if="schemas.vr.value"
                                    :section="schemas.vr.value" v-model="gameData" />
                            </ModernPanel>

                            <ModernPanel id="sec-issues" v-show="panelVisibility.issues">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <AlertCircle class="text-red-500 w-4 h-4" /><span
                                            class="section-eyebrow">Issues</span>
                                    </div>
                                </template>
                                <DynamicSection v-if="schemas.issues.value"
                                    :section="schemas.issues.value" v-model="gameData" />
                            </ModernPanel>

                            <ModernPanel id="sec-other" v-show="panelVisibility.other">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <Settings class="text-slate-500 w-4 h-4" /><span
                                            class="section-eyebrow">Other Information (API, Middleware)</span>
                                    </div>
                                </template>
                                <div class="flex flex-col gap-6">
                                    <DynamicSection v-if="schemas.api.value"
                                        :section="schemas.api.value" v-model="gameData" />
                                    <DynamicSection v-if="schemas.middleware.value"
                                        :section="schemas.middleware.value" v-model="gameData" />
                                </div>
                            </ModernPanel>

                            <ModernPanel id="sec-systemReq"
                                v-show="panelVisibility.systemReq">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <Cpu class="text-lime-500 w-4 h-4" /><span class="section-eyebrow">System
                                            Requirements</span>
                                    </div>
                                </template>
                                <DynamicSection v-if="schemas.systemReq.value"
                                    :section="schemas.systemReq.value" v-model="gameData" />
                            </ModernPanel>



                            <ModernPanel id="sec-l10n" v-show="panelVisibility.l10n">
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <Globe class="text-teal-400 w-4 h-4" /><span
                                            class="section-eyebrow">Localizations</span>
                                    </div>
                                </template>
                                <DynamicSection v-if="schemas.l10n.value"
                                    :section="schemas.l10n.value" v-model="gameData" />
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
                </div>
            </SplitterPanel>

            <!-- Right Panel: Preview -->
            <SplitterPanel
                class="flex flex-col overflow-hidden bg-surface-50 dark:bg-surface-950 border-l border-surface-200 dark:border-surface-700"
                :size="50" :minSize="30">
                <PreviewPanel data-tour="preview-panel" :html="renderedHtml" :loading="isPreviewLoading" :error="previewError"
                    :previewMode="previewMode" @update:previewMode="previewMode = $event" />
            </SplitterPanel>
        </Splitter>

        <div v-else class="h-screen w-screen flex flex-col items-center justify-center bg-linear-to-b from-surface-50 to-surface-100 dark:from-surface-950 dark:to-surface-900 relative px-4 text-center">
            <!-- Settings button on empty state -->
            <div class="absolute top-4 right-4 z-10">
                <Button text rounded severity="secondary" @click="uiStore.isSettingsOpen = true" data-tour="settings-btn"
                    class="h-10! w-10! p-0! hover-scale" v-tooltip.bottom="'App Settings'">
                    <template #icon>
                        <Settings class="w-5 h-5 text-surface-500 dark:text-surface-400" />
                    </template>
                </Button>
            </div>

            <!-- Glowing gradient background elements -->
            <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-400/20 dark:bg-primary-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-400/20 dark:bg-sky-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

            <div class="z-10 max-w-md p-8 md:p-10 rounded-2xl bg-surface-0/60 dark:bg-surface-900/60 backdrop-blur-xl border border-surface-200/50 dark:border-surface-800/50 shadow-2xl flex flex-col items-center gap-6 transition-all duration-300 hover:shadow-primary-500/5 dark:hover:shadow-primary-400/5">
                
                <!-- App Logo / Mascot / Icon -->
                <div class="p-5 bg-linear-to-tr from-primary-500 to-sky-500 dark:from-primary-600 dark:to-sky-600 rounded-2xl shadow-lg relative group">
                    <div class="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <svg class="w-12 h-12 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                </div>

                <div class="flex flex-col gap-2">
                    <h1 class="text-3xl font-extrabold tracking-tight bg-linear-to-r from-primary-600 to-sky-500 dark:from-primary-400 dark:to-sky-400 bg-clip-text text-transparent">
                        PCGamingWiki Editor
                    </h1>
                    <p class="text-sm text-surface-500 dark:text-surface-400 max-w-xs leading-relaxed">
                        A gorgeous, modern visual wiki editor for making contributions to PCGamingWiki easy and fast.
                    </p>
                </div>

                <div class="border-t border-surface-200 dark:border-surface-800 w-full my-1"></div>

                <!-- Quick Actions -->
                <div class="flex flex-col gap-3 w-full sm:w-80">
                    <Button label="Open Workspace Sidebar" class="w-full text-sm font-semibold py-2.5 rounded-xl shadow-md cursor-pointer" @click="uiStore.sidebarVisible = true">
                        <template #icon>
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                            </svg>
                        </template>
                    </Button>
                    
                    <div class="flex gap-3 w-full">
                        <Button label="New Page" severity="secondary" outlined class="flex-1 text-sm font-semibold rounded-xl cursor-pointer" @click="handleCreateNewPageEmptyState">
                            <template #icon>
                                <Plus class="w-4 h-4 mr-1.5" />
                            </template>
                        </Button>

                        <FileUpload mode="basic" name="import[]" accept=".json" :maxFileSize="1000000" @select="onImportSelectEmptyState"
                            customUpload auto chooseLabel="Import" :chooseButtonProps="{ severity: 'secondary', outlined: true }"
                            class="flex-1 cursor-pointer">
                            <template #chooseicon>
                                <Download class="w-4 h-4 mr-1.5" />
                            </template>
                        </FileUpload>
                    </div>
                </div>
            </div>
        </div>

        <GeminiDialogs v-model:showApiKeyDialog="showApiKeyDialog" v-model:shareSummaryVisible="shareSummaryVisible"
            v-model:tempApiKey="tempApiKey" :isGeneratingSummary="isGeneratingSummary" :geminiApiKey="activeKey()"
            :shareSummaryText="shareSummaryText" @saveApiKey="saveApiKey" @clearApiKey="clearApiKey"
            @copyShareSummary="copyShareSummary" @openApiKeyDialog="showApiKeyDialog = true" />
    </div>

    <!-- Global Modals -->
    <AppSettings />
    <GuidedTour />
    <MetadataAutofillDialog v-model:visible="isAutofillDialogVisible" />
    <DiffMergerDialog v-model:visible="isDiffMergerVisible" :localWikitext="diffMergerLocalWikitext"
        :baseWikitext="diffMergerBaseWikitext" :onlineWikitext="diffMergerOnlineWikitext"
        :pageTitle="diffMergerPageTitle" @merge="handleDiffMerge" />

    <!-- Publish Diff Dialog -->
    <PublishDiffDialog 
        v-model:visible="isPublishDiffDialogVisible" 
        :localWikitext="publishDiffLocalWikitext"
        :onlineWikitext="publishDiffOnlineWikitext"
        :pageTitle="workspaceStore.activePage?.pcgwPageTitle"
        :isPublishing="isPublishing"
        :isGeneratingSummary="isGeneratingEditSummary"
        :suggestedSummary="suggestedEditSummary"
        @publish="handlePublishFromDialog"
        @requestAiSummary="handleGenerateEditSummary"
    />

    <ReloadPrompt />

    <ReleaseNotesDialog />

    <!-- Conflict Dialog -->
    <Dialog v-model:visible="isConflictDialogVisible" modal header="Conflict Detected" :style="{ width: '500px' }" :draggable="false">
        <div class="flex flex-col gap-5 py-2">
            <div class="flex items-start gap-4 bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-200 dark:border-amber-900/20">
                <div class="p-2 bg-amber-500 rounded-lg shadow-sm shrink-0">
                    <AlertCircle class="w-5 h-5 text-white" />
                </div>
                <div class="flex flex-col gap-1">
                    <div class="text-sm font-bold text-amber-900 dark:text-amber-200">Newer version found online</div>
                    <div class="text-xs text-amber-800/80 dark:text-amber-200/60 leading-relaxed">
                        Someone else has modified this page on PCGamingWiki since you last synced. Pushing now would overwrite their changes.
                    </div>
                </div>
            </div>

            <div class="flex flex-col gap-3">
                <div class="flex flex-col gap-1 p-3 bg-surface-100 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
                    <div class="text-xs font-bold text-surface-500 uppercase flex items-center gap-1.5">
                        <FileClock class="w-3 h-3" /> Recommended Action
                    </div>
                    <div class="text-sm font-medium">Use the Merge Tool to integrate online changes with your own.</div>
                </div>
            </div>

            <div class="flex flex-col gap-2">
                <Button label="Open Merge Tool" icon="lucide-refresh-cw" @click="handleOpenMerge" severity="primary" class="w-full">
                    <template #icon>
                        <RefreshCw class="w-4 h-4 mr-2" />
                    </template>
                </Button>
                
                <div class="flex items-center gap-2 py-2">
                    <div class="h-px flex-1 bg-surface-200 dark:bg-surface-700"></div>
                    <span class="text-xs font-bold text-surface-400 dark:text-surface-600 uppercase">Or proceed anyway</span>
                    <div class="h-px flex-1 bg-surface-200 dark:bg-surface-700"></div>
                </div>

                <div class="flex flex-col gap-3">
                    <div class="flex items-start gap-2 text-xs text-red-500/80 dark:text-red-400/60 italic leading-tight bg-red-500/5 p-2 rounded border border-red-500/10">
                        <AlertCircle class="w-3 h-3 shrink-0" />
                        Force pushing will discard the online changes. Use this only if you are sure your version is correct.
                    </div>
                    <div class="flex justify-between gap-3">
                        <Button label="Cancel" text @click="isConflictDialogVisible = false" class="flex-1" />
                        <Button label="Force Publish" variant="outlined" severity="danger" @click="handlePublishToPcgw(true)" :loading="isPublishing" class="flex-1" />
                    </div>
                </div>
            </div>
        </div>
    </Dialog>
</template>

<style>
@import './styles/animations.css';

/* Splitter Modern Styling */
/* Hairline gutter — a quiet surface rule that warms to blue only on interaction. */
.splitter-modern .p-splitter-gutter {
    background: var(--color-surface-200);
    transition: background 0.15s ease;
    position: relative;
}

.dark .splitter-modern .p-splitter-gutter {
    background: var(--color-surface-800);
}

.splitter-modern .p-splitter-gutter:hover {
    background: var(--color-primary-500);
}

.splitter-modern .p-splitter-gutter::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 3px;
    height: 28px;
    background: var(--color-surface-400);
    border-radius: 2px;
    opacity: 0;
    transition: opacity 0.15s ease;
}

.splitter-modern .p-splitter-gutter:hover::after {
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
