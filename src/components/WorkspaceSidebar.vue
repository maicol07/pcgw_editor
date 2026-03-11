<script setup lang="ts">
import { useWorkspaceStore } from '../stores/workspace';
import Drawer from 'primevue/drawer';
import Button from 'primevue/button';
import FileUpload from 'primevue/fileupload';
import { computed, ref } from 'vue';
import {
    Plus, Pencil, Download, Trash2, Loader2, Github, AlertCircle,
    Search, Filter, ArrowUpDown, Clock, Calendar, Hash,
    File, FilePenLine, User, Users, Link, Unlink,
    Layout, SortAsc, SortDesc
} from 'lucide-vue-next';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import SelectButton from 'primevue/selectbutton';
import Message from 'primevue/message';
import AutocompleteField from './AutocompleteField.vue';
import { pcgwApi } from '../services/pcgwApi';
import { formatDistanceToNow } from 'date-fns';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';

const store = useWorkspaceStore();

const props = defineProps<{
    visible: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;

}>();

const visibleState = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
});

const isNewPageDialogVisible = ref(false);
const isCreatingPage = ref(false);
const newPageTitle = ref('Untitled Page');
const newPageTemplate = ref('blank');
const importSource = ref('url'); // 'url' or 'search'
const importUrl = ref('');
const importSearch = ref('');
const importError = ref('');

const importSourceOptions = [
    { label: 'URL', value: 'url', icon: Link },
    { label: 'Search', value: 'search', icon: Search }
];

// Filtering & Sorting
const searchQuery = ref('');
const filterTemplate = ref('all');
const sortBy = ref('recent');

const filterOptions = [
    { label: 'All Templates', value: 'all', icon: Layout },
    { label: 'Blank', value: 'blank', icon: File },
    { label: 'Existing PCGW Page', value: 'pcgw', icon: FilePenLine },
    { label: 'Singleplayer', value: 'singleplayer', icon: User },
    { label: 'Multiplayer', value: 'multiplayer', icon: Users },
];

const sortOptions = [
    { label: 'Most Recent', value: 'recent', icon: Clock },
    { label: 'Oldest First', value: 'oldest', icon: Calendar },
    { label: 'Title (A-Z)', value: 'title-asc', icon: SortAsc },
    { label: 'Title (Z-A)', value: 'title-desc', icon: SortDesc },
];


const filteredPages = computed(() => {
    let result = [...store.pages];

    // Search
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        result = result.filter(p => p.title.toLowerCase().includes(q));
    }

    // Template Filter
    if (filterTemplate.value !== 'all') {
        result = result.filter(p => (p.template || 'blank') === filterTemplate.value);
    }

    // Sort
    result.sort((a, b) => {
        if (sortBy.value === 'recent') return b.lastModified - a.lastModified;
        if (sortBy.value === 'oldest') return a.lastModified - b.lastModified;
        if (sortBy.value === 'title-asc') return a.title.localeCompare(b.title);
        if (sortBy.value === 'title-desc') return b.title.localeCompare(a.title);
        return 0;
    });

    return result;
});

const templateOptions = [
    { label: 'Blank', value: 'blank', icon: File },
    { label: 'Existing PCGW Page', value: 'pcgw', icon: FilePenLine },
    { label: 'Singleplayer', value: 'singleplayer', icon: User },
    { label: 'Multiplayer', value: 'multiplayer', icon: Users },
    { label: 'Unknown Template', value: 'unknown' }
];

const openNewPageDialog = () => {
    newPageTitle.value = 'Untitled Page';
    newPageTemplate.value = 'blank';
    importUrl.value = '';
    importSearch.value = '';
    importError.value = '';
    isNewPageDialogVisible.value = true;
};

