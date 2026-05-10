import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import SectionGallery from '../../../src/components/SectionGallery.vue';
import { createTestingPinia } from '@pinia/testing';
import PrimeVue from 'primevue/config';
import Tooltip from 'primevue/tooltip';
import ToastService from 'primevue/toastservice';
import type { GalleryImage } from '../../../src/models/GameData';
import { useFileStore } from '../../../src/stores/files';

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

        it('replaces the image instead of appending when combined via Image Combiner', async () => {
            const wrapper = createWrapper([
                { name: 'image1.jpg', position: 'gallery', localId: 10 },
                { name: 'image2.jpg', position: 'gallery' }
            ]);
            const vm = wrapper.vm as any;
            
            const fileStore = useFileStore();
            (fileStore.addFile as any).mockResolvedValue(100);
            (fileStore.removeFile as any).mockResolvedValue(true);
            
            // 1. Trigger replace for the first image
            vm.triggerReplace(0);
            expect(vm.isReplacing).toBe(true);
            expect(vm.replaceImageIndex).toBe(0);

            // 2. Simulate clicking "Open Image Combiner" inside the Add Image dialog
            vm.showSearchDialog = false;
            vm.showCombineDialog = true;

            // Wait a bit to ensure the timeout inside the watch doesn't clear the replaceImageIndex
            await new Promise(resolve => setTimeout(resolve, 350));
            
            expect(vm.isReplacing).toBe(true); // Should still be replacing!
            expect(vm.replaceImageIndex).toBe(0);

            // 3. Prepare combine queue and preview blob
            vm.combineQueue = [
                { type: 'local', name: 'image3.jpg', localId: 3 },
                { type: 'local', name: 'image4.jpg', localId: 4 }
            ];
            vm.setPreviewObjUrlBlob(new Blob(['preview']));

            // 4. Confirm combination
            await vm.handleConfirmCombine();

            // 5. Verify the replacement in modelValue
            const emitted = wrapper.emitted('update:modelValue');
            expect(emitted).toBeTruthy();
            const lastEmission = emitted![emitted!.length - 1][0] as any[];
            
            // The gallery length should remain 2 (image1 replaced, image2 untouched)
            expect(lastEmission.length).toBe(2);
            
            // The first image should be the newly combined image
            const newCombinedImage = lastEmission[0];
            expect(newCombinedImage.name).toContain('combined_');
            expect(newCombinedImage.position).toBe('gallery');
            
            // The second image should still be image2
            expect(lastEmission[1].name).toBe('image2.jpg');
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
