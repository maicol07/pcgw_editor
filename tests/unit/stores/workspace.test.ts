import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWorkspaceStore } from '../../../src/stores/workspace';
import { pcgwApi } from '../../../src/services/pcgwApi';

describe('Workspace Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        localStorage.clear();
    });

    it('creates a new page with default blank template', async () => {
        const store = useWorkspaceStore();
        store.pages = []; // clear initial
        store.createPage('Test Page');
        expect(store.pages.length).toBe(1);
        expect(store.pages[0].title).toBe('Test Page');
        expect(store.pages[0].template).toBe('blank');
    });

    it('creates a new page with a specific template', async () => {
        const store = useWorkspaceStore();
        store.pages = [];
        store.createPage('Test Page 2', '== Initial Wikitext ==', 'singleplayer');
        expect(store.pages.length).toBe(1);
        expect(store.pages[0].title).toBe('Test Page 2');
        expect(store.pages[0].template).toBe('singleplayer');
        expect(store.pages[0].wikitext).toBe('== Initial Wikitext ==');
    });

    it('deletes a page', async () => {
        const store = useWorkspaceStore();
        store.pages = [];
        store.createPage('Test Page');
        const id = store.pages[0].id;
        store.deletePage(id);
        expect(store.pages.length).toBe(0);
    });

    it('checks all pages for updates using batch query', async () => {
        const store = useWorkspaceStore();
        store.pages = []; // clear initial
        
        // Create a couple of linked pages
        store.createPage('Page 1', 'Wikitext 1', 'singleplayer', 'Game 1', 100);
        store.createPage('Page 2', 'Wikitext 2', 'singleplayer', 'Game 2', 200);
        // Create an unlinked page
        store.createPage('Page 3', 'Wikitext 3', 'blank', undefined);

        // Spy on getLatestRevisionsInfo
        const spy = vi.spyOn(pcgwApi, 'getLatestRevisionsInfo').mockResolvedValue({
            'Game 1': { revid: 150 },
            'Game 2': { revid: 200 }
        });

        await store.checkAllPagesForUpdates();

        expect(spy).toHaveBeenCalledWith(['Game 1', 'Game 2']);
        
        const page1 = store.pages.find(p => p.title === 'Page 1');
        const page2 = store.pages.find(p => p.title === 'Page 2');
        const page3 = store.pages.find(p => p.title === 'Page 3');

        expect(page1?.onlineRevisionId).toBe(150);
        expect(page2?.onlineRevisionId).toBe(200);
        expect(page3?.onlineRevisionId).toBeUndefined();
    });
});
