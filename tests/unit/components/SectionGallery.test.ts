import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import SectionGallery from '../../../src/components/SectionGallery.vue';
import { pcgwApi } from '../../../src/services/pcgwApi';
import { pcgwAuth } from '../../../src/services/pcgwAuth';
import { pcgwMedia } from '../../../src/services/pcgwMedia';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';

// Mock URL methods
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Shared mock objects to ensure test and component use the same instances
const { mockFileStore, mockPcgwAuth, mockPcgwMedia } = vi.hoisted(() => ({
    mockFileStore: {
        loadFiles: vi.fn(() => Promise.resolve([])),
        files: [] as any[],
        addFile: vi.fn(),
        updateFileStatus: vi.fn(() => Promise.resolve())
    },
    mockPcgwAuth: {
        isLoggedIn: true,
        username: 'test-user',
        sessionCookies: 'test-cookies',
        getCsrfToken: vi.fn(() => Promise.resolve('csrf-token')),
    },
    mockPcgwMedia: {
        editPage: vi.fn(),
        uploadFile: vi.fn(),
        checkFileExists: vi.fn(),
        moveFile: vi.fn(() => Promise.resolve()),
    }
}));

// Mock services
vi.mock('../../../src/services/pcgwApi', () => ({
    pcgwApi: {
        getPageContent: vi.fn(),
        getImagesByHash: vi.fn(() => Promise.resolve([])),
        getImagesInfo: vi.fn(() => Promise.resolve({})),
        getImageInfo: vi.fn(() => Promise.resolve(null)),
        resetCache: vi.fn(),
    }
}));

// Mock local store/db to avoid IndexedDB errors
vi.mock('@/stores/files', () => ({
    useFileStore: () => mockFileStore
}));

vi.mock('../../../src/services/pcgwAuth', () => ({
    pcgwAuth: mockPcgwAuth
}));

vi.mock('../../../src/services/pcgwMedia', () => ({
    pcgwMedia: mockPcgwMedia
}));

// Mock Lucide components
vi.mock('lucide-vue-next', () => {
    const icons = [
        'Images', 'Image', 'GripHorizontal', 'ExternalLink', 'Pencil', 'Trash2', 'PanelRight', 'Grid',
        'Upload', 'CheckCircle2', 'AlertCircle', 'Loader2', 'LogOut', 'HardDrive', 'MoreVertical', 
        'User', 'Plus', 'Info', 'ShieldAlert', 'LogIn', 'Replace', 'TextCursorInput', 'Crop', 'Combine'
    ];
    const mock: any = {};
    icons.forEach(i => mock[i] = { template: `<span>${i}</span>` });
    return mock;
});

