import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';
import { initialGameData, GameData } from '../models/GameData';
import { computed } from 'vue';
import { generateWikitext } from '../utils/wikitext';
import { parseWikitext } from '../utils/parser';

export interface Page {
    id: string;
    title: string;
    wikitext: string;
    baseWikitext: string;
    lastModified: number;
}

export const useWorkspaceStore = defineStore('workspace', () => {
    // Persist pages to local storage
    const pages = useStorage<Page[]>('pcgw-workspace-pages', []);

    // Persist active page ID
    const activePageId = useStorage<string>('pcgw-workspace-active-id', '');

    // Computed: Active Page
    const activePage = computed(() => {
        return pages.value.find(p => p.id === activePageId.value);
    });

    // Computed: Game Data of Active Page (read-write proxy or just access?)
    // Parse wikitext to GameData on get, generate wikitext from GameData on set
    const activeGameData = computed({
        get: () => {
            if (!activePage.value) return initialGameData;

            // If wikitext is empty, return initial data
            if (!activePage.value.wikitext) return initialGameData;

            try {
                return parseWikitext(activePage.value.wikitext);
            } catch (e) {
                console.error('Failed to parse wikitext:', e);
                return initialGameData;
            }
        },
        set: (newData: GameData) => {
            if (activePage.value) {
                // Generate wikitext from GameData and save it
                activePage.value.wikitext = generateWikitext(newData, activePage.value.baseWikitext);
                activePage.value.lastModified = Date.now();
            }
        }
    });

    // Actions
    function createPage(title: string = 'Untitled Page') {
        const id = crypto.randomUUID();
        const newPage: Page = {
            id,
            title,
            wikitext: '',
            baseWikitext: '',
            lastModified: Date.now()
        };
        pages.value.push(newPage);
        activePageId.value = id;
    }

    function deletePage(id: string) {
        const index = pages.value.findIndex(p => p.id === id);
        if (index !== -1) {
            pages.value.splice(index, 1);
            if (activePageId.value === id) {
                // Switch to another page if available
                activePageId.value = pages.value.length > 0 ? pages.value[0].id : '';
            }
        }
    }

    function setActivePage(id: string) {
        if (pages.value.find(p => p.id === id)) {
            activePageId.value = id;
        }
    }

    function renamePage(id: string, newTitle: string) {
        const page = pages.value.find(p => p.id === id);
        if (page) {
            page.title = newTitle;
            page.lastModified = Date.now();
        }
    }

    function importPage(file: File) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const importedData = JSON.parse(content);

                const id = crypto.randomUUID();
                let newPage: Page;

                // Check if it's the new format (with wikitext)
                if (importedData.wikitext !== undefined) {
                    newPage = {
                        id,
                        title: importedData.title + ' (Imported)',
                        wikitext: importedData.wikitext || '',
                        baseWikitext: importedData.baseWikitext || '',
                        lastModified: Date.now()
                    };
                }
                // Backward compatibility: old format with data
                else if (importedData.data) {
                    const wikitext = generateWikitext(importedData.data, '');
                    newPage = {
                        id,
                        title: importedData.title + ' (Imported)',
                        wikitext: wikitext,
                        baseWikitext: '',
                        lastModified: Date.now()
                    };
                } else {
                    throw new Error('Invalid format');
                }

                pages.value.push(newPage);
                activePageId.value = id;
            } catch (err) {
                console.error('Import failed', err);
                alert('Failed to import page. Invalid JSON.');
            }
        };
        reader.readAsText(file);
    }

    function exportPage(id: string) {
        const page = pages.value.find(p => p.id === id);
        if (!page) return;

        const exportObj = {
            title: page.title,
            wikitext: page.wikitext,
            baseWikitext: page.baseWikitext,
            version: '2.0'
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${page.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`);
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    // Initialize if empty
    if (pages.value.length === 0) {
        createPage('My First Page');
    } else if (!activePageId.value || !pages.value.find(p => p.id === activePageId.value)) {
        activePageId.value = pages.value[0].id;
    }

    return {
        pages,
        activePageId,
        activePage,
        activeGameData,
        createPage,
        deletePage,
        setActivePage,
        renamePage,
        importPage,
        exportPage
    };
});
