import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import SubsectionCodeWrapper from '../../../../src/components/common/SubsectionCodeWrapper.vue';
import { useUiStore } from '../../../../src/stores/ui';
import { useWorkspaceStore } from '../../../../src/stores/workspace';

describe('SubsectionCodeWrapper.vue', () => {
    let pinia: any;

    beforeEach(() => {
        localStorage.clear();
        pinia = createPinia();
        setActivePinia(pinia);
    });

    const createWrapper = (props = {}, slots = {}) => {
        return mount(SubsectionCodeWrapper, {
            props: {
                sectionKey: 'gameData.config',
                ...props
            },
            slots: {
                header: `<template #header="{ isCodeMode, toggleCode }">
                    <button class="test-toggle-btn" @click="toggleCode">
                        {{ isCodeMode ? 'Visual' : 'Code' }}
                    </button>
                </template>`,
                default: '<div class="visual-content">Visual Content</div>',
                ...slots
            },
            global: {
                plugins: [pinia],
                stubs: {
                    CodeEditor: {
                        name: 'CodeEditor',
                        props: ['modelValue'],
                        emits: ['update:modelValue'],
                        template: '<div class="mock-code-editor">{{ modelValue }}</div>'
                    }
                }
            }
        });
    };

    it('renders visual slot content initially', () => {
        const wrapper = createWrapper();
        expect(wrapper.find('.visual-content').exists()).toBe(true);
        expect(wrapper.find('.test-toggle-btn').text()).toBe('Code');
    });

    it('switches to code mode when toggleCode is invoked', async () => {
        const wrapper = createWrapper();
        const uiStore = useUiStore();
        const workspaceStore = useWorkspaceStore();

        workspaceStore.createPage('Test Page', '=== Configuration file(s) location ===\n{{Game data/config|Windows|test}}\n');

        const btn = wrapper.find('.test-toggle-btn');
        await btn.trigger('click');

        expect(uiStore.isSectionCode('gameData.config')).toBe(true);
        expect(wrapper.find('.visual-content').exists()).toBe(false);
        expect(wrapper.find('.test-toggle-btn').text()).toBe('Visual');
    });

    it('triggers syncFromWikitext when switching back to visual mode', async () => {
        const wrapper = createWrapper();
        const uiStore = useUiStore();
        const workspaceStore = useWorkspaceStore();

        workspaceStore.createPage('Test Page', '=== Configuration file(s) location ===\n{{Game data/config|Windows|test}}\n');

        const btn = wrapper.find('.test-toggle-btn');
        await btn.trigger('click');
        expect(uiStore.isSectionCode('gameData.config')).toBe(true);

        const syncSpy = vi.spyOn(workspaceStore, 'syncFromWikitext');
        await btn.trigger('click');

        expect(uiStore.isSectionCode('gameData.config')).toBe(false);
        expect(syncSpy).toHaveBeenCalled();
        expect(wrapper.find('.visual-content').exists()).toBe(true);
    });
});
