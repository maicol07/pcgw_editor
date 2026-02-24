import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkspaceStore } from '../../../src/stores/workspace';

describe('Workspace Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        localStorage.clear();
    });

    it('creates a new page with default blank template', () => {
        const store = useWorkspaceStore();
        store.pages = []; // clear initial
        store.createPage('Test Page');
        expect(store.pages.length).toBe(1);
        expect(store.pages[0].title).toBe('Test Page');
        expect(store.pages[0].template).toBeUndefined();
    });

    it('creates a new page with a specific template', () => {
        const store = useWorkspaceStore();
        store.pages = [];
        store.createPage('Test Page 2', '== Initial Wikitext ==', 'singleplayer');
        expect(store.pages.length).toBe(1);
        expect(store.pages[0].title).toBe('Test Page 2');
        expect(store.pages[0].template).toBe('singleplayer');
        expect(store.pages[0].wikitext).toBe('== Initial Wikitext ==');
    });

    it('deletes a page', () => {
        const store = useWorkspaceStore();
        store.pages = [];
        store.createPage('Test Page');
        const id = store.pages[0].id;
        store.deletePage(id);
        expect(store.pages.length).toBe(0);
    });
});
