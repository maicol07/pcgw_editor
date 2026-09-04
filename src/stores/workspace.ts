import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';
import { initialGameData, GameData, type GalleryImage } from '../models/GameData';
import { resolveGallerySectionKey } from '../config/gallerySections';
import { computed, ref, watch } from 'vue';
import { generateWikitext, PCGWEditor } from '../utils/wikitext';
import { parseWikitext } from '../utils/parser';
import { pcgwApi } from '../services/pcgwApi';
import { pcgwMedia } from '../services/pcgwMedia';

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
    const _activeGameData = ref<GameData>(structuredClone(initialGameData));

    // Watch for page changes to reset/parse data
    watch(activePageId, async () => {
        if (activePage.value && activePage.value.wikitext) {
            try {
                _activeGameData.value = await parseWikitext(activePage.value.wikitext);
            } catch (e) {
                console.error('Failed to parse wikitext on page switch:', e);
                _activeGameData.value = structuredClone(initialGameData);
            }
        } else {
            _activeGameData.value = structuredClone(initialGameData);
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

    function deleteSection(sectionKey: string) {
        if (!activePage.value || !_activeGameData.value) return;

        // 1. Reset the section's fields in _activeGameData to empty / blank state
        switch (sectionKey) {
            case 'articleState':
                _activeGameData.value.articleState = { stub: false, cleanup: false, delete: false };
                break;
            case 'infobox':
                _activeGameData.value.infobox = {
                    cover: '',
                    developers: [],
                    publishers: [],
                    engines: [],
                    releaseDates: [],
                    reception: [],
                    taxonomy: {} as any,
                    links: {} as any,
                    license: '',
                };
                break;
            case 'introduction':
                _activeGameData.value.introduction = {
                    introduction: '',
                    releaseHistory: '',
                    currentState: '',
                    generalInfo: '',
                };
                break;
            case 'availability':
                _activeGameData.value.availability = [];
                break;
            case 'monetization':
                _activeGameData.value.monetization = {
                    adSupported: '',
                    crossGameBonus: '',
                    dlc: '',
                    expansionPack: '',
                    freeware: '',
                    freeToPlay: '',
                    oneTimePurchase: '',
                    subscription: '',
                    subscriptionGamingService: '',
                };
                _activeGameData.value.microtransactions = {
                    boost: '',
                    cosmetic: '',
                    currency: '',
                    finiteSpend: '',
                    infiniteSpend: '',
                    freeToGrind: '',
                    lootBox: '',
                    none: '',
                    playerTrading: '',
                    timeLimited: '',
                    unlock: '',
                };
                break;
            case 'dlc':
                _activeGameData.value.dlc = [];
                break;
            case 'essentialImprovements':
                _activeGameData.value.essentialImprovements = '';
                break;
            case 'gameData':
                _activeGameData.value.config = {
                    configFiles: [],
                    saveData: [],
                    xdg: null,
                    cloudSync: {} as any,
                };
                if (_activeGameData.value.galleries) {
                    _activeGameData.value.galleries.game_data = [];
                }
                break;
            case 'video':
                _activeGameData.value.video = {} as any;
                if (_activeGameData.value.galleries) {
                    _activeGameData.value.galleries.video = [];
                }
                break;
            case 'input':
                _activeGameData.value.input = {} as any;
                if (_activeGameData.value.galleries) {
                    _activeGameData.value.galleries.input = [];
                }
                break;
            case 'audio':
                _activeGameData.value.audio = {} as any;
                if (_activeGameData.value.galleries) {
                    _activeGameData.value.galleries.audio = [];
                }
                break;
            case 'network':
                _activeGameData.value.network = {} as any;
                if (_activeGameData.value.galleries) {
                    _activeGameData.value.galleries.network = [];
                }
                break;
            case 'vr':
                _activeGameData.value.vr = {} as any;
                if (_activeGameData.value.galleries) {
                    _activeGameData.value.galleries.vr = [];
                }
                break;
            case 'issues':
                _activeGameData.value.issues = [];
                break;
            case 'other':
                _activeGameData.value.api = {} as any;
                _activeGameData.value.middleware = {} as any;
                if (_activeGameData.value.galleries) {
                    _activeGameData.value.galleries.other = [];
                }
                break;
            case 'systemReq':
                _activeGameData.value.requirements = {
                    windows: { minimum: {} as any, recommended: {} as any },
                    mac: { minimum: {} as any, recommended: {} as any },
                    linux: { minimum: {} as any, recommended: {} as any },
                };
                if (_activeGameData.value.galleries) {
                    _activeGameData.value.galleries.systemReq = [];
                }
                break;
            case 'l10n':
                _activeGameData.value.localizations = [];
                break;
        }

        // 2. Remove templates and sections directly from base and current wikitext
        if (activePage.value.baseWikitext) {
            const baseEditor = new PCGWEditor(activePage.value.baseWikitext);
            baseEditor.removeSectionByKey(sectionKey);
            activePage.value.baseWikitext = baseEditor.getText();
        }

        const currentEditor = new PCGWEditor(activePage.value.wikitext);
        currentEditor.removeSectionByKey(sectionKey);
        activePage.value.wikitext = currentEditor.getText();
        activePage.value.lastModified = Date.now();
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

    async function checkAllPagesForUpdates(): Promise<void> {
        const linkedPages = pages.value.filter(p => p.pcgwPageTitle);
        if (!linkedPages.length) return;

        const titles = linkedPages.map(p => p.pcgwPageTitle as string);
        const infoMap = await pcgwApi.getLatestRevisionsInfo(titles);

        linkedPages.forEach(page => {
            if (page.pcgwPageTitle && infoMap[page.pcgwPageTitle]) {
                page.onlineRevisionId = infoMap[page.pcgwPageTitle].revid;
            }
        });
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
            baseWikitext: initialWikitext || wikitext || '',
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
                // If we are linking and have a revision ID, initialization counts as having seen this online version too.
                if (!page.onlineRevisionId || page.onlineRevisionId < revid) {
                    page.onlineRevisionId = revid;
                }
            }
            page.lastModified = Date.now();
        }
    }

    async function publishPage(id: string, summary: string, force: boolean = false, minor: boolean = false, watchlist?: 'nochange' | 'watch' | 'unwatch' | 'preferences'): Promise<any> {
        const page = pages.value.find(p => p.id === id);
        if (!page || !page.pcgwPageTitle) {
            throw new Error('Page is not linked to PCGamingWiki.');
        }

        // 1. Conflict Check: See if there is a newer version online than what we think is the latest.
        if (!force) {
            const isOutdated = await checkForUpdates(id);
            if (isOutdated) {
                const error = new Error('A newer version of this page exists on PCGamingWiki.');
                (error as any).code = 'PUBLISH_CONFLICT';
                throw error;
            }
        }

        // 2. Perform Edit
        // Only send baserevid if we want the server to check for conflicts (i.e. not forced)
        // This is extra safety besides our check.
        const result = await pcgwMedia.editPage(
            page.pcgwPageTitle, 
            page.wikitext, 
            summary, 
            !force ? page.localRevisionId : undefined,
            minor,
            watchlist
        );

        if (result?.edit?.newrevid) {
            const newRevid = result.edit.newrevid;
            page.localRevisionId = newRevid;
            page.onlineRevisionId = newRevid;
            page.lastModified = Date.now();
            return result;
        } else if (result?.edit?.nochange !== undefined) {
            // No changes were made (wikitext is identical)
            if (result.edit.newrevid === undefined && page.onlineRevisionId) {
                page.localRevisionId = page.onlineRevisionId;
            }
            return result;
        } else if (result?.error?.code === 'editconflict' || result?.edit?.result === 'Failure' && result?.edit?.info?.includes('conflict')) {
            const error = new Error('MediaWiki reported an edit conflict.');
            (error as any).code = 'PUBLISH_CONFLICT';
            throw error;
        }

        throw new Error(result?.edit?.info || result?.error?.info || 'Failed to publish changes to PCGamingWiki.');
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

    function exportWorkspaceBackup() {
        const backupData = {
            version: '2.0',
            exportedAt: new Date().toISOString(),
            pageCount: pages.value.length,
            pages: pages.value,
            activePageId: activePageId.value
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        const dateTag = new Date().toISOString().slice(0, 10);
        downloadAnchorNode.setAttribute("download", `pcgw_workspace_backup_${dateTag}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    function importWorkspaceBackup(file: File): Promise<{ success: boolean; importedCount: number; message?: string }> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const parsed = JSON.parse(content);
                    const incomingPages: Page[] = Array.isArray(parsed.pages) ? parsed.pages : [];

                    if (incomingPages.length === 0) {
                        return resolve({ success: false, importedCount: 0, message: 'No valid pages found in backup file.' });
                    }

                    // Validate & assign unique IDs if colliding
                    const existingIds = new Set(pages.value.map(p => p.id));
                    let count = 0;
                    const pagesToAppend: Page[] = [];

                    for (const p of incomingPages) {
                        if (p && typeof p.title === 'string') {
                            const newId = (p.id && !existingIds.has(p.id)) ? p.id : crypto.randomUUID();
                            pagesToAppend.push({
                                id: newId,
                                title: p.title,
                                wikitext: p.wikitext || '',
                                baseWikitext: p.baseWikitext || '',
                                lastModified: p.lastModified || Date.now(),
                                template: p.template || 'blank',
                                pcgwPageTitle: p.pcgwPageTitle,
                                localRevisionId: p.localRevisionId,
                                onlineRevisionId: p.onlineRevisionId
                            });
                            existingIds.add(newId);
                            count++;
                        }
                    }

                    pages.value = [...pages.value, ...pagesToAppend];
                    if (pagesToAppend.length > 0 && !activePageId.value) {
                        activePageId.value = pagesToAppend[0].id;
                    }

                    resolve({ success: true, importedCount: count });
                } catch (err: any) {
                    reject(new Error('Invalid backup JSON format: ' + (err.message || 'parse error')));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file.'));
            reader.readAsText(file);
        });
    }

    function clearAllWorkspaceData() {
        pages.value = [];
        activePageId.value = '';
        _activeGameData.value = structuredClone(initialGameData);
    }

    function moveGalleryImages(
        fromSection: string,
        toSection: string,
        imagesToMove: (GalleryImage | string)[]
    ): { moved: GalleryImage[]; skipped: GalleryImage[] } {
        if (!_activeGameData.value || imagesToMove.length === 0) {
            return { moved: [], skipped: [] };
        }

        const fromKey = resolveGallerySectionKey(fromSection);
        const toKey = resolveGallerySectionKey(toSection);

        if (fromKey === toKey) {
            return { moved: [], skipped: [] };
        }

        if (!_activeGameData.value.galleries) {
            _activeGameData.value.galleries = {};
        }
        if (!_activeGameData.value.galleries[fromKey]) {
            _activeGameData.value.galleries[fromKey] = [];
        }
        if (!_activeGameData.value.galleries[toKey]) {
            _activeGameData.value.galleries[toKey] = [];
        }

        const normalize = (item: GalleryImage | string): GalleryImage => {
            if (typeof item === 'string') {
                return { name: item, caption: '', position: 'gallery' };
            }
            return { ...item, position: item.position || 'gallery' };
        };

        const targetList = _activeGameData.value.galleries[toKey];
        const moved: GalleryImage[] = [];
        const skipped: GalleryImage[] = [];

        const isDuplicate = (targetItem: GalleryImage, item: GalleryImage) => {
            if (item.localId !== undefined && targetItem.localId !== undefined) {
                return item.localId === targetItem.localId;
            }
            return targetItem.name.trim().toLowerCase() === item.name.trim().toLowerCase();
        };

        for (const rawItem of imagesToMove) {
            const item = normalize(rawItem);
            const exists = targetList.some(target => isDuplicate(target, item));
            if (exists) {
                skipped.push(item);
            } else {
                moved.push(item);
            }
        }

        if (moved.length > 0) {
            _activeGameData.value.galleries[fromKey] = _activeGameData.value.galleries[fromKey].filter(sourceItem => {
                const normalizedSource = normalize(sourceItem);
                return !moved.some(m => isDuplicate(normalizedSource, m));
            });

            _activeGameData.value.galleries[toKey] = [...targetList, ...moved];
        }

        return { moved, skipped };
    }

    // Initialize if empty
    if (pages.value.length > 0 && (!activePageId.value || !pages.value.find(p => p.id === activePageId.value))) {
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
        exportWorkspaceBackup,
        importWorkspaceBackup,
        clearAllWorkspaceData,
        deleteSection,
        moveGalleryImages,
        syncToWikitext,
        syncFromWikitext,
        checkForUpdates,
        checkAllPagesForUpdates,
        publishPage
    };
});
