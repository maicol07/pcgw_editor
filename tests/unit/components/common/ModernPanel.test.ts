import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ModernPanel from '../../../../src/components/common/ModernPanel.vue';
import { useUiStore } from '../../../../src/stores/ui';
import { useWorkspaceStore } from '../../../../src/stores/workspace';

describe('ModernPanel.vue', () => {
    let pinia: any;

    beforeEach(() => {
        localStorage.clear();
        pinia = createPinia();
        setActivePinia(pinia);
    });

    const createWrapper = (props = {}, slots = {}) => {
        return mount(ModernPanel, {
            props: {
                sectionKey: 'video',
                ...props
            },
            slots: {
                header: '<span>Video Title</span>',
                default: '<div class="visual-content">Visual Form</div>',
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
                },
                directives: {
                    tooltip: {}
                }
            }
        });
    };

    it('renders header, visual content, and code toggle button by default', () => {
        const wrapper = createWrapper();
        expect(wrapper.text()).toContain('Video Title');
        expect(wrapper.find('.visual-content').exists()).toBe(true);

        const codeBtn = wrapper.find('button[aria-label="Switch to code editor"]');
        expect(codeBtn.exists()).toBe(true);
    });

    it('switches to code mode when code toggle button is clicked', async () => {
        const wrapper = createWrapper();
        const uiStore = useUiStore();
        const workspaceStore = useWorkspaceStore();

        workspaceStore.createPage('Test Page', '== Video ==\n{{Video\n|fov = 90\n}}\n');

        const codeBtn = wrapper.find('button[aria-label="Switch to code editor"]');
        await codeBtn.trigger('click');

        expect(uiStore.isSectionCode('video')).toBe(true);
        expect(wrapper.text()).toContain('Code');
        expect(wrapper.find('.visual-content').exists()).toBe(false);

        const visualBtn = wrapper.find('button[aria-label="Switch to visual editor"]');
        expect(visualBtn.exists()).toBe(true);
    });

    it('syncs back to workspace when returning to visual mode', async () => {
        const wrapper = createWrapper();
        const uiStore = useUiStore();
        const workspaceStore = useWorkspaceStore();

        workspaceStore.createPage('Test Page', '== Video ==\n{{Video\n|fov = 90\n}}\n');

        // Enter code mode
        await wrapper.find('button[aria-label="Switch to code editor"]').trigger('click');
        expect(uiStore.isSectionCode('video')).toBe(true);

        // Exit code mode
        const syncSpy = vi.spyOn(workspaceStore, 'syncFromWikitext');
        await wrapper.find('button[aria-label="Switch to visual editor"]').trigger('click');

        expect(uiStore.isSectionCode('video')).toBe(false);
        expect(syncSpy).toHaveBeenCalled();
        expect(wrapper.find('.visual-content').exists()).toBe(true);
    });
});
