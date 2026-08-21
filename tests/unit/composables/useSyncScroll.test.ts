import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useSyncScroll, computeInterpolatedScroll, type SectionAnchor } from '../../../src/composables/useSyncScroll';

describe('useSyncScroll', () => {
    let editorEl: HTMLElement;
    let previewEl: HTMLElement;

    beforeEach(() => {
        vi.restoreAllMocks();

        // Create mock DOM elements with scroll properties
        editorEl = document.createElement('div');
        Object.defineProperty(editorEl, 'scrollHeight', { value: 1000, configurable: true });
        Object.defineProperty(editorEl, 'clientHeight', { value: 200, configurable: true });
        editorEl.scrollTop = 0;
        editorEl.getBoundingClientRect = vi.fn(() => ({ top: 0, bottom: 200, left: 0, right: 500, width: 500, height: 200, x: 0, y: 0, toJSON: () => {} }));
        editorEl.scrollTo = vi.fn((options: any) => {
            if (typeof options === 'object') {
                editorEl.scrollTop = options.top;
            }
        });

        previewEl = document.createElement('div');
        Object.defineProperty(previewEl, 'scrollHeight', { value: 2000, configurable: true });
        Object.defineProperty(previewEl, 'clientHeight', { value: 400, configurable: true });
        previewEl.scrollTop = 0;
        previewEl.getBoundingClientRect = vi.fn(() => ({ top: 0, bottom: 400, left: 500, right: 1000, width: 500, height: 400, x: 500, y: 0, toJSON: () => {} }));
        previewEl.scrollTo = vi.fn((options: any) => {
            if (typeof options === 'object') {
                previewEl.scrollTop = options.top;
            }
        });
    });

    it('computes piecewise interpolated scroll across section anchors', () => {
        const anchors: SectionAnchor[] = [
            { editorTop: 0, previewTop: 0 },
            { editorTop: 500, previewTop: 200 },
            { editorTop: 1000, previewTop: 800 },
        ];

        // Exact match at anchor
        expect(computeInterpolatedScroll(500, 1000, 800, anchors, true)).toBe(200);

        // 50% between anchor 0 (0,0) and anchor 1 (500, 200) -> editor=250 => preview=100
        expect(computeInterpolatedScroll(250, 1000, 800, anchors, true)).toBe(100);

        // 50% between anchor 1 (500, 200) and anchor 2 (1000, 800) -> editor=750 => preview=500
        expect(computeInterpolatedScroll(750, 1000, 800, anchors, true)).toBe(500);

        // Inverse calculation from preview to editor
        expect(computeInterpolatedScroll(200, 800, 1000, anchors, false)).toBe(500);
        expect(computeInterpolatedScroll(500, 800, 1000, anchors, false)).toBe(750);
    });

    it('synchronizes scroll from editor to preview when enabled', () => {
        const editorRef = ref<HTMLElement | null>(editorEl);
        const previewRef = ref<HTMLElement | null>(previewEl);
        const enabled = ref(true);

        const { handleEditorScroll } = useSyncScroll({
            editorContainer: editorRef,
            previewContainer: previewRef,
            enabled,
        });

        // Editor max scroll = 1000 - 200 = 800. Set scrollTop = 400 (50%)
        editorEl.scrollTop = 400;
        handleEditorScroll();

        // Preview max scroll = 2000 - 400 = 1600. 50% = 800
        expect(previewEl.scrollTop).toBe(800);
    });

    it('synchronizes scroll from preview to editor when enabled', () => {
        const editorRef = ref<HTMLElement | null>(editorEl);
        const previewRef = ref<HTMLElement | null>(previewEl);
        const enabled = ref(true);

        const { handlePreviewScroll } = useSyncScroll({
            editorContainer: editorRef,
            previewContainer: previewRef,
            enabled,
        });

        // Preview max scroll = 1600. Set scrollTop = 400 (25%)
        previewEl.scrollTop = 400;
        handlePreviewScroll();

        // Editor max scroll = 800. 25% = 200
        expect(editorEl.scrollTop).toBe(200);
    });

    it('does not synchronize scroll when enabled is false', () => {
        const editorRef = ref<HTMLElement | null>(editorEl);
        const previewRef = ref<HTMLElement | null>(previewEl);
        const enabled = ref(false);

        const { handleEditorScroll, handlePreviewScroll } = useSyncScroll({
            editorContainer: editorRef,
            previewContainer: previewRef,
            enabled,
        });

        editorEl.scrollTop = 400;
        handleEditorScroll();
        expect(previewEl.scrollTop).toBe(0);

        previewEl.scrollTop = 400;
        handlePreviewScroll();
        expect(editorEl.scrollTop).toBe(400);
    });

    it('aligns section in editor and preview when alignSection is called', () => {
        const editorRef = ref<HTMLElement | null>(editorEl);
        const previewRef = ref<HTMLElement | null>(previewEl);
        const enabled = ref(true);

        // Add section element in document
        const secEl = document.createElement('div');
        secEl.id = 'sec-video';
        secEl.getBoundingClientRect = vi.fn(() => ({ top: 300, bottom: 400, left: 0, right: 500, width: 500, height: 100, x: 0, y: 300, toJSON: () => {} }));
        document.body.appendChild(secEl);

        // Add heading in preview
        const headingEl = document.createElement('h2');
        headingEl.id = 'video';
        headingEl.getBoundingClientRect = vi.fn(() => ({ top: 600, bottom: 640, left: 500, right: 1000, width: 500, height: 40, x: 500, y: 600, toJSON: () => {} }));
        previewEl.appendChild(headingEl);

        const { alignSection } = useSyncScroll({
            editorContainer: editorRef,
            previewContainer: previewRef,
            enabled,
        });

        alignSection('video');

        expect(editorEl.scrollTo).toHaveBeenCalledWith({ top: 288, behavior: 'smooth' });
        expect(previewEl.scrollTo).toHaveBeenCalledWith({ top: 588, behavior: 'smooth' });

        document.body.removeChild(secEl);
    });
});
