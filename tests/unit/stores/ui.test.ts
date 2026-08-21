import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach } from 'vitest';
import { useUiStore } from '../../../src/stores/ui';
import { nextTick } from 'vue';

describe('UI Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        localStorage.clear();
    });

    it('defaults hideAiFeatures to false', () => {
        const store = useUiStore();
        expect(store.hideAiFeatures).toBe(false);
    });

    it('loads hideAiFeatures from localStorage if set to true', () => {
        localStorage.setItem('hideAiFeatures', 'true');
        const store = useUiStore();
        expect(store.hideAiFeatures).toBe(true);
    });

    it('persists hideAiFeatures changes to localStorage', async () => {
        const store = useUiStore();
        store.hideAiFeatures = true;
        await nextTick();
        expect(localStorage.getItem('hideAiFeatures')).toBe('true');

        store.hideAiFeatures = false;
        await nextTick();
        expect(localStorage.getItem('hideAiFeatures')).toBe('false');
    });
});