describe('SectionGallery.vue - Enhancement Deletion', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
        mockFileStore.files.length = 0;
    });

    const setupWrapper = (props = {}) => {
        return mount(SectionGallery, {
            global: {
                plugins: [PrimeVue, ToastService],
                directives: { 'tooltip': Tooltip },
                stubs: {
                    'Dialog': {
                        template: '<div><slot></slot><slot name="footer"></slot></div>',
                        props: ['visible']
                    },
                    Button: true,
                    Image: true,
                    ProgressBar: true,
                    ToggleButton: true, // If used anywhere
                    MultiSelect: true,
                    InputNumber: true,
                    RadioButton: true,
                    ToggleSwitch: true,
                    FileUpload: {
                        template: '<div><slot></slot></div>',
                        methods: {
                            choose: vi.fn(),
                            clear: vi.fn(),
                        }
                    },
                    WysiwygEditor: true,
                    PcgwMediaBadge: true,
                }
            },
            props: {
                modelValue: [],
                header: 'Gallery',
                section: 'Gallery',
                ...props
            }
        });
    };

    it('detects existing delete tag in file description', async () => {
        const image = { name: 'Test.jpg', caption: 'Capt', position: 'gallery' };
        vi.mocked(pcgwApi.getPageContent).mockResolvedValue('{{delete|reason=Old reason}}\nExisting content');
        
        const wrapper = setupWrapper({ modelValue: [image] });
        const vm = wrapper.vm as any;
        
        await vm.initiateDelete(image);
        
        expect(pcgwApi.getPageContent).toHaveBeenCalledWith('File:Test.jpg');
        expect(vm.existingDeletionReason).toBe('Old reason');
    });

    it('replaces existing delete tag in handleConfirmDelete', async () => {
        const image = { name: 'Test.jpg', caption: 'Capt', position: 'gallery' };
        vi.mocked(pcgwApi.getPageContent).mockResolvedValue('{{delete|reason=Old reason}}\nSome content');
        
        const wrapper = setupWrapper({ modelValue: [image] });
        const vm = wrapper.vm as any;
        
        await vm.initiateDelete(image);
        vm.pcgwDeletionReason = 'New reason';
        await vm.handleConfirmDelete();
        
        expect(pcgwMedia.editPage).toHaveBeenCalledWith(
            'File:Test.jpg',
            '{{delete|reason=New reason}}\nSome content',
            expect.stringContaining('Requesting file deletion')
        );
    });

    it('saves edited caption to the correct item in modelValue', async () => {
        const image = { name: 'TestCaption.jpg', caption: 'Old Caption', position: 'gallery' };
        const wrapper = setupWrapper({ modelValue: [image] });
        const vm = wrapper.vm as any;
        
        // Open the dialog
        vm.openCaptionDialog(image, 0);
        expect(vm.editingCaption).toBe('Old Caption');
        
        // Update the value
        vm.editingCaption = 'New Caption';
        
        // Save
        vm.saveCaption();
        
        // Verify emitted update:modelValue
        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted![0][0]).toEqual([{ name: 'TestCaption.jpg', caption: 'New Caption', position: 'gallery' }]);
    });

    it('should handle image replacement correctly', async () => {
        const initialImages = [
            { name: 'Original.png', caption: 'Original Caption', position: 'gallery' }
        ];
        const wrapper = setupWrapper({ modelValue: initialImages });
        
        // Mock addFile to return a fake ID
        mockFileStore.addFile.mockResolvedValue(123);

        // Access the component's exposed methods
        const vm = wrapper.vm as any;

        // 1. Trigger replace for the first image
        vm.triggerReplace(0);
        
        // 2. Simulate file upload result
        const mockFile = new File(['test'], 'Replacement.png', { type: 'image/png' });
        await vm.handleReplaceUpload({ files: [mockFile] });

        // Expectations
        expect(mockFileStore.addFile).toHaveBeenCalledWith(mockFile);
        
        // Check emitted events
        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        const newValue = emitted![0][0] as any[];
        
        expect(newValue[0]).toMatchObject({
            name: 'Replacement.png',
            localId: 123,
            caption: 'Original Caption', // Caption should be preserved
            position: 'gallery' // Position should be preserved
        });
    });

    it('should handle replacement of a simple string image', async () => {
        const initialImages = ['StringImage.png'];
        const wrapper = setupWrapper({ modelValue: initialImages });
        mockFileStore.addFile.mockResolvedValue(456);

        const vm = wrapper.vm as any;
        vm.triggerReplace(0);
        
        const mockFile = new File(['test'], 'NewLocal.png', { type: 'image/png' });
        await vm.handleReplaceUpload({ files: [mockFile] });

        const newValue = wrapper.emitted('update:modelValue')![0][0] as any[];
        expect(newValue[0]).toMatchObject({
            name: 'NewLocal.png',
            localId: 456,
            caption: '', // Default for strings
            position: 'gallery'
        });
    });

    it('should handle wiki rename correctly', async () => {
        const initialImages = [
            { name: 'WikiImage.png', caption: 'Wiki Caption', position: 'gallery' }
        ];
        const wrapper = setupWrapper({ modelValue: initialImages });
        const vm = wrapper.vm as any;

        // 1. Initiate rename
        vm.initiateRename(initialImages[0]);
        expect(vm.showRenameDialog).toBe(true);
        expect(vm.newRenameName).toBe('WikiImage.png');

        // @ts-ignore
        vm.newRenameName = 'NewWikiName.png';

        // 3. Confirm rename
        await vm.handleConfirmRename();

        expect(mockPcgwMedia.moveFile).toHaveBeenCalledWith(
            'WikiImage.png',
            'NewWikiName.png',
            expect.any(String)
        );

        // Check emitted events
        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect((emitted as any)[0][0][0]).toMatchObject({
            name: 'NewWikiName.png'
        });
    });

    it('should handle local rename correctly', async () => {
        const initialImages = [
            { name: 'LocalImage.png', localId: 789, caption: 'Local Caption', position: 'gallery' }
        ];
        const wrapper = setupWrapper({ modelValue: initialImages });
        const vm = wrapper.vm as any;

        // 1. Initiate rename
        vm.initiateRename(initialImages[0]);
        expect(vm.showRenameDialog).toBe(true);

        // 2. Simulate user input
        vm.newRenameName = 'NewLocalName.png';

        // 3. Confirm rename
        await vm.handleConfirmRename();

        expect(mockFileStore.updateFileStatus).toHaveBeenCalledWith(
            789,
            { name: 'NewLocalName.png' }
        );

        // Check emitted events
        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect((emitted as any)[0][0][0]).toMatchObject({
            name: 'NewLocalName.png'
        });
    });

    it('should handle linking to existing wiki file correctly', async () => {
        const localImage = { name: 'MatchMe.png', localId: 101, caption: 'Match Caption', position: 'gallery' };
        const wrapper = setupWrapper({ modelValue: [localImage] });
        const vm = wrapper.vm as any;

        // Mock hash calculation and API match
        vi.mocked(pcgwApi.getImagesByHash).mockResolvedValue(['ExistingWikiFile.png']);

        // 1. Manually trigger linkToWiki (as if clicked from menu)
        await vm.linkToWiki(101, 'ExistingWikiFile.png');

        // Check emitted events
        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect((emitted as any)[0][0][0]).toMatchObject({
            name: 'ExistingWikiFile.png',
            localId: undefined // Should be cleared
        });
    });

    it('should automatically synchronize model when a redirect is detected', async () => {
        const oldImage = { name: 'OldName.png', caption: 'Stay same', position: 'gallery' };
        
        // Mock getImageInfo returning a redirect BEFORE setup
        vi.mocked(pcgwApi.getImageInfo).mockResolvedValue({
            url: 'https://pcgw.com/NewName.png',
            user: 'Admin',
            size: 1024,
            width: 800,
            height: 600,
            canonicalName: 'NewName.png'
        });

        const wrapper = setupWrapper({ modelValue: [oldImage] });

        // Wait for watchEffect and async call
        await flushPromises();
        await vi.waitUntil(() => wrapper.emitted('update:modelValue') !== undefined, { timeout: 2000 });

        // Check emitted events
        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect((emitted as any)[0][0][0]).toMatchObject({
            name: 'NewName.png'
        });
    });

    it('should open crop dialog when initiateCrop is called manually', async () => {
        const wrapper = setupWrapper();
        const vm = wrapper.vm as any;
        const mockFile = { id: 2002, blob: new Blob(), name: 'Manual.png' };
        mockFileStore.files.push(mockFile);
        
        vm.initiateCrop({ type: 'gallery', galleryItem: { localId: 2002, name: 'Manual.png' } });
        
        expect(vm.showCropDialog).toBe(true);
        expect(vm.cropImageUrl).toBe('mock-url');
    });

    it('should handle crop on upload toggle and queueing', async () => {
        const wrapper = setupWrapper();
        const vm = wrapper.vm as any;
        
        // 1. Enable crop on upload
        vm.cropOnUpload = true;
        
        // 2. Simulate upload
        const mockFile = new File(['test'], 'ToCrop.png', { type: 'image/png' });
        mockFileStore.addFile.mockResolvedValue(1001);
        mockFileStore.files.push({ id: 1001, blob: mockFile, name: 'ToCrop.png' });
        
        await vm.handleLocalMenuUpload({ files: [mockFile] });
        await flushPromises();
        
        // 3. Verify it was added to croppingQueue
        expect(vm.croppingQueue.length).toBe(1);
        expect(vm.croppingQueue[0].type).toBe('gallery');
        expect(vm.croppingQueue[0].galleryItem.localId).toBe(1001);
        
        // 4. Verify cropper dialog opened
        expect(vm.showCropDialog).toBe(true);
    });

    it('should handle image combiner upload and cropping', async () => {
        const wrapper = setupWrapper();
        const vm = wrapper.vm as any;
        
        // 1. Enable crop on upload
        vm.cropOnUpload = true;
        
        // 2. Simulate combiner upload
        const mockFile = new File(['test'], 'CombineMe.png', { type: 'image/png' });
        mockFileStore.addFile.mockResolvedValue(1234);
        await vm.handleCombineLocalUpload({ files: [mockFile] });
        await flushPromises();
        
        // 3. Verify it was added to both queues
        expect(vm.combineQueue.length).toBe(1);
        expect(vm.croppingQueue.length).toBe(1);
        expect(vm.croppingQueue[0].type).toBe('combine');
        // 4. Verify cropper dialog opened
        expect(vm.showCropDialog).toBe(true);
    });

    it('should handle sequential cropping multiple uploads', async () => {
        vi.useFakeTimers();
        const wrapper = setupWrapper();
        const vm = wrapper.vm as any;
        vm.cropOnUpload = true;
        
        const file1 = new File(['1'], 'one.png', { type: 'image/png' });
        const file2 = new File(['2'], 'two.png', { type: 'image/png' });
        
        mockFileStore.addFile.mockResolvedValueOnce(1).mockResolvedValueOnce(2);
        mockFileStore.files.push({ id: 1, blob: file1, name: 'one.png' });
        mockFileStore.files.push({ id: 2, blob: file2, name: 'two.png' });
        
        await vm.handleLocalMenuUpload({ files: [file1, file2] });
        await flushPromises();
        
        expect(vm.croppingQueue.length).toBe(2);
        expect(vm.showCropDialog).toBe(true);
        expect(vm.croppingImage.name).toBe('one.png');
        
        // Simulate first crop completion (closing dialog triggers next)
        vm.closeCropDialog();
        
        // Wait for timeout that triggers processNextCrop
        await vi.advanceTimersByTimeAsync(400);
        await flushPromises();
        
        expect(vm.croppingQueue.length).toBe(1);
        expect(vm.croppingImage.name).toBe('two.png');
        
        vi.useRealTimers();
    });
});

