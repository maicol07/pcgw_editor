import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db, type LocalFile } from '../db';

export { type LocalFile };

export const useFileStore = defineStore('files', () => {
    const files = ref<LocalFile[]>([]);
    const isLoading = ref(false);

    async function loadFiles() {
        isLoading.value = true;
        try {
            files.value = await db.localFiles.toArray();
        } catch (e) {
            console.error('Failed to load local files:', e);
        } finally {
            isLoading.value = false;
        }
    }

    async function addFile(file: File) {
        const localFile: LocalFile = {
            name: file.name,
            blob: file,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            status: 'local'
        };

        try {
            const id = await db.localFiles.add(localFile);
            files.value.push({ ...localFile, id });
            return id;
        } catch (e) {
            console.error('Failed to add local file:', e);
            throw e;
        }
    }

    async function removeFile(id: number) {
        try {
            await db.localFiles.delete(id);
            files.value = files.value.filter(f => f.id !== id);
        } catch (e) {
            console.error('Failed to remove local file:', e);
            throw e;
        }
    }

    async function updateFileStatus(id: number, updates: Partial<LocalFile>) {
        try {
            await db.localFiles.update(id, updates);
            const index = files.value.findIndex(f => f.id === id);
            if (index !== -1) {
                files.value[index] = { ...files.value[index], ...updates };
            }
        } catch (e) {
            console.error('Failed to update file status:', e);
        }
    }

    // Load files on store initialization
    loadFiles();

    return {
        files,
        isLoading,
        addFile,
        removeFile,
        updateFileStatus,
        loadFiles
    };
});