const createNewPage = async () => {
    isCreatingPage.value = true;
    importError.value = '';
    try {
        let title = newPageTitle.value;
        let wikitext: string | undefined = undefined;

        if (newPageTemplate.value === 'pcgw') {
            let pageTitleToFetch = '';
            if (importSource.value === 'url') {
                const extracted = pcgwApi.extractTitleFromUrl(importUrl.value);
                if (!extracted) {
                    importError.value = 'Invalid PCGW URL';
                    return;
                }
                pageTitleToFetch = extracted;
            } else {
                if (!importSearch.value) {
                    importError.value = 'Please select a page';
                    return;
                }
                pageTitleToFetch = importSearch.value;
            }

            const result = await pcgwApi.fetchWikitext(pageTitleToFetch);
            if (!result) {
                importError.value = 'Failed to fetch page content. Please check the title/URL.';
                return;
            }
            wikitext = result.content;
            const revid = result.revid;
            title = pageTitleToFetch;
            store.createPage(title, wikitext, newPageTemplate.value as any, title, revid);
        } else if (newPageTemplate.value !== 'blank') {
            const templateType = newPageTemplate.value as 'singleplayer' | 'multiplayer' | 'unknown';
            const templateWikitext = await pcgwApi.fetchTemplateWikitext(templateType);
            if (templateWikitext) {
                wikitext = templateWikitext;
            } else {
                alert('Failed to load template. Falling back to blank page.');
            }
            store.createPage(title, wikitext, newPageTemplate.value as any, undefined);
        } else {
            store.createPage(title, wikitext, newPageTemplate.value as any, undefined);
        }
        isNewPageDialogVisible.value = false;
        visibleState.value = false;
    } catch (error) {
        console.error('Error creating page:', error);
        importError.value = 'An unexpected error occurred.';
    } finally {
        isCreatingPage.value = false;
    }
};

const onImportSelect = (event: any) => {
    const file = event.files[0];
    if (file) {
        store.importPage(file);
    }
};



const customRename = (page: any) => {
    const newName = prompt("Enter new name:", page.title);
    if (newName && newName.trim() !== "") {
        store.renamePage(page.id, newName);
    }
}

const isLinkDialogVisible = ref(false);
const linkPageId = ref('');
const linkSearch = ref('');
const linkUrl = ref('');
const linkSource = ref<'url' | 'search'>('search');
const linkError = ref('');
const isLinkingPage = ref(false);

const linkSourceOptions = [
    { label: 'URL', value: 'url', icon: Link },
    { label: 'Search', value: 'search', icon: Search }
];

const openLinkDialog = (page: any) => {
    linkPageId.value = page.id;
    linkSearch.value = page.pcgwPageTitle || page.title;
    linkUrl.value = '';
    linkSource.value = page.pcgwPageTitle ? 'search' : 'search'; // Default to search
    linkError.value = '';
    isLinkDialogVisible.value = true;
};

const submitLinkPage = async () => {
    if (!linkPageId.value) return;

    let pcgwTitle = '';
    linkError.value = '';

    if (linkSource.value === 'url') {
        const extracted = pcgwApi.extractTitleFromUrl(linkUrl.value);
        if (!extracted) {
            linkError.value = 'Invalid PCGW URL';
            return;
        }
        pcgwTitle = extracted;
    } else {
        if (!linkSearch.value) {
            linkError.value = 'Please select a page';
            return;
        }
        pcgwTitle = linkSearch.value;
    }

    isLinkingPage.value = true;
    try {
        const info = await pcgwApi.getLatestRevisionInfo(pcgwTitle);
        if (!info) {
            linkError.value = 'Failed to find page on PCGamingWiki.';
            return;
        }
        store.linkPage(linkPageId.value, pcgwTitle, info.revid);
        isLinkDialogVisible.value = false;
    } catch (e) {
        console.error('Failed to link page:', e);
        linkError.value = 'Error linking page. Check the title/URL.';
    } finally {
        isLinkingPage.value = false;
    }
};



const appVersion = __APP_VERSION__;
const commitHash = __COMMIT_HASH__;

defineExpose({ openLinkDialog });
</script>

<style scoped>
.list-move,
.list-enter-active,
.list-leave-active {
    transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: translateX(30px);
}

.list-leave-active {
    position: absolute;
}
</style>

