<script setup lang="ts">
import { ref, inject, computed, type Ref, watch } from 'vue';
import {
    aiConfig,
    availableModels,
    refreshAvailableModels,
    isFetchingModels,
    modelFetchError,
    PROVIDERS,
    PROVIDER_LABELS,
    PROVIDER_KEY_LINKS,
    type AIProvider
} from '../../services/ai/aiConfig';
import { useUiStore } from '../../stores/ui';
import { useWorkspaceStore } from '../../stores/workspace';
import Dialog from 'openvue/dialog';
import Select from 'openvue/select';
import AutoComplete from 'openvue/autocomplete';
import InputText from 'openvue/inputtext';
import Button from 'openvue/button';
import ToggleSwitch from 'openvue/toggleswitch';
import {
    Palette, Bot, Sun, Moon, Monitor, Type, Layout, Key,
    AlignJustify, AlignLeft, Menu, Globe, LogOut, LogIn,
    Info, RotateCcw, Eye, EyeOff, Cloud, RefreshCw, Loader2, AlertCircle,
    Check, Link2, Code2, UploadCloud, HardDrive, Download, Upload, Trash2,
    Sliders
} from '@lucide/vue';
import { pcgwAuth } from '../../services/pcgwAuth';
import { syncState, connectAndUnlock, syncNow, disconnect as disconnectSync, reconnectSync } from '../../services/sync/syncService';
import { pcgwApi } from '../../services/pcgwApi';
import PcgwLoginDialog from '../common/PcgwLoginDialog.vue';
import { useToast } from 'openvue/usetoast';
import { PROVIDER_LOGOS } from '../icons/aiLogos';

const uiStore = useUiStore();
const workspaceStore = useWorkspaceStore();
const toast = useToast();

// AI provider/model/key bind directly to the reactive aiConfig (auto-persisted).
const providerOptions = PROVIDERS.map((p) => ({ label: PROVIDER_LABELS[p], value: p }));
const keyLink = computed(() => PROVIDER_KEY_LINKS[aiConfig.provider]);
const modelSuggestions = ref<any[]>([]);

const searchModel = (event: { query: string }) => {
    const query = (event.query || '').toLowerCase().trim();
    const list = availableModels[aiConfig.provider] || [];
    if (!query) {
        modelSuggestions.value = [...list];
    } else {
        modelSuggestions.value = list.filter(
            (m) => m.id.toLowerCase().includes(query) || m.label.toLowerCase().includes(query)
        );
    }
};

const onModelSelect = (event: any) => {
    if (event.value && typeof event.value === 'object') {
        aiConfig.model = event.value.id;
    } else if (typeof event.value === 'string') {
        aiConfig.model = event.value;
    }
};

const handleRefreshModels = async (showToast = true) => {
    const key = aiConfig.keys[aiConfig.provider];
    if (!key) {
        if (showToast) {
            toast.add({
                severity: 'info',
                summary: 'API Key Required',
                detail: `Add an API key for ${PROVIDER_LABELS[aiConfig.provider]} to fetch live models.`,
                life: 3000,
            });
        }
        return;
    }
    const result = await refreshAvailableModels(aiConfig.provider);
    if (showToast) {
        if (modelFetchError.value) {
            toast.add({
                severity: 'error',
                summary: 'Failed to fetch models',
                detail: modelFetchError.value,
                life: 4000,
            });
        } else {
            toast.add({
                severity: 'success',
                summary: 'Models Updated',
                detail: `Loaded ${result.length} models from ${PROVIDER_LABELS[aiConfig.provider]}.`,
                life: 3000,
            });
        }
    }
};

// On provider switch, auto-fetch models if key exists and adjust default model if current is not in list
watch(() => aiConfig.provider, async (p: AIProvider) => {
    if (aiConfig.keys[p]) {
        await handleRefreshModels(false);
    }
    const models = availableModels[p];
    if (!models.some((m) => m.id === aiConfig.model)) {
        aiConfig.model = models[0]?.id || '';
    }
});

const twitchClientId = inject<Ref<string>>('twitchClientId');
const twitchClientSecret = inject<Ref<string>>('twitchClientSecret');
const tempTwitchClientId = ref(twitchClientId?.value || '');
const tempTwitchClientSecret = ref(twitchClientSecret?.value || '');

const rawgApiKey = inject<Ref<string>>('rawgApiKey');
const tempRawgApiKey = ref(rawgApiKey?.value || '');

const isLoginVisible = ref(false);
const activeTab = ref(uiStore.settingsTab || 'appearance');
watch(() => uiStore.settingsTab, (tab) => {
    if (tab) activeTab.value = tab;
});
watch(activeTab, (tab) => {
    uiStore.settingsTab = tab;
});

// Password visibility toggles
const showAiKey = ref(false);
const showTwitchSecret = ref(false);
const showRawgKey = ref(false);

// Help section toggles
const showRawgHelp = ref(false);
const showIgdbHelp = ref(false);
const showAiHelp = ref(false);

const handleResetCache = () => {
    pcgwApi.resetCache();
    toast.add({
        severity: 'success',
        summary: 'Cache Reset',
        detail: 'PCGamingWiki metadata cache has been cleared.',
        life: 3000
    });
};

// --- Workspace Backup & Restore ---
const backupFileInput = ref<HTMLInputElement | null>(null);

const handleExportBackup = () => {
    workspaceStore.exportWorkspaceBackup();
    toast.add({
        severity: 'success',
        summary: 'Backup Exported',
        detail: 'Workspace backup file downloaded.',
        life: 3000
    });
};

const handleImportBackup = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    try {
        const res = await workspaceStore.importWorkspaceBackup(file);
        if (res.success) {
            toast.add({
                severity: 'success',
                summary: 'Backup Restored',
                detail: `Successfully restored ${res.importedCount} pages into workspace.`,
                life: 4000
            });
        } else {
            toast.add({
                severity: 'warn',
                summary: 'Import Incomplete',
                detail: res.message || 'No pages imported.',
                life: 4000
            });
        }
    } catch (err: any) {
        toast.add({
            severity: 'error',
            summary: 'Import Failed',
            detail: err.message || 'Could not parse backup file.',
            life: 4000
        });
    } finally {
        input.value = '';
    }
};

const handleClearWorkspaceData = () => {
    if (confirm('Are you sure you want to clear all local workspace pages? This cannot be undone unless you have an exported backup.')) {
        workspaceStore.clearAllWorkspaceData();
        toast.add({
            severity: 'info',
            summary: 'Workspace Cleared',
            detail: 'All local pages have been removed.',
            life: 3000
        });
    }
};

// --- Cloud Sync ---
const syncPassphrase = ref('');

const handleConnectSync = async () => {
    if (!syncPassphrase.value) return;
    try {
        await connectAndUnlock(syncPassphrase.value);
        syncPassphrase.value = '';
        toast.add({ severity: 'success', summary: 'Sync enabled', detail: 'Connected to Google Drive.', life: 3000 });
    } catch {
        toast.add({ severity: 'error', summary: 'Sync failed', detail: syncState.error || 'Could not enable sync.', life: 4000 });
    }
};

const handleDisconnectSync = async () => {
    await disconnectSync();
    toast.add({ severity: 'info', summary: 'Sync disabled', detail: 'Disconnected on this device.', life: 3000 });
};

