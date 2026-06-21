<script setup lang="ts">
import { ref, computed } from 'vue';
import Toolbar from 'primevue/toolbar';
import Menu from 'primevue/menu';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import SelectButton from 'primevue/selectbutton';
import { Wand2, Loader2, Settings, RefreshCw, Unlink, Link, Globe, Menu as MenuIcon, FileClock, History, UploadCloud, Eye, Code2 } from 'lucide-vue-next';
import pcgwLogo from '../../assets/pcgw_logo.webp';
import { useUiStore } from '../../stores/ui';
import { useWorkspaceStore } from '../../stores/workspace';


export type EditorMode = 'Visual' | 'Code';

const props = defineProps<{
    title: string;
    editorMode: EditorMode;
    isGeneratingSummary?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:title', value: string): void;
    (e: 'update:editorMode', value: EditorMode): void;
    (e: 'toggleSidebar'): void;
    (e: 'generateSummary'): void;
    (e: 'updatePcgw'): void;
    (e: 'publishPcgw'): void;
    (e: 'linkPcgw'): void;
}>();

import { useToast } from 'primevue/usetoast';

const uiStore = useUiStore();
const workspaceStore = useWorkspaceStore();
const toast = useToast();
const editorModeOptions = [
    { label: 'Visual', value: 'Visual', icon: Eye },
    { label: 'Code', value: 'Code', icon: Code2 },
];

const pcgwMenu = ref<any>(null);
const isCheckingUpdates = ref(false);

const togglePcgwMenu = (event: Event) => {
    pcgwMenu.value.toggle(event);
};

const handleCheckUpdates = async () => {
    if (workspaceStore.activePage) {
        isCheckingUpdates.value = true;
        const hasNewUpdates = await workspaceStore.checkForUpdates(workspaceStore.activePage.id);
        isCheckingUpdates.value = false;
        
        if (hasNewUpdates) {
            toast.add({ 
                severity: 'info', 
                summary: 'Update Available', 
                detail: 'A newer version of the page was found.', 
                life: 3000 
            });
        } else {
            toast.add({ 
                severity: 'success', 
                summary: 'Page Up to Date', 
                detail: 'You are viewing the latest version.', 
                life: 3000 
            });
        }
    }
};

const openUrl = (url: string | null | undefined) => {
    if (url) window.open(url, '_blank');
};

const pcgwMenuItems = computed(() => {
    const page = workspaceStore.activePage;
    if (!page) return [];

    const items: any[] = [];

    if (page.pcgwPageTitle) {
        // 1. Primary Action: Open
        items.push({
            label: 'Open on PCGW',
            icon: Globe,
            command: () => {
                window.open(`https://www.pcgamingwiki.com/wiki/${encodeURIComponent(page.pcgwPageTitle!)}`, '_blank');
            }
        });

        items.push({ separator: true });

        // 2. Sync status: revision tracking + check button on the header
        items.push({
            type: 'section-header',
            label: 'Sync Status',
            isChecking: isCheckingUpdates.value
        });

        items.push({
            type: 'info',
            label: `Local: ${page.localRevisionId || '---'}`,
            icon: FileClock,
            url: page.localRevisionId ? `https://www.pcgamingwiki.com/w/index.php?oldid=${page.localRevisionId}` : null
        });

        items.push({
            type: 'info',
            label: `Online: ${page.onlineRevisionId || '---'}`,
            icon: History,
            url: page.onlineRevisionId ? `https://www.pcgamingwiki.com/w/index.php?oldid=${page.onlineRevisionId}` : null
        });

        // 3. The two verbs: pull (Update) and push (Publish), side by side
        items.push({
            type: 'sync-actions',
            hasUpdate: !!(page.onlineRevisionId && (!page.localRevisionId || page.onlineRevisionId > page.localRevisionId))
        });

        items.push({ separator: true });

        // 4. Management
        items.push({
            label: 'Unlink PCGW Page',
            icon: Unlink,
            command: () => workspaceStore.unlinkPage(workspaceStore.activePageId!)
        });
    } else {
        items.push({
            label: 'Link to PCGW Page',
            icon: Link,
            command: () => emit('linkPcgw')
        });
    }



    return items;
});
</script>

