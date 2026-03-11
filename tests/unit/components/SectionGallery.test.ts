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
    useFileStore: () => ({
        loadFiles: vi.fn(() => Promise.resolve([])),
        files: []
    })
}));

vi.mock('../../../src/services/pcgwAuth', () => ({
    pcgwAuth: {
        isLoggedIn: true,
        sessionCookies: 'test-cookies',
        getCsrfToken: vi.fn(() => Promise.resolve('csrf-token')),
    }
}));

vi.mock('../../../src/services/pcgwMedia', () => ({
    pcgwMedia: {
        editPage: vi.fn(),
    }
}));

// Mock Lucide components
vi.mock('lucide-vue-next', () => {
    const icons = [
        'Images', 'Image', 'GripHorizontal', 'ExternalLink', 'Pencil', 'Trash2', 'PanelRight', 'Grid',
        'Upload', 'CheckCircle2', 'AlertCircle', 'Loader2', 'LogOut', 'HardDrive', 'MoreVertical', 
        'User', 'Plus', 'Info', 'ShieldAlert', 'LogIn'
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
});
