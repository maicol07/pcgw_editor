
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import VideoForm from '../../../src/components/VideoForm.vue';
import { SettingsVideo } from '../../../src/models/GameData';
import { ref } from 'vue';

// Mock Lucide icons
vi.mock('lucide-vue-next', () => ({
    Monitor: { template: '<span class="icon-monitor"></span>' },
    Grid2X2: { template: '<span class="icon-grid"></span>' },
    Maximize: { template: '<span class="icon-maximize"></span>' },
    Star: { template: '<span class="icon-star"></span>' },
    Eye: { template: '<span class="icon-eye"></span>' },
    Minimize: { template: '<span class="icon-minimize"></span>' },
    Image: { template: '<span class="icon-image"></span>' },
    ScanLine: { template: '<span class="icon-scanline"></span>' },
    LineChart: { template: '<span class="icon-linechart"></span>' },
    ArrowUpRight: { template: '<span class="icon-arrowup"></span>' },
    FastForward: { template: '<span class="icon-fastforward"></span>' },
    RefreshCcw: { template: '<span class="icon-refresh"></span>' },
    Clock: { template: '<span class="icon-clock"></span>' },
    Zap: { template: '<span class="icon-zap"></span>' },
    Sun: { template: '<span class="icon-sun"></span>' },
    Sparkles: { template: '<span class="icon-sparkles"></span>' },
    Palette: { template: '<span class="icon-palette"></span>' }
}));

// Mock useVideoAnalysis
vi.mock('../../../src/features/video/useVideoAnalysis', () => ({
    useVideoAnalysis: () => ({
        isAnalyzing: ref(false),
        error: ref(''),
        analysisSuccess: ref(false),
        showAnalysis: ref(false),
        analyzeScreenshot: vi.fn()
    })
}));

// Mock VideoAnalysis component
const VideoAnalysisStub = {
    template: '<div class="video-analysis-stub"></div>',
    props: ['isAnalyzing', 'error', 'analysisSuccess', 'geminiApiKey']
};

// Mock RatingRow to check props
const RatingRowStub = {
    template: '<div class="rating-row-stub" :data-label="label" :data-value="value"></div>',
    props: ['label', 'value', 'notes', 'reference', 'icon'],
    emits: ['update:value', 'update:notes', 'update:reference']
};

// Mock InputText to check model updates
const InputTextStub = {
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
    template: '<input :value="modelValue" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)" class="input-text-stub" />'
};

const PanelStub = {
    template: '<div><slot /></div>'
};

