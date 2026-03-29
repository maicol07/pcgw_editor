<script setup lang="ts">
import { ref, computed, watchEffect, reactive, watch } from 'vue';
import { useFileStore, LocalFile } from '../stores/files';
import { useUiStore } from '../stores/ui';
import { useToast } from 'primevue/usetoast';
import { pcgwAuth } from '../services/pcgwAuth';
import { pcgwMedia } from '../services/pcgwMedia';
import { pcgwApi } from '../services/pcgwApi';
import type { GalleryImage } from '../models/GameData';
import AutocompleteField from './AutocompleteField.vue';
import Button from 'primevue/button';
import { VueDraggable } from 'vue-draggable-plus';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import InputText from 'primevue/inputtext';
import ProgressBar from 'primevue/progressbar';
import FileUpload from 'primevue/fileupload';
import Menu from 'primevue/menu';
import MultiSelect from 'primevue/multiselect';
import InputNumber from 'primevue/inputnumber';
import RadioButton from 'primevue/radiobutton';
import ToggleSwitch from 'primevue/toggleswitch';
import PcgwLoginDialog from './common/PcgwLoginDialog.vue';
import WysiwygEditor from './common/WysiwygEditor.vue';
import {
    Images, Image, GripHorizontal, ExternalLink, Pencil, Trash2, PanelRight, Grid,
    Upload, CheckCircle2, AlertCircle, Loader2, LogOut, HardDrive, MoreVertical, User, Plus, Info, Replace, TextCursorInput, Link, Crop, Combine
} from 'lucide-vue-next';
import { calculateSha1 } from '../utils/crypto';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

interface Props {
    modelValue: (GalleryImage | string)[];
    section: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: (GalleryImage | string)[]): void;
}>();

const newImage = ref('');
const displayImages = computed({
    get: (): GalleryImage[] => {
        const raw = props.modelValue || [];
        return raw.map((item: GalleryImage | string) => {
            if (typeof item === 'string') {
                return { name: item, caption: '', position: 'gallery' };
            }
            // Ensure position exists
            const galleryItem = { ...item };
            if (!galleryItem.position) galleryItem.position = 'gallery';
            return galleryItem;
        });
    },
    set: (val: GalleryImage[]) => {
        emit('update:modelValue', val);
    }
});

const editingIndex = ref<number | null>(null);

const openCaptionDialog = (img: GalleryImage, index: number) => {
    editingImage.value = img;
    editingIndex.value = index;
    editingCaption.value = img.caption || '';
    showCaptionDialog.value = true;
};

const saveCaption = () => {
    if (editingIndex.value !== null) {
        const newValue = [...(props.modelValue || [])];
        const item = newValue[editingIndex.value];

        if (typeof item === 'string') {
            newValue[editingIndex.value] = { name: item, caption: editingCaption.value, position: 'gallery' };
        } else {
            newValue[editingIndex.value] = { ...item, caption: editingCaption.value };
        }
        emit('update:modelValue', newValue);
    }
    showCaptionDialog.value = false;
    editingIndex.value = null;
    editingImage.value = null;
};

// Caption Edit State
const editingImage = ref<GalleryImage | null>(null);
const editingCaption = ref('');
const showCaptionDialog = ref(false);

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

const editFilename = ref('');
const editDescription = ref('');

// Matching Wiki Files State
const matchingWikiFiles = reactive<Record<number, string[]>>({});

const checkMatch = async (localId: number) => {
    const file = fileStore.files.find(f => f.id === localId);
    if (!file) return;

    try {
        const sha1 = await calculateSha1(file.blob);
        const matches = await pcgwApi.getImagesByHash(sha1);
        matchingWikiFiles[localId] = matches;
    } catch (e) {
        console.error('Failed to check match for local file:', e);
    }
};

// Watch for local images and check matches
watchEffect(() => {
    displayImages.value.forEach(img => {
        if (img.localId !== undefined && matchingWikiFiles[img.localId] === undefined) {
            checkMatch(img.localId);
        }
    });
});
const fileUploadRef = ref<any>(null);
const replaceFileUploadRef = ref<any>(null);
const showSearchDialog = ref(false);
const replaceImageIndex = ref<number | null>(null);

const menu = ref();
const activeItem = ref<{ element: GalleryImage; index: number } | null>(null);

const toggleMenu = (event: any, element: GalleryImage, index: number) => {
    activeItem.value = { element, index };
    menu.value.toggle(event);
};

const actionMenuItems = computed<any[]>(() => {
    if (!activeItem.value) return [];
    const { element } = activeItem.value;

    const items: any[] = [];

    if (element.localId !== undefined) {
        // Local file actions
        items.push({
            label: 'View image',
            icon: ExternalLink,
            url: getImageUrl(element),
            target: '_blank',
            rel: 'noreferrer'
        });

        const matches = matchingWikiFiles[element.localId] || [];
        matches.forEach(match => {
            items.push({
                label: `Link to existing PCGW file (${match})`,
                icon: Link,
                command: () => linkToWiki(element.localId!, match)
            });
        });

        if (matches.length > 0) {
            items.push({ separator: true });
        }

        items.push({
            label: 'Rename local file',
            icon: TextCursorInput,
            command: () => initiateRename(element)
        });
        items.push({
            label: 'Crop image',
            icon: Crop,
            command: () => initiateCrop({ type: 'gallery', galleryItem: element })
        });
        if (element.combineConfig) {
            items.push({
                label: 'Edit layout combination',
                icon: Combine,
                command: () => triggerEditCombine(activeItem.value!.index)
            });
        }
        items.push({
            label: 'Replace with another image',
            icon: Replace,
            command: () => triggerReplace(activeItem.value!.index)
        });
    } else {
        // Wiki file actions
        items.push({
            label: 'View on PCGW',
            icon: ExternalLink,
            url: `https://www.pcgamingwiki.com/wiki/File:${encodeURIComponent(element.name.replace(/ /g, '_'))}`,
            target: '_blank',
            rel: 'noreferrer'
        });
        items.push({
            label: 'Edit wiki description',
            icon: Pencil,
            command: () => initiateEdit(element)
        });
        items.push({
            label: 'Rename wiki file',
            icon: TextCursorInput,
            command: () => initiateRename(element)
        });
        items.push({
            label: 'Delete from PCGW',
            icon: Trash2,
            class: 'text-red-500',
            command: () => initiateDelete(element)
        });
        items.push({
            separator: true
        });
        items.push({
            label: 'Replace with local image',
            icon: Replace,
            command: () => triggerReplace(activeItem.value!.index)
        });
    }

    return items;
});

const triggerReplace = (index: number) => {
    replaceImageIndex.value = index;
    replaceFileUploadRef.value?.choose();
};

const handleReplaceUpload = async (event: any) => {
    if (replaceImageIndex.value === null) return;

    const file = event.files[0];
    if (!file) return;

    try {
        const newValue = [...(props.modelValue || [])];
        const item = newValue[replaceImageIndex.value];

        if (typeof item !== 'string' && item.localId !== undefined) {
            await fileStore.removeFile(item.localId).catch(console.error);
        }

        const id = await fileStore.addFile(file);

        const galleryItem: GalleryImage = {
            name: file.name,
            caption: typeof item === 'string' ? '' : (item.caption || ''),
            position: typeof item === 'string' ? 'gallery' : (item.position || 'gallery'),
            localId: id
        };

        newValue[replaceImageIndex.value] = galleryItem;
        emit('update:modelValue', newValue);

        toast.add({
            severity: 'success',
            summary: 'Image Replaced',
            detail: `Replaced with local file "${file.name}".`,
            life: 3000
        });
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: 'Replace Failed',
            detail: `Could not process replacement file.`,
            life: 3000
        });
    } finally {
        replaceImageIndex.value = null;
    }
};

const linkToWiki = (localId: number, wikiFilename: string) => {
    const newValue = [...(props.modelValue || [])];
    const index = newValue.findIndex(img => 
        typeof img !== 'string' && img.localId === localId
    );

    if (index !== -1) {
        const item = newValue[index] as GalleryImage;
        newValue[index] = {
            ...item,
            name: wikiFilename,
            localId: undefined // Link complete
        };
        emit('update:modelValue', newValue);
        
        toast.add({
            severity: 'success',
            summary: 'Linked to PCGW',
            detail: `"${wikiFilename}" is now linked to the gallery item.`,
            life: 3000
        });
    }
};