const handleReconnectSync = async () => {
    try {
        await reconnectSync();
        toast.add({ severity: 'success', summary: 'Sync restored', detail: 'Connected to Google Drive.', life: 3000 });
    } catch {
        toast.add({ severity: 'error', summary: 'Reconnection failed', detail: syncState.error || 'Could not reconnect.', life: 4000 });
    }
};

const lastSyncedLabel = computed(() =>
    syncState.lastSyncedAt ? new Date(syncState.lastSyncedAt).toLocaleString() : 'never'
);

const handleLogout = async () => {
    await pcgwAuth.logout();
    toast.add({
        severity: 'info',
        summary: 'Logged Out',
        detail: 'Logged out from PCGamingWiki.',
        life: 3000
    });
};

watch(() => uiStore.isSettingsOpen, (val) => {
    if (val) {
        tempTwitchClientId.value = twitchClientId?.value || '';
        tempTwitchClientSecret.value = twitchClientSecret?.value || '';
        tempRawgApiKey.value = rawgApiKey?.value || '';
        if (aiConfig.keys[aiConfig.provider]) {
            handleRefreshModels(false);
        }
    }
});

const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'editor', label: 'Editor & Preview', icon: Code2 },
    { id: 'publishing', label: 'Publishing & Wiki', icon: UploadCloud },
    { id: 'workspace', label: 'Workspace & Data', icon: HardDrive },
    { id: 'integrations', label: 'Integrations & APIs', icon: Bot },
    { id: 'sync', label: 'Cloud Sync', icon: Cloud }
];

const tabSubtitles: Record<string, string> = {
    appearance: 'Customize the interface theme, typography, and UI spacing.',
    editor: 'Configure CodeMirror wikitext editor, live preview rendering, and split pane behavior.',
    publishing: 'Manage PCGamingWiki publishing defaults, edit summaries, and watchlist preferences.',
    workspace: 'Manage workspace defaults, section collapsing, backup export/restore, and local data storage.',
    integrations: 'Configure third-party API credentials to enable autofill and metadata assistance.',
    sync: 'Sync workspaces and settings across your devices via your own Google Drive.'
};

const themeOptions = [
    { label: 'System', value: 'system', icon: Monitor },
    { label: 'Light', value: 'light', icon: Sun },
    { label: 'Dark', value: 'dark', icon: Moon }
] as const;

const fontOptions = [
    { label: 'Google Sans (Default)', value: '"Google Sans"' },
    { label: 'Inter', value: 'Inter' },
    { label: 'Segoe UI Variable', value: '"Segoe UI Variable", "Segoe UI", sans-serif' },
    { label: 'Outfit', value: 'Outfit' },
    { label: 'Sora', value: 'Sora' },
    { label: 'Plus Jakarta Sans', value: '"Plus Jakarta Sans"' },
    { label: 'Lexend', value: 'Lexend' },
    { label: 'Manrope', value: 'Manrope' },
    { label: 'Pixelify Sans', value: '"Pixelify Sans"' }
];

const densityModes = ['normal', 'comfortable', 'compact'] as const;
const densityLabels = ['Normal', 'Comfortable', 'Compact'];
const densityValue = ref(densityModes.indexOf(uiStore.densityMode));

const updateDensity = (index: number) => {
    uiStore.densityMode = densityModes[index];
};

// Select Options for Editor & Preview
const editorFontFamilyOptions = [
    { label: 'Default Monospace (System)', value: 'default' },
    { label: 'JetBrains Mono', value: 'JetBrains Mono' },
    { label: 'Fira Code', value: 'Fira Code' },
    { label: 'Source Code Pro', value: 'Source Code Pro' },
    { label: 'Cascadia Code', value: 'Cascadia Code' },
    { label: 'Consolas', value: 'Consolas' }
];

const editorFontSizeOptions = [
    { label: '12 px (Compact)', value: 12 },
    { label: '13 px', value: 13 },
    { label: '14 px (Default)', value: 14 },
    { label: '15 px', value: 15 },
    { label: '16 px (Comfortable)', value: 16 },
    { label: '18 px (Large)', value: 18 }
];

const editorTabSizeOptions = [
    { label: '2 Spaces', value: 2 },
    { label: '4 Spaces (Default)', value: 4 }
];

const defaultEditorModeOptions = [
    { label: 'Remember Last Mode (Default)', value: 'remember' },
    { label: 'Visual Form Editor', value: 'Visual' },
    { label: 'Code Wikitext Editor', value: 'Code' }
];

const previewDebounceOptions = [
    { label: '150 ms (Fast - Realtime)', value: 150 },
    { label: '300 ms (Balanced - Default)', value: 300 },
    { label: '500 ms (Smooth)', value: 500 },
    { label: '1000 ms (Relaxed)', value: 1000 }
];

const previewSplitRatioOptions = [
    { label: '50 / 50 (Balanced Equal)', value: '50/50' },
    { label: '60 / 40 (Editor Focused)', value: '60/40' },
    { label: '40 / 60 (Preview Focused)', value: '40/60' },
    { label: '70 / 30 (Wide Editor)', value: '70/30' }
];

// Select Options for Publishing & Wiki
const defaultWatchlistOptions = [
    { label: 'Do not change watchlist (Default)', value: 'nochange' },
    { label: 'Add edited page to watchlist', value: 'watch' },
    { label: 'Remove edited page from watchlist', value: 'unwatch' },
    { label: 'Respect PCGW user preferences', value: 'preferences' }
];

// Select Options for Workspace
const defaultSectionStateOptions = [
    { label: 'Remember Previous State (Default)', value: 'remember' },
    { label: 'All Sections Expanded', value: 'expanded' },
    { label: 'All Sections Collapsed', value: 'collapsed' }
];

const saveSettings = () => {
    // AI config persists itself via aiConfig watchers; only the legacy temp-bound keys need committing here.
    if (twitchClientId && twitchClientSecret) {
        twitchClientId.value = tempTwitchClientId.value;
        twitchClientSecret.value = tempTwitchClientSecret.value;
        localStorage.setItem('twitch-client-id', tempTwitchClientId.value);
        localStorage.setItem('twitch-client-secret', tempTwitchClientSecret.value);
    }
    if (rawgApiKey) {
        rawgApiKey.value = tempRawgApiKey.value;
        localStorage.setItem('rawg-api-key', tempRawgApiKey.value);
    }
    uiStore.isSettingsOpen = false;
};
</script>