describe('VideoForm.vue', () => {
    const createVideoSettings = (): SettingsVideo => ({
        wsgfLink: '',
        widescreenWsgfAward: '',
        multiMonitorWsgfAward: '',
        ultraWidescreenWsgfAward: '',
        fourKUltraHdWsgfAward: '',
        widescreenResolution: 'unknown',
        multiMonitor: 'unknown',
        ultraWidescreen: 'unknown',
        fourKUltraHd: 'unknown',
        fov: 'unknown',
        windowed: 'unknown',
        borderlessWindowed: 'unknown',
        anisotropic: 'unknown',
        antiAliasing: 'unknown',
        upscaling: 'unknown',
        frameGen: 'unknown',
        vsync: 'unknown',
        fps60: 'unknown',
        fps120: 'unknown',
        hdr: 'unknown',
        rayTracing: 'unknown',
        colorBlind: 'unknown',
        upscalingTech: '',
        frameGenTech: ''
    });

    const setupWrapper = (videoProps: Partial<SettingsVideo> = {}) => {
        const video = { ...createVideoSettings(), ...videoProps };
        return {
            wrapper: mount(VideoForm, {
                props: { video },
                global: {
                    stubs: {
                        VideoAnalysis: VideoAnalysisStub,
                        RatingRow: RatingRowStub,
                        Panel: PanelStub,
                        InputText: InputTextStub
                    },
                    provide: {
                        geminiApiKey: ref('test-key')
                    }
                }
            }),
            video
        };
    };

    const ratingFields = [
        { label: 'Widescreen Resolution', prop: 'widescreenResolution' },
        { label: 'Multi-monitor', prop: 'multiMonitor' },
        { label: 'Ultra-widescreen', prop: 'ultraWidescreen' },
        { label: '4K Ultra HD', prop: 'fourKUltraHd' },
        { label: 'FOV', prop: 'fov' },
        { label: 'Windowed', prop: 'windowed' },
        { label: 'Borderless Windowed', prop: 'borderlessWindowed' },
        { label: 'Anisotropic Filtering', prop: 'anisotropic' },
        { label: 'Anti-aliasing', prop: 'antiAliasing' },
        { label: 'Upscaling', prop: 'upscaling' },
        { label: 'Frame Generation', prop: 'frameGen' },
        { label: 'VSync', prop: 'vsync' },
        { label: '60 FPS', prop: 'fps60' },
        { label: '120+ FPS', prop: 'fps120' },
        { label: 'HDR', prop: 'hdr' },
        { label: 'Ray Tracing', prop: 'rayTracing' },
        { label: 'Color Blind Mode', prop: 'colorBlind' }
    ];

    const textFields = [
        { label: 'WSGF Link', prop: 'wsgfLink' },
        { label: 'Widescreen Award', prop: 'widescreenWsgfAward' },
        { label: 'Multi-monitor Award', prop: 'multiMonitorWsgfAward' },
        { label: 'Ultra-widescreen Award', prop: 'ultraWidescreenWsgfAward' },
        { label: '4K Ultra HD Award', prop: 'fourKUltraHdWsgfAward' }
    ];

    it('renders all rating rows', () => {
        const { wrapper } = setupWrapper();
        const rows = wrapper.findAllComponents(RatingRowStub);

        expect(rows.length).toBe(ratingFields.length);

        ratingFields.forEach(field => {
            const row = wrapper.findComponent(`[data-label="${field.label}"]`);
            expect(row.exists()).toBe(true);
        });
    });

    it('passes correct props to all RatingRows', () => {
        const testData: any = {};
        ratingFields.forEach(f => testData[f.prop] = 'true');

        const { wrapper } = setupWrapper(testData);

        ratingFields.forEach(field => {
            const row = wrapper.findComponent(`[data-label="${field.label}"]`);
            // Cast to any to avoid strict type checking against 'native' | 'true' ...
            expect((row as any).props('value')).toBe('true');
        });
    });

    it('updates video object when RatingRow emits update', async () => {
        const { wrapper, video } = setupWrapper();

        for (const field of ratingFields) {
            const row = wrapper.findComponent(`[data-label="${field.label}"]`);
            await (row as any).vm.$emit('update:value', 'new-value');
            expect((video as any)[field.prop]).toBe('new-value');
        }
    });

    it('updates text fields correctly', async () => {
        // Pre-fill with unique values to identify them
        const testData: any = {};
        textFields.forEach((f, i) => testData[f.prop] = `val-${i}`);

        const { wrapper, video } = setupWrapper(testData);
        const inputs = wrapper.findAllComponents(InputTextStub);

        // We have 5 text fields + 2 tech fields (hidden by default)

        // Match inputs by value since placeholders might be duplicate
        textFields.forEach((f, i) => {
            const input = inputs.find(w => w.props('modelValue') === `val-${i}`);
            expect(input?.exists()).toBe(true);

            // Test update
            input?.vm.$emit('update:modelValue', `new-${i}`);
            expect((video as any)[f.prop]).toBe(`new-${i}`);
        });
    });

    it('shows tech input when upscaling is enabled', async () => {
        const { wrapper } = setupWrapper({ upscaling: 'dlss' as any });

        const inputs = wrapper.findAllComponents(InputTextStub);
        const techInput = inputs.find(i => i.props('placeholder')?.includes('DLSS 2'));
        expect(techInput?.exists()).toBe(true);
    });

    it('hides tech input when upscaling is false', async () => {
        const { wrapper } = setupWrapper({ upscaling: 'false' });

        const inputs = wrapper.findAllComponents(InputTextStub);
        const techInput = inputs.find(i => i.props('placeholder')?.includes('DLSS 2'));
        expect(techInput).toBeUndefined();
    });

    it('shows frame gen tech input when enabled', async () => {
        const { wrapper } = setupWrapper({ frameGen: 'fsr3' as any });

        const inputs = wrapper.findAllComponents(InputTextStub);
        const techInput = inputs.find(i => i.props('placeholder')?.includes('DLSS 3'));
        expect(techInput?.exists()).toBe(true);
    });
});