const handleLocalMenuUpload = async (event: any) => {
    const files = event.files;
    const newlyAddedImages: GalleryImage[] = [];

    for (const file of files) {
        try {
            const id = await fileStore.addFile(file);
            const newImage: GalleryImage = {
                name: file.name,
                caption: '',
                position: 'gallery',
                localId: id
            };
            newlyAddedImages.push(newImage);
            
            toast.add({
                severity: 'success',
                summary: 'Added Local File',
                detail: `"${file.name}" added to gallery.`,
                life: 3000
            });
        } catch (e) {
            toast.add({
                severity: 'error',
                summary: 'Add Failed',
                detail: `Could not add "${file.name}".`,
                life: 3000
            });
        }
    }

    if (newlyAddedImages.length > 0) {
        emit('update:modelValue', [...(props.modelValue || []), ...newlyAddedImages]);
        
        if (cropOnUpload.value) {
            const jobs: CropJob[] = newlyAddedImages.map(img => ({ type: 'gallery', galleryItem: img }));
            croppingQueue.value = [...croppingQueue.value, ...jobs];
            // Only start if not already cropping
            if (!showCropDialog.value) {
                processNextCrop();
            }
        }
    }
    
    fileUploadRef.value?.clear();
    showSearchDialog.value = false;
};

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

const addImage = () => {
    if (newImage.value) {
        // Handle both single and multiple selections from Autocomplete
        const items = Array.isArray(newImage.value) ? newImage.value : [newImage.value];
        const newImages: GalleryImage[] = items.map((name: string) => ({ name: name, caption: '', position: 'gallery' }));
        emit('update:modelValue', [...(props.modelValue || []), ...newImages]);
        newImage.value = '';
    }
};

const removeImage = (index: number) => {
    const newValue = [...(props.modelValue || [])];
    const item = newValue[index];
    if (typeof item !== 'string' && item.localId !== undefined) {
        fileStore.removeFile(item.localId).catch(console.error);
    }
    newValue.splice(index, 1);
    emit('update:modelValue', newValue);
};

const togglePosition = (index: number) => {
    const newValue = [...(props.modelValue || [])];
    const item = newValue[index];

    let galleryItem: GalleryImage;
    if (typeof item === 'string') {
        galleryItem = { name: item, caption: '', position: 'gallery' };
    } else {
        galleryItem = { ...item };
    }

    // Toggle
    const newPos = galleryItem.position === 'lateral' ? 'gallery' : 'lateral';
    galleryItem.position = newPos;
    newValue[index] = galleryItem;
    emit('update:modelValue', newValue);
};

const initiateUpload = (file: LocalFile | GalleryImage) => {
    if (!pcgwAuth.isLoggedIn) {
        isLoginDialogVisible.value = true;
        return;
    }

    if ('localId' in file && file.localId) {
        const localFile = fileStore.files.find(f => f.id === file.localId);
        if (localFile) {
            selectedFile.value = localFile;
            editFilename.value = localFile.name;
            editDescription.value = localFile.description || '';
        }
    } else {
        selectedFile.value = file as LocalFile;
        editFilename.value = (file as LocalFile).name;
        editDescription.value = (file as LocalFile).description || '';
    }
    showConfirmUpload.value = true;
};

const processUpload = async (force: boolean = false) => {
    if (!selectedFile.value) return;

    const file = selectedFile.value;

    try {
        // 1. Pre-check if not forced
        if (!force) {
            isChecking.value = true;
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
            // Update resolved info immediately for reactivity
            resolvedInfos[normalizeFilename(editFilename.value)] = {
                url: result.upload.imageinfo.url,
                user: pcgwAuth.username || '',
                size: result.upload.imageinfo.size,
                width: result.upload.imageinfo.width,
                height: result.upload.imageinfo.height,
                canonicalName: normalizeFilename(editFilename.value)
            };

            await fileStore.updateFileStatus(file.id!, {
                status: 'uploaded',
                name: editFilename.value,
                description: editDescription.value,
                pcgwUrl: result.upload.imageinfo.descriptionurl
            });

            // Update gallery item if this was a local placeholder
            const newValue = [...(props.modelValue || [])];
            const placeholderIndex = newValue.findIndex(img =>
                typeof img !== 'string' && img.localId === file.id
            );

            if (placeholderIndex !== -1) {
                const item = newValue[placeholderIndex] as GalleryImage;
                newValue[placeholderIndex] = {
                    ...item,
                    name: editFilename.value,
                    localId: undefined // No longer a local placeholder
                };
                emit('update:modelValue', newValue);
            }

            toast.add({
                severity: 'success',
                summary: 'Uploaded Successfully',
                detail: `"${file.name}" is now on PCGW.`,
                life: 5000
            });
        } else if (result?.upload?.result === 'Warning' || result?.warnings) {
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
        if (!showOverwriteConfirm.value) {
            selectedFile.value = null;
        }
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



// Rename Logic
const showRenameDialog = ref(false);
const renamingImage = ref<GalleryImage | null>(null);
const newRenameName = ref('');
const isRenaming = ref(false);

const initiateRename = (element: GalleryImage) => {
    if (!pcgwAuth.isLoggedIn) {
        toast.add({
            severity: 'warn',
            summary: 'Authentication Required',
            detail: 'Please login to PCGW to rename files.',
            life: 3000
        });
        return;
    }
    renamingImage.value = element;
    newRenameName.value = element.name;
    showRenameDialog.value = true;
};

const handleConfirmRename = async () => {
    if (!renamingImage.value || !newRenameName.value.trim() || newRenameName.value.trim() === renamingImage.value.name) {
        showRenameDialog.value = false;
        return;
    }

    isRenaming.value = true;
    try {
        const fromName = renamingImage.value.name;
        const toName = newRenameName.value.trim();

        if (renamingImage.value.localId !== undefined) {
            // Local rename
            await fileStore.updateFileStatus(renamingImage.value.localId, { name: toName });
        } else {
            // Wiki rename
            await pcgwMedia.moveFile(fromName, toName, 'Renaming file via PCGW Editor');
            // Update local cache if possible or just rely on next fetch
            pcgwApi.resetCache();
        }

        // Update modelValue
        const newValue = [...(props.modelValue || [])];
        const itemIdx = newValue.findIndex(img => (typeof img === 'string' ? img : img.name) === fromName);
        if (itemIdx !== -1) {
            const item = newValue[itemIdx];
            if (typeof item === 'string') {
                newValue[itemIdx] = toName;
            } else {
                newValue[itemIdx] = { ...item, name: toName };
            }
            emit('update:modelValue', newValue);
        }

        toast.add({
            severity: 'success',
            summary: 'File Renamed',
            detail: `"${fromName}" moved to "${toName}".`,
            life: 3000
        });
        showRenameDialog.value = false;
    } catch (e: any) {
        toast.add({
            severity: 'error',
            summary: 'Rename Failed',
            detail: e.message || 'Failed to rename file.',
            life: 5000
        });
    } finally {
        isRenaming.value = false;
    }
};

// Edit Dialog Logic
const showPcgwEditDialog = ref(false);
const pcgwEditingImage = ref<{ name: string; description: string } | null>(null);
const isSavingEdit = ref(false);
const isFetchingContent = ref(false);

const initiateEdit = async (element: GalleryImage) => {
    if (!pcgwAuth.isLoggedIn) {
        toast.add({
            severity: 'warn',
            summary: 'Authentication Required',
            detail: 'Please login to PCGW to edit file descriptions.',
            life: 3000
        });
        return;
    }

    // Pre-fill with local description if available (useful for recently uploaded files)
    let initialDescription = '';
    const localMatch = fileStore.files.find(f => normalizeFilename(f.name) === normalizeFilename(element.name));
    if (localMatch?.description) {
        initialDescription = localMatch.description;
    }

    pcgwEditingImage.value = { name: element.name, description: initialDescription };
    showPcgwEditDialog.value = true;
    isFetchingContent.value = true;

    try {
        const content = await pcgwApi.getPageContent(`File:${element.name}`);
        if (content !== null) {
            pcgwEditingImage.value.description = content;
        }
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: 'Fetch Failed',
            detail: 'Could not retrieve current file description.',
            life: 3000
        });
    } finally {
        isFetchingContent.value = false;
    }
};

const handleSaveEdit = async () => {
    if (!pcgwEditingImage.value) return;

    isSavingEdit.value = true;
    try {
        await pcgwMedia.editPage(
            `File:${pcgwEditingImage.value.name}`,
            pcgwEditingImage.value.description,
            'Edited file description via PCGW Editor'
        );

        toast.add({
            severity: 'success',
            summary: 'Updated',
            detail: 'File description updated successfully.',
            life: 3000
        });
        showPcgwEditDialog.value = false;
    } catch (e: any) {
        toast.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: e.message || 'Failed to update description.',
            life: 5000
        });
    } finally {
        isSavingEdit.value = false;
    }
};

