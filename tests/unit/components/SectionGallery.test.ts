import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import SectionGallery from '../../../src/components/SectionGallery.vue';
import { createTestingPinia } from '@pinia/testing';
import PrimeVue from 'primevue/config';
import Tooltip from 'primevue/tooltip';
import ToastService from 'primevue/toastservice';
import type { GalleryImage } from '../../../src/models/GameData';

// Mock primevue/usetoast
vi.mock('primevue/usetoast', () => ({
    useToast: () => ({
        add: vi.fn(),
        remove: vi.fn(),
        removeAll: vi.fn()
    })
}));

// Mock services
vi.mock('../../../src/services/pcgwAuth', () => ({
    pcgwAuth: { isLoggedIn: true, username: 'TestUser' }
}));
vi.mock('../../../src/services/pcgwApi', () => ({
    pcgwApi: { 
        getImagesInfo: vi.fn().mockResolvedValue({}),
        getImageInfo: vi.fn().mockResolvedValue(null),
        getImagesByHash: vi.fn().mockResolvedValue([])
    }
}));
vi.mock('../../../src/services/pcgwMedia', () => ({
    pcgwMedia: {}
}));

// Mock Dexie
vi.mock('dexie', () => ({
    default: class Dexie {
        constructor() {}
        version() { return { stores: vi.fn() }; }
        table() { return { toArray: vi.fn().mockResolvedValue([]) }; }
    }
}));

// Mock URL API
global.URL.createObjectURL = vi.fn((_blob) => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('SectionGallery.vue', () => {
    let pinia: any;

    beforeEach(() => {
        pinia = createTestingPinia({
            createSpy: vi.fn,
            initialState: {
                files: {
                    files: [
                        { id: 1, blob: new Blob(['test']), name: 'local_test.jpg', status: 'uploaded', pcgwUrl: 'https://pcgw.example.com/local_test.jpg' },
                        { id: 2, blob: new Blob(['test']), name: 'only_local.jpg', status: 'uploading' }
                    ]
                },
                ui: {
                    autoUploadDescription: false
                }
            }
        });
    });

    const createWrapper = (modelValue: (GalleryImage | string)[] = []) => {
        return mount(SectionGallery, {
            props: {
                modelValue,
                section: 'test-section'
            },
            global: {
                plugins: [pinia, PrimeVue, ToastService],
                directives: {
                    tooltip: Tooltip
                },
                stubs: {
                    AutocompleteField: true,
                    VueDraggable: true,
                    Dialog: true,
                    FileUpload: true,
                    Menu: true
                }
            }
        });
    };

    describe('Replace Image Logic', () => {
        it('opens Add Image dialog with Replace context', async () => {
            const wrapper = createWrapper([
                { name: 'image1.jpg', position: 'gallery' }
            ]);
            const vm = wrapper.vm as any;
            
            expect(vm.replaceImageIndex).toBeNull();
            expect(vm.isReplacing).toBe(false);

            // simulate triggerReplace
            vm.triggerReplace(0);
            
            expect(vm.replaceImageIndex).toBe(0);
            expect(vm.isReplacing).toBe(true);
            expect(vm.showSearchDialog).toBe(true);
        });
    });

    describe('PCGW Priority and Switch Logic', () => {
        it('identifies if a local file is also on PCGW', async () => {
            const wrapper = createWrapper();
            const vm = wrapper.vm as any;
            
            // local file id 1 is 'uploaded' in mock store
            expect(vm.isAlsoOnPcgw({ name: 'local_test.jpg', localId: 1 })).toBe(true);
            
            // local file id 2 is 'uploading' in mock store
            expect(vm.isAlsoOnPcgw({ name: 'only_local.jpg', localId: 2 })).toBe(false);
            
            // no local id, just a name
            vm.resolvedInfos['pcgw image.jpg'] = { url: 'https://pcgw.example.com/pcgw_image.jpg' };
            expect(vm.isAlsoOnPcgw({ name: 'pcgw_image.jpg' })).toBe(false);
            
            // local file exists, and resolvedInfos has it
            expect(vm.isAlsoOnPcgw({ name: 'pcgw_image.jpg', localId: 2 })).toBe(true);
        });

        it('prioritizes PCGW url over local url when both exist', async () => {
            const wrapper = createWrapper();
            const vm = wrapper.vm as any;

            vm.resolvedInfos['local test.jpg'] = { url: 'https://pcgw.example.com/resolved_url.jpg' };
            
            const element: any = { name: 'local_test.jpg', localId: 1 };
            // default is to use PCGW
            expect(vm.getImageUrl(element)).toBe('https://pcgw.example.com/resolved_url.jpg');
            
            // switch to prefer local
            element.preferLocal = true;
            expect(vm.getImageUrl(element)).toBe('blob:mock-url'); // mocked object url for local file
        });

        it('toggles preferLocal on an item', async () => {
            const wrapper = createWrapper([
                { name: 'local_test.jpg', localId: 1 }
            ]);
            const vm = wrapper.vm as any;
            
            vm.toggleSource(0);
            
            // Should emit update:modelValue with preferLocal toggled
            const emitted = wrapper.emitted('update:modelValue');
            expect(emitted).toBeTruthy();
            expect(emitted![0][0]).toEqual([
                { name: 'local_test.jpg', localId: 1, preferLocal: true }
            ]);
        });
    });
});
