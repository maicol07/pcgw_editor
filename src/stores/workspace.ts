import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';
import { initialGameData, GameData } from '../models/GameData';
import { computed, ref, watch } from 'vue';
import { generateWikitext } from '../utils/wikitext';
import { parseWikitext } from '../utils/parser';
import { pcgwApi } from '../services/pcgwApi';

export interface Page {
    id: string;
    title: string;
    wikitext: string;
    baseWikitext: string;
    lastModified: number;
    template?: 'blank' | 'singleplayer' | 'multiplayer' | 'unknown';
    pcgwPageTitle?: string;
    localRevisionId?: number;
    onlineRevisionId?: number; // Latest known revision ID on the server
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

    // State for the parsed game data. Using ref + deep watch ensures real-time sync to wikitext.
    const _activeGameData = ref<GameData>(JSON.parse(JSON.stringify(initialGameData)));

    // Watch for page changes to reset/parse data
    watch(activePageId, async () => {
        if (activePage.value && activePage.value.wikitext) {
            try {
                _activeGameData.value = await parseWikitext(activePage.value.wikitext);
            } catch (e) {
                console.error('Failed to parse wikitext on page switch:', e);
                _activeGameData.value = JSON.parse(JSON.stringify(initialGameData));
            }
        } else {
            _activeGameData.value = JSON.parse(JSON.stringify(initialGameData));
        }
    }, { immediate: true });

    // Deep watch to sync UI changes back to wikitext.
    // This solves the issue where nested updates (like engines or galleries)
    // bypass the computed setter in DynamicSection bindings.
    watch(_activeGameData, (newData) => {
        if (activePage.value) {
            const newWikitext = generateWikitext(newData, activePage.value.baseWikitext);
            if (activePage.value.wikitext !== newWikitext) {
                activePage.value.wikitext = newWikitext;
                activePage.value.lastModified = Date.now();
            }
        }
    }, { deep: true });

    const activeGameData = computed({
        get: () => _activeGameData.value,
        set: (newData: GameData) => {
            _activeGameData.value = newData;
            if (activePage.value) {
                const newWikitext = generateWikitext(newData, activePage.value.baseWikitext);
                if (activePage.value.wikitext !== newWikitext) {
                    activePage.value.wikitext = newWikitext;
                    activePage.value.lastModified = Date.now();
                }
            }
        }
    });

    // Explicit sync methods if needed by UI
    function syncToWikitext() {
        if (activePage.value && _activeGameData.value) {
            activePage.value.wikitext = generateWikitext(_activeGameData.value, activePage.value.baseWikitext);
            activePage.value.lastModified = Date.now();
        }
    }

    async function syncFromWikitext(newWikitext?: string, revid?: number) {
        if (activePage.value) {
            if (newWikitext !== undefined) {
                activePage.value.wikitext = newWikitext;
            }
            if (revid !== undefined) {
                activePage.value.localRevisionId = revid;
                // If we synced to this revision, then the online revision is at least this.
                // We reset onlineRevisionId if it was equal or less.
                if (!activePage.value.onlineRevisionId || activePage.value.onlineRevisionId <= revid) {
                    activePage.value.onlineRevisionId = revid;
                }
            }
            try {
                // Update baseWikitext to the current wikitext before parsing.
                // This ensures that the next generation (from watch) starts with this version,
                // preserving manual edits made in Code mode.
                activePage.value.baseWikitext = activePage.value.wikitext;
                _activeGameData.value = await parseWikitext(activePage.value.wikitext);
                activePage.value.lastModified = Date.now();
            } catch (e) {
                console.error('Failed to sync from wikitext:', e);
            }
        }
    }

    async function checkForUpdates(pageId: string): Promise<boolean> {
        const page = pages.value.find(p => p.id === pageId);
        if (!page || !page.pcgwPageTitle) return false;

        const info = await pcgwApi.getLatestRevisionInfo(page.pcgwPageTitle);
        if (info) {
            page.onlineRevisionId = info.revid;
            return !!(page.onlineRevisionId && (!page.localRevisionId || page.onlineRevisionId > page.localRevisionId));
        }
        return false;
    }

    // Actions
    function createPage(title: string = 'Untitled Page', initialWikitext?: string, template: 'blank' | 'singleplayer' | 'multiplayer' | 'unknown' = 'blank', pcgwPageTitle?: string, revid?: number) {
        let wikitext = initialWikitext;
        if (wikitext === undefined) {
            wikitext = generateWikitext(initialGameData, '');
        }

        const id = crypto.randomUUID();
        const newPage: Page = {
            id,
            title,
            wikitext,
            baseWikitext: initialWikitext || '',
            lastModified: Date.now(),
            template,
            pcgwPageTitle,
            localRevisionId: revid,
            onlineRevisionId: revid
        };
        // Re-assign the array to ensure VirtualScroller reactivity triggers properly
        pages.value = [...pages.value, newPage];
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

    function linkPage(id: string, pcgwTitle: string, revid?: number) {
        const page = pages.value.find(p => p.id === id);
        if (page) {
            page.pcgwPageTitle = pcgwTitle;
            if (revid !== undefined) {
                page.localRevisionId = revid;
                page.onlineRevisionId = revid;
            }
            page.lastModified = Date.now();
        }
    }

    function unlinkPage(id: string) {
        const page = pages.value.find(p => p.id === id);
        if (page) {
            page.pcgwPageTitle = undefined;
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
                        lastModified: Date.now(),
                        pcgwPageTitle: importedData.pcgwPageTitle
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
                        lastModified: Date.now(),
                        pcgwPageTitle: importedData.pcgwPageTitle
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
            pcgwPageTitle: page.pcgwPageTitle,
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
        linkPage,
        unlinkPage,
        importPage,
        exportPage,
        syncToWikitext,
        syncFromWikitext,
        checkForUpdates
    };
});