// Deletion Dialog Logic
const showPcgwDeleteDialog = ref(false);
const pcgwDeletingImage = ref<GalleryImage | null>(null);
const pcgwDeletionReason = ref('');
const isSavingDelete = ref(false);
const isCheckingExistingDelete = ref(false);
const existingDeletionReason = ref<string | null>(null);

const initiateDelete = async (element: GalleryImage) => {
    if (!pcgwAuth.isLoggedIn) {
        toast.add({
            severity: 'warn',
            summary: 'Authentication Required',
            detail: 'Please login to PCGW to request file deletion.',
            life: 3000
        });
        return;
    }
    pcgwDeletingImage.value = element;
    pcgwDeletionReason.value = '';
    existingDeletionReason.value = null;
    showPcgwDeleteDialog.value = true;

    // Check for existing deletion request
    isCheckingExistingDelete.value = true;
    try {
        const title = `File:${element.name}`;
        const content = await pcgwApi.getPageContent(title);
        if (content) {
            // Match {{delete|reason=...}} or {{delete}}
            const deleteMatch = content.match(/\{\{delete(?:\s*\|\s*reason\s*=\s*([^}]*))?\}\}/i);
            if (deleteMatch) {
                existingDeletionReason.value = deleteMatch[1]?.trim() || 'No reason specified';
                // Pre-fill with existing reason if user wants to edit it
                pcgwDeletionReason.value = deleteMatch[1]?.trim() || '';
            }
        }
    } catch (e) {
        console.error('Failed to check for existing deletion tag:', e);
    } finally {
        isCheckingExistingDelete.value = false;
    }
};

const handleConfirmDelete = async () => {
    if (!pcgwDeletingImage.value) return;

    isSavingDelete.value = true;
    try {
        const title = `File:${pcgwDeletingImage.value.name}`;
        let currentContent = await pcgwApi.getPageContent(title) || '';

        const deleteTemplate = pcgwDeletionReason.value.trim()
            ? `{{delete|reason=${pcgwDeletionReason.value.trim()}}}`
            : '{{delete}}';

        let newContent = '';
        const deleteRegex = /\{\{delete(?:\s*\|\s*reason\s*=\s*[^}]*)?\}\}/gi;

        if (deleteRegex.test(currentContent)) {
            // Replace existing tags
            newContent = currentContent.replace(deleteRegex, deleteTemplate);
        } else {
            // Prepend new tag
            newContent = `${deleteTemplate}\n${currentContent}`;
        }

        await pcgwMedia.editPage(title, newContent, 'Requesting file deletion via template (updated)');

        toast.add({
            severity: 'success',
            summary: 'Request Sent',
            detail: 'Deletion request template added to the file.',
            life: 3000
        });
        showPcgwDeleteDialog.value = false;
    } catch (e: any) {
        toast.add({
            severity: 'error',
            summary: 'Request Failed',
            detail: e.message || 'Failed to request deletion.',
            life: 5000
        });
    } finally {
        isSavingDelete.value = false;
    }
};

const normalizeFilename = (name: string) => name.replace(/_/g, ' ').trim();

// Resolved image info (url and uploader)
const resolvedInfos = reactive<Record<string, { url: string; user: string; size: number; width: number; height: number; canonicalName: string }>>({});

// Fetch info for images
watchEffect(() => {
    props.modelValue?.forEach(async (img) => {
        const currentName = typeof img === 'string' ? img : img.name;
        const normalizedItemName = normalizeFilename(currentName);
        if (!resolvedInfos[normalizedItemName]) {
            const info = await pcgwApi.getImageInfo(currentName);
            if (info) {
                resolvedInfos[normalizedItemName] = info;

                // Sync model if it's a redirect
                if (info.canonicalName !== normalizedItemName) {
                    const newValue = [...(props.modelValue || [])];
                    const idx = newValue.findIndex(item => (typeof item === 'string' ? item : item.name) === currentName);
                    if (idx !== -1) {
                        const item = newValue[idx];
                        if (typeof item === 'string') {
                            newValue[idx] = info.canonicalName;
                        } else {
                            newValue[idx] = { ...item, name: info.canonicalName };
                        }
                        emit('update:modelValue', newValue);
                        
                        toast.add({
                            severity: 'info',
                            summary: 'Filename Synchronized',
                            detail: `"${currentName}" redirected to "${info.canonicalName}" on PCGW. Editor updated to current name.`,
                            life: 5000
                        });
                    }
                }
            }
        }
    });
});

const getImageUrl = (element: GalleryImage) => {
    if (element.localId) {
        const file = fileStore.files.find(f => f.id === element.localId);
        if (file) return getFileUrl(file.blob);
    }
    return resolvedInfos[normalizeFilename(element.name)]?.url;
};



const getLocalFile = (localId?: number) => {
    if (!localId) return null;
    return fileStore.files.find(f => f.id === localId);
};

const handleSuggestionsUpdate = async (suggestions: string[]) => {
    const toFetch = suggestions.filter(name => !resolvedInfos[normalizeFilename(name)]);
    if (toFetch.length > 0) {
        const infos = await pcgwApi.getImagesInfo(toFetch);
        Object.keys(infos).forEach(key => {
            resolvedInfos[normalizeFilename(key)] = infos[key];
        });
    }
};

// Crop Logic
const showCropDialog = ref(false);
const croppingImage = ref<GalleryImage | null>(null);
const cropperRef = ref<any>(null);
const isCropping = ref(false);
const cropImageUrl = ref<string>('');
const cropOnUpload = ref(false);

interface CropJob {
    type: 'gallery' | 'combine';
    galleryItem?: GalleryImage;
    combineItem?: CombineItem;
}

const croppingQueue = ref<CropJob[]>([]);
const currentManualCropJob = ref<CropJob | null>(null);

const initiateCrop = (job: CropJob) => {
    if (job.type === 'gallery' && job.galleryItem?.localId !== undefined) {
        const file = fileStore.files.find(f => f.id === job.galleryItem?.localId);
        if (!file) return;
        croppingImage.value = job.galleryItem;
        cropImageUrl.value = getFileUrl(file.blob);
    } else if (job.type === 'combine' && job.combineItem) {
        if (!job.combineItem.url) return;
        cropImageUrl.value = job.combineItem.url;
        // We set a placeholder for the gallery image to keep progressbar/dialog happy
        croppingImage.value = { 
            name: job.combineItem.name, 
            caption: '', 
            position: 'gallery',
            localId: job.combineItem.localId || 0
        };
    } else {
        return;
    }
    
    // If not triggered by the auto-uploader queue, track it manually
    if (!croppingQueue.value.find((j: CropJob) => j === job)) {
        currentManualCropJob.value = job;
    }
    
    showCropDialog.value = true;
};

const processNextCrop = () => {
    if (croppingQueue.value.length > 0) {
        initiateCrop(croppingQueue.value[0]);
    }
};

const handleConfirmCrop = async () => {
    if (!cropperRef.value || !croppingImage.value) return;

    isCropping.value = true;
    const { canvas } = cropperRef.value.getResult();
    if (!canvas) {
        isCropping.value = false;
        return;
    }

    canvas.toBlob(async (blob: Blob | null) => {
        if (!blob) {
            isCropping.value = false;
            return;
        }

        const currentJob = croppingQueue.value[0] || currentManualCropJob.value;
        if (!currentJob) {
            isCropping.value = false;
            return;
        }

        if (currentJob.type === 'gallery' && currentJob.galleryItem?.localId !== undefined) {
            const localFile = fileStore.files.find(f => f.id === currentJob.galleryItem?.localId);
            if (localFile) {
                const newFile = new File([blob], localFile.name, { type: blob.type, lastModified: Date.now() });
                await fileStore.updateFileStatus(localFile.id!, {
                    blob: newFile,
                    size: newFile.size,
                    type: newFile.type,
                    lastModified: newFile.lastModified
                });
            }
        } else if (currentJob.type === 'combine' && currentJob.combineItem) {
            const item = currentJob.combineItem;
            // Create a brand new file from the blob
            const newFile = new File([blob], item.name, { type: 'image/png', lastModified: Date.now() });
            
            // If it's a local file, also update it in the file store so it persists
            if (item.localId) {
                await fileStore.updateFileStatus(item.localId, {
                    blob: newFile,
                    size: newFile.size,
                    type: newFile.type,
                    lastModified: newFile.lastModified
                });
            } else {
                item.localId = await fileStore.addFile(newFile);
                item.type = 'local';
                item.id = 'local-' + item.localId;
            }
            
            item.file = newFile;
            if (item.url && item.url.startsWith('blob:')) URL.revokeObjectURL(item.url);
            item.url = URL.createObjectURL(newFile);
            
            // Force reactivity by re-assigning the item in the queue if possible
            const qIdx = combineQueue.value.indexOf(item);
            if (qIdx !== -1) {
                combineQueue.value[qIdx] = { ...item };
            }
        }

        toast.add({
            severity: 'success',
            summary: 'Image Cropped',
            detail: `"${currentJob.galleryItem?.name || currentJob.combineItem?.name}" has been successfully cropped.`,
            life: 3000
        });

        showCropDialog.value = false;
    }, 'image/png');
};

