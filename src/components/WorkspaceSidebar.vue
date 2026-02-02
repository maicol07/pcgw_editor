<script setup lang="ts">
import { useWorkspaceStore } from '../stores/workspace';
import Drawer from 'primevue/drawer';
import Button from 'primevue/button';
import FileUpload from 'primevue/fileupload';
import { computed } from 'vue';
import { Plus, Pencil, Download, Trash2 } from 'lucide-vue-next';

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
    <Drawer v-model:visible="visibleState" header="Workspace" position="left" class="!w-full md:!w-80">
        <div class="flex flex-col h-full gap-4">
            
            <!-- Actions -->
            <div class="flex gap-2">
                <Button label="New Page" class="flex-1" @click="store.createPage('Untitled Page')">
                    <template #icon><Plus class="w-4 h-4" /></template>
                </Button>
            </div>

            <!-- Page List -->
            <div class="flex-1 overflow-y-auto border border-surface-200 dark:border-surface-700 rounded-lg p-2">
                <div v-for="page in store.pages" :key="page.id" 
                    class="p-3 mb-2 rounded-lg cursor-pointer transition-colors border group relative"
                    :class="[
                        page.id === store.activePageId 
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500' 
                        : 'bg-surface-50 dark:bg-surface-800 border-transparent hover:border-surface-300 dark:hover:border-surface-600'
                    ]"
                    @click="store.setActivePage(page.id)"
                >
                    <div class="flex justify-between items-start">
                        <div class="font-medium truncate pr-20" :title="page.title">{{ page.title }}</div>
                        
                        <!-- Actions -->
                         <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 bg-surface-0 dark:bg-surface-900 shadow-sm rounded transition-opacity duration-200">
                            <Button text rounded size="small" class="!h-[34px] !w-[34px]" @click.stop="customRename(page)" v-tooltip.top="'Rename'">
                                <template #icon><Pencil class="!w-6 !h-6" /></template>
                            </Button>
                            <Button text rounded size="small" class="!h-[34px] !w-[34px]" @click.stop="store.exportPage(page.id)" v-tooltip.top="'Export JSON'">
                                <template #icon><Download class="!w-6 !h-6" /></template>
                            </Button>
                            <Button text rounded severity="danger" size="small" class="!h-[34px] !w-[34px]" @click.stop="store.deletePage(page.id)" v-tooltip.top="'Delete'">
                                <template #icon><Trash2 class="!w-6 !h-6" /></template>
                            </Button>
                         </div>
                    </div>
                    <div class="text-xs text-surface-500 mt-2">
                        {{ formatDate(page.lastModified) }}
                    </div>
                </div>
            </div>

            <!-- Import -->
            <div class="border-t pt-4 border-surface-200 dark:border-surface-700">
                <div class="text-sm font-bold mb-2">Import Page</div>
                <FileUpload 
                    mode="basic" 
                    name="demo[]" 
                    accept=".json" 
                    :maxFileSize="1000000" 
                    @select="onImportSelect"
                    customUpload 
                    auto 
                    chooseLabel="Import JSON"
                    class="w-full"
                />
            </div>
        </div>
    </Drawer>
</template>

<style scoped>
/* Custom Scrollbar for list */
</style>