<template>
    <Toolbar
        class="border-b! border-0! rounded-none! glass glass-border shadow-soft z-20 p-1.5! sticky top-0 bg-surface-0/80 dark:bg-surface-900/80 backdrop-blur-md">
        <template #start>
            <div class="flex items-center gap-2 md:gap-3">
                <Button text @click="emit('toggleSidebar')" class="lg:hidden hover-scale h-8! w-8! p-0!"
                    severity="secondary">
                    <template #icon>
                        <MenuIcon class="w-5! h-5!" />
                    </template>
                </Button>

                <span
                    class="font-bold text-base md:text-lg bg-linear-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent select-none">
                    PCGamingWiki Editor
                </span>

                <span class="text-surface-300 dark:text-surface-600 hidden lg:block text-xs">•</span>

                <div class="flex items-center gap-1 group/title relative">
                    <InputText :modelValue="title" @update:modelValue="emit('update:title', $event || '')"
                        placeholder="Page Title..."
                        class="w-48 lg:w-64 py-1.5! px-2.5! text-sm hidden md:block transition-all" />
                    
                    <!-- Unified PCGW Menu next to title -->
                    <div v-if="workspaceStore.activePage" class="flex items-center">
                        <div class="h-7 w-7 absolute right-1.5 flex items-center justify-center">
                            <Button type="button" text size="small" @click="togglePcgwMenu" severity="secondary"
                                class="h-full w-full p-0! opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center rounded-full"
                                v-tooltip.bottom="'PCGamingWiki Actions'">
                                <img :src="pcgwLogo" alt="PCGW" class="h-4.5 w-4.5 object-contain rounded-full border border-surface-200 dark:border-surface-700 shadow-sm" />
                            </Button>
                            
                            <!-- Update Badge (on container to avoid clipping) -->
                            <div v-if="workspaceStore.activePage.onlineRevisionId && (!workspaceStore.activePage.localRevisionId || workspaceStore.activePage.onlineRevisionId > workspaceStore.activePage.localRevisionId)"
                                class="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-surface-0 dark:border-surface-900 shadow-sm animate-pulse z-10 pointer-events-none">
                            </div>
                        </div>
                        <Menu ref="pcgwMenu" :model="pcgwMenuItems" :popup="true" class="text-sm! min-w-48">
                            <template #item="{ item, props }">
                                <!-- Section Header (with inline check-for-updates) -->
                                <div v-if="item.type === 'section-header'"
                                    class="flex items-center justify-between px-3 pt-2 pb-1 select-none">
                                    <span class="text-xs font-bold tracking-wider text-surface-400 dark:text-surface-500 uppercase">{{ item.label }}</span>
                                    <Button text rounded size="small" severity="secondary" class="h-6! w-6! p-0!"
                                        :disabled="item.isChecking" @click="handleCheckUpdates"
                                        v-tooltip.bottom="'Check for newer versions'">
                                        <template #icon>
                                            <Loader2 v-if="item.isChecking" class="w-3.5 h-3.5 animate-spin" />
                                            <RefreshCw v-else class="w-3.5 h-3.5" />
                                        </template>
                                    </Button>
                                </div>

                                <!-- Compact Revision Info -->
                                <div v-else-if="item.type === 'info'" 
                                    class="flex items-center px-3 py-1 text-xs text-surface-500 dark:text-surface-400 hover:text-primary-500 transition-colors cursor-pointer"
                                    @click="openUrl(item.url)">
                                    <component :is="item.icon" class="w-3 h-3 mr-1.5 shrink-0" />
                                    <span class="truncate font-mono">{{ item.label }}</span>
                                </div>

                                <!-- The two verbs: pull (Update) and push (Publish) -->
                                <div v-else-if="item.type === 'sync-actions'" class="flex gap-1.5 px-2 pt-1.5 pb-1">
                                    <Button size="small" severity="secondary" variant="outlined" class="flex-1 py-1.5! text-xs!"
                                        :disabled="!item.hasUpdate" @click="emit('updatePcgw')"
                                        v-tooltip.bottom="'Merge newer version from PCGW'">
                                        <template #icon>
                                            <RefreshCw class="w-3.5 h-3.5 mr-1.5" />
                                        </template>
                                        Update
                                    </Button>
                                    <Button size="small" severity="primary" class="flex-1 py-1.5! text-xs!"
                                        @click="emit('publishPcgw')" v-tooltip.bottom="'Publish your changes to PCGW'">
                                        <template #icon>
                                            <UploadCloud class="w-3.5 h-3.5 mr-1.5" />
                                        </template>
                                        Publish
                                    </Button>
                                </div>

                                <!-- Standard Action -->
                                <a v-else class="flex items-center px-3 py-2 cursor-pointer group" v-bind="props.action">
                                    <component :is="item.icon" 
                                        class="w-4 h-4 mr-2" 
                                        :class="[item.disabled ? 'text-surface-400 dark:text-surface-600' : 'text-surface-600 dark:text-surface-400 group-hover:text-primary-500']" />
                                    <span :class="[item.disabled ? 'text-surface-400 dark:text-surface-600' : 'text-surface-700 dark:text-surface-300 group-hover:text-primary-600']">{{ item.label }}</span>
                                </a>
                            </template>
                        </Menu>
                    </div>
                </div>

                <Button text size="small" @click="emit('generateSummary')" severity="secondary"
                    class="h-8! w-8! p-0! hover-scale ml-1" v-tooltip.bottom="'Generate summary with AI'"
                    :disabled="isGeneratingSummary">
                    <template #icon>
                        <Loader2 v-if="isGeneratingSummary" class="w-4 h-4 animate-spin text-primary-500" />
                        <Wand2 v-else class="w-4 h-4" />
                    </template>
                </Button>
            </div>
        </template>

        <template #end>
            <div class="flex items-center gap-2">
                <Button text size="small" @click="uiStore.isSettingsOpen = true" severity="secondary"
                    class="h-8! w-8! p-0! hover-scale" v-tooltip.bottom="'App Settings'">
                    <template #icon>
                        <Settings class="w-4 h-4 text-surface-500 dark:text-surface-400" />
                    </template>
                </Button>

                <div class="w-px h-4 bg-surface-200 dark:bg-surface-700 mx-1"></div>

                <SelectButton :modelValue="editorMode" @update:modelValue="emit('update:editorMode', $event)"
                    :options="editorModeOptions" optionLabel="label" optionValue="value" dataKey="value"
                    :allowEmpty="false" size="small" class="transition-fast">
                    <template #option="{ option }">
                        <span v-tooltip.bottom="option.label" class="flex items-center justify-center -m-2 p-2">
                            <component :is="option.icon" class="w-4 h-4" />
                        </span>
                    </template>
                </SelectButton>
            </div>
        </template>
    </Toolbar>


</template>