watch(showCropDialog, (newVal) => {
    if (!newVal && croppingImage.value) {
        croppingImage.value = null;
        isCropping.value = false;
        cropImageUrl.value = '';
        currentManualCropJob.value = null;

        if (croppingQueue.value.length > 0) {
            croppingQueue.value.shift();
            if (croppingQueue.value.length > 0) {
                setTimeout(() => {
                    processNextCrop();
                }, 300); // Wait for dialog animation
            }
        }
    }
});

const closeCropDialog = () => {
    showCropDialog.value = false;
};

// Combine Images Logic
const showCombineDialog = ref(false);
const combineOrientation = ref<'horizontal' | 'vertical'>('vertical');
const combineGap = ref<number>(0);

interface CombineItem {
    id: string;
    type: 'local' | 'gallery';
    file?: File;
    galleryImage?: GalleryImage;
    localId?: number;
    url?: string;
    name: string;
}

const combineQueue = ref<CombineItem[]>([]);
const combinePreviewUrl = ref<string>('');
const isCombining = ref(false);
const isGeneratingPreview = ref(false);
const combineUploadRef = ref<any>(null);

// For selecting existing images into the queue
const combineTempGallerySelection = ref<any[]>([]);

const handleCombineTempSelect = async () => {
    // Add newly selected valid images
    for (const img of combineTempGallerySelection.value) {
        const itemObj = typeof img === 'string' ? { name: img } as GalleryImage : img;
        const exists = combineQueue.value.some(q => q.type === 'gallery' && q.name === itemObj.name);
        if (!exists) {
            let url = getImageUrl(itemObj);
            if (!url) {
                const info = await pcgwApi.getImageInfo(itemObj.name);
                if (info) {
                    resolvedInfos[normalizeFilename(itemObj.name)] = info;
                    url = info.url;
                }
            }
            
            if (url) {
                combineQueue.value.push({
                    id: 'gallery-' + Math.random().toString(36).substring(2, 9),
                    type: 'gallery',
                    galleryImage: itemObj,
                    url,
                    name: itemObj.name
                });
            }
        }
    }
    combineTempGallerySelection.value = [];
};

const handleCombineLocalUpload = async (event: any) => {
    const newItems: CombineItem[] = [];
    for (const file of event.files) {
        const id = await fileStore.addFile(file);
        const item: CombineItem = {
            id: 'local-' + id,
            type: 'local',
            file,
            localId: id,
            url: URL.createObjectURL(file), // Need object URL for canvas drawing & preview rendering
            name: file.name
        };
        newItems.push(item);
    }
    combineQueue.value = [...combineQueue.value, ...newItems];

    if (cropOnUpload.value) {
        const jobs: CropJob[] = newItems.map(item => ({ type: 'combine', combineItem: item }));
        croppingQueue.value = [...croppingQueue.value, ...jobs];
        if (!showCropDialog.value) {
            processNextCrop();
        }
    }
    combineUploadRef.value?.clear();
};

const removeCombineItem = (index: number) => {
    const item = combineQueue.value[index];
    if (item.type === 'local' && item.url) {
        URL.revokeObjectURL(item.url);
    }
    combineQueue.value.splice(index, 1);
};

// Generate Preview live!
let previewObjUrlBlob: Blob | null = null;
const generatePreview = async () => {
    if (combineQueue.value.length === 0) {
        if (combinePreviewUrl.value) URL.revokeObjectURL(combinePreviewUrl.value);
        combinePreviewUrl.value = '';
        previewObjUrlBlob = null;
        return;
    }
    
    isGeneratingPreview.value = true;
    try {
        const sources = combineQueue.value.map(item => item.url).filter(Boolean) as string[];
        
        const images = await Promise.all(sources.map(src => {
            return new Promise<HTMLImageElement>((resolve, reject) => {
                const imgElement = new window.Image();
                imgElement.crossOrigin = 'anonymous';
                imgElement.onload = () => resolve(imgElement);
                imgElement.onerror = () => reject(new Error('Failed to load image from URL'));
                imgElement.src = src;
            });
        }));

        let totalWidth = 0;
        let totalHeight = 0;
        const gap = combineGap.value || 0;

        if (combineOrientation.value === 'horizontal') {
            totalHeight = Math.max(...images.map(i => i.height));
            totalWidth = images.reduce((sum, i) => sum + i.width, 0) + gap * Math.max(0, images.length - 1);
        } else {
            totalWidth = Math.max(...images.map(i => i.width));
            totalHeight = images.reduce((sum, i) => sum + i.height, 0) + gap * Math.max(0, images.length - 1);
        }

        const canvas = document.createElement('canvas');
        canvas.width = totalWidth;
        canvas.height = totalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No 2D context');

        ctx.clearRect(0, 0, totalWidth, totalHeight);

        let currentX = 0;
        let currentY = 0;

        for (const imgElement of images) {
            if (combineOrientation.value === 'horizontal') {
                ctx.drawImage(imgElement, currentX, 0);
                currentX += imgElement.width + gap;
            } else {
                ctx.drawImage(imgElement, 0, currentY);
                currentY += imgElement.height + gap;
            }
        }

        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        if (blob) {
            if (combinePreviewUrl.value) URL.revokeObjectURL(combinePreviewUrl.value);
            combinePreviewUrl.value = URL.createObjectURL(blob);
            previewObjUrlBlob = blob;
        } else {
            previewObjUrlBlob = null;
        }
    } catch (e) {
        console.error("Preview building failed", e);
    } finally {
        isGeneratingPreview.value = false;
    }
};

watch([combineQueue, combineOrientation, combineGap], () => {
    generatePreview();
}, { deep: true });

const editingCombineIndex = ref<number | null>(null);

const triggerEditCombine = async (index: number) => {
    const newValue = props.modelValue || [];
    const item = newValue[index];
    if (typeof item === 'string' || !item.combineConfig) return;

    editingCombineIndex.value = index;
    const config = item.combineConfig;

    combineOrientation.value = config.orientation;
    combineGap.value = config.gap;

    const newQueue: CombineItem[] = [];
    for (const cfgItem of config.items) {
        if (cfgItem.type === 'local' && cfgItem.localId) {
            const localFile = fileStore.files.find(f => f.id === cfgItem.localId);
            if (localFile) {
                newQueue.push({
                    id: 'restored-local-' + cfgItem.localId,
                    type: 'local',
                    localId: cfgItem.localId,
                    url: getFileUrl(localFile.blob),
                    name: cfgItem.name,
                    file: localFile.blob as File
                });
            }
        } else if (cfgItem.type === 'gallery') {
            const galleryImg: GalleryImage = { name: cfgItem.name, position: 'gallery', localId: cfgItem.localId };
            
            let url = getImageUrl(galleryImg);
            if (!url) {
                const info = await pcgwApi.getImageInfo(cfgItem.name);
                if (info) {
                    resolvedInfos[normalizeFilename(cfgItem.name)] = info;
                    url = info.url;
                }
            }
            
            newQueue.push({
                id: 'restored-gallery-' + Math.random().toString(36).substring(2, 9),
                type: 'gallery',
                galleryImage: galleryImg,
                url: url,
                name: cfgItem.name
            });
        }
    }
    
    combineQueue.value = newQueue;
    showCombineDialog.value = true;
};

const openUrl = (url?: string) => {
    if (url) window.open(url, '_blank');
};

const closeCombineDialog = () => {
    showCombineDialog.value = false;
    combineQueue.value.forEach(item => {
        if (item.type === 'local' && item.url && item.id.startsWith('local-')) URL.revokeObjectURL(item.url);
    });
    combineQueue.value = [];
    if (combinePreviewUrl.value) URL.revokeObjectURL(combinePreviewUrl.value);
    combinePreviewUrl.value = '';
    previewObjUrlBlob = null;
    combineTempGallerySelection.value = [];
    editingCombineIndex.value = null;
};

