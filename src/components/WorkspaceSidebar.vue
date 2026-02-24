<script setup lang="ts">
import { useWorkspaceStore } from '../stores/workspace';
import Drawer from 'primevue/drawer';
import Button from 'primevue/button';
import FileUpload from 'primevue/fileupload';
import VirtualScroller from 'primevue/virtualscroller';
import { computed, ref } from 'vue';
import { Plus, Pencil, Download, Trash2, Loader2 } from 'lucide-vue-next';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import { pcgwApi } from '../services/pcgwApi';

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

const templateOptions = [
    { label: 'Blank', value: 'blank' },
    { label: 'Singleplayer', value: 'singleplayer' },
    { label: 'Multiplayer', value: 'multiplayer' },
    { label: 'Unknown', value: 'unknown' }
];

const openNewPageDialog = () => {
    newPageTitle.value = 'Untitled Page';
    newPageTemplate.value = 'blank';
    isNewPageDialogVisible.value = true;
};

const createNewPage = async () => {
    isCreatingPage.value = true;
    try {
        if (newPageTemplate.value === 'blank') {
            store.createPage(newPageTitle.value, undefined, 'blank');
        } else {
            const templateType = newPageTemplate.value as 'singleplayer' | 'multiplayer' | 'unknown';
            const templateWikitext = await pcgwApi.fetchTemplateWikitext(templateType);
            if (templateWikitext) {
                store.createPage(newPageTitle.value, templateWikitext, templateType);
            } else {
                alert('Failed to load template. Falling back to blank page.');
                store.createPage(newPageTitle.value, undefined, 'blank');
            }
        }
        isNewPageDialogVisible.value = false;
        visibleState.value = false;
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

const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString();
};

const customRename = (page: any) => {
    const newName = prompt("Enter new name:", page.title);
    if (newName && newName.trim() !== "") {
        store.renamePage(page.id, newName);
    }
}
</script>

<template>
    <Drawer v-model:visible="visibleState" header="Workspace" position="left" class="w-full! md:w-80!">
        <div class="flex flex-col h-full gap-4">

            <!-- Actions -->
            <div class="flex gap-2">
                <Button label="New Page" class="flex-1" @click="openNewPageDialog">
                    <template #icon>
                        <Plus class="w-4 h-4" />
                    </template>
                </Button>
            </div>

            <!-- Page List -->
            <div class="flex-1 border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
                <VirtualScroller :items="store.pages" :itemSize="90" class="h-full w-full" :autoSize="false">
                    <template v-slot:item="{ item: page, options }">
                        <div class="mx-2 mt-2 p-3 rounded-lg cursor-pointer transition-colors border group relative box-border"
                            style="height: 82px" :class="[
                                page.id === store.activePageId
                                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500'
                                    : 'bg-surface-50 dark:bg-surface-800 border-transparent hover:border-surface-300 dark:hover:border-surface-600'
                            ]" @click="store.setActivePage(page.id)">
                            <div class="flex justify-between items-start">
                                <div class="font-medium truncate pr-20" :title="page.title">{{ page.title }}</div>

                                <!-- Actions -->
                                <div
                                    class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 bg-surface-0 dark:bg-surface-900 shadow-sm rounded transition-opacity duration-200">
                                    <Button text rounded size="small" class="h-[34px]! w-[34px]!"
                                        @click.stop="customRename(page)" v-tooltip.top="'Rename'">
                                        <template #icon>
                                            <Pencil class="w-6! h-6!" />
                                        </template>
                                    </Button>
                                    <Button text rounded size="small" class="h-[34px]! w-[34px]!"
                                        @click.stop="store.exportPage(page.id)" v-tooltip.top="'Export JSON'">
                                        <template #icon>
                                            <Download class="w-6! h-6!" />
                                        </template>
                                    </Button>
                                    <Button text rounded severity="danger" size="small" class="h-[34px]! w-[34px]!"
                                        @click.stop="store.deletePage(page.id)" v-tooltip.top="'Delete'">
                                        <template #icon>
                                            <Trash2 class="w-6! h-6!" />
                                        </template>
                                    </Button>
                                </div>
                            </div>
                            <div class="flex justify-between items-center mt-2">
                                <div class="text-xs text-surface-500">
                                    {{ formatDate(page.lastModified) }}
                                </div>
                                <div
                                    class="text-[10px] font-medium bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300 px-1.5 py-0.5 rounded capitalize">
                                    {{ page.template || 'blank' }}
                                </div>
                            </div>
                        </div>
                    </template>
                </VirtualScroller>
            </div>

            <!-- Import -->
            <div class="border-t pt-4 border-surface-200 dark:border-surface-700">
                <div class="text-sm font-bold mb-2">Import Page</div>
                <FileUpload mode="basic" name="demo[]" accept=".json" :maxFileSize="1000000" @select="onImportSelect"
                    customUpload auto chooseLabel="Import JSON" class="w-full" />
            </div>
        </div>
    </Drawer>

    <!-- New Page Dialog -->
    <Dialog v-model:visible="isNewPageDialogVisible" header="Create New Page" :style="{ width: '400px' }" modal>
        <div class="flex flex-col gap-4 py-4">
            <div class="flex flex-col gap-2">
                <label for="pageTitle" class="font-bold">Page Title</label>
                <InputText id="pageTitle" v-model="newPageTitle" placeholder="Enter page title" autofocus />
            </div>

            <div class="flex flex-col gap-2">
                <label for="pageTemplate" class="font-bold">Template</label>
                <Select id="pageTemplate" v-model="newPageTemplate" :options="templateOptions" optionLabel="label"
                    optionValue="value" class="w-full" />
            </div>
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
