import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import SectionGallery from '../../../src/components/SectionGallery.vue';
import { createTestingPinia } from '@pinia/testing';
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

        // Mock window.Image globally to resolve onload immediately by default with safe dimensions
        const defaultMockImage = {
            width: 100,
            height: 100,
            onload: null as any,
            onerror: null as any,
            set src(_val: string) {
                setTimeout(() => {
                    if (this.onload) this.onload();
                }, 0);
            }
        };
        vi.spyOn(window, 'Image').mockImplementation(function() {
            return defaultMockImage;
        } as any);

        // Mock HTMLCanvasElement.prototype.toBlob globally
        vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (this: HTMLCanvasElement, callback: any) {
            callback(new Blob(['resized_blob_data']));
        });
    });

    const createWrapper = (modelValue: (GalleryImage | string)[] = []) => {
        return mount(SectionGallery, {
            props: {
                modelValue,
                section: 'test-section'
            },
            global: {
                plugins: [pinia, ToastService],
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

        it('proxies PCGW url when it belongs to pcgamingwiki.com', async () => {
            const wrapper = createWrapper();
            const vm = wrapper.vm as any;

            vm.resolvedInfos['pcgamingwiki image.jpg'] = { url: 'https://images.pcgamingwiki.com/w/images/a/ab/Cover.jpg' };
            
            const element: any = { name: 'pcgamingwiki image.jpg' };
            const expected = `https://pcgw-proxy-login.maicol07.workers.dev/api/image?url=${encodeURIComponent('https://images.pcgamingwiki.com/w/images/a/ab/Cover.jpg')}`;
            expect(vm.getImageUrl(element)).toBe(expected);
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

    describe('Upload Warning Handling', () => {
        it('handles exists-normalized warning and shows overwrite confirm dialog', async () => {
            const wrapper = createWrapper([
                { name: 'test_upload.jpg', position: 'gallery', localId: 1 }
            ]);
            const vm = wrapper.vm as any;
            
            const { pcgwMedia } = await import('../../../src/services/pcgwMedia');
            (pcgwMedia as any).uploadFile = vi.fn().mockResolvedValue({
                upload: {
                    result: 'Warning',
                    warnings: {
                        'exists-normalized': 'Test_Upload.jpg'
                    }
                }
            });
            (pcgwMedia as any).checkFileExists = vi.fn().mockResolvedValue(false);
            
            vm.selectedFile = { id: 1, blob: new Blob(['test']), name: 'test_upload.jpg' };
            vm.editFilename = 'test_upload.jpg';
            
            await vm.processUpload();
            
            expect(vm.isUploading).toBe(false);
            expect(vm.showOverwriteConfirm).toBe(true);
            expect(vm.duplicateInfo).toEqual({ filename: 'test_upload.jpg', type: 'warning' });
        });

        it('throws error for unhandled upload warnings', async () => {
            const wrapper = createWrapper([
                { name: 'test_upload.jpg', position: 'gallery', localId: 1 }
            ]);
            const vm = wrapper.vm as any;
            
            const { pcgwMedia } = await import('../../../src/services/pcgwMedia');
            (pcgwMedia as any).uploadFile = vi.fn().mockResolvedValue({
                upload: {
                    result: 'Warning',
                    warnings: {
                        'some-other-warning': true
                    }
                }
            });
            (pcgwMedia as any).checkFileExists = vi.fn().mockResolvedValue(false);
            
            vm.selectedFile = { id: 1, blob: new Blob(['test']), name: 'test_upload.jpg' };
            vm.editFilename = 'test_upload.jpg';
            
            await vm.processUpload();
            
            expect(vm.isUploading).toBe(false);
            const fileStore = useFileStore();
            expect(fileStore.updateFileStatus).toHaveBeenCalledWith(1, {
                status: 'error',
                error: 'Upload warning: {"some-other-warning":true}'
            });
        });
    });

    describe('Upload Concurrency and Race Condition Safety', () => {
        it('prevents initiating a new upload when an upload is in progress or dialog is showing', async () => {
            const wrapper = createWrapper();
            const vm = wrapper.vm as any;
            
            const fileA = { id: 1, blob: new Blob(['A']), name: 'imageA.jpg' };
            const fileB = { id: 2, blob: new Blob(['B']), name: 'imageB.jpg' };
            
            // Initial upload
            vm.initiateUpload(fileA);
            expect(vm.selectedFile).toEqual(fileA);
            expect(vm.showConfirmUpload).toBe(true);
            
            // Attempt to upload fileB while confirm upload is open
            vm.initiateUpload(fileB);
            expect(vm.selectedFile).toEqual(fileA); // Should NOT have changed to fileB!
            
            // Reset and simulate active upload
            vm.showConfirmUpload = false;
            vm.isUploading = true;
            vm.initiateUpload(fileB);
            expect(vm.selectedFile).toEqual(fileA); // Should NOT have changed!
            
            // Reset and simulate overwrite warning open
            vm.isUploading = false;
            vm.showOverwriteConfirm = true;
            vm.initiateUpload(fileB);
            expect(vm.selectedFile).toEqual(fileA); // Should NOT have changed!
        });

        it('captures filename and description locally during processUpload to prevent race conditions', async () => {
            const wrapper = createWrapper();
            const vm = wrapper.vm as any;
            
            const { pcgwMedia } = await import('../../../src/services/pcgwMedia');
            
            // Mock a slow upload using a promise we control
            let resolveUpload: any;
            const uploadPromise = new Promise((resolve) => {
                resolveUpload = resolve;
            });
            pcgwMedia.uploadFile = vi.fn().mockReturnValue(uploadPromise);
            pcgwMedia.checkFileExists = vi.fn().mockResolvedValue(false);
            
            const fileA = { id: 1, blob: new Blob(['A']), name: 'imageA.jpg', status: 'local' };
            vm.selectedFile = fileA;
            vm.editFilename = 'imageA.jpg';
            vm.editDescription = 'Desc A';
            
            // Start uploading A
            const processPromise = vm.processUpload();
            
            // Simulate user opening dialog for image B, changing refs while A is in progress
            vm.editFilename = 'imageB.jpg';
            vm.editDescription = 'Desc B';
            
            // Resolve upload of A with success
            resolveUpload({
                upload: {
                    result: 'Success',
                    imageinfo: {
                        url: 'https://pcgw.example.com/imageA.jpg',
                        size: 100,
                        width: 50,
                        height: 50,
                        descriptionurl: 'https://pcgw.example.com/File:imageA.jpg'
                    }
                }
            });
            
            await processPromise;
            
            // Verification:
            // 1. pcgwMedia.uploadFile should have been called with A's filename and description
            expect(pcgwMedia.uploadFile).toHaveBeenCalledWith(expect.any(Blob), expect.objectContaining({
                filename: 'imageA.jpg',
                comment: expect.stringContaining('Desc A')
            }));
            
            // 2. resolvedInfos should have been updated with A's details under 'imageA.jpg' (normalized A)
            // and NOT 'imageB.jpg' (normalized B)
            expect(vm.resolvedInfos['imageA.jpg']).toBeDefined();
            expect(vm.resolvedInfos['imageB.jpg']).toBeUndefined();
            
            // 3. fileStore.updateFileStatus should have been called with targetFilename ('imageA.jpg') and targetDescription ('Desc A')
            const fileStore = useFileStore();
            expect(fileStore.updateFileStatus).toHaveBeenCalledWith(1, expect.objectContaining({
                status: 'uploaded',
                name: 'imageA.jpg',
                description: 'Desc A'
            }));
        });
    });

    describe('Image Format Selection Logic', () => {
        it('correctly retrieves MIME type from file extension', () => {
            const wrapper = createWrapper();
            const vm = wrapper.vm as any;

            expect(vm.getImageFormatFromName('photo.png')).toBe('image/png');
            expect(vm.getImageFormatFromName('photo.jpg')).toBe('image/jpeg');
            expect(vm.getImageFormatFromName('photo.jpeg')).toBe('image/jpeg');
            expect(vm.getImageFormatFromName('photo.webp')).toBe('image/webp');
            expect(vm.getImageFormatFromName('photo.unknown')).toBe('image/png'); // fallback
        });

        it('correctly replaces file extension based on MIME type', () => {
            const wrapper = createWrapper();
            const vm = wrapper.vm as any;

            expect(vm.replaceExtension('image.png', 'image/jpeg')).toBe('image.jpg');
            expect(vm.replaceExtension('image.jpg', 'image/webp')).toBe('image.webp');
            expect(vm.replaceExtension('image.webp', 'image/png')).toBe('image.png');
            expect(vm.replaceExtension('no-ext', 'image/png')).toBe('no-ext'); // no extension to replace
        });

        it('extracts correct original format for crop jobs', () => {
            const wrapper = createWrapper();
            const vm = wrapper.vm as any;

            // Crop job from local file in gallery with JPEG format in store
            const galleryJob = {
                type: 'gallery' as const,
                galleryItem: { name: 'local_test.jpg', localId: 1, position: 'gallery' as const }
            };
            expect(vm.getOriginalFormatForCrop(galleryJob)).toBe('image/jpeg'); // Mock store file 1 is JPEG implicitly or falls back to name if no file type

            // Crop job from combine item with file type
            const combineJob = {
                type: 'combine' as const,
                combineItem: {
                    name: 'combined_image.png',
                    type: 'local' as const,
                    id: 'local-10',
                    file: new File([new Blob([''])], 'combined_image.png', { type: 'image/png' })
                }
            };
            expect(vm.getOriginalFormatForCrop(combineJob)).toBe('image/png');
        });

        it('determines the most used format in combine queue with tiebreaker', () => {
            const wrapper = createWrapper();
            const vm = wrapper.vm as any;

            // 2 JPEGs and 1 PNG -> JPEG
            const queue1 = [
                { id: '1', type: 'local' as const, name: 'image1.jpg', file: new File([], 'image1.jpg', { type: 'image/jpeg' }) },
                { id: '2', type: 'local' as const, name: 'image2.png', file: new File([], 'image2.png', { type: 'image/png' }) },
                { id: '3', type: 'local' as const, name: 'image3.jpg', file: new File([], 'image3.jpg', { type: 'image/jpeg' }) }
            ];
            expect(vm.getDefaultCombineFormat(queue1)).toBe('image/jpeg');

            // 1 JPEG and 1 PNG (Tie) -> first one in queue (JPEG)
            const queue2 = [
                { id: '1', type: 'local' as const, name: 'image1.jpg', file: new File([], 'image1.jpg', { type: 'image/jpeg' }) },
                { id: '2', type: 'local' as const, name: 'image2.png', file: new File([], 'image2.png', { type: 'image/png' }) }
            ];
            expect(vm.getDefaultCombineFormat(queue2)).toBe('image/jpeg');

            // 1 PNG and 1 JPEG (Tie) -> first one in queue (PNG)
            const queue3 = [
                { id: '1', type: 'local' as const, name: 'image1.png', file: new File([], 'image1.png', { type: 'image/png' }) },
                { id: '2', type: 'local' as const, name: 'image2.jpg', file: new File([], 'image2.jpg', { type: 'image/jpeg' }) }
            ];
            expect(vm.getDefaultCombineFormat(queue3)).toBe('image/png');
        });

        it('updates selectedCombineFormat reactively on combineQueue changes unless manual flag is set', async () => {
            const wrapper = createWrapper();
            const vm = wrapper.vm as any;

            expect(vm.selectedCombineFormat).toBe('image/png');
            expect(vm.isCombineFormatManuallySelected).toBe(false);

            // Add JPEG image to queue
            vm.combineQueue = [
                { id: '1', type: 'local' as const, name: 'image1.jpg', file: new File([], 'image1.jpg', { type: 'image/jpeg' }) }
            ];
            await wrapper.vm.$nextTick(); // Wait for watcher to trigger

            expect(vm.selectedCombineFormat).toBe('image/jpeg');

            // Override manually
            vm.onCombineFormatChange();
            expect(vm.isCombineFormatManuallySelected).toBe(true);

            // Add PNG image (it should be the majority, but should not override since manual flag is set)
            vm.combineQueue = [
                { id: '1', type: 'local' as const, name: 'image1.jpg', file: new File([], 'image1.jpg', { type: 'image/jpeg' }) },
                { id: '2', type: 'local' as const, name: 'image2.png', file: new File([], 'image2.png', { type: 'image/png' }) },
                { id: '3', type: 'local' as const, name: 'image3.png', file: new File([], 'image3.png', { type: 'image/png' }) }
            ];
            await wrapper.vm.$nextTick();

            expect(vm.selectedCombineFormat).toBe('image/jpeg'); // Kept JPEG manual choice!
        });

        it('creates file with correct format and extension on handleConfirmCombine', async () => {
            const wrapper = createWrapper();
            const vm = wrapper.vm as any;

            const fileStore = useFileStore();
            (fileStore.addFile as any).mockResolvedValue(200);

            // Set combine queue and preview blob
            vm.combineQueue = [
                { id: '1', type: 'local' as const, name: 'image1.jpg', file: new File([], 'image1.jpg', { type: 'image/jpeg' }) },
                { id: '2', type: 'local' as const, name: 'image2.jpg', file: new File([], 'image2.jpg', { type: 'image/jpeg' }) }
            ];
            vm.setPreviewObjUrlBlob(new Blob(['preview']));

            // Choose WebP output format
            vm.selectedCombineFormat = 'image/webp';

            await vm.handleConfirmCombine();

            // Verify call to addFile with correct file extension (.webp) and MIME (image/webp)
            expect(fileStore.addFile).toHaveBeenCalled();
            const addedFile = (fileStore.addFile as any).mock.calls[0][0] as File;
            expect(addedFile.name).toContain('.webp');
            expect(addedFile.type).toBe('image/webp');

            // Verify call to updateFileStatus with correct combineConfig
            expect(fileStore.updateFileStatus).toHaveBeenCalledWith(200, {
                combineConfig: {
                    orientation: 'vertical',
                    gap: 0,
                    items: [
                        { name: 'image1.jpg', type: 'local', localId: undefined },
                        { name: 'image2.jpg', type: 'local', localId: undefined }
                    ]
                }
            });
        });

        it('suggests filename based on common prefix or suffix of queue items', async () => {
            const wrapper = createWrapper();
            const vm = wrapper.vm as any;

            // Test common prefix: GTA_V_1.png, GTA_V_2.jpg
            vm.combineQueue = [
                { id: '1', type: 'local' as const, name: 'GTA_V_1.png', file: new File([], 'GTA_V_1.png', { type: 'image/png' }) },
                { id: '2', type: 'local' as const, name: 'GTA_V_2.jpg', file: new File([], 'GTA_V_2.jpg', { type: 'image/jpeg' }) }
            ];
            await wrapper.vm.$nextTick();
            expect(vm.combineFileName).toBe('GTA_V');

            // Test common suffix: 1_Skyrim.png, 2_Skyrim.jpg
            vm.combineQueue = [
                { id: '1', type: 'local' as const, name: '1_Skyrim.png', file: new File([], '1_Skyrim.png', { type: 'image/png' }) },
                { id: '2', type: 'local' as const, name: '2_Skyrim.jpg', file: new File([], '2_Skyrim.jpg', { type: 'image/jpeg' }) }
            ];
            await wrapper.vm.$nextTick();
            expect(vm.combineFileName).toBe('Skyrim');

            // Test no common prefix/suffix
            vm.combineQueue = [
                { id: '1', type: 'local' as const, name: 'GTA_V_1.png', file: new File([], 'GTA_V_1.png', { type: 'image/png' }) },
                { id: '2', type: 'local' as const, name: 'Skyrim.jpg', file: new File([], 'Skyrim.jpg', { type: 'image/jpeg' }) }
            ];
            await wrapper.vm.$nextTick();
            expect(vm.combineFileName).toContain('combined_');
        });

        it('does not override manual filename changes on queue updates', async () => {
            const wrapper = createWrapper();
            const vm = wrapper.vm as any;

            vm.combineQueue = [
                { id: '1', type: 'local' as const, name: 'GTA_V_1.png', file: new File([], 'GTA_V_1.png', { type: 'image/png' }) }
            ];
            await wrapper.vm.$nextTick();
            expect(vm.combineFileName).toBe('GTA_V_1');

            // Manually edit the filename
            vm.combineFileName = 'CustomName';
            vm.isCombineFileNameManuallyEdited = true;

            // Update queue
            vm.combineQueue = [
                ...vm.combineQueue,
                { id: '2', type: 'local' as const, name: 'GTA_V_2.png', file: new File([], 'GTA_V_2.png', { type: 'image/png' }) }
            ];
            await wrapper.vm.$nextTick();
            expect(vm.combineFileName).toBe('CustomName');
        });

        it('sanitizes filename and strips double/incorrect extensions when confirming combination', async () => {
            const wrapper = createWrapper();
            const vm = wrapper.vm as any;

            const fileStore = useFileStore();
            (fileStore.addFile as any).mockResolvedValue(201);

            vm.combineQueue = [
                { id: '1', type: 'local' as const, name: 'GTA_V_1.png', file: new File([], 'GTA_V_1.png', { type: 'image/png' }) },
                { id: '2', type: 'local' as const, name: 'GTA_V_2.png', file: new File([], 'GTA_V_2.png', { type: 'image/png' }) }
            ];
            vm.setPreviewObjUrlBlob(new Blob(['preview']));
            vm.selectedCombineFormat = 'image/png';

            // Custom name with weird characters, path traversal attempt, and extension suffix
            vm.combineFileName = '../../My Game Image.png';
            await vm.handleConfirmCombine();

            expect(fileStore.addFile).toHaveBeenCalled();
            const addedFile = (fileStore.addFile as any).mock.calls[0][0] as File;
            // The extension '.png' from target format is appended.
            // "../../" will be stripped completely because '/' is not allowed.
            expect(addedFile.name).toBe('My Game Image.png');
        });
    });

    describe('Image Megapixel Validation & Auto-resizing', () => {
        let mockImage: any;

        beforeEach(() => {
            // Mock window.Image
            mockImage = {
                width: 0,
                height: 0,
                onload: null as any,
                onerror: null as any,
                set src(_val: string) {
                    setTimeout(() => {
                        if (this.onload) this.onload();
                    }, 0);
                }
            };
            vi.spyOn(window, 'Image').mockImplementation(function() {
                return mockImage;
            } as any);

            // Mock HTMLCanvasElement.prototype.toBlob
            vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (this: HTMLCanvasElement, callback: any) {
                callback(new Blob(['resized_blob_data']));
            });
        });

        it('does not trigger warning dialog for images under 12.5 MP', async () => {
            const wrapper = createWrapper();
            const vm = wrapper.vm as any;

            mockImage.width = 3000;
            mockImage.height = 4000; // 12 MP (under 12.5 MP)

            const file = new File([new Blob(['test'])], 'under_limit.jpg', { type: 'image/jpeg' });
            
            const resultPromise = vm.checkAndResizeImage(file);
            const resultFile = await resultPromise;

            expect(vm.showMpWarningDialog).toBe(false);
            expect(resultFile).toBe(file);
        });

        it('triggers warning dialog for images over 12.5 MP', async () => {
            const wrapper = createWrapper();
            const vm = wrapper.vm as any;

            mockImage.width = 4000;
            mockImage.height = 4000; // 16 MP (over 12.5 MP)

            const file = new File([new Blob(['test'])], 'over_limit.jpg', { type: 'image/jpeg' });
            
            const resultPromise = vm.checkAndResizeImage(file);

            // Wait a tick for the image onload to run
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(vm.showMpWarningDialog).toBe(true);
            expect(vm.mpWarningData).not.toBeNull();
            expect(vm.mpWarningData.filename).toBe('over_limit.jpg');
            expect(vm.mpWarningData.mp).toBe(16);
            expect(vm.mpWarningData.newWidth).toBeLessThan(4000);
            expect(vm.mpWarningData.newHeight).toBeLessThan(4000);
        });

        it('keeps the original file when choosing No/KeepOriginal', async () => {
            const wrapper = createWrapper();
            const vm = wrapper.vm as any;

            mockImage.width = 4000;
            mockImage.height = 4000; // 16 MP

            const file = new File([new Blob(['test'])], 'over_limit.jpg', { type: 'image/jpeg' });
            const resultPromise = vm.checkAndResizeImage(file);

            // Wait a tick for onload
            await new Promise(resolve => setTimeout(resolve, 10));

            // Choose KeepOriginal
            vm.handleMpKeepOriginal();

            const resultFile = await resultPromise;
            expect(vm.showMpWarningDialog).toBe(false);
            expect(resultFile).toStrictEqual(file);
        });

        it('returns null when choosing Cancel', async () => {
            const wrapper = createWrapper();
            const vm = wrapper.vm as any;

            mockImage.width = 4000;
            mockImage.height = 4000; // 16 MP

            const file = new File([new Blob(['test'])], 'over_limit.jpg', { type: 'image/jpeg' });
            const resultPromise = vm.checkAndResizeImage(file);

            // Wait a tick for onload
            await new Promise(resolve => setTimeout(resolve, 10));

            // Choose Cancel
            vm.handleMpCancel();

            const resultFile = await resultPromise;
            expect(vm.showMpWarningDialog).toBe(false);
            expect(resultFile).toBeNull();
        });

        it('resizes the image when choosing Yes/ResizeConfirm', async () => {
            const wrapper = createWrapper();
            const vm = wrapper.vm as any;

            mockImage.width = 4000;
            mockImage.height = 4000; // 16 MP

            const file = new File([new Blob(['test'])], 'over_limit.jpg', { type: 'image/jpeg' });
            const resultPromise = vm.checkAndResizeImage(file);

            // Wait a tick for onload
            await new Promise(resolve => setTimeout(resolve, 10));

            // Choose ResizeConfirm
            vm.handleMpResizeConfirm();

            // Wait a tick for resizing process
            await new Promise(resolve => setTimeout(resolve, 10));

            const resultFile = await resultPromise;
            expect(vm.showMpWarningDialog).toBe(false);
            expect(resultFile).not.toBeNull();
            expect(resultFile.name).toBe('over_limit.jpg');
            expect(resultFile.type).toBe('image/jpeg');
        });

        it('correctly detects and records large images reactively in largeImages map', async () => {
            const fileStore = useFileStore();
            // Mock file in store with id 5
            fileStore.files.push({
                id: 5,
                blob: new Blob(['test']),
                size: 100,
                name: 'large_gallery_file.jpg',
                type: 'image/jpeg',
                status: 'local',
                lastModified: Date.now()
            });

            const wrapper = createWrapper([
                { name: 'large_gallery_file.jpg', localId: 5, position: 'gallery' }
            ]);
            const vm = wrapper.vm as any;

            mockImage.width = 4000;
            mockImage.height = 4000; // 16 MP

            // Trigger dimension check
            vm.checkGalleryItemMp(5);

            // Wait a tick for onload
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(vm.largeImages[5]).not.toBeNull();
            expect(vm.largeImages[5].mp).toBe(16);
            expect(vm.largeImages[5].width).toBe(4000);
            expect(vm.largeImages[5].height).toBe(4000);
        });
    });
});
