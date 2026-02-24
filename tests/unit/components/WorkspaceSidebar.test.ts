import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkspaceSidebar from '../../../src/components/WorkspaceSidebar.vue';
import { createPinia, setActivePinia } from 'pinia';
import PrimeVue from 'primevue/config';

vi.mock('../../../src/services/pcgwApi', () => ({
    pcgwApi: {
        fetchTemplateWikitext: vi.fn().mockResolvedValue('== Mock Wikitext ==')
    }
}));

vi.mock('../../../src/stores/workspace', () => ({
    useWorkspaceStore: vi.fn(() => ({
        pages: [
            { id: '1', title: 'Test 1', wikitext: '', baseWikitext: '', lastModified: Date.now() },
            { id: '2', title: 'Test 2', wikitext: '', baseWikitext: '', lastModified: Date.now(), template: 'singleplayer' }
        ],
        activePageId: '1',
        createPage: vi.fn(),
        importPage: vi.fn(),
        exportPage: vi.fn(),
        deletePage: vi.fn(),
        setActivePage: vi.fn(),
        renamePage: vi.fn(),
    }))
}));

describe('WorkspaceSidebar.vue', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renders sidebar correctly with template labels', () => {
        const wrapper = mount(WorkspaceSidebar, {
            props: { visible: true },
            global: {
                plugins: [PrimeVue],
                stubs: {
                    Drawer: { template: '<div><slot></slot></div>' },
                    Dialog: { template: '<div><slot></slot><slot name="footer"></slot></div>' },
                    Button: { template: '<button><slot></slot><slot name="icon"></slot></button>' },
                    VirtualScroller: { template: '<div><slot name="item" :item="item" v-for="item in items"></slot></div>', props: ['items'] },
                    FileUpload: true,
                    InputText: true,
                    Select: true
                },
                directives: {
                    tooltip: () => { }
                }
            }
        });

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.html()).toContain('Test 1');
        expect(wrapper.html()).toContain('Test 2');
        expect(wrapper.html()).toContain('singleplayer');
    });
});
