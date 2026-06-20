<script setup lang="ts">
import { ref, inject, type Ref, watch } from 'vue';
import { useUiStore } from '../../stores/ui';
import Dialog from 'primevue/dialog';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import ToggleSwitch from 'primevue/toggleswitch';
import {
    Palette, Bot, Sun, Moon, Monitor, Type, Layout, Key,
    AlignJustify, AlignLeft, Menu, Globe, LogOut, LogIn,
    Info, RotateCcw, Eye, EyeOff
} from 'lucide-vue-next';
import { pcgwAuth } from '../../services/pcgwAuth';
import { pcgwApi } from '../../services/pcgwApi';
import PcgwLoginDialog from '../common/PcgwLoginDialog.vue';
import { useToast } from 'primevue/usetoast';

const uiStore = useUiStore();
const geminiApiKey = inject<Ref<string>>('geminiApiKey');
const apiKeyValue = ref(geminiApiKey?.value || '');

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

const handleResetCache = () => {
    pcgwApi.resetCache();
    toast.add({
        severity: 'success',
        summary: 'Cache Reset',
        detail: 'PCGamingWiki metadata cache has been cleared.',
        life: 3000
    });
};

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
        apiKeyValue.value = geminiApiKey?.value || '';
        tempTwitchClientId.value = twitchClientId?.value || '';
        tempTwitchClientSecret.value = twitchClientSecret?.value || '';
        tempRawgApiKey.value = rawgApiKey?.value || '';
    }
});

const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'integrations', label: 'Integrations & APIs', icon: Bot },
    { id: 'account', label: 'Account & Cache', icon: Globe }
];

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
    if (geminiApiKey) {
        geminiApiKey.value = apiKeyValue.value;
        localStorage.setItem('gemini-api-key', apiKeyValue.value);
    }
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
                        {{ activeTab === 'appearance' ? 'Customize the interface theme, fonts, and layout spacing.' : activeTab === 'integrations' ? 'Configure third-party API credentials to enable autofill and metadata assistance.' : 'Manage authentication credentials and local data cache settings.' }}
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
                    <!-- Gemini -->
                    <div class="flex flex-col gap-3 pb-5">
                        <div class="flex items-center gap-2.5">
                            <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-500/10 text-primary-500 shrink-0"><Bot class="w-4 h-4" /></span>
                            <span class="font-semibold text-sm text-surface-900 dark:text-surface-100">Gemini AI Assistant</span>
                        </div>
                        <div class="flex flex-col gap-2 md:pl-9">
                            <label class="text-xs font-semibold text-surface-600 dark:text-surface-300">Gemini API Key</label>
                            <div class="flex relative items-center">
                                <InputText v-model="apiKeyValue" :type="showGeminiKey ? 'text' : 'password'" placeholder="AI api key..." class="w-full pr-10 gemini-api-key-input" />
                                <button type="button" @click="showGeminiKey = !showGeminiKey" class="absolute right-3 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 cursor-pointer">
                                    <component :is="showGeminiKey ? EyeOff : Eye" class="w-4 h-4" />
                                </button>
                            </div>
                            <span class="text-[11px] text-surface-500 leading-normal">Required for AI-driven screenshot parsing, edit summary generation, and infobox mapping tools.</span>
                        </div>
                    </div>

                    <!-- RAWG -->
                    <div class="flex flex-col gap-3 py-5">
                        <div class="flex items-center gap-2.5">
                            <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-teal-500/10 text-teal-500 shrink-0"><Key class="w-4 h-4" /></span>
                            <span class="font-semibold text-sm text-surface-900 dark:text-surface-100">RAWG.io Database API</span>
                        </div>
                        <div class="flex flex-col gap-2 md:pl-9">
                            <label class="text-xs font-semibold text-surface-600 dark:text-surface-300">RAWG API Key</label>
                            <div class="flex relative items-center">
                                <InputText v-model="tempRawgApiKey" :type="showRawgKey ? 'text' : 'password'" placeholder="RAWG api key..." class="w-full pr-10" />
                                <button type="button" @click="showRawgKey = !showRawgKey" class="absolute right-3 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 cursor-pointer">
                                    <component :is="showRawgKey ? EyeOff : Eye" class="w-4 h-4" />
                                </button>
                            </div>
                            <span class="text-[11px] text-surface-500 leading-normal">Used for populating release dates, developers, publishers, and store identifiers directly.</span>
                        </div>
                    </div>

                    <!-- Twitch / IGDB -->
                    <div class="flex flex-col gap-3.5 pt-5">
                        <div class="flex items-center gap-2.5">
                            <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-500/10 text-primary-500 shrink-0"><Key class="w-4 h-4" /></span>
                            <span class="font-semibold text-sm text-surface-900 dark:text-surface-100">Twitch IGDB Integration</span>
                        </div>
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
                            <span class="text-[11px] text-surface-500 leading-normal">Enables querying ratings, genres, and store platform URLs using the IGDB game database endpoints.</span>
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