<template>
    <Dialog v-model:visible="uiStore.isSettingsOpen" modal :draggable="false" class="p-fluid glass settings-dialog"
        :style="{ width: 'min(1040px, calc(100vw - 2rem))', maxWidth: '95vw' }">
        <template #header>
            <div class="flex items-center gap-2">
                <Palette class="w-5 h-5 text-primary-500 animate-pulse-soft" />
                <span class="font-bold text-lg">App Settings</span>
            </div>
        </template>

        <div class="flex flex-col md:flex-row min-h-[600px]">
            <!-- Rail-style navigation (mirrors SectionNav) -->
            <nav class="flex flex-row md:flex-col shrink-0 w-full md:w-56 border-b md:border-b-0 md:border-r border-surface-200/70 dark:border-surface-800/70 overflow-x-auto md:overflow-x-visible custom-scrollbar">
                <div class="flex flex-row md:flex-col gap-1 px-2.5 py-3 md:py-4 md:pt-5">
                    <span class="hidden md:block px-2.5 mb-1 text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 select-none">
                        Settings
                    </span>
                    <button v-for="tab in tabs" :key="tab.id" type="button"
                        @click="activeTab = tab.id"
                        class="group relative flex items-center gap-2.5 rounded-lg pl-3 pr-2 py-1.5 text-left shrink-0 whitespace-nowrap transition-colors duration-150 cursor-pointer"
                        :class="activeTab === tab.id
                            ? 'bg-primary-500/10 text-primary-600 dark:text-primary-300'
                            : 'text-surface-600 dark:text-surface-300 hover:bg-surface-200/60 dark:hover:bg-surface-800/50'"
                    >
                        <span class="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-primary-500 transition-opacity duration-150"
                            :class="activeTab === tab.id ? 'opacity-100' : 'opacity-0'" />
                        <component :is="tab.icon" class="w-4 h-4 shrink-0"
                            :class="activeTab === tab.id ? 'text-primary-500' : 'text-surface-400 dark:text-surface-500 group-hover:text-surface-600 dark:group-hover:text-surface-300'" />
                        <span class="text-[13px] font-medium">{{ tab.label }}</span>
                    </button>
                </div>
            </nav>

            <!-- Content Area -->
            <div class="flex-1 p-5 md:p-6 overflow-y-auto max-h-[60vh] md:max-h-[70vh] relative bg-surface-0 dark:bg-surface-950/20">
                <!-- Tab Header Info -->
                <div class="mb-5">
                    <h2 class="text-lg font-bold text-surface-900 dark:text-surface-0 leading-tight">
                        {{ tabs.find(t => t.id === activeTab)?.label }}
                    </h2>
                    <p class="text-xs text-surface-500 mt-1 leading-relaxed">
                        {{ tabSubtitles[activeTab] }}
                    </p>
                </div>

                <!-- 1. Appearance Tab -->
                <div v-show="activeTab === 'appearance'" class="flex flex-col gap-6 animate-fade-in">
                    <!-- Theme Selector -->
                    <div class="flex flex-col gap-3">
                        <span id="group-theme" class="text-sm font-semibold text-surface-700 dark:text-surface-200">Theme Preference</span>
                        <div class="grid grid-cols-3 gap-3" role="radiogroup" aria-labelledby="group-theme">
                            <button v-for="opt in themeOptions" :key="opt.value" role="radio"
                                :aria-label="opt.label"
                                :aria-checked="uiStore.theme === opt.value"
                                @click="uiStore.theme = opt.value"
                                class="flex flex-col items-center gap-2.5 p-3 rounded-xl border transition-all duration-250 text-left relative overflow-hidden cursor-pointer"
                                :class="uiStore.theme === opt.value
                                    ? 'border-primary-500 bg-primary-500/5 dark:bg-primary-500/10 ring-1 ring-primary-500'
                                    : 'border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50 hover:bg-surface-100 dark:hover:bg-surface-800/80 hover:border-surface-300 dark:hover:border-surface-700'"
                            >
                                <div class="w-full h-14 rounded-lg relative overflow-hidden border border-surface-200/60 dark:border-surface-800/60 shadow-2xs"
                                    :class="opt.value === 'light' ? 'bg-white' : opt.value === 'dark' ? 'bg-surface-900' : 'bg-linear-to-br from-white via-surface-100 to-surface-900'"
                                >
                                    <div class="absolute inset-x-2 top-2 h-2 rounded bg-surface-200 dark:bg-surface-750"></div>
                                    <div class="absolute left-2 top-6 w-8 h-1.5 rounded bg-primary-400"></div>
                                    <div class="absolute right-2 top-6 w-4 h-1.5 rounded bg-surface-300 dark:bg-surface-700"></div>
                                    <div class="absolute inset-x-2 top-9 h-3 rounded bg-surface-100 dark:bg-surface-800"></div>
                                </div>
                                
                                <span class="text-xs font-semibold flex items-center gap-1.5">
                                    <component :is="opt.icon" class="w-3.5 h-3.5" :class="uiStore.theme === opt.value ? 'text-primary-500' : 'text-surface-500'" />
                                    {{ opt.label }}
                                </span>

                                <div v-if="uiStore.theme === opt.value" class="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center text-white scale-90 md:scale-100">
                                    <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </button>
                        </div>
                    </div>

                    <!-- Font Family Selector -->
                    <div class="flex flex-col gap-2.5">
                        <label for="setting-font-family" class="text-sm font-semibold text-surface-700 dark:text-surface-200 flex items-center gap-2">
                            <Type class="w-4 h-4 text-primary-500" /> Font Family
                        </label>
                        <Select v-model="uiStore.fontFamily" :options="fontOptions" inputId="setting-font-family" aria-label="Font family" optionLabel="label" optionValue="value"
                            class="w-full" :style="{ fontFamily: uiStore.fontFamily }">
                            <template #value="slotProps">
                                <span :style="{ fontFamily: slotProps.value }">
                                    {{fontOptions.find(o => o.value === slotProps.value)?.label || 'Select Font'}}
                                </span>
                            </template>
                            <template #option="slotProps">
                                <span :style="{ fontFamily: slotProps.option.value }">{{ slotProps.option.label }}</span>
                            </template>
                        </Select>

                        <div class="flex flex-col gap-1.5 mt-1">
                            <span id="group-font-preview" class="text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500">Preview text</span>
                            <div class="p-3.5 rounded-xl border border-surface-200/80 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50 text-sm font-medium select-none"
                                :style="{ fontFamily: uiStore.fontFamily }">
                                The quick brown fox jumps over the lazy dog. 1234567890
                            </div>
                        </div>
                    </div>

                    <!-- UI Density Cards -->
                    <div class="flex flex-col gap-3">
                        <span id="group-density" class="text-sm font-semibold text-surface-700 dark:text-surface-200 flex items-center gap-2">
                            <Layout class="w-4 h-4 text-primary-500" /> Layout Spacing (UI Density)
                        </span>
                        <div class="grid grid-cols-3 gap-3" role="radiogroup" aria-labelledby="group-density">
                            <button v-for="(mode, index) in densityModes" :key="mode" role="radio"
                                :aria-checked="uiStore.densityMode === mode"
                                @click="updateDensity(index); densityValue = index"
                                class="flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer density-btn"
                                :class="densityValue === index
                                    ? 'border-primary-500 bg-primary-500/5 dark:bg-primary-500/10 ring-1 ring-primary-500'
                                    : 'border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50 hover:bg-surface-100 dark:hover:bg-surface-800/80'"
                            >
                                <component :is="index === 0 ? AlignJustify : index === 1 ? AlignLeft : Menu" 
                                    class="w-4 h-4" :class="densityValue === index ? 'text-primary-500' : 'text-surface-400'" />
                                <div class="text-xs font-bold">{{ densityLabels[index] }}</div>
                            </button>
                        </div>
                    </div>

                    <!-- Synchronize Scrolling -->
                    <div class="flex flex-col gap-3 pt-5 border-t border-surface-200/60 dark:border-surface-800/60">
                        <span id="group-scroll" class="text-sm font-semibold text-surface-700 dark:text-surface-200 flex items-center gap-2">
                            <Link2 class="w-4 h-4 text-primary-500" /> Scrolling Synchronization
                        </span>
                        <div class="flex items-center justify-between gap-3 p-4 bg-surface-50 dark:bg-surface-900/40 border border-surface-200/60 dark:border-surface-800/60 rounded-xl">
                            <div class="flex flex-col gap-0.5">
                                <span class="text-xs font-bold text-surface-800 dark:text-surface-200">Synchronize Scrolling</span>
                                <span class="text-[11px] text-surface-500 leading-normal">Keep the editor and preview scrolling positions synchronized.</span>
                            </div>
                            <ToggleSwitch v-model="uiStore.syncScroll" aria-label="Synchronize Scrolling" />
                        </div>
                    </div>

                    <!-- AI Features Visibility -->
                    <div class="flex flex-col gap-3 pt-5 border-t border-surface-200/60 dark:border-surface-800/60">
                        <span id="group-ai-features" class="text-sm font-semibold text-surface-700 dark:text-surface-200 flex items-center gap-2">
                            <Bot class="w-4 h-4 text-primary-500" /> AI Features
                        </span>
                        <div class="flex items-center justify-between gap-3 p-4 bg-surface-50 dark:bg-surface-900/40 border border-surface-200/60 dark:border-surface-800/60 rounded-xl">
                            <div class="flex flex-col gap-0.5">
                                <span class="text-xs font-bold text-surface-800 dark:text-surface-200">Hide AI Features</span>
                                <span class="text-[11px] text-surface-500 leading-normal">Hide all AI-assisted tools, summary generation, and screenshot analysis across the editor.</span>
                            </div>
                            <ToggleSwitch v-model="uiStore.hideAiFeatures" aria-label="Hide AI Features" />
                        </div>
                    </div>

                    <!-- Guided Tour -->
                    <div class="flex flex-col gap-3 pt-5 border-t border-surface-200/60 dark:border-surface-800/60">
                        <span id="group-tour" class="text-sm font-semibold text-surface-700 dark:text-surface-200 flex items-center gap-2">
                            <Info class="w-4 h-4 text-primary-500" /> Guided Tour
                        </span>
                        <div class="flex items-center justify-between gap-3 p-4 bg-surface-50 dark:bg-surface-900/40 border border-surface-200/60 dark:border-surface-800/60 rounded-xl">
                            <div class="flex flex-col gap-0.5">
                                <span class="text-xs font-bold text-surface-800 dark:text-surface-200">Interactive Tour</span>
                                <span class="text-[11px] text-surface-500 leading-normal">Start the guided walkthrough to learn the editor features.</span>
                            </div>
                            <Button label="Start Tour" severity="primary" size="small" @click="uiStore.startTour()" class="cursor-pointer shrink-0">
                                <template #icon>
                                    <RefreshCw class="w-3.5 h-3.5 mr-1.5" />
                                </template>
                            </Button>
                        </div>
                    </div>
                </div>

                <!-- 2. Editor & Preview Tab -->
                <div v-show="activeTab === 'editor'" class="flex flex-col gap-6 animate-fade-in">
                    <!-- Code Editor Settings Group -->
                    <div class="flex flex-col gap-4">
                        <span class="text-sm font-semibold text-surface-700 dark:text-surface-200 flex items-center gap-2">
                            <Code2 class="w-4 h-4 text-primary-500" /> Code Editor (CodeMirror)
                        </span>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Font Family -->
                            <div class="flex flex-col gap-1.5">
                                <label for="setting-editor-font-family" class="text-xs font-semibold text-surface-600 dark:text-surface-300">Editor Font Family</label>
                                <Select v-model="uiStore.editorFontFamily" :options="editorFontFamilyOptions" optionLabel="label" optionValue="value" inputId="setting-editor-font-family" class="w-full">
                                    <template #option="slotProps">
                                        <span :style="{ fontFamily: slotProps.option.value === 'default' ? 'monospace' : `'${slotProps.option.value}', monospace` }">{{ slotProps.option.label }}</span>
                                    </template>
                                </Select>
                            </div>

                            <!-- Font Size -->
                            <div class="flex flex-col gap-1.5">
                                <label for="setting-editor-font-size" class="text-xs font-semibold text-surface-600 dark:text-surface-300">Editor Font Size</label>
                                <Select v-model="uiStore.editorFontSize" :options="editorFontSizeOptions" optionLabel="label" optionValue="value" inputId="setting-editor-font-size" class="w-full" />
                            </div>

                            <!-- Tab Size -->
                            <div class="flex flex-col gap-1.5">
                                <label for="setting-editor-tab-size" class="text-xs font-semibold text-surface-600 dark:text-surface-300">Indentation / Tab Size</label>
                                <Select v-model="uiStore.editorTabSize" :options="editorTabSizeOptions" optionLabel="label" optionValue="value" inputId="setting-editor-tab-size" class="w-full" />
                            </div>

                            <!-- Default Mode -->
                            <div class="flex flex-col gap-1.5">
                                <label for="setting-default-mode" class="text-xs font-semibold text-surface-600 dark:text-surface-300">Default Editor Mode on Load</label>
                                <Select v-model="uiStore.defaultEditorMode" :options="defaultEditorModeOptions" optionLabel="label" optionValue="value" inputId="setting-default-mode" class="w-full" />
                            </div>
                        </div>

                        <!-- Editor Toggles -->
                        <div class="flex flex-col divide-y divide-surface-200/70 dark:divide-surface-800/70 bg-surface-50 dark:bg-surface-900/40 border border-surface-200/60 dark:border-surface-800/60 rounded-xl px-4">
                            <!-- Line Wrapping -->
                            <div class="flex items-center justify-between py-3.5">
                                <div class="flex flex-col gap-0.5">
                                    <span class="text-xs font-bold text-surface-800 dark:text-surface-200">Line Wrapping (Soft Wrap)</span>
                                    <span class="text-[11px] text-surface-500 leading-normal">Wrap long wikitext lines automatically to avoid horizontal scrolling.</span>
                                </div>
                                <ToggleSwitch v-model="uiStore.editorLineWrapping" aria-label="Line Wrapping" />
                            </div>

                            <!-- Line Numbers -->
                            <div class="flex items-center justify-between py-3.5">
                                <div class="flex flex-col gap-0.5">
                                    <span class="text-xs font-bold text-surface-800 dark:text-surface-200">Show Line Numbers</span>
                                    <span class="text-[11px] text-surface-500 leading-normal">Display gutter line numbers along the left edge of the code editor.</span>
                                </div>
                                <ToggleSwitch v-model="uiStore.editorLineNumbers" aria-label="Show Line Numbers" />
                            </div>
                        </div>
                    </div>

                    <!-- Live Preview Settings Group -->
                    <div class="flex flex-col gap-4 pt-5 border-t border-surface-200/60 dark:border-surface-800/60">
                        <span class="text-sm font-semibold text-surface-700 dark:text-surface-200 flex items-center gap-2">
                            <Monitor class="w-4 h-4 text-primary-500" /> Live Preview & Layout
                        </span>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Preview Debounce -->
                            <div class="flex flex-col gap-1.5">
                                <label for="setting-preview-debounce" class="text-xs font-semibold text-surface-600 dark:text-surface-300">Rendering Debounce Rate</label>
                                <Select v-model="uiStore.previewDebounce" :options="previewDebounceOptions" optionLabel="label" optionValue="value" inputId="setting-preview-debounce" class="w-full" />
                                <span class="text-[11px] text-surface-400">Delay before re-rendering wikitext preview upon typing.</span>
                            </div>

                            <!-- Split Ratio -->
                            <div class="flex flex-col gap-1.5">
                                <label for="setting-split-ratio" class="text-xs font-semibold text-surface-600 dark:text-surface-300">Default Split Screen Ratio</label>
                                <Select v-model="uiStore.previewSplitRatio" :options="previewSplitRatioOptions" optionLabel="label" optionValue="value" inputId="setting-split-ratio" class="w-full" />
                                <span class="text-[11px] text-surface-400">Initial proportion between editor and live preview panels.</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 3. Publishing & Wiki Tab -->
                <div v-show="activeTab === 'publishing'" class="flex flex-col gap-5 animate-fade-in">
                    <!-- PCGamingWiki Authentication Status -->
                    <div class="flex flex-col gap-3">
                        <span id="group-pcgw-account" class="text-sm font-semibold text-surface-700 dark:text-surface-200 flex items-center gap-2">
                            <Globe class="w-4 h-4 text-primary-500" /> PCGamingWiki Account
                        </span>
                        
                        <!-- Logged In state card -->
                        <div v-if="pcgwAuth.isLoggedIn" class="flex items-center justify-between p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-500 relative">
                                    <Globe class="w-5 h-5" />
                                    <div class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-surface-950 rounded-full animate-pulse"></div>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Connected Account</span>
                                    <span class="font-bold text-surface-800 dark:text-surface-100 text-sm leading-tight">{{ pcgwAuth.username }}</span>
                                </div>
                            </div>
                            <Button aria-label="Logout" severity="danger" text size="small" @click="handleLogout" v-tooltip.bottom="'Logout'"
                                class="p-2 rounded-lg hover:bg-red-500/10 text-red-500 border-none cursor-pointer">
                                <LogOut class="w-4 h-4" />
                            </Button>
                        </div>

                        <!-- Logged Out state card -->
                        <div v-else class="flex flex-col items-center gap-3 p-6 bg-surface-50 dark:bg-surface-900/40 border border-dashed border-surface-300 dark:border-surface-800 rounded-xl text-center">
                            <div class="w-11 h-11 rounded-full bg-surface-100 dark:bg-surface-850 flex items-center justify-center text-surface-400">
                                <Globe class="w-5 h-5" />
                            </div>
                            <div class="flex flex-col gap-1 max-w-xs">
                                <span class="font-bold text-sm text-surface-800 dark:text-surface-200">Not connected to PCGamingWiki</span>
                                <span class="text-xs text-surface-500 leading-relaxed">Connect to submit wiki page revisions directly, upload screenshots and set auto-descriptions.</span>
                            </div>
                            <Button label="Connect Account" severity="primary" size="small" class="mt-1 shadow-soft shadow-primary-500/10 cursor-pointer" @click="isLoginVisible = true">
                                <template #icon>
                                    <LogIn class="w-4 h-4 mr-2" />
                                </template>
                            </Button>
                        </div>
                    </div>

                    <!-- Publishing Defaults -->
                    <div class="flex flex-col gap-4 pt-4 border-t border-surface-200/60 dark:border-surface-800/60">
                        <span class="text-sm font-semibold text-surface-700 dark:text-surface-200 flex items-center gap-2">
                            <UploadCloud class="w-4 h-4 text-primary-500" /> Revision Defaults
                        </span>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Default Summary -->
                            <div class="flex flex-col gap-1.5 md:col-span-2">
                                <label for="setting-default-summary" class="text-xs font-semibold text-surface-600 dark:text-surface-300">Default Edit Summary</label>
                                <InputText v-model="uiStore.defaultEditSummary" id="setting-default-summary" placeholder="e.g. Updated via PCGW Editor" class="w-full" />
                                <span class="text-[11px] text-surface-400">Initial edit summary prefilled when opening the publish dialog.</span>
                            </div>

                            <!-- Watchlist Action -->
                            <div class="flex flex-col gap-1.5 md:col-span-2">
                                <label for="setting-default-watchlist" class="text-xs font-semibold text-surface-600 dark:text-surface-300">Watchlist Preference</label>
                                <Select v-model="uiStore.defaultWatchlist" :options="defaultWatchlistOptions" optionLabel="label" optionValue="value" inputId="setting-default-watchlist" class="w-full" />
                                <span class="text-[11px] text-surface-400">Action performed on your PCGamingWiki watchlist when publishing changes.</span>
                            </div>
                        </div>

                        <!-- Publishing Toggles -->
                        <div class="flex flex-col divide-y divide-surface-200/70 dark:divide-surface-800/70 bg-surface-50 dark:bg-surface-900/40 border border-surface-200/60 dark:border-surface-800/60 rounded-xl px-4">
                            <!-- Minor Edit Toggle -->
                            <div class="flex items-center justify-between py-3.5">
                                <div class="flex flex-col gap-0.5">
                                    <span class="text-xs font-bold text-surface-800 dark:text-surface-200">Mark as Minor Edit by Default</span>
                                    <span class="text-[11px] text-surface-500 leading-normal">Automatically check the "This is a minor edit" flag during publishing.</span>
                                </div>
                                <ToggleSwitch v-model="uiStore.defaultMinorEdit" aria-label="Mark as Minor Edit" />
                            </div>

                            <!-- Auto-relogin Switch -->
                            <div class="flex items-center justify-between py-3.5">
                                <div class="flex flex-col gap-0.5">
                                    <span class="text-xs font-bold text-surface-800 dark:text-surface-200">Automatic Session Refresh</span>
                                    <span class="text-[11px] text-surface-500 leading-normal">Automatically renews PCGW API credentials when session expires using local tokens.</span>
                                </div>
                                <ToggleSwitch v-model="uiStore.autoReLogin" aria-label="Auto Re-login" />
                            </div>

                            <!-- Auto-description Switch -->
                            <div class="flex items-center justify-between py-3.5">
                                <div class="flex flex-col gap-0.5">
                                    <span class="text-xs font-bold text-surface-800 dark:text-surface-200">Show Upload Attribution</span>
                                    <span class="text-[11px] text-surface-500 leading-normal">Adds a descriptive tag linking back to this client app when uploading media files.</span>
                                </div>
                                <ToggleSwitch v-model="uiStore.autoUploadDescription" aria-label="Show Upload Attribution" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 4. Workspace & Data Tab -->
                <div v-show="activeTab === 'workspace'" class="flex flex-col gap-5 animate-fade-in">
                    <!-- Visual Form Defaults -->
                    <div class="flex flex-col gap-4">
                        <span class="text-sm font-semibold text-surface-700 dark:text-surface-200 flex items-center gap-2">
                            <Sliders class="w-4 h-4 text-primary-500" /> Visual Form Behavior
                        </span>

                        <div class="flex flex-col gap-1.5">
                            <label for="setting-section-state" class="text-xs font-semibold text-surface-600 dark:text-surface-300">Initial Section Expansion State</label>
                            <Select v-model="uiStore.defaultSectionState" :options="defaultSectionStateOptions" optionLabel="label" optionValue="value" inputId="setting-section-state" class="w-full" />
                            <span class="text-[11px] text-surface-400">Controls whether form sections start fully expanded or collapsed by default.</span>
                        </div>

                        <!-- Confirm Deletions Toggle -->
                        <div class="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-900/40 border border-surface-200/60 dark:border-surface-800/60 rounded-xl">
                            <div class="flex flex-col gap-0.5">
                                <span class="text-xs font-bold text-surface-800 dark:text-surface-200">Confirm Before Deletion</span>
                                <span class="text-[11px] text-surface-500 leading-normal">Show confirmation dialogs when deleting workspace pages, custom sections, or table rows.</span>
                            </div>
                            <ToggleSwitch v-model="uiStore.confirmDeletions" aria-label="Confirm Before Deletion" />
                        </div>
                    </div>

                    <!-- Local Backup & Restore -->
                    <div class="flex flex-col gap-3 pt-5 border-t border-surface-200/60 dark:border-surface-800/60">
                        <span class="text-sm font-semibold text-surface-700 dark:text-surface-200 flex items-center gap-2">
                            <HardDrive class="w-4 h-4 text-primary-500" /> Local Workspace Backup
                        </span>

                        <div class="flex items-center justify-between gap-3 p-4 bg-surface-50 dark:bg-surface-900/40 border border-surface-200/60 dark:border-surface-800/60 rounded-xl">
                            <div class="flex flex-col gap-0.5">
                                <span class="text-xs font-bold text-surface-800 dark:text-surface-200">Export Complete Backup</span>
                                <span class="text-[11px] text-surface-500 leading-normal">Download all workspace pages and configuration snapshots as a single JSON file.</span>
                            </div>
                            <Button label="Export Backup" severity="secondary" variant="outlined" size="small" @click="handleExportBackup" class="cursor-pointer shrink-0">
                                <template #icon>
                                    <Download class="w-3.5 h-3.5 mr-1.5" />
                                </template>
                            </Button>
                        </div>

                        <div class="flex items-center justify-between gap-3 p-4 bg-surface-50 dark:bg-surface-900/40 border border-surface-200/60 dark:border-surface-800/60 rounded-xl">
                            <div class="flex flex-col gap-0.5">
                                <span class="text-xs font-bold text-surface-800 dark:text-surface-200">Restore Workspace Backup</span>
                                <span class="text-[11px] text-surface-500 leading-normal">Import and restore pages from an exported workspace backup file.</span>
                            </div>
                            <input ref="backupFileInput" type="file" accept=".json" class="hidden" @change="handleImportBackup" />
                            <Button label="Restore Backup" severity="primary" size="small" @click="backupFileInput?.click()" class="cursor-pointer shrink-0">
                                <template #icon>
                                    <Upload class="w-3.5 h-3.5 mr-1.5" />
                                </template>
                            </Button>
                        </div>
                    </div>

                    <!-- Cache & Data Management -->
                    <div class="flex flex-col gap-3 pt-5 border-t border-surface-200/60 dark:border-surface-800/60">
                        <span class="text-sm font-semibold text-surface-700 dark:text-surface-200 flex items-center gap-2">
                            <RotateCcw class="w-4 h-4 text-primary-500" /> Cache & Storage Management
                        </span>

                        <div class="flex items-center justify-between gap-3 p-4 bg-surface-50 dark:bg-surface-900/40 border border-surface-200/60 dark:border-surface-800/60 rounded-xl">
                            <div class="flex flex-col gap-0.5">
                                <span class="text-xs font-bold text-surface-800 dark:text-surface-200">PCGW Metadata Cache</span>
                                <span class="text-[11px] text-surface-500 leading-normal">Clear cached Cargo tables, schemas, and template suggestions.</span>
                            </div>
                            <Button label="Reset Cache" severity="secondary" variant="outlined" size="small" @click="handleResetCache" class="cursor-pointer shrink-0">
                                <template #icon>
                                    <RotateCcw class="w-3.5 h-3.5 mr-1.5" />
                                </template>
                            </Button>
                        </div>

                        <div class="flex items-center justify-between gap-3 p-4 bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 rounded-xl">
                            <div class="flex flex-col gap-0.5">
                                <span class="text-xs font-bold text-red-600 dark:text-red-400">Clear All Workspace Pages</span>
                                <span class="text-[11px] text-surface-500 leading-normal">Wipe all local pages stored in your browser's workspace storage.</span>
                            </div>
                            <Button label="Clear Workspace" severity="danger" variant="outlined" size="small" @click="handleClearWorkspaceData" class="cursor-pointer shrink-0">
                                <template #icon>
                                    <Trash2 class="w-3.5 h-3.5 mr-1.5" />
                                </template>
                            </Button>
                        </div>
                    </div>
                </div>

                <!-- 5. Integrations Tab -->
                <div v-show="activeTab === 'integrations'" class="flex flex-col divide-y divide-surface-200/70 dark:divide-surface-800/70 animate-fade-in">
                    <!-- AI Assistant -->
                    <div class="flex flex-col gap-3 pb-5">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2.5">
                                <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-500/10 text-primary-500 shrink-0"><Bot class="w-4 h-4" /></span>
                                <span class="font-semibold text-sm text-surface-900 dark:text-surface-100">AI Assistant</span>
                            </div>
                            <button type="button" @click="showAiHelp = !showAiHelp" class="flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-600 font-semibold cursor-pointer select-none">
                                <Info class="w-3.5 h-3.5" />
                                <span>{{ showAiHelp ? 'Hide Setup' : 'How to get a key?' }}</span>
                            </button>
                        </div>
                        <Transition
                            enter-active-class="transition duration-200 ease-out"
                            enter-from-class="opacity-0 -translate-y-2"
                            enter-to-class="opacity-100 translate-y-0"
                            leave-active-class="transition duration-150 ease-in"
                            leave-from-class="opacity-100 translate-y-0"
                            leave-to-class="opacity-0 -translate-y-2"
                        >
                            <div v-show="showAiHelp" class="p-3.5 bg-surface-100/50 dark:bg-surface-800/40 rounded-xl text-xs text-surface-600 dark:text-surface-300 flex flex-col gap-2 md:pl-9 border border-surface-200/50 dark:border-surface-800/50 leading-relaxed">
                                <span class="font-bold text-surface-800 dark:text-surface-200">How to get an API Key:</span>
                                <ol class="list-decimal list-inside flex flex-col gap-1.5 pl-1">
                                    <li><b>Google Gemini:</b> Access <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-primary-500 hover:underline font-medium">aistudio.google.com</a> and click "Create API key". Free tier available!</li>
                                    <li><b>OpenAI:</b> Visit <a href="https://platform.openai.com/api-keys" target="_blank" class="text-primary-500 hover:underline font-medium">platform.openai.com</a>, create an account, and generate a new secret key under API Keys.</li>
                                    <li><b>Anthropic (Claude):</b> Go to <a href="https://console.anthropic.com/settings/keys" target="_blank" class="text-primary-500 hover:underline font-medium">console.anthropic.com</a>, navigate to API Keys, and click Create Key.</li>
                                </ol>
                            </div>
                        </Transition>
                        <div class="md:pl-9 flex flex-col gap-3">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div class="flex flex-col gap-1.5">
                                    <label for="setting-ai-provider" class="text-xs font-semibold text-surface-600 dark:text-surface-300">Provider</label>
                                    <Select v-model="aiConfig.provider" :options="providerOptions" optionLabel="label" optionValue="value" inputId="setting-ai-provider" class="w-full">
                                        <template #value="slotProps">
                                            <div v-if="slotProps.value" class="flex items-center gap-2">
                                                <component :is="PROVIDER_LOGOS[slotProps.value as AIProvider]" class="w-4 h-4 text-primary-500 shrink-0" />
                                                <span>{{ PROVIDER_LABELS[slotProps.value as AIProvider] }}</span>
                                            </div>
                                        </template>
                                        <template #option="slotProps">
                                            <div class="flex items-center gap-2">
                                                <component :is="PROVIDER_LOGOS[slotProps.option.value as AIProvider]" class="w-4 h-4 text-primary-500 shrink-0" />
                                                <span>{{ slotProps.option.label }}</span>
                                            </div>
                                        </template>
                                    </Select>
                                </div>
                                <div class="flex flex-col gap-1.5">
                                    <div class="flex items-center justify-between">
                                        <label for="setting-ai-model" class="text-xs font-semibold text-surface-600 dark:text-surface-300">Model</label>
                                        <button type="button" @click="handleRefreshModels(true)" :disabled="isFetchingModels" class="text-[11px] text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1 cursor-pointer">
                                            <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': isFetchingModels }" />
                                            <span>Fetch Models</span>
                                        </button>
                                    </div>
                                    <AutoComplete v-model="aiConfig.model" :suggestions="modelSuggestions" optionLabel="label" inputId="setting-ai-model" placeholder="Select or type model..." class="w-full" dropdown @complete="searchModel" @item-select="onModelSelect">
                                        <template #option="slotProps">
                                            <div class="flex flex-col py-0.5">
                                                <span class="text-xs font-semibold">{{ slotProps.option.label }}</span>
                                                <span class="text-[10px] text-surface-400 font-mono">{{ slotProps.option.id }}</span>
                                            </div>
                                        </template>
                                    </AutoComplete>
                                </div>
                            </div>

                            <div class="flex flex-col gap-1.5">
                                <div class="flex items-center justify-between">
                                    <label for="setting-ai-key" class="text-xs font-semibold text-surface-600 dark:text-surface-300">API Key</label>
                                    <a v-if="keyLink" :href="keyLink" target="_blank" class="text-[11px] text-primary-500 hover:underline">Get Key &rarr;</a>
                                </div>
                                <div class="flex relative items-center">
                                    <InputText v-model="aiConfig.keys[aiConfig.provider]" id="setting-ai-key" :type="showAiKey ? 'text' : 'password'" placeholder="Enter API key" class="w-full pr-10 ai-api-key-input" />
                                    <button type="button" @click="showAiKey = !showAiKey" class="absolute right-3 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 cursor-pointer">
                                        <component :is="showAiKey ? EyeOff : Eye" class="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- RAWG API -->
                    <div class="flex flex-col gap-3 py-5">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2.5">
                                <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-500/10 text-primary-500 shrink-0"><Key class="w-4 h-4" /></span>
                                <span class="font-semibold text-sm text-surface-900 dark:text-surface-100">RAWG Video Games Database API</span>
                            </div>
                            <button type="button" @click="showRawgHelp = !showRawgHelp" class="flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-600 font-semibold cursor-pointer select-none">
                                <Info class="w-3.5 h-3.5" />
                                <span>{{ showRawgHelp ? 'Hide Setup' : 'How to get a key?' }}</span>
                            </button>
                        </div>
                        <Transition
                            enter-active-class="transition duration-200 ease-out"
                            enter-from-class="opacity-0 -translate-y-2"
                            enter-to-class="opacity-100 translate-y-0"
                            leave-active-class="transition duration-150 ease-in"
                            leave-from-class="opacity-100 translate-y-0"
                            leave-to-class="opacity-0 -translate-y-2"
                        >
                            <div v-show="showRawgHelp" class="p-3.5 bg-surface-100/50 dark:bg-surface-800/40 rounded-xl text-xs text-surface-600 dark:text-surface-300 flex flex-col gap-2 md:pl-9 border border-surface-200/50 dark:border-surface-800/50 leading-relaxed">
                                <span class="font-bold text-surface-800 dark:text-surface-200">How to get a RAWG API Key:</span>
                                <ol class="list-decimal list-inside flex flex-col gap-1.5 pl-1">
                                    <li>Sign up for a free account at <a href="https://rawg.io/apidocs" target="_blank" class="text-primary-500 hover:underline font-medium">rawg.io/apidocs</a>.</li>
                                    <li>Navigate to your profile settings or API section.</li>
                                    <li>Click <b>Get an API key</b> and fill in the brief project details.</li>
                                    <li>Copy your generated key and paste it below.</li>
                                </ol>
                            </div>
                        </Transition>
                        <div class="md:pl-9 flex flex-col gap-1.5">
                            <div class="flex items-center justify-between">
                                <label for="setting-rawg-key" class="text-xs font-semibold text-surface-600 dark:text-surface-300">RAWG API Key</label>
                                <a href="https://rawg.io/apidocs" target="_blank" class="text-[11px] text-primary-500 hover:underline">Get RAWG Key &rarr;</a>
                            </div>
                            <div class="flex relative items-center">
                                <InputText v-model="tempRawgApiKey" id="setting-rawg-key" :type="showRawgKey ? 'text' : 'password'" placeholder="Enter RAWG API Key" class="w-full pr-10" />
                                <button type="button" @click="showRawgKey = !showRawgKey" class="absolute right-3 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 cursor-pointer">
                                    <component :is="showRawgKey ? EyeOff : Eye" class="w-4 h-4" />
                                </button>
                            </div>
                            <span class="text-[11px] text-surface-500 leading-normal">Used to fetch game release dates, developers, publishers, genres, tags and official websites automatically.</span>
                        </div>
                    </div>

                    <!-- Twitch IGDB -->
                    <div class="flex flex-col gap-3 pt-5">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2.5">
                                <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-500/10 text-primary-500 shrink-0"><Key class="w-4 h-4" /></span>
                                <span class="font-semibold text-sm text-surface-900 dark:text-surface-100">Twitch IGDB Integration</span>
                            </div>
                            <button type="button" @click="showIgdbHelp = !showIgdbHelp" class="flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-600 font-semibold cursor-pointer select-none">
                                <Info class="w-3.5 h-3.5" />
                                <span>{{ showIgdbHelp ? 'Hide Setup' : 'How to get credentials?' }}</span>
                            </button>
                        </div>
                        <Transition
                            enter-active-class="transition duration-200 ease-out"
                            enter-from-class="opacity-0 -translate-y-2"
                            enter-to-class="opacity-100 translate-y-0"
                            leave-active-class="transition duration-150 ease-in"
                            leave-from-class="opacity-100 translate-y-0"
                            leave-to-class="opacity-0 -translate-y-2"
                        >
                            <div v-show="showIgdbHelp" class="p-3.5 bg-surface-100/50 dark:bg-surface-800/40 rounded-xl text-xs text-surface-600 dark:text-surface-300 flex flex-col gap-2 md:pl-9 border border-surface-200/50 dark:border-surface-800/50 leading-relaxed">
                                <span class="font-bold text-surface-800 dark:text-surface-200">How to get Twitch IGDB Credentials:</span>
                                <ol class="list-decimal list-inside flex flex-col gap-1.5 pl-1">
                                    <li>Log in to the <a href="https://dev.twitch.tv/console" target="_blank" class="text-primary-500 hover:underline font-medium">Twitch Developer Console</a> (requires 2FA).</li>
                                    <li>Click <b>Register Your Application</b>.</li>
                                    <li>Choose a unique name, set OAuth Redirect URL to <code class="bg-surface-200 dark:bg-surface-800 px-1.5 py-0.5 rounded font-mono text-[10px]">http://localhost</code>, and set category to <i>Application Integration</i>.</li>
                                    <li>Click <b>Create</b>, then click <b>Manage</b> on your new app.</li>
                                    <li>Copy the <b>Client ID</b> and generate a <b>Client Secret</b> (copy it immediately!).</li>
                                </ol>
                            </div>
                        </Transition>
                        <div class="md:pl-9 flex flex-col gap-3">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div class="flex flex-col gap-1.5">
                                    <label for="setting-twitch-id" class="text-xs font-semibold text-surface-600 dark:text-surface-300">Client ID</label>
                                    <InputText v-model="tempTwitchClientId" id="setting-twitch-id" placeholder="Twitch Client ID" class="w-full" />
                                </div>
                                <div class="flex flex-col gap-1.5">
                                    <label for="setting-twitch-secret" class="text-xs font-semibold text-surface-600 dark:text-surface-300">Client Secret</label>
                                    <div class="flex relative items-center">
                                        <InputText v-model="tempTwitchClientSecret" id="setting-twitch-secret" :type="showTwitchSecret ? 'text' : 'password'" placeholder="Twitch Secret" class="w-full pr-10" />
                                        <button type="button" @click="showTwitchSecret = !showTwitchSecret" class="absolute right-3 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 cursor-pointer">
                                            <component :is="showTwitchSecret ? EyeOff : Eye" class="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <span class="text-[11px] text-surface-500 leading-normal">Enables querying ratings, genres, and store platform URLs using the IGDB game database endpoints. Register your application on the <a href="https://dev.twitch.tv/console" target="_blank" class="text-primary-500 hover:underline">Twitch Developer Console</a> to obtain a Client ID and Client Secret.</span>
                        </div>
                    </div>
                </div>

                <!-- 6. Cloud Sync Tab -->
                <div v-show="activeTab === 'sync'" class="flex flex-col gap-5 animate-fade-in">
                    <!-- Not configured in this build -->
                    <div v-if="!syncState.available" class="flex items-start gap-3 p-4 rounded-xl border border-dashed border-surface-300 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/40">
                        <AlertCircle class="w-4 h-4 text-surface-400 mt-0.5 shrink-0" />
                        <p class="text-xs text-surface-500 leading-relaxed">Cloud sync isn't configured in this build (missing Google client ID).</p>
                    </div>

                    <template v-else>
                        <!-- Setup state -->
                        <div v-if="!syncState.unlocked" class="flex flex-col gap-3">
                            <div class="flex items-start gap-3.5">
                                <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-500/10 text-primary-500 shrink-0 mt-0.5"><Cloud class="w-4 h-4" /></span>
                                <p class="text-xs text-surface-500 leading-relaxed flex-1">
                                    Stores an <strong>encrypted</strong> copy of your workspaces, settings and API keys in your own Google Drive (a hidden app folder). Drive syncs it to your other devices. Choose a sync passphrase &mdash; you'll enter the same one on each device. It never leaves your browser and can't be recovered if lost.
                                </p>
                            </div>
                            <div class="flex flex-col gap-2 md:pl-9">
                                <label for="setting-sync-passphrase" class="text-xs font-semibold text-surface-600 dark:text-surface-300">Sync passphrase</label>
                                <InputText v-model="syncPassphrase" id="setting-sync-passphrase" type="password" placeholder="Choose a passphrase..." class="w-full" @keyup.enter="handleConnectSync" />
                                <Button label="Connect Google Drive" :disabled="!syncPassphrase || syncState.status === 'syncing'" @click="handleConnectSync" class="self-start mt-1 cursor-pointer">
                                    <template #icon>
                                        <component :is="syncState.status === 'syncing' ? Loader2 : Cloud" class="w-4 h-4 mr-2" :class="{ 'animate-spin': syncState.status === 'syncing' }" />
                                    </template>
                                </Button>
                            </div>
                        </div>

                        <!-- Connected state -->
                        <div v-else class="flex flex-col gap-4">
                            <div class="flex items-center justify-between p-4 rounded-xl border"
                                :class="syncState.status === 'error'
                                    ? 'bg-red-500/5 border-red-500/20'
                                    : !syncState.connected
                                        ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20'
                                        : 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20'">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full flex items-center justify-center"
                                        :class="syncState.status === 'error'
                                            ? 'bg-red-500/15 text-red-500'
                                            : !syncState.connected
                                                ? 'bg-amber-500/15 text-amber-500'
                                                : 'bg-emerald-500/15 text-emerald-500'">
                                        <component :is="syncState.status === 'error' || !syncState.connected ? AlertCircle : Cloud" class="w-5 h-5" />
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-xs font-bold uppercase tracking-wider"
                                            :class="syncState.status === 'error'
                                                ? 'text-red-600 dark:text-red-400'
                                                : !syncState.connected
                                                    ? 'text-amber-600 dark:text-amber-400'
                                                    : 'text-emerald-600 dark:text-emerald-400'">
                                            {{ syncState.status === 'error' ? 'Sync error' : syncState.connected ? 'Sync active' : 'Reconnect needed' }}
                                        </span>
                                        <span class="text-sm text-surface-700 dark:text-surface-200 leading-tight">
                                            {{ syncState.status === 'error' ? syncState.error : `Last synced: ${lastSyncedLabel}` }}
                                        </span>
                                    </div>
                                </div>
                                <component :is="Loader2" v-if="syncState.status === 'syncing'" class="w-4 h-4 text-primary-500 animate-spin" />
                            </div>
                            <div class="flex gap-2">
                                <Button v-if="!syncState.connected" label="Reconnect" severity="warn" variant="outlined" size="small" :disabled="syncState.status === 'syncing'" @click="handleReconnectSync" class="cursor-pointer">
                                    <template #icon><LogIn class="w-3.5 h-3.5 mr-1.5" /></template>
                                </Button>
                                <Button label="Sync now" severity="secondary" variant="outlined" size="small" :disabled="syncState.status === 'syncing' || !syncState.connected" @click="syncNow" class="cursor-pointer">
                                    <template #icon><RefreshCw class="w-3.5 h-3.5 mr-1.5" :class="{ 'animate-spin': syncState.status === 'syncing' }" /></template>
                                </Button>
                                <Button label="Disconnect" severity="danger" variant="outlined" size="small" @click="handleDisconnectSync" class="cursor-pointer">
                                    <template #icon><LogOut class="w-3.5 h-3.5 mr-1.5" /></template>
                                </Button>
                            </div>
                            <p class="text-[11px] text-surface-500 leading-normal">
                                Changes are pushed a few seconds after you edit and pulled when you focus this tab. Same page edited on two devices: the most recent change wins. PCGamingWiki login applies after a reload on a new device.
                            </p>
                        </div>
                    </template>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2 w-full">
                <Button label="Done" @click="saveSettings" class="cursor-pointer">
                    <template #icon>
                        <Check class="w-4 h-4 mr-2" />
                    </template>
                </Button>
            </div>
        </template>
    </Dialog>

    <PcgwLoginDialog v-model:visible="isLoginVisible" />
</template>

<style scoped>
/* Scoped overrides to enforce style without impacting other dialogs */
.settings-dialog :deep(.p-dialog-content) {
    padding: 0 !important;
    overflow: hidden !important;
}

.settings-dialog :deep(.p-dialog-header) {
    padding: 1.25rem 1.5rem !important;
    border-bottom: 1px solid var(--color-surface-200);
}

.dark .settings-dialog :deep(.p-dialog-header) {
    border-bottom: 1px solid var(--color-surface-800);
}

.settings-dialog :deep(.p-dialog-footer) {
    padding: 1rem 1.5rem !important;
    border-top: 1px solid var(--color-surface-200);
}

.dark .settings-dialog :deep(.p-dialog-footer) {
    border-top: 1px solid var(--color-surface-800);
}

/* Scrollbar tweaks inside sidebar */
.custom-scrollbar::-webkit-scrollbar {
    height: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: var(--color-surface-300);
    border-radius: 9px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: var(--color-surface-700);
}

/* Animations */
.animate-fade-in {
    animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(4px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