const handleConfirmCombine = async () => {
    if (combineQueue.value.length < 2 || !previewObjUrlBlob) {
        toast.add({ severity: 'warn', summary: 'Missing Data', detail: 'Please select at least 2 images and wait for preview.', life: 3000 });
        return;
    }

    isCombining.value = true;
    try {
        const blob = previewObjUrlBlob;
        const combinedFile = new File([blob], `combined_${Date.now()}.png`, { type: 'image/png', lastModified: Date.now() });
        const id = await fileStore.addFile(combinedFile);

        const combineConfig = {
            orientation: combineOrientation.value,
            gap: combineGap.value,
            items: combineQueue.value.map(q => ({
                name: q.name,
                type: q.type,
                localId: q.localId || q.galleryImage?.localId
            }))
        };

        const newImages: GalleryImage[] = [{
            name: combinedFile.name,
            caption: '',
            position: 'gallery',
            localId: id,
            combineConfig
        }];

        if (editingCombineIndex.value !== null) {
            const newValue = [...(props.modelValue || [])];
            const oldItem = newValue[editingCombineIndex.value];
            if (typeof oldItem !== 'string' && oldItem.localId !== undefined) {
                await fileStore.removeFile(oldItem.localId).catch(console.error);
            }
            newValue[editingCombineIndex.value] = newImages[0];
            emit('update:modelValue', newValue);
            toast.add({ severity: 'success', summary: 'Image Updated', detail: 'Combined image has been modified.', life: 3000 });
        } else {
            emit('update:modelValue', [...(props.modelValue || []), ...newImages]);
            toast.add({ severity: 'success', summary: 'Images Combined', detail: 'Combined image added to gallery.', life: 3000 });
        }

        closeCombineDialog();
    } catch (e: any) {
        console.error(e);
        toast.add({ severity: 'error', summary: 'Combination Failed', detail: e.message || 'An error occurred.', life: 3000 });
    } finally {
        isCombining.value = false;
    }
};

defineExpose({
    initiateDelete,
    handleConfirmDelete,
    existingDeletionReason,
    pcgwDeletionReason,
    openCaptionDialog,
    saveCaption,
    editingCaption
});
</script>

