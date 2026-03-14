import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import SectionGallery from '../../../src/components/SectionGallery.vue';
import { pcgwApi } from '../../../src/services/pcgwApi';
import { pcgwAuth } from '../../../src/services/pcgwAuth';
import { pcgwMedia } from '../../../src/services/pcgwMedia';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';

// Shared mock objects to ensure test and component use the same instances
const { mockFileStore, mockPcgwAuth, mockPcgwMedia } = vi.hoisted(() => ({
    mockFileStore: {
        loadFiles: vi.fn(() => Promise.resolve([])),
        files: [] as any[],
        addFile: vi.fn()
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
    }
}));

// Mock services
vi.mock('../../../src/services/pcgwApi', () => ({
    pcgwApi: {
        getPageContent: vi.fn(),
        getImagesByHash: vi.fn(() => Promise.resolve([])),
        getImagesInfo: vi.fn(() => Promise.resolve({})),
        getImageInfo: vi.fn(() => Promise.resolve(null)),
    }
}));

// Mock local store/db to avoid IndexedDB errors
vi.mock('../../../src/stores/files', () => ({
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
        'User', 'Plus', 'Info', 'ShieldAlert', 'LogIn', 'Replace'
    ];
    const mock: any = {};
    icons.forEach(i => mock[i] = { template: `<span>${i}</span>` });
    return mock;
});

describe('SectionGallery.vue - Enhancement Deletion', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
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
        
        // @ts-ignore
        await wrapper.vm.initiateDelete(image);
        
        expect(pcgwApi.getPageContent).toHaveBeenCalledWith('File:Test.jpg');
        // @ts-ignore
        expect(wrapper.vm.existingDeletionReason).toBe('Old reason');
    });

    it('replaces existing delete tag in handleConfirmDelete', async () => {
        const image = { name: 'Test.jpg', caption: 'Capt', position: 'gallery' };
        vi.mocked(pcgwApi.getPageContent).mockResolvedValue('{{delete|reason=Old reason}}\nSome content');
        
        const wrapper = setupWrapper({ modelValue: [image] });
        
        // @ts-ignore
        await wrapper.vm.initiateDelete(image);
        
        // @ts-ignore
        wrapper.vm.pcgwDeletionReason = 'New reason';
        
        // @ts-ignore
        await wrapper.vm.handleConfirmDelete();
        
        expect(pcgwMedia.editPage).toHaveBeenCalledWith(
            'File:Test.jpg',
            '{{delete|reason=New reason}}\nSome content',
            expect.stringContaining('Requesting file deletion')
        );
    });

    it('saves edited caption to the correct item in modelValue', async () => {
        const image = { name: 'TestCaption.jpg', caption: 'Old Caption', position: 'gallery' };
        const wrapper = setupWrapper({ modelValue: [image] });
        
        // Open the dialog
        // @ts-ignore
        wrapper.vm.openCaptionDialog(image, 0);
        
        // @ts-ignore
        expect(wrapper.vm.editingCaption).toBe('Old Caption');
        
        // Update the value
        // @ts-ignore
        wrapper.vm.editingCaption = 'New Caption';
        
        // Save
        // @ts-ignore
        wrapper.vm.saveCaption();
        
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
});

