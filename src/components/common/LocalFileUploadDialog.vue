<script setup lang="ts">
import { ref } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import FileUpload from 'primevue/fileupload';
import DataView from 'primevue/dataview';
import ProgressBar from 'primevue/progressbar';
import { useToast } from 'primevue/usetoast';
import { 
    FileUp, 
    Upload, 
    Trash2, 
    CheckCircle2, 
    AlertCircle, 
    Loader2, 
    LogOut,
    Eye,
    Globe,
    FileText,
    PencilLine
} from 'lucide-vue-next';
import Textarea from 'primevue/textarea';
import InputText from 'primevue/inputtext';
import { useFileStore, LocalFile } from '../../stores/files';
import { useUiStore } from '../../stores/ui';
import { pcgwAuth } from '../../services/pcgwAuth';
import { pcgwMedia } from '../../services/pcgwMedia';
import PcgwLoginDialog from './PcgwLoginDialog.vue';

const props = defineProps<{
    visible: boolean;
    selectionMode?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'selected', filename: string): void;
}>();

const fileStore = useFileStore();
const uiStore = useUiStore();
const toast = useToast();

const isLoginDialogVisible = ref(false);
const isUploading = ref(false);
const uploadProgress = ref(0);
const selectedFile = ref<LocalFile | null>(null);
const showConfirmUpload = ref(false);
const showOverwriteConfirm = ref(false);
const isChecking = ref(false);
const duplicateInfo = ref<{ filename: string; type: 'pre-check' | 'warning' } | null>(null);

const getFileUrl = (blob: Blob) => {
    return URL.createObjectURL(blob);
};

const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const editFilename = ref('');
const editDescription = ref('');

const handleFileUpload = async (event: any) => {
    const files = event.files;
    for (const file of files) {
        try {
            await fileStore.addFile(file);
            toast.add({
                severity: 'success',
                summary: 'File Saved',
                detail: `"${file.name}" saved to local storage.`,
                life: 3000
            });
        } catch (e) {
            toast.add({
                severity: 'error',
                summary: 'Upload Failed',
                detail: `Could not save "${file.name}" locally.`,
                life: 3000
            });
        }
    }
};

const handleRemoveFile = async (id: number) => {
    await fileStore.removeFile(id);
    toast.add({
        severity: 'info',
        summary: 'File Removed',
        detail: 'The file has been deleted from local storage.',
        life: 2000
    });
};

const initiateUpload = (file: LocalFile) => {
    if (!pcgwAuth.isLoggedIn) {
        isLoginDialogVisible.value = true;
        return;
    }
    selectedFile.value = file;
    editFilename.value = file.name;
    editDescription.value = file.description || '';
    showConfirmUpload.value = true;
};

const processUpload = async (force: boolean = false) => {
    if (!selectedFile.value) return;
    
    const file = selectedFile.value;
    
    try {
        // 1. Pre-check if not forced
        if (!force) {
            isChecking.value = true;
            // Check if file exists before showing the full-screen upload overlay
            const exists = await pcgwMedia.checkFileExists(editFilename.value);
            isChecking.value = false;
            
            if (exists) {
                duplicateInfo.value = { filename: editFilename.value, type: 'pre-check' };
                showOverwriteConfirm.value = true;
                return;
            }
        }

        // If we get here, we proceed with the actual upload
        showConfirmUpload.value = false;
        showOverwriteConfirm.value = false;
        isUploading.value = true;
        uploadProgress.value = 0;

        await fileStore.updateFileStatus(file.id!, { status: 'uploading' });
        
        // 2. Attempt Upload
        const attribution = uiStore.autoUploadDescription ? '\n\nUploaded via [https://github.com/maicol07/pcgw_editor PCGW Editor]' : '';
        const result = await pcgwMedia.uploadFile(file.blob, {
            filename: editFilename.value,
            comment: (editDescription.value || '') + attribution,
            ignorewarnings: force
        });

        // 3. Handle Results
        if (result?.upload?.result === 'Success') {
            await fileStore.updateFileStatus(file.id!, { 
                status: 'uploaded',
                name: editFilename.value,
                description: editDescription.value,
                pcgwUrl: result.upload.imageinfo.descriptionurl
            });
            toast.add({
                severity: 'success',
                summary: 'Uploaded Successfully',
                detail: `"${file.name}" is now on PCGW.`,
                life: 5000
            });
        } else if (result?.upload?.result === 'Warning' || result?.warnings) {
            // Check for duplicates in warnings
            const warnings = result.upload?.warnings || result.warnings;
            if (warnings?.duplicate) {
                isUploading.value = false;
                duplicateInfo.value = { filename: editFilename.value, type: 'warning' };
                showOverwriteConfirm.value = true;
                return;
            }
            throw new Error('Upload warning: ' + JSON.stringify(warnings));
        } else {
            throw new Error(result?.upload?.error?.info || result?.error?.info || 'Unknown upload error');
        }
    } catch (e: any) {
        console.error('Upload process failed:', e);
        await fileStore.updateFileStatus(file.id!, { 
            status: 'error', 
            error: e.message 
        });
        toast.add({
            severity: 'error',
            summary: 'Upload Failed',
            detail: e.message,
            life: 5000
        });
    } finally {
        isUploading.value = false;
        selectedFile.value = null;
    }
};

