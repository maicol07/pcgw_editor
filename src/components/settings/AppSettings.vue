<script setup lang="ts">
import { ref, inject, computed, type Ref, watch } from 'vue';
import { aiConfig, MODELS, PROVIDERS, PROVIDER_LABELS, PROVIDER_KEY_LINKS, type AIProvider } from '../../services/ai/aiConfig';
import { useUiStore } from '../../stores/ui';
import Dialog from 'primevue/dialog';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import ToggleSwitch from 'primevue/toggleswitch';
import {
    Palette, Bot, Sun, Moon, Monitor, Type, Layout, Key,
    AlignJustify, AlignLeft, Menu, Globe, LogOut, LogIn,
    Info, RotateCcw, Eye, EyeOff, Cloud, RefreshCw, Loader2, AlertCircle
} from 'lucide-vue-next';
import { pcgwAuth } from '../../services/pcgwAuth';
import { syncState, connectAndUnlock, syncNow, disconnect as disconnectSync } from '../../services/sync/syncService';
import { pcgwApi } from '../../services/pcgwApi';
import PcgwLoginDialog from '../common/PcgwLoginDialog.vue';
import { useToast } from 'primevue/usetoast';

const uiStore = useUiStore();

// AI provider/model/key bind directly to the reactive aiConfig (auto-persisted).
const providerOptions = PROVIDERS.map((p) => ({ label: PROVIDER_LABELS[p], value: p }));
const modelOptions = computed(() => MODELS[aiConfig.provider]);
const keyLink = computed(() => PROVIDER_KEY_LINKS[aiConfig.provider]);
// On provider switch, default the model to that provider's first option.
watch(() => aiConfig.provider, (p: AIProvider) => { aiConfig.model = MODELS[p][0].id; });

const twitchClientId = inject<Ref<string>>('twitchClientId');
const twitchClientSecret = inject<Ref<string>>('twitchClientSecret');
const tempTwitchClientId = ref(twitchClientId?.value || '');
const tempTwitchClientSecret = ref(twitchClientSecret?.value || '');

const rawgApiKey = inject<Ref<string>>('rawgApiKey');
const tempRawgApiKey = ref(rawgApiKey?.value || '');

const toast = useToast();
const isLoginVisible = ref(false);

const activeTab = ref('appearance');

// Password visibility toggles
const showGeminiKey = ref(false);
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
    }
});

const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'integrations', label: 'Integrations & APIs', icon: Bot },
    { id: 'account', label: 'Account & Cache', icon: Globe },
    { id: 'sync', label: 'Cloud Sync', icon: Cloud }
];