<template>
    <div
        class="gallery-section flex flex-col gap-4 p-4 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl relative overflow-hidden">
        <!-- Decoration -->
        <div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Images class="w-24 h-24" />
        </div>

        <div class="flex items-center justify-between relative z-10">
            <label class="font-bold text-sm text-surface-500 uppercase tracking-widest flex items-center">
                <Images class="mr-2 w-4 h-4" /> Gallery
            </label>
            <div v-if="pcgwAuth.isLoggedIn" class="flex items-center gap-2">
                <span
                    class="text-[10px] text-surface-500 bg-surface-100 dark:bg-surface-900 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 class="w-3 h-3 text-green-500" />
                    {{ pcgwAuth.username }}
                </span>
                <Button text size="small" @click="handleLogout" severity="secondary" v-tooltip.bottom="'Logout'">
                    <template #icon>
                        <LogOut class="w-5 h-5 text-red-500" />
                    </template>
                </Button>
            </div>
        </div>

        <div class="flex gap-2 relative z-10 w-full sm:w-auto">
            <Button label="Add Image" outlined @click="showSearchDialog = true" class="flex-1">
                <template #icon>
                    <Plus class="w-4 h-4 mr-2" />
                </template>
            </Button>

            <div class="hidden">
                <FileUpload ref="fileUploadRef" mode="basic" name="files[]" :auto="true" customUpload
                    @uploader="handleLocalMenuUpload" :multiple="true" accept="image/*" :maxFileSize="10000000" />
                <FileUpload ref="replaceFileUploadRef" mode="basic" name="files[]" :auto="true" customUpload
                    @uploader="handleReplaceUpload" :multiple="false" accept="image/*" :maxFileSize="10000000" />
            </div>
        </div>

        <Dialog v-model:visible="showSearchDialog" header="Add Image" modal :style="{ width: '500px' }"
            :draggable="false">
            <div class="flex flex-col gap-6 py-4">
                <div class="flex flex-col gap-3">
                    <div class="flex items-center justify-between">
                        <label class="font-bold text-xs text-surface-500 uppercase flex items-center gap-2">
                            <Upload class="w-4 h-4" /> From your computer
                        </label>
                        <div class="flex items-center gap-2">
                            <label for="cropOnUpload" class="text-[10px] text-surface-400 font-bold uppercase cursor-pointer">Crop after upload</label>
                            <ToggleSwitch v-model="cropOnUpload" inputId="cropOnUpload" class="scale-75 origin-right" />
                        </div>
                    </div>
                    <Button label="Upload Files" severity="secondary" @click="() => fileUploadRef?.choose()"
                        class="w-full">
                        <template #icon>
                            <Upload class="w-4 h-4 mr-2" />
                        </template>
                    </Button>
                </div>

                <div class="border-t border-surface-100 dark:border-surface-700 relative flex justify-center">
                    <span
                        class="absolute -top-3 px-3 bg-surface-0 dark:bg-surface-800 text-[10px] text-surface-400 uppercase tracking-widest font-bold">Or</span>
                </div>

                <div class="flex flex-col gap-3">
                    <label class="font-bold text-xs text-surface-500 uppercase flex items-center gap-2">
                        <Images class="w-4 h-4" /> Existing PCGW Image
                    </label>
                    <AutocompleteField v-model="newImage" dataSource="files" placeholder="Search by filename..."
                        :multiple="true" class="w-full" @suggestions-update="handleSuggestionsUpdate">
                        <template #option="{ option }">
                            <div class="flex items-center justify-between w-full group/search-item">
                                <div class="flex flex-col gap-0.5 overflow-hidden">
                                    <span class="font-bold text-sm truncate">{{ option }}</span>
                                    <div v-if="resolvedInfos[normalizeFilename(option)]"
                                        class="flex items-center gap-1 text-[10px] text-surface-500">
                                        <User class="w-3 h-3" />
                                        <span>{{ resolvedInfos[normalizeFilename(option)].user }}</span>
                                    </div>
                                </div>
                                <a :href="`https://www.pcgamingwiki.com/wiki/File:${encodeURIComponent(option.replace(/ /g, '_'))}`"
                                    target="_blank" rel="noreferrer"
                                    class="p-button p-button-icon-only p-button-text p-button-rounded p-button-sm p-1! opacity-0 group-hover/search-item:opacity-100 transition-opacity shrink-0 flex items-center justify-center no-underline"
                                    v-tooltip.top="'View on PCGW'"
                                    @click.stop>
                                    <ExternalLink class="w-4 h-4" />
                                </a>
                            </div>
                        </template>
                    </AutocompleteField>
                </div>

                <div class="border-t border-surface-100 dark:border-surface-700 relative flex justify-center mt-4">
                    <span class="absolute -top-3 px-3 bg-surface-0 dark:bg-surface-800 text-[10px] text-surface-400 uppercase tracking-widest font-bold">Advanced Tools</span>
                </div>

                <div class="flex flex-col gap-3">
                    <label class="font-bold text-xs text-surface-500 uppercase flex items-center gap-2">
                        <Combine class="w-4 h-4" /> Layout Builder
                    </label>
                    <Button label="Open Image Combiner" severity="secondary" @click="() => { showSearchDialog = false; showCombineDialog = true; }" class="w-full">
                        <template #icon>
                            <Combine class="w-4 h-4 mr-2" />
                        </template>
                    </Button>
                </div>

                <div class="flex justify-end gap-2 mt-2 pt-2 border-t border-surface-100 dark:border-surface-700">
                    <Button label="Cancel" text @click="showSearchDialog = false" />
                    <Button label="Add Selected" @click="() => { addImage(); showSearchDialog = false; }"
                        :disabled="!newImage || newImage.length === 0" />
                </div>
            </div>
        </Dialog>
        <div v-if="displayImages.length > 0" class="w-full">
            <VueDraggable v-model="displayImages"
                class="gallery-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" ghost-class="opacity-50"
                :animation="200">
                <div v-for="(element, index) in displayImages"
                    :key="typeof element === 'string' ? element : element.name"
                    class="gallery-item border border-surface-200 dark:border-surface-700 rounded p-3 bg-surface-0 dark:bg-surface-800 relative group flex flex-col h-full cursor-move hover:shadow-md transition-shadow">
                    <!-- Drag handle visual indicator -->
                    <div
                        class="flex justify-center mb-2 text-surface-300 dark:text-surface-600 group-hover:text-surface-500 dark:group-hover:text-surface-400 transition-colors">
                        <GripHorizontal class="w-5 h-5" />
                    </div>
                    <div
                        class="gallery-image-container relative flex-1 flex items-center justify-center p-2 rounded bg-surface-100 dark:bg-surface-900 overflow-hidden min-h-[150px]">
                        <img v-if="getImageUrl(element)" :src="getImageUrl(element)" :alt="element.name" loading="lazy"
                            class="gallery-image max-h-[150px] max-w-full object-contain pointer-events-none" />
                        <div v-else
                            class="gallery-image-placeholder flex flex-col items-center justify-center text-surface-500 h-[150px]">
                            <Image class="w-8 h-8 mb-2" />
                            <span class="text-xs text-center break-all px-2">{{ element.name }}</span>
                        </div>

                        <!-- Status Badges -->
                        <div class="absolute top-2 left-2 flex flex-col gap-1">
                            <div v-if="element.localId"
                                class="bg-surface-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/20 flex items-center gap-1 uppercase tracking-tight">
                                <HardDrive class="w-3 h-3" /> Local
                            </div>
                            <div v-if="element.localId && getLocalFile(element.localId)?.status === 'uploading'"
                                class="bg-primary-500 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-tight">
                                <Loader2 class="w-3 h-3 animate-spin" /> Uploading
                            </div>
                            <div v-if="element.localId && getLocalFile(element.localId)?.status === 'error'"
                                class="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-tight"
                                v-tooltip="getLocalFile(element.localId)?.error">
                                <AlertCircle class="w-3 h-3" /> Error
                            </div>

                            <!-- PCGW Info Tooltip -->
                            <div v-if="resolvedInfos[normalizeFilename(element.name)]"
                                class="bg-surface-900/60 backdrop-blur-sm text-white w-6 h-6 rounded-full border border-white/10 flex items-center justify-center cursor-help transition-colors hover:bg-surface-900/80"
                                v-tooltip.right="{
                                    value: `Uploaded by: ${resolvedInfos[normalizeFilename(element.name)].user}\nSize: ${formatSize(resolvedInfos[normalizeFilename(element.name)].size)}\nDimensions: ${resolvedInfos[normalizeFilename(element.name)].width}x${resolvedInfos[normalizeFilename(element.name)].height}`,
                                    autoHide: false
                                }">
                                <Info class="w-3.5 h-3.5" />
                            </div>
                        </div>

                        <!-- Position Badge -->
                        <div v-if="element.position === 'lateral'"
                            class="absolute top-2 right-2 bg-primary-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                            <PanelRight class="w-3 h-3" /> Side
                        </div>

                        <!-- Caption Overlay -->
                        <div v-if="element.caption"
                            class="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 text-center truncate pointer-events-none">
                            {{ element.caption }}
                        </div>
                    </div>

                    <!-- Actions -->
                    <div
                        class="gallery-actions flex items-center justify-between mt-3 border-t border-surface-100 dark:border-surface-700 pt-2">
                        <!-- Left: Gallery Settings (Always Visible) -->
                        <div class="flex gap-1">
                            <Button text rounded size="small" v-tooltip="'Edit Caption'"
                                :class="element.caption ? 'text-primary-500' : 'text-surface-500'"
                                @click="openCaptionDialog(element, index)">
                                <template #icon>
                                    <Pencil />
                                </template>
                            </Button>
                            <Button text rounded size="small"
                                v-tooltip="element.position === 'lateral' ? 'Move to Gallery' : 'Move to Side'"
                                :class="element.position === 'lateral' ? 'text-primary-500' : 'text-surface-500'"
                                @click="togglePosition(index)">
                                <template #icon>
                                    <PanelRight v-if="element.position !== 'lateral'" />
                                    <Grid v-else />
                                </template>
                            </Button>
                            <Button severity="danger" text rounded size="small" @click="removeImage(index)"
                                v-tooltip="'Remove from Gallery'">
                                <template #icon>
                                    <Trash2 />
                                </template>
                            </Button>
                        </div>

                        <!-- Right: Actions & Management -->
                        <div class="flex items-center gap-1">
                            <!-- Local file: Primary Upload Action -->
                            <Button v-if="element.localId !== undefined" size="small" text rounded severity="primary"
                                v-tooltip="'Upload to PCGW'" @click="initiateUpload(element)"
                                :loading="getLocalFile(element.localId)?.status === 'uploading'">
                                <template #icon>
                                    <Upload />
                                </template>
                            </Button>

                            <!-- Common Management Menu -->
                            <Button type="button" @click="toggleMenu($event, element, index)" size="small" text rounded
                                severity="primary"
                                v-tooltip="element.localId !== undefined ? 'Local Actions' : 'Manage on PCGW'">
                                <template #icon>
                                    <MoreVertical />
                                </template>
                            </Button>
                        </div>
                    </div>
                </div>
            </VueDraggable>
            <Menu ref="menu" id="overlay_menu" :model="actionMenuItems" :popup="true">
                <template #item="{ item, props }">
                    <a v-bind="props.action" class="flex items-center" :href="item.url" :target="item.target" :rel="item.rel">
                        <component :is="item.icon" v-if="item.icon && typeof item.icon !== 'string'"
                            class="w-4 h-4 mr-2" />
                        <span v-else-if="item.icon" :class="item.icon" class="mr-2" />
                        <span>{{ item.label }}</span>
                    </a>
                </template>
            </Menu>
        </div>

        <!-- Caption Dialog -->
        <Dialog v-model:visible="showCaptionDialog" header="Edit Caption" modal :style="{ width: '400px' }"
            :draggable="false">
            <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                    <label class="font-bold text-sm">Image</label>
                    <InputText :value="editingImage?.name" disabled class="w-full bg-surface-100 dark:bg-surface-900" />
                </div>
                <div class="flex flex-col gap-2">
                    <label class="font-bold text-sm">Caption</label>
                    <Textarea v-model="editingCaption" rows="3" autoResize class="w-full"
                        placeholder="Enter caption..." />
                </div>
                <div class="flex justify-end gap-2 mt-2">
                    <Button label="Cancel" text @click="showCaptionDialog = false" />
                    <Button label="Save" @click="saveCaption" />
                </div>
            </div>
        </Dialog>

        <!-- Edit PCGW Description Dialog -->
        <Dialog v-model:visible="showPcgwEditDialog" modal header="Edit PCGW Description" :draggable="false"
            class="w-full max-w-md">
            <div class="flex flex-col gap-5">
                <div
                    class="flex items-center gap-4 bg-primary-50 dark:bg-primary-900/10 p-4 rounded-xl border border-primary-100 dark:border-primary-900/20">
                    <div class="p-2.5 bg-primary-500 rounded-lg shadow-lg">
                        <Pencil class="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p class="font-bold text-xs text-primary-600 uppercase tracking-widest">Wiki Metadata Editor</p>
                        <p class="text-xs opacity-70">Modify the description of the file on PCGamingWiki.</p>
                    </div>
                </div>

                <div v-if="pcgwEditingImage" class="flex flex-col gap-4">
                    <div class="flex flex-col gap-1.5">
                        <label
                            class="text-[10px] font-bold text-surface-500 uppercase flex items-center justify-between gap-1.5">
                            <span>Target Filename</span>
                            <div v-if="isFetchingContent"
                                class="flex items-center gap-1.5 text-primary-500 font-normal italic lowercase tracking-normal">
                                <Loader2 class="w-3 h-3 animate-spin" />
                                <span>Syncing with wiki...</span>
                            </div>
                        </label>
                        <div
                            class="px-3 py-2 bg-surface-100 dark:bg-surface-800 rounded text-sm text-surface-600 truncate">
                            {{ pcgwEditingImage.name }}
                        </div>
                    </div>

                    <div class="flex flex-col gap-1.5 min-h-[300px]">
                        <label for="pcgwEditDescription"
                            class="text-[10px] font-bold text-surface-500 uppercase flex items-center gap-1.5 px-1">
                            Description / Comment
                        </label>
                        <WysiwygEditor id="pcgwEditDescription" v-model="pcgwEditingImage.description"
                            editorStyle="height: 200px" placeholder="Enter file description..." />
                    </div>
                </div>

                <div class="flex gap-2 mt-2">
                    <Button label="Cancel" severity="secondary" text class="flex-1" @click="showPcgwEditDialog = false"
                        :disabled="isSavingEdit" />
                    <Button label="Save Changes" severity="primary" class="flex-1" @click="handleSaveEdit"
                        :loading="isSavingEdit" :disabled="isFetchingContent">
                        <template #loadingicon>
                            <Loader2 class="w-4 h-4 animate-spin mr-2" />
                        </template>
                    </Button>
                </div>
            </div>
        </Dialog>

        <!-- PCGW Deletion Request Dialog -->
        <Dialog v-model:visible="showPcgwDeleteDialog" modal header="Request PCGW Deletion" :draggable="false"
            class="w-full max-w-sm">
            <div class="flex flex-col gap-5">
                <div
                    class="flex items-center gap-4 bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/20">
                    <div class="p-2.5 bg-red-500 rounded-lg shadow-lg">
                        <Trash2 class="w-5 h-5 text-white" />
                    </div>
                    <div class="flex-1">
                        <p class="font-bold text-xs text-red-600 uppercase tracking-widest dark:text-red-400">Deletion
                            Request
                        </p>
                        <p class="text-[11px] opacity-80 leading-tight mt-0.5">This will add a <code
                                v-pre>{{delete}}</code> tag
                            to the file description on PCGamingWiki.</p>
                    </div>
                </div>

                <div v-if="isCheckingExistingDelete"
                    class="flex items-center justify-center py-2 gap-2 text-[10px] text-surface-500 italic">
                    <Loader2 class="w-3 h-3 animate-spin" />
                    Checking for existing requests...
                </div>

                <div v-else-if="existingDeletionReason !== null"
                    class="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-900/30">
                    <div class="flex items-start gap-2 text-amber-700 dark:text-amber-400">
                        <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
                        <div class="flex flex-col gap-1">
                            <span class="text-[10px] font-bold uppercase">Existing Request Found</span>
                            <p class="text-[11px] leading-tight">This file already has a deletion tag. Sending this
                                request will
                                <strong>replace</strong> the previous one.
                            </p>
                            <div class="mt-1 p-1.5 bg-amber-100/50 dark:bg-amber-900/40 rounded text-[10px] italic">
                                Original reason: "{{ existingDeletionReason }}"
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="pcgwDeletingImage" class="flex flex-col gap-4">
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[10px] font-bold text-surface-500 uppercase">Target Filename</label>
                        <div
                            class="px-3 py-2 bg-surface-100 dark:bg-surface-800 rounded text-xs text-surface-600 truncate border border-surface-200 dark:border-surface-700">
                            {{ pcgwDeletingImage.name }}
                        </div>
                    </div>

                    <div class="flex flex-col gap-1.5">
                        <label for="deletionReason"
                            class="text-[10px] font-bold text-surface-500 uppercase flex items-center justify-between">
                            <span>Reason (Optional)</span>
                            <span class="font-normal text-[9px] lowercase opacity-60">Shown in the template</span>
                        </label>
                        <InputText id="deletionReason" v-model="pcgwDeletionReason"
                            placeholder="e.g., Duplicated, lower quality..." class="w-full text-sm!"
                            @keyup.enter="handleConfirmDelete" />
                    </div>
                </div>

                <div class="flex gap-2 mt-2">
                    <Button label="Cancel" severity="secondary" text class="flex-1"
                        @click="showPcgwDeleteDialog = false" :disabled="isSavingDelete" />
                    <Button label="Send Request" severity="danger" class="flex-1" @click="handleConfirmDelete"
                        :loading="isSavingDelete">
                        <template #loadingicon>
                            <Loader2 class="w-4 h-4 animate-spin mr-2" />
                        </template>
                    </Button>
                </div>
            </div>
        </Dialog>

        <!-- PCGW Rename Dialog -->
        <Dialog v-model:visible="showRenameDialog" modal :header="renamingImage?.localId !== undefined ? 'Rename File' : 'Rename on PCGW'" :draggable="false"
            class="w-full max-w-sm">
            <div class="flex flex-col gap-5">
                <div
                    class="flex items-center gap-4 bg-primary-50 dark:bg-primary-900/10 p-4 rounded-xl border border-primary-100 dark:border-primary-900/20">
                    <div class="p-2.5 bg-primary-500 rounded-lg shadow-lg">
                        <TextCursorInput class="w-5 h-5 text-white" />
                    </div>
                    <div class="flex-1">
                        <p class="font-bold text-xs text-primary-600 uppercase tracking-widest">{{ renamingImage?.localId !== undefined ? 'Rename Local File' : 'Rename Wiki File' }}</p>
                        <p class="text-[11px] opacity-80 leading-tight mt-0.5">{{ renamingImage?.localId !== undefined ? 'Update the name of this local file before upload.' : 'This will rename the file on PCGamingWiki using the Move API.' }}</p>
                    </div>
                </div>

                <div v-if="renamingImage" class="flex flex-col gap-4">
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[10px] font-bold text-surface-500 uppercase">Current Filename</label>
                        <div
                            class="px-3 py-2 bg-surface-100 dark:bg-surface-800 rounded text-xs text-surface-400 truncate border border-surface-200 dark:border-surface-700 italic">
                            {{ renamingImage.name }}
                        </div>
                    </div>

                    <div class="flex flex-col gap-1.5">
                        <label for="newRenameName" class="text-[10px] font-bold text-surface-500 uppercase">New
                            Filename</label>
                        <InputText id="newRenameName" v-model="newRenameName" placeholder="New-filename.png"
                            class="w-full text-sm!" @keyup.enter="handleConfirmRename" />
                        <span class="text-[9px] text-surface-400 italic px-1">Remember to include the extension (e.g.,
                            .png, .jpg).</span>
                    </div>
                </div>

                <div class="flex gap-2 mt-2">
                    <Button label="Cancel" severity="secondary" text class="flex-1" @click="showRenameDialog = false"
                        :disabled="isRenaming" />
                    <Button label="Rename File" severity="primary" class="flex-1" @click="handleConfirmRename"
                        :loading="isRenaming" :disabled="!newRenameName.trim() || newRenameName.trim() === renamingImage?.name">
                        <template #loadingicon>
                            <Loader2 class="w-4 h-4 animate-spin mr-2" />
                        </template>
                    </Button>
                </div>
            </div>
        </Dialog>

        <!-- Upload Confirmation & Metadata Dialog -->
        <Dialog v-model:visible="showConfirmUpload" header="Confirm PCGW Upload" modal :style="{ width: '450px' }"
            :draggable="false">
            <div class="flex flex-col gap-4">
                <div v-if="selectedFile"
                    class="flex gap-4 items-start p-3 bg-surface-50 dark:bg-surface-900 rounded-lg">
                    <img :src="getFileUrl(selectedFile.blob)" class="w-20 h-20 object-cover rounded shadow-sm" />
                    <div class="flex flex-col gap-1 min-w-0">
                        <span class="text-xs font-bold text-surface-400 uppercase tracking-tight">Original File</span>
                        <span class="text-sm font-medium break-all">{{ selectedFile.name }}</span>
                        <span class="text-xs text-surface-500">{{ formatSize(selectedFile.blob.size) }}</span>
                    </div>
                </div>

                <div class="flex flex-col gap-2">
                    <label class="text-xs font-bold text-surface-500 uppercase">PCGW Filename</label>
                    <InputText v-model="editFilename" class="w-full" placeholder="Existing-filename.png" />
                    <span class="text-[10px] text-surface-400 italic">This will be the final name on the wiki.</span>
                </div>

                <div class="flex flex-col gap-2">
                    <label class="text-xs font-bold text-surface-500 uppercase">Description / Comment</label>
                    <Textarea v-model="editDescription" rows="2" class="w-full text-sm"
                        placeholder="Brief description of the image content..." />
                </div>

                <div v-if="isUploading" class="mt-2">
                    <ProgressBar :value="uploadProgress" class="h-1.5" />
                    <div
                        class="text-[10px] text-center mt-1 text-primary-500 font-bold animate-pulse uppercase tracking-widest">
                        Uploading to PCGamingWiki...
                    </div>
                </div>

                <div class="flex justify-end gap-2 mt-2">
                    <Button label="Cancel" text @click="showConfirmUpload = false" :disabled="isUploading" />
                    <Button label="Confirm & Upload" @click="() => processUpload()" :loading="isChecking"
                        :disabled="isUploading">
                        <template #icon>
                            <Loader2 v-if="isChecking" class="w-4 h-4 animate-spin mr-2" />
                            <Upload v-else class="w-4 h-4 mr-2" />
                        </template>
                    </Button>
                </div>
            </div>
        </Dialog>

        <!-- Overwrite / Duplicate Warning Dialog -->
        <Dialog v-model:visible="showOverwriteConfirm" header="File Already Exists" modal :style="{ width: '400px' }"
            :draggable="false" severity="warning">
            <template #header>
                <div class="flex items-center gap-2">
                    <AlertCircle class="w-5 h-5 text-orange-500" />
                    <span class="font-bold">Caution: Duplicate File</span>
                </div>
            </template>
            <div class="flex flex-col gap-3 py-2">
                <p class="text-sm leading-relaxed">
                    A file named <b class="text-orange-500">{{ duplicateInfo?.filename }}</b> already exists on
                    PCGamingWiki.
                </p>
                <p class="text-xs text-surface-500">
                    Do you want to overwrite it with this version? This action cannot be easily undone.
                </p>

                <div class="flex justify-end gap-2 mt-4">
                    <Button label="Cancel" text @click="showOverwriteConfirm = false" />
                    <Button label="Yes, Overwrite" severity="warning" @click="processUpload(true)" />
                </div>
            </div>
        </Dialog>

        <!-- Image Cropper Dialog -->
        <Dialog v-model:visible="showCropDialog" :header="croppingQueue.length > 0 ? `Crop Image (${croppingQueue.length} remaining)` : 'Crop Image'" modal :style="{ width: '800px' }" :draggable="false">
            <div class="flex flex-col gap-4">
                <div class="h-[500px] w-full bg-surface-100 dark:bg-surface-900 rounded overflow-hidden flex items-center justify-center">
                    <Cropper v-if="cropImageUrl" ref="cropperRef" :src="cropImageUrl" class="h-full w-full" background-class="bg-surface-100 dark:bg-surface-900" />
                </div>
                <div class="flex justify-end gap-2 mt-2">
                    <Button :label="croppingQueue.length > 1 ? 'Skip' : 'Cancel'" text @click="closeCropDialog" :disabled="isCropping" />
                    <Button :label="croppingQueue.length > 1 ? 'Apply & Next' : 'Apply Crop'" severity="primary" @click="handleConfirmCrop" :loading="isCropping">
                        <template #icon>
                            <Loader2 v-if="isCropping" class="w-4 h-4 animate-spin mr-2" />
                            <Crop v-else class="w-4 h-4 mr-2" />
                        </template>
                    </Button>
                </div>
            </div>
        </Dialog>

        <!-- Combine Images Dialog -->
        <Dialog v-model:visible="showCombineDialog" header="Combine Images Builder" modal :style="{ width: '100%', maxWidth: '800px' }" class="mx-4" :draggable="false" @hide="closeCombineDialog">
            <div class="flex flex-col gap-6 py-4">
                
                <!-- Live Preview -->
                <div v-if="combinePreviewUrl" class="w-full h-64 border border-surface-200 dark:border-surface-700 rounded-lg flex items-center justify-center overflow-hidden bg-white dark:bg-black relative shadow-inner">
                    <img :src="combinePreviewUrl" class="w-full h-full object-contain" />
                    <div v-if="isGeneratingPreview" class="absolute inset-0 bg-surface-0/50 dark:bg-surface-900/50 flex items-center justify-center">
                        <Loader2 class="w-8 h-8 animate-spin text-primary" />
                    </div>
                </div>
                <div v-else class="w-full h-32 border border-dashed border-surface-300 dark:border-surface-600 rounded-lg flex items-center justify-center bg-surface-50 dark:bg-surface-800 text-surface-500 text-sm italic">
                    Add at least 2 images to generate a preview
                </div>

                <div class="flex items-center gap-8">
                    <div class="flex flex-col gap-2 flex-1">
                        <label class="font-bold text-xs text-surface-500 uppercase">Orientation</label>
                        <div class="flex items-center gap-4 bg-surface-100 dark:bg-surface-800 py-2 px-3 rounded-md w-fit">
                            <div class="flex items-center gap-2 cursor-pointer" @click="combineOrientation = 'horizontal'">
                                <RadioButton v-model="combineOrientation" inputId="horizontal" name="orientation" value="horizontal" />
                                <label for="horizontal" class="text-sm cursor-pointer">Horizontal</label>
                            </div>
                            <div class="flex items-center gap-2 cursor-pointer" @click="combineOrientation = 'vertical'">
                                <RadioButton v-model="combineOrientation" inputId="vertical" name="orientation" value="vertical" />
                                <label for="vertical" class="text-sm cursor-pointer">Vertical</label>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="font-bold text-xs text-surface-500 uppercase">Gap (px)</label>
                        <InputNumber v-model="combineGap" inputId="gap" :min="0" :max="1000" class="w-20" inputClass="w-full" />
                    </div>
                </div>

                <hr class="border-surface-100 dark:border-surface-700" />

                <!-- Unified Queue -->
                <div class="flex flex-col gap-2 relative">
                    <div class="flex items-center justify-between">
                        <label class="font-bold text-xs text-surface-500 uppercase flex items-center gap-2">
                            <Images class="w-4 h-4" /> Layout Queue
                        </label>
                        <div class="flex items-center gap-4">
                            <div class="flex items-center gap-2">
                                <label for="combineCropOnUpload" class="text-[10px] text-surface-400 font-bold uppercase cursor-pointer">Crop after upload</label>
                                <ToggleSwitch v-model="cropOnUpload" inputId="combineCropOnUpload" class="scale-75 origin-right" />
                            </div>
                            <MultiSelect v-model="combineTempGallerySelection" :options="displayImages" optionLabel="name" 
                                placeholder="Add from Gallery..." class="w-56 text-sm" @change="handleCombineTempSelect">
                                <template #option="slotProps">
                                    <span class="truncate text-xs">{{ typeof slotProps.option === 'string' ? slotProps.option : slotProps.option.name }}</span>
                                </template>
                            </MultiSelect>
                            <FileUpload ref="combineUploadRef" mode="basic" name="files[]" :auto="true" customUpload 
                                @uploader="handleCombineLocalUpload" :multiple="true" accept="image/*" :maxFileSize="10000000" 
                                chooseLabel="Upload Local..." class="p-button-sm" />
                        </div>
                    </div>
                    
                    <div v-if="combineQueue.length === 0" class="w-full text-center py-4 text-surface-400 text-sm">
                        No images layered yet. Added images will appear here.
                    </div>
                    
                    <VueDraggable v-else v-model="combineQueue" target=".sortable-combine-list" handle=".drag-handle" :animation="150" ghost-class="opacity-50">
                        <TransitionGroup name="list" tag="div" class="sortable-combine-list flex flex-col gap-1.5 mt-2 relative w-full">
                            <div v-for="(item, idx) in combineQueue" :key="item.id" class="flex items-center justify-between bg-surface-100 dark:bg-surface-800 p-2 rounded text-sm border border-surface-200 dark:border-surface-700 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors w-full z-10">
                            <div class="flex items-center gap-3 overflow-hidden flex-1">
                                <GripHorizontal class="w-4 h-4 text-surface-400 cursor-move drag-handle shrink-0 hover:text-primary transition-colors" />
                                <div class="w-8 h-8 rounded bg-surface-200 dark:bg-surface-900 border border-surface-300 dark:border-surface-600 flex items-center justify-center overflow-hidden shrink-0">
                                    <img v-if="item.url" :src="item.url" class="w-full h-full object-cover" />
                                    <Image v-else class="w-4 h-4 text-surface-400" />
                                </div>
                                <span class="truncate">{{ item.name }}</span>
                                <span class="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-surface-300 dark:bg-surface-600 text-surface-600 dark:text-surface-300 ml-2 shrink-0">{{ item.type }}</span>
                            </div>
                            <div class="flex items-center gap-0.5 shrink-0 ml-2">
                                <Button text severity="secondary" @click="initiateCrop({ type: 'combine', combineItem: item })" class="p-1" v-tooltip.bottom="'Crop Image'">
                                    <template #icon>
                                        <Crop class="w-5 h-5" />
                                    </template>
                                </Button>
                                <Button text severity="info" @click="openUrl(item.url)" class="p-1" v-tooltip.bottom="'View Image'">
                                    <template #icon>
                                        <ExternalLink class="w-5 h-5" />
                                    </template>
                                </Button>
                                <Button text severity="danger" @click="removeCombineItem(idx)" class="p-1" v-tooltip.bottom="'Remove Image'">
                                    <template #icon>
                                        <Trash2 class="w-5 h-5" />
                                    </template>
                                </Button>
                            </div>
                            </div>
                        </TransitionGroup>
                    </VueDraggable>
                </div>

                <div class="flex justify-end gap-2 mt-4 border-t border-surface-100 dark:border-surface-700 pt-4">
                    <Button label="Cancel" text @click="closeCombineDialog" :disabled="isCombining" />
                    <Button label="Confirm & Add Image" severity="primary" @click="handleConfirmCombine" :loading="isCombining" :disabled="combineQueue.length < 2 || !previewObjUrlBlob">
                        <template #icon>
                            <Loader2 v-if="isCombining" class="w-4 h-4 animate-spin mr-2" />
                            <Combine v-else class="w-4 h-4 mr-2" />
                        </template>
                    </Button>
                </div>
            </div>
        </Dialog>

        <!-- Login Dialog Fallback -->
        <PcgwLoginDialog v-model:visible="isLoginDialogVisible" />
    </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: scale(0.95) translateY(-5px);
}
</style>