const handleLogout = async () => {
    await pcgwAuth.logout();
    toast.add({
        severity: 'info',
        summary: 'Logged Out',
        detail: 'Successfully logged out from PCGW.',
        life: 3000
    });
};

const selectFile = (file: LocalFile) => {
    if (file.status === 'uploaded') {
        emit('selected', file.name);
        emit('update:visible', false);
    } else {
        toast.add({
            severity: 'warn',
            summary: 'Not Uploaded',
            detail: 'Please upload the file to PCGW before adding it to the gallery.',
            life: 3000
        });
    }
};

const openPcgwPage = (url: string) => {
    window.open(url, '_blank');
};
</script>

<template>
    <Dialog 
        :visible="visible" 
        @update:visible="emit('update:visible', $event)"
        modal 
        header="Local File Manager" 
        class="w-full max-w-4xl mx-4"
        :draggable="false"
    >
        <div class="flex flex-col gap-6">
            <!-- Header/Status Section -->
            <div class="flex items-center justify-between border-b pb-4 border-surface-200 dark:border-surface-700">
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                        <FileUp class="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                        <h3 class="font-bold text-lg">Local Storage</h3>
                        <p class="text-xs text-surface-500">Manage images saved in your browser</p>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <div v-if="pcgwAuth.isLoggedIn" class="flex items-center gap-2 bg-surface-100 dark:bg-surface-800 px-3 py-1.5 rounded-full text-xs">
                        <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span class="font-bold">{{ pcgwAuth.username }}</span>
                        <Button severity="secondary" text rounded size="small" class="h-6! w-6! p-0!" @click="handleLogout" v-tooltip.bottom="'Logout'">
                            <template #icon>
                                <LogOut class="w-3 h-3 text-red-500" />
                            </template>
                        </Button>
                    </div>
                    <Button v-else label="Connect to PCGW" size="small" variant="outlined" @click="isLoginDialogVisible = true">
                        <template #icon>
                            <Globe class="w-4 h-4 mr-2" />
                        </template>
                    </Button>
                </div>
            </div>

            <!-- Upload Zone -->
            <div class="flex flex-col gap-4">
                <FileUpload 
                    name="files[]" 
                    mode="advanced" 
                    multiple 
                    auto 
                    customUpload 
                    @uploader="handleFileUpload" 
                    :maxFileSize="16000000"
                    accept="image/*"
                    class="p-fileupload-compact"
                >
                    <template #empty>
                        <div class="flex flex-col items-center justify-center py-6 gap-2 border-2 border-dashed border-surface-300 dark:border-surface-700 rounded-xl">
                            <Upload class="w-8 h-8 text-surface-400" />
                            <p class="text-sm text-surface-500">Drag and drop images here or browse</p>
                        </div>
                    </template>
                    <template #header="{ chooseCallback }">
                        <div class="flex flex-wrap gap-2">
                            <Button label="Add Files" @click="chooseCallback" severity="secondary" size="small">
                                <template #icon>
                                    <FileUp class="w-4 h-4 mr-2" />
                                </template>
                            </Button>
                        </div>
                    </template>
                    <template #content>
                        <!-- We handle files immediately via uploader -->
                    </template>
                </FileUpload>
            </div>

            <!-- Local Files Grid -->
            <div class="flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <h4 class="font-bold text-sm text-surface-400 uppercase tracking-widest">Saved Files ({{ fileStore.files.length }})</h4>
                    <Button label="Refresh" size="small" text @click="fileStore.loadFiles" />
                </div>

                <div v-if="fileStore.isLoading" class="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 class="w-8 h-8 animate-spin text-primary-500" />
                    <p class="text-sm text-surface-500">Loading files from IndexedDB...</p>
                </div>

                <div v-else-if="fileStore.files.length === 0" class="flex flex-col items-center justify-center py-12 bg-surface-50 dark:bg-surface-900/50 rounded-xl">
                    <p class="text-sm text-surface-400">No files stored locally.</p>
                </div>

                <DataView v-else :value="fileStore.files" layout="grid">
                    <template #grid="slotProps">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                            <div v-for="file in slotProps.items" :key="file.id" class="p-3 border rounded-xl bg-surface-0 dark:bg-surface-900 border-surface-200 dark:border-surface-800 flex flex-col gap-3 hover:shadow-md transition-shadow">
                                <div class="relative group aspect-video rounded-lg overflow-hidden bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                                    <img :src="getFileUrl(file.blob)" class="object-contain h-full w-full" :alt="file.name" />
                                    
                                    <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button size="small" text rounded severity="contrast" @click="openPcgwPage(getFileUrl(file.blob))" v-tooltip.top="'Preview'">
                                            <template #icon><Eye class="w-5 h-5 text-white" /></template>
                                        </Button>
                                    </div>

                                    <!-- Status Badges -->
                                    <div v-if="file.status === 'uploaded'" class="absolute bottom-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
                                        <CheckCircle2 class="w-4 h-4" />
                                    </div>
                                    <div v-else-if="file.status === 'error'" class="absolute bottom-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-lg" v-tooltip.left="file.error">
                                        <AlertCircle class="w-4 h-4" />
                                    </div>
                                    <div v-else-if="file.status === 'uploading'" class="absolute inset-0 bg-surface-900/60 flex items-center justify-center rounded-lg">
                                        <Loader2 class="w-8 h-8 animate-spin text-primary-500" />
                                    </div>
                                </div>

                                <div class="flex flex-col gap-1 overflow-hidden">
                                    <span class="font-bold text-sm truncate" :title="file.name">{{ file.name }}</span>
                                    <span class="text-[10px] text-surface-500">{{ formatSize(file.size) }} • {{ new Date(file.lastModified).toLocaleDateString() }}</span>
                                </div>

                                <div class="flex gap-2 mt-auto">
                                    <template v-if="selectionMode">
                                        <Button v-if="file.status === 'uploaded'" label="Select" size="small" class="flex-1 text-[10px]!" severity="success" @click="selectFile(file)">
                                            <template #icon><CheckCircle2 class="w-3.5 h-3.5 mr-1" /></template>
                                        </Button>
                                        <Button v-else label="Upload to Select" size="small" class="flex-1 text-[10px]!" severity="primary" @click="initiateUpload(file)" :disabled="isUploading">
                                            <template #icon><Upload class="w-3.5 h-3.5 mr-1" /></template>
                                        </Button>
                                    </template>
                                    <template v-else>
                                        <Button v-if="file.status === 'uploaded'" label="View on PCGW" size="small" class="flex-1 text-[10px]!" severity="success" underlined @click="openPcgwPage(file.pcgwUrl!)">
                                            <template #icon><Globe class="w-3.5 h-3.5 mr-1" /></template>
                                        </Button>
                                        <Button v-else label="Upload to PCGW" size="small" class="flex-1 text-[10px]!" severity="primary" @click="initiateUpload(file)" :disabled="isUploading">
                                            <template #icon><Upload class="w-3.5 h-3.5 mr-1" /></template>
                                        </Button>
                                    </template>
                                    
                                    <Button size="small" severity="danger" text class="w-9 h-9 p-0!" @click="handleRemoveFile(file.id!)" :disabled="isUploading" v-tooltip.bottom="'Delete Local'">
                                        <template #icon><Trash2 class="w-4 h-4" /></template>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </template>
                </DataView>
            </div>
        </div>

        <!-- Confirm Upload Dialog -->
        <Dialog v-model:visible="showConfirmUpload" modal header="Confirm Upload" :draggable="false" class="w-full max-w-md">
            <div class="flex flex-col gap-5">
                <div class="flex items-center gap-4 bg-primary-50 dark:bg-primary-900/10 p-4 rounded-xl border border-primary-100 dark:border-primary-900/20">
                    <div class="p-2.5 bg-primary-500 rounded-lg shadow-lg">
                        <Upload class="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p class="font-bold text-xs text-primary-600 uppercase tracking-widest">Step 2: Wiki Metadata</p>
                        <p class="text-xs opacity-70">Review and edit file details before sending to PCGW.</p>
                    </div>
                </div>

                <div class="flex flex-col gap-4">
                    <div class="flex flex-col gap-1.5">
                        <label for="editFilename" class="text-[10px] font-bold text-surface-500 uppercase flex items-center gap-1.5">
                            <PencilLine class="w-3 h-3" /> Target Filename
                        </label>
                        <InputText id="editFilename" v-model="editFilename" class="w-full text-sm!" />
                        <p class="text-[10px] text-surface-400">Must include extension (e.g. .png, .jpg)</p>
                    </div>

                    <div class="flex flex-col gap-1.5">
                        <label for="editDescription" class="text-[10px] font-bold text-surface-500 uppercase flex items-center gap-1.5">
                            <FileText class="w-3 h-3" /> Description / Comment
                        </label>
                        <Textarea id="editDescription" v-model="editDescription" rows="3" class="w-full text-sm! resize-none" placeholder="Enter a brief description for the wiki log..." />
                    </div>
                </div>

                <div class="flex gap-2 mt-2">
                    <Button label="Cancel" severity="secondary" text class="flex-1" @click="showConfirmUpload = false" :disabled="isChecking" />
                    <Button label="Confirm & Upload" severity="primary" class="flex-1" @click="() => processUpload()" :loading="isChecking">
                        <template #loadingicon>
                            <Loader2 class="w-4 h-4 animate-spin mr-2" />
                        </template>
                    </Button>
                </div>
            </div>
        </Dialog>
        
        <!-- Overwrite Confirmation Dialog -->
        <Dialog v-model:visible="showOverwriteConfirm" modal header="File Already Exists" :draggable="false" class="w-full max-w-sm">
            <div class="flex flex-col gap-5">
                <div class="flex flex-col items-center text-center gap-3">
                    <div class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-full">
                        <AlertCircle class="w-8 h-8 text-amber-500" />
                    </div>
                    <div>
                        <h3 class="font-bold text-lg">Overwrite File?</h3>
                        <p class="text-sm text-surface-500 mt-1">
                            A file named <strong>{{ duplicateInfo?.filename }}</strong> already exists on PCGamingWiki. 
                            Uploading will create a new version.
                        </p>
                    </div>
                </div>

                <div class="flex gap-2">
                    <Button label="Cancel" severity="secondary" text class="flex-1" @click="showOverwriteConfirm = false" />
                    <Button label="Overwrite" severity="warning" class="flex-1" @click="processUpload(true)" />
                </div>
            </div>
        </Dialog>

        <PcgwLoginDialog v-model:visible="isLoginDialogVisible" />

        <div v-if="isUploading" class="fixed inset-0 z-2000 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
            <div class="w-full max-w-md bg-surface-0 dark:bg-surface-900 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 border border-surface-200 dark:border-surface-800">
                <div class="flex items-center justify-between">
                    <span class="font-bold">Uploading to PCGamingWiki...</span>
                    <Loader2 class="w-5 h-5 animate-spin text-primary-500" />
                </div>
                <ProgressBar mode="indeterminate" class="h-2" />
                <p class="text-xs text-surface-500 text-center italic">This may take a moment depending on the file size.</p>
            </div>
        </div>
    </Dialog>
</template>

<style scoped>
:deep(.p-fileupload-compact .p-fileupload-content) {
    padding: 0;
}
:deep(.p-fileupload-compact .p-fileupload-buttonbar) {
    border: none;
    background: transparent;
    padding: 0 0 1rem 0;
}
</style>