const tabSubtitles: Record<string, string> = {
    appearance: 'Customize the interface theme, fonts, and layout spacing.',
    integrations: 'Configure third-party API credentials to enable autofill and metadata assistance.',
    account: 'Manage authentication credentials and local data cache settings.',
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
            <nav class="flex flex-row md:flex-col shrink-0 w-full md:w-52 border-b md:border-b-0 md:border-r border-surface-200/70 dark:border-surface-800/70 overflow-x-auto md:overflow-x-visible custom-scrollbar">
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

                <!-- Appearance Tab -->
                <div v-show="activeTab === 'appearance'" class="flex flex-col gap-6 animate-fade-in">
                    <!-- Theme Selector -->
                    <div class="flex flex-col gap-3">
                        <label class="text-sm font-semibold text-surface-700 dark:text-surface-200">Theme Preference</label>
                        <div class="grid grid-cols-3 gap-3">
                            <button v-for="opt in themeOptions" :key="opt.value"
                                @click="uiStore.theme = opt.value"
                                class="flex flex-col items-center gap-2.5 p-3 rounded-xl border transition-all duration-250 text-left relative overflow-hidden cursor-pointer"
                                :class="uiStore.theme === opt.value
                                    ? 'border-primary-500 bg-primary-500/5 dark:bg-primary-500/10 ring-1 ring-primary-500'
                                    : 'border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50 hover:bg-surface-100 dark:hover:bg-surface-800/80 hover:border-surface-300 dark:hover:border-surface-700'"
                            >
                                <!-- Simulated theme UI cards -->
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
                        <label class="text-sm font-semibold text-surface-700 dark:text-surface-200 flex items-center gap-2">
                            <Type class="w-4 h-4 text-primary-500" /> Font Family
                        </label>
                        <Select v-model="uiStore.fontFamily" :options="fontOptions" optionLabel="label" optionValue="value"
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
                            <label class="text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500">Preview text</label>
                            <div class="p-3.5 rounded-xl border border-surface-200/80 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50 text-sm font-medium select-none"
                                :style="{ fontFamily: uiStore.fontFamily }">
                                The quick brown fox jumps over the lazy dog. 1234567890
                            </div>
                        </div>
                    </div>

                    <!-- UI Density Cards -->
                    <div class="flex flex-col gap-3">
                        <label class="text-sm font-semibold text-surface-700 dark:text-surface-200 flex items-center gap-2">
                            <Layout class="w-4 h-4 text-primary-500" /> Layout Spacing (UI Density)
                        </label>
                        <div class="grid grid-cols-3 gap-3">
                            <button v-for="(mode, index) in densityModes" :key="mode"
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
                </div>

                <!-- Integrations Tab -->
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
                                <span class="font-bold text-surface-800 dark:text-surface-200">How to get an AI Provider Key:</span>
                                <ul class="list-disc list-inside flex flex-col gap-1.5 pl-1">
                                    <li><b>Google Gemini:</b> Go to <a href="https://aistudio.google.com/apikey" target="_blank" class="text-primary-500 hover:underline font-medium">Google AI Studio</a>, click on <i>Create API key</i>, and copy the generated key. (Free tier available).</li>
                                    <li><b>OpenAI:</b> Visit the <a href="https://platform.openai.com/api-keys" target="_blank" class="text-primary-500 hover:underline font-medium">OpenAI API Keys dashboard</a>, click <i>Create new secret key</i>, and copy it. (Requires credit balance).</li>
                                    <li><b>Anthropic Claude:</b> Go to the <a href="https://console.anthropic.com/settings/keys" target="_blank" class="text-primary-500 hover:underline font-medium">Anthropic Console keys page</a>, click <i>Create Key</i>, and copy the key. (Requires active credits).</li>
                                </ul>
                            </div>
                        </Transition>
                        <div class="flex flex-col gap-3 md:pl-9">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div class="flex flex-col gap-1.5">
                                    <label class="text-xs font-semibold text-surface-600 dark:text-surface-300">Provider</label>
                                    <Select v-model="aiConfig.provider" :options="providerOptions" optionLabel="label" optionValue="value" class="w-full" />
                                </div>
                                <div class="flex flex-col gap-1.5">
                                    <label class="text-xs font-semibold text-surface-600 dark:text-surface-300">Model</label>
                                    <Select v-model="aiConfig.model" :options="modelOptions" optionLabel="label" optionValue="id" editable class="w-full" />
                                </div>
                            </div>
                            <div class="flex flex-col gap-2">
                                <label class="text-xs font-semibold text-surface-600 dark:text-surface-300">{{ PROVIDER_LABELS[aiConfig.provider] }} API Key</label>
                                <div class="flex relative items-center">
                                    <InputText v-model="aiConfig.keys[aiConfig.provider]" :type="showGeminiKey ? 'text' : 'password'" placeholder="API key..." class="w-full pr-10 gemini-api-key-input" />
                                    <button type="button" @click="showGeminiKey = !showGeminiKey" class="absolute right-3 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 cursor-pointer">
                                        <component :is="showGeminiKey ? EyeOff : Eye" class="w-4 h-4" />
                                    </button>
                                </div>
                                <span class="text-[11px] text-surface-500 leading-normal">
                                    Powers screenshot parsing, edit-summary generation, and infobox mapping. Keys are stored per provider in your browser's local storage. Get a key from <a :href="keyLink" target="_blank" class="text-primary-500 hover:underline">{{ PROVIDER_LABELS[aiConfig.provider] }}</a>.
                                    <br>Web-grounded metadata autofill (store IDs) requires a <strong>Google</strong> key specifically.
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- RAWG -->
                    <div class="flex flex-col gap-3 py-5">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2.5">
                                <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-teal-500/10 text-teal-500 shrink-0"><Key class="w-4 h-4" /></span>
                                <span class="font-semibold text-sm text-surface-900 dark:text-surface-100">RAWG.io Database API</span>
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
                                    <li>Go to the <a href="https://rawg.io/apidocs" target="_blank" class="text-primary-500 hover:underline font-medium">RAWG.io API Docs</a>.</li>
                                    <li>Log in or register a new RAWG account.</li>
                                    <li>Click on <b>Get an API key</b> and fill out the form.</li>
                                    <li>Copy the generated key and paste it below.</li>
                                </ol>
                            </div>
                        </Transition>
                        <div class="flex flex-col gap-2 md:pl-9">
                            <label class="text-xs font-semibold text-surface-600 dark:text-surface-300">RAWG API Key</label>
                            <div class="flex relative items-center">
                                <InputText v-model="tempRawgApiKey" :type="showRawgKey ? 'text' : 'password'" placeholder="RAWG api key..." class="w-full pr-10" />
                                <button type="button" @click="showRawgKey = !showRawgKey" class="absolute right-3 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 cursor-pointer">
                                    <component :is="showRawgKey ? EyeOff : Eye" class="w-4 h-4" />
                                </button>
                            </div>
                            <span class="text-[11px] text-surface-500 leading-normal">Used for populating release dates, developers, publishers, and store identifiers directly. Get an API key from the <a href="https://rawg.io/apidocs" target="_blank" class="text-primary-500 hover:underline">RAWG API Docs</a>.</span>
                        </div>
                    </div>

                    <!-- Twitch / IGDB -->
                    <div class="flex flex-col gap-3.5 pt-5">
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
                                    <label class="text-xs font-semibold text-surface-600 dark:text-surface-300">Client ID</label>
                                    <InputText v-model="tempTwitchClientId" placeholder="Twitch Client ID" class="w-full" />
                                </div>
                                <div class="flex flex-col gap-1.5">
                                    <label class="text-xs font-semibold text-surface-600 dark:text-surface-300">Client Secret</label>
                                    <div class="flex relative items-center">
                                        <InputText v-model="tempTwitchClientSecret" :type="showTwitchSecret ? 'text' : 'password'" placeholder="Twitch Secret" class="w-full pr-10" />
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

                <!-- Account & Cache Tab -->
                <div v-show="activeTab === 'account'" class="flex flex-col gap-5 animate-fade-in">
                    <!-- PCGamingWiki Authentication Status -->
                    <div class="flex flex-col gap-3">
                        <label class="text-sm font-semibold text-surface-700 dark:text-surface-200 flex items-center gap-2">
                            <Globe class="w-4 h-4 text-primary-500" /> PCGamingWiki Account
                        </label>
                        
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
                            <Button severity="danger" text size="small" @click="handleLogout" v-tooltip.bottom="'Logout'"
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

                    <!-- Preferences + cache (flat, divider-separated) -->
                    <div class="flex flex-col divide-y divide-surface-200/70 dark:divide-surface-800/70">
                        <!-- Auto-relogin Switch -->
                        <div class="flex items-start gap-3.5 py-3.5">
                            <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-500/10 text-primary-500 shrink-0 mt-0.5"><RotateCcw class="w-4 h-4" /></span>
                            <div class="flex-1 flex flex-col gap-1">
                                <div class="flex items-center justify-between">
                                    <span class="text-sm font-semibold text-surface-800 dark:text-surface-200">Automatic Session Refresh</span>
                                    <ToggleSwitch v-model="uiStore.autoReLogin" />
                                </div>
                                <p class="text-[11px] text-surface-500 leading-normal">
                                    Automatically renews PCGW API credentials when the current session expires. Uses secure locally stored tokens.
                                </p>
                            </div>
                        </div>

                        <!-- Auto-description Switch -->
                        <div class="flex items-start gap-3.5 py-3.5">
                            <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-500/10 text-primary-500 shrink-0 mt-0.5"><Info class="w-4 h-4" /></span>
                            <div class="flex-1 flex flex-col gap-1">
                                <div class="flex items-center justify-between">
                                    <span class="text-sm font-semibold text-surface-800 dark:text-surface-200">Show Upload Attribution</span>
                                    <ToggleSwitch v-model="uiStore.autoUploadDescription" />
                                </div>
                                <p class="text-[11px] text-surface-500 leading-normal">
                                    Adds a descriptive tag linking back to this client app whenever you upload image media files to the wiki.
                                </p>
                            </div>
                        </div>

                        <!-- Cache Administration -->
                        <div class="flex items-center justify-between gap-3 py-3.5">
                            <div class="flex items-start gap-3.5">
                                <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-500/10 text-primary-500 shrink-0 mt-0.5"><RotateCcw class="w-4 h-4" /></span>
                                <div class="flex flex-col gap-1">
                                    <span class="text-sm font-semibold text-surface-800 dark:text-surface-200">Cache Administration</span>
                                    <span class="text-[11px] text-surface-500 leading-normal">Purge offline copies of PCGW schemas and templates.</span>
                                </div>
                            </div>
                            <Button label="Reset Cache" severity="secondary" variant="outlined" size="small" @click="handleResetCache" class="cursor-pointer shrink-0">
                                <template #icon>
                                    <RotateCcw class="w-3.5 h-3.5 mr-1.5" />
                                </template>
                            </Button>
                        </div>
                    </div>
                </div>

                <!-- Cloud Sync Tab -->
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
                                <label class="text-xs font-semibold text-surface-600 dark:text-surface-300">Sync passphrase</label>
                                <InputText v-model="syncPassphrase" type="password" placeholder="Choose a passphrase..." class="w-full" @keyup.enter="handleConnectSync" />
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
                                    : 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20'">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full flex items-center justify-center"
                                        :class="syncState.status === 'error' ? 'bg-red-500/15 text-red-500' : 'bg-emerald-500/15 text-emerald-500'">
                                        <component :is="syncState.status === 'error' ? AlertCircle : Cloud" class="w-5 h-5" />
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-xs font-bold uppercase tracking-wider"
                                            :class="syncState.status === 'error' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'">
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
                                <Button label="Sync now" severity="secondary" variant="outlined" size="small" :disabled="syncState.status === 'syncing'" @click="syncNow" class="cursor-pointer">
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
                <Button label="Done" @click="saveSettings" icon="pi pi-check" class="cursor-pointer" />
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