<template>
    <Drawer v-model:visible="visibleState" header="Workspace" position="left" class="w-full! md:w-96! lg:w-[450px]!">
        <div class="flex flex-col h-full gap-4">

            <!-- Actions -->
            <div class="flex gap-2">
                <Button label="New Page" class="flex-1" @click="openNewPageDialog">
                    <template #icon>
                        <Plus class="w-4 h-4" />
                    </template>
                </Button>
            </div>

            <!-- Search & Filters -->
            <div class="flex flex-col gap-2">
                <IconField iconPosition="left">
                    <InputIcon>
                        <Search class="w-4 h-4 text-surface-400" />
                    </InputIcon>
                    <InputText v-model="searchQuery" placeholder="Filter pages..." class="w-full text-sm!" />
                </IconField>

                <div class="flex gap-2 w-full">
                    <Select v-model="filterTemplate" :options="filterOptions" optionLabel="label" optionValue="value"
                        class="flex-1 w-0 text-2xs!" size="small">
                        <template #value="slotProps">
                            <div class="flex items-center overflow-hidden">
                                <component :is="filterOptions.find(o => o.value === slotProps.value)?.icon || Filter"
                                    class="w-4! h-4! text-surface-400 mr-2 shrink-0" />
                                <span class="truncate">{{filterOptions.find(o => o.value === slotProps.value)?.label
                                    }}</span>
                            </div>
                        </template>
                        <template #option="slotProps">
                            <div class="flex items-center">
                                <component :is="slotProps.option.icon"
                                    class="w-4! h-4! text-surface-400 mr-2 shrink-0" />
                                <span>{{ slotProps.option.label }}</span>
                            </div>
                        </template>
                    </Select>
                    <Select v-model="sortBy" :options="sortOptions" optionLabel="label" optionValue="value"
                        class="flex-1 w-0 text-2xs!" size="small">
                        <template #value="slotProps">
                            <div v-if="slotProps.value" class="flex items-center overflow-hidden">
                                <component :is="sortOptions.find(o => o.value === slotProps.value)?.icon || ArrowUpDown"
                                    class="w-4! h-4! text-surface-400 mr-2 shrink-0" />
                                <span class="truncate">{{sortOptions.find(o => o.value === slotProps.value)?.label
                                    }}</span>
                            </div>
                            <span v-else>{{ slotProps.placeholder }}</span>
                        </template>
                        <template #option="slotProps">
                            <div class="flex items-center">
                                <component :is="slotProps.option.icon"
                                    class="w-4! h-4! text-surface-400 mr-2 shrink-0" />
                                <span>{{ slotProps.option.label }}</span>
                            </div>
                        </template>
                    </Select>
                </div>
            </div>

            <!-- Page List -->
            <div
                class="flex-1 border border-surface-200 dark:border-surface-700 rounded-lg overflow-y-auto overflow-x-hidden bg-surface-0 dark:bg-surface-950">
                <TransitionGroup name="list" tag="div" class="w-full">
                    <div v-for="page in filteredPages" :key="page.id"
                        class="mx-2 mt-2 p-2 rounded-xl cursor-pointer transition-all duration-300 border group relative overflow-hidden"
                        :class="[
                            page.id === store.activePageId
                                ? 'bg-primary-50/70 dark:bg-primary-950/30 border-primary-500/50 ring-1 ring-primary-500/20 shadow-[0_0_15px_-3px_rgba(168,85,247,0.2)] dark:shadow-[0_0_20px_-5px_rgba(168,85,247,0.3)] pl-4!'
                                : 'bg-surface-0 dark:bg-surface-900 border-surface-200 dark:border-surface-800 hover:border-primary-400/50 dark:hover:border-primary-500/50 hover:bg-surface-50/50 dark:hover:bg-surface-800/50'
                        ]" @click="store.setActivePage(page.id)">


                        <!-- Active Indicator -->
                        <div v-if="page.id === store.activePageId"
                            class="absolute top-1/2 -translate-y-1/2 left-0 w-1.5 h-8 bg-primary-500 rounded-r-full shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                        </div>

                        <div class="flex justify-between items-start">
                            <div class="flex-1 min-w-0 pr-10">
                                <div class="font-bold text-sm truncate text-surface-900 dark:text-surface-0 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
                                    :title="page.title">
                                    {{ page.title }}
                                </div>
                                <div class="flex items-center gap-2 mt-0.5">
                                    <div
                                        class="flex items-center text-[10px] text-surface-500 bg-surface-200/50 dark:bg-surface-800 px-1.5 py-0.5 rounded capitalize">
                                        <Hash class="w-2.5 h-2.5 mr-1" />
                                        {{ page.template || 'blank' }}
                                    </div>
                                    <div class="flex items-center text-[10px] text-surface-500 font-medium">
                                        <Clock class="w-2.5 h-2.5 mr-1" />
                                        {{ formatDistanceToNow(page.lastModified, { addSuffix: true }) }}
                                    </div>
                                    <div v-if="page.pcgwPageTitle" title="Linked to PCGW"
                                        class="flex items-center text-[10px] text-primary-500 font-medium ml-1">
                                        <Link class="w-3 h-3" />
                                    </div>
                                </div>
                            </div>

                            <!-- Floating Actions -->
                            <div
                                class="absolute top-2 right-2 flex gap-1 transform translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out">
                                <template v-if="page.pcgwPageTitle">

                                    <Button severity="secondary" variant="text" size="small"
                                        v-tooltip.top="'Unlink PCGW Page'"
                                        class="p-1.5! w-8! h-8! hover:bg-white dark:hover:bg-surface-800"
                                        @click.stop="store.unlinkPage(page.id)">
                                        <template #icon>
                                            <Unlink class="w-4! h-4!" />
                                        </template>
                                    </Button>
                                </template>
                                <template v-else>
                                    <Button severity="secondary" variant="text" size="small"
                                        v-tooltip.top="'Link to PCGW Page'"
                                        class="p-1.5! w-8! h-8! hover:bg-white dark:hover:bg-surface-800"
                                        @click.stop="openLinkDialog(page)">
                                        <template #icon>
                                            <Link class="w-4! h-4!" />
                                        </template>
                                    </Button>
                                </template>
                                <Button icon="pi pi-download" severity="secondary" variant="text" size="small"
                                    v-tooltip.top="'Export JSON'"
                                    class="p-1.5! w-8! h-8! hover:bg-white dark:hover:bg-surface-800"
                                    @click.stop="store.exportPage(page.id)">
                                    <template #icon>
                                        <Download class="w-4! h-4!" />
                                    </template>
                                </Button>
                                <Button icon="pi pi-pencil" severity="secondary" variant="text" size="small"
                                    v-tooltip.top="'Rename'"
                                    class="p-1.5! w-8! h-8! hover:bg-white dark:hover:bg-surface-800"
                                    @click.stop="customRename(page)">
                                    <template #icon>
                                        <Pencil class="w-4! h-4!" />
                                    </template>
                                </Button>
                                <Button icon="pi pi-trash" severity="danger" variant="text" size="small"
                                    v-tooltip.top="'Delete'"
                                    class="p-1.5! w-8! h-8! hover:bg-red-50 dark:hover:bg-red-900/20"
                                    @click.stop="store.deletePage(page.id)">
                                    <template #icon>
                                        <Trash2 class="w-4! h-4!" />
                                    </template>
                                </Button>
                            </div>
                        </div>
                    </div>
                </TransitionGroup>
            </div>

            <!-- Import -->
            <div class="border-t pt-4 border-surface-200 dark:border-surface-700">
                <div class="text-sm font-bold mb-2">Import Page</div>
                <FileUpload mode="basic" name="demo[]" accept=".json" :maxFileSize="1000000" @select="onImportSelect"
                    customUpload auto chooseLabel="Import JSON" class="w-full" />
            </div>

            <!-- Footer Links -->
            <div class="mt-auto border-t pt-4 border-surface-200 dark:border-surface-700 flex flex-col gap-1">
                <a href="https://github.com/maicol07/pcgw_editor" target="_blank" rel="noopener noreferrer"
                    class="flex items-center w-full px-3 py-2 rounded-md text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors whitespace-nowrap no-underline">
                    <Github class="w-4 h-4 mr-3 shrink-0" />
                    <span class="text-xs font-medium">GitHub Repository</span>
                </a>
                <a href="https://github.com/maicol07/pcgw_editor/issues" target="_blank" rel="noopener noreferrer"
                    class="flex items-center w-full px-3 py-2 rounded-md text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors whitespace-nowrap no-underline">
                    <AlertCircle class="w-4 h-4 mr-3 shrink-0" />
                    <span class="text-xs font-medium">Report an Issue</span>
                </a>
            </div>

            <!-- Version Info -->
            <div
                class="flex items-center justify-between px-3 pb-2 text-[10px] text-surface-500 dark:text-surface-500 font-mono">
                <a :href="appVersion === 'main' ? 'https://github.com/maicol07/pcgw_editor' : `https://github.com/maicol07/pcgw_editor/releases/tag/${appVersion}`"
                    target="_blank" rel="noopener noreferrer"
                    class="hover:text-primary-500 transition-colors no-underline">
                    {{ appVersion === 'main' ? 'main' : (appVersion.startsWith('v') ? appVersion : `v${appVersion}`) }}
                </a>
                <a :href="`https://github.com/maicol07/pcgw_editor/commit/${commitHash}`" target="_blank"
                    rel="noopener noreferrer" class="hover:text-primary-500 transition-colors no-underline">
                    {{ commitHash }}
                </a>
            </div>
        </div>
    </Drawer>

    <Dialog v-model:visible="isLinkDialogVisible" header="Link to PCGW Page" :style="{ width: '400px' }" modal :draggable="false">
        <div class="flex flex-col gap-4 py-4">
            <div class="flex flex-col gap-2">
                <label class="text-xs font-bold uppercase text-surface-500">Linking Method</label>
                <SelectButton v-model="linkSource" :options="linkSourceOptions" optionLabel="label"
                    optionValue="value" class="w-full">
                    <template #option="slotProps">
                        <div class="flex items-center gap-2">
                            <component :is="slotProps.option.icon" class="w-4 h-4" />
                            <span>{{ slotProps.option.label }}</span>
                        </div>
                    </template>
                </SelectButton>
            </div>

            <Transition name="fade-fast" mode="out-in">
                <div v-if="linkSource === 'url'" class="flex flex-col gap-2">
                    <label class="text-xs font-semibold text-surface-600 dark:text-surface-400">PCGW URL</label>
                    <IconField>
                        <InputIcon>
                            <Link class="w-4 h-4" />
                        </InputIcon>
                        <InputText v-model="linkUrl" placeholder="https://www.pcgamingwiki.com/wiki/..."
                            class="w-full" size="small" autofocus @keyup.enter="submitLinkPage" />
                    </IconField>
                </div>
                <div v-else class="flex flex-col gap-2">
                    <label class="text-xs font-semibold text-surface-600 dark:text-surface-400">Search Page</label>
                    <IconField>
                        <InputIcon>
                            <Search class="w-4 h-4" />
                        </InputIcon>
                        <AutocompleteField v-model="linkSearch" dataSource="pages" :multiple="false"
                            placeholder="Type game title..." class="w-full" autofocus />
                    </IconField>
                </div>
            </Transition>

            <Message v-if="linkError" severity="error" variant="simple" size="small">{{ linkError }}</Message>
        </div>
        <template #footer>
            <Button label="Cancel" text severity="secondary" @click="isLinkDialogVisible = false"
                :disabled="isLinkingPage" />
            <Button label="Link" @click="submitLinkPage" :disabled="isLinkingPage" severity="primary">
                <template #icon v-if="isLinkingPage">
                    <Loader2 class="w-4 h-4 animate-spin mr-2" />
                </template>
            </Button>
        </template>
    </Dialog>

    <!-- New Page Dialog -->
    <Dialog v-model:visible="isNewPageDialogVisible" header="Create New Page" :style="{ width: '400px' }" modal :draggable="false">
        <div class="flex flex-col gap-4 py-4">
            <div class="flex flex-col gap-2">
                <label for="pageTemplate" class="font-bold">Source / Template</label>
                <Select id="pageTemplate" v-model="newPageTemplate" :options="templateOptions" optionLabel="label"
                    optionValue="value" class="w-full" size="small">
                    <template #value="slotProps">
                        <div v-if="slotProps.value" class="flex items-center">
                            <component :is="templateOptions.find(o => o.value === slotProps.value)?.icon"
                                class="w-4 h-4 mr-2 text-surface-400" />
                            <span>{{templateOptions.find(o => o.value === slotProps.value)?.label}}</span>
                        </div>
                        <span v-else>{{ slotProps.placeholder }}</span>
                    </template>
                    <template #option="slotProps">
                        <div class="flex items-center">
                            <component :is="slotProps.option.icon" class="w-4 h-4 mr-2 text-surface-400" />
                            <span>{{ slotProps.option.label }}</span>
                        </div>
                    </template>
                </Select>
            </div>

            <Transition name="fade-fast" mode="out-in">
                <div v-if="newPageTemplate === 'pcgw'"
                    class="flex flex-col gap-4 p-3 bg-surface-100 dark:bg-surface-800/50 rounded-lg border border-surface-200 dark:border-surface-700">
                    <div class="flex flex-col gap-2">
                        <label class="text-xs font-bold uppercase text-surface-500">Import Method</label>
                        <SelectButton v-model="importSource" :options="importSourceOptions" optionLabel="label"
                            optionValue="value" aria-labelledby="basic" class="w-full">
                            <template #option="slotProps">
                                <div class="flex items-center gap-2">
                                    <component :is="slotProps.option.icon" class="w-4 h-4" />
                                    <span>{{ slotProps.option.label }}</span>
                                </div>
                            </template>
                        </SelectButton>
                    </div>

                    <div v-if="importSource === 'url'" class="flex flex-col gap-2">
                        <label class="text-xs font-semibold text-surface-600 dark:text-surface-400">PCGW URL</label>
                        <IconField>
                            <InputIcon>
                                <Link class="w-4 h-4" />
                            </InputIcon>
                            <InputText v-model="importUrl" placeholder="https://www.pcgamingwiki.com/wiki/..."
                                class="w-full" size="small" />
                        </IconField>
                    </div>

                    <div v-else class="flex flex-col gap-2">
                        <label class="text-xs font-semibold text-surface-600 dark:text-surface-400">Search Page</label>
                        <IconField>
                            <InputIcon>
                                <Search class="w-4 h-4" />
                            </InputIcon>
                            <AutocompleteField v-model="importSearch" dataSource="pages" :multiple="false"
                                placeholder="Type game title..." class="w-full" />
                        </IconField>
                    </div>

                    <Message v-if="importError" severity="error" variant="simple" size="small">{{ importError }}
                    </Message>
                </div>
                <div v-else class="flex flex-col gap-2">
                    <label for="pageTitle" class="font-bold">Page Title</label>
                    <InputText id="pageTitle" v-model="newPageTitle" placeholder="Enter page title" autofocus />
                </div>
            </Transition>
        </div>
        <template #footer>
            <Button label="Cancel" text severity="secondary" @click="isNewPageDialogVisible = false"
                :disabled="isCreatingPage" />
            <Button label="Create" @click="createNewPage" :disabled="!newPageTitle || isCreatingPage">
                <template #icon v-if="isCreatingPage">
                    <Loader2 class="w-4 h-4 animate-spin mr-2" />
                </template>
            </Button>
        </template>
    </Dialog>
</template>

<style scoped>
/* Custom Scrollbar for list */
</style>
