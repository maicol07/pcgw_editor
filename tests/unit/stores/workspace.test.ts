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

    it('resets section in activeGameData and strips section from activePage wikitext on deleteSection', async () => {
        const store = useWorkspaceStore();
        store.pages = [];
        const wikitext = '== Availability ==\n{{Availability\n|Steam|1234|Steam|}}\n\n== Video ==\n{{Video\n|widescreen resolution=true\n}}';
        store.createPage('Game Page', wikitext, 'singleplayer');
        await store.syncFromWikitext();

        expect(store.activeGameData.availability.length).toBeGreaterThan(0);
        expect(store.activePage?.wikitext).toContain('== Availability ==');

        store.deleteSection('availability');

        expect(store.activeGameData.availability.length).toBe(0);
        expect(store.activePage?.wikitext).not.toContain('== Availability ==');
        expect(store.activePage?.wikitext).not.toContain('{{Availability');
        expect(store.activePage?.wikitext).toContain('== Video ==');
    });

    it('moves gallery images from one section to another', async () => {
        const store = useWorkspaceStore();
        store.pages = [];
        store.createPage('Test Page');
        store.activeGameData.galleries = {
            video: [{ name: 'video_preview.jpg', caption: 'Video 1', position: 'gallery' }],
            input: []
        };

        const result = store.moveGalleryImages('Video', 'Input', [
            { name: 'video_preview.jpg', caption: 'Video 1', position: 'gallery' }
        ]);

        expect(result.moved).toHaveLength(1);
        expect(result.skipped).toHaveLength(0);
        expect(store.activeGameData.galleries.video).toHaveLength(0);
        expect(store.activeGameData.galleries.input).toHaveLength(1);
        expect(store.activeGameData.galleries.input[0].name).toBe('video_preview.jpg');
        expect(store.activeGameData.galleries.input[0].caption).toBe('Video 1');
    });

    it('skips duplicates when moving gallery images to a section that already contains them', async () => {
        const store = useWorkspaceStore();
        store.pages = [];
        store.createPage('Test Page');
        store.activeGameData.galleries = {
            video: [
                { name: 'shared.jpg', caption: 'Shared', position: 'gallery' },
                { name: 'unique.jpg', caption: 'Unique', position: 'gallery' }
            ],
            input: [
                { name: 'shared.jpg', caption: 'Existing', position: 'gallery' }
            ]
        };

        const result = store.moveGalleryImages('video', 'input', store.activeGameData.galleries.video);

        expect(result.moved).toHaveLength(1);
        expect(result.moved[0].name).toBe('unique.jpg');
        expect(result.skipped).toHaveLength(1);
        expect(result.skipped[0].name).toBe('shared.jpg');
        expect(store.activeGameData.galleries.video).toHaveLength(1);
        expect(store.activeGameData.galleries.video[0].name).toBe('shared.jpg');
        expect(store.activeGameData.galleries.input).toHaveLength(2);
    });
});
