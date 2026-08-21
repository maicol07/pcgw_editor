import { watch, onUnmounted, getCurrentInstance, type Ref } from 'vue';
import { sectionKeysInOrder } from '../config/sections';

export interface UseSyncScrollOptions {
    editorContainer: Ref<HTMLElement | null | undefined>;
    previewContainer: Ref<HTMLElement | null | undefined>;
    enabled: Ref<boolean>;
}

export const SECTION_TO_PREVIEW_SELECTORS: Record<string, string[]> = {
    articleState: ['#article-state', '.article-state'],
    infobox: ['.infobox', '#infobox', 'table.infobox'],
    introduction: ['#introduction', '.introduction'],
    availability: ['#availability', '#availability-and-pricing', 'h2[id*="availability"]'],
    monetization: ['#monetization', '#monetization--microtransactions', '#microtransactions', 'h2[id*="monetization"]'],
    dlc: ['#dlc-and-expansion-packs', '#dlc--expansions', '#dlc-and-expansions', '#dlc', 'h2[id*="dlc"]'],
    essentialImprovements: ['#essential-improvements', 'h2[id*="essential"]'],
    gameData: ['#game-data', 'h2[id*="game-data"]'],
    video: ['#video', 'h2[id*="video"]', '#video-settings'],
    input: ['#input', 'h2[id*="input"]', '#input-settings'],
    audio: ['#audio', 'h2[id*="audio"]', '#audio-settings'],
    network: ['#network', 'h2[id*="network"]'],
    vr: ['#vr-support', '#vr', 'h2[id*="vr"]'],
    issues: ['#issues-fixed', '#issues-unresolved', '#issues', 'h2[id*="issues"]'],
    other: ['#other-information', 'h2[id*="other"]'],
    systemReq: ['#system-requirements', '#system-configuration', 'h2[id*="system-requirements"]'],
    l10n: ['#localizations', '#localization', 'h2[id*="localization"]'],
};

export function findPreviewElement(preview: HTMLElement, sectionKey: string): HTMLElement | null {
    const selectors = SECTION_TO_PREVIEW_SELECTORS[sectionKey] || [];
    for (const sel of selectors) {
        try {
            const el = preview.querySelector<HTMLElement>(sel);
            if (el) return el;
        } catch {
            // ignore
        }
    }
    const escaped = CSS.escape(sectionKey.toLowerCase());
    const fallback = preview.querySelector<HTMLElement>(`#${escaped}`) || preview.querySelector<HTMLElement>(`[id*="${escaped}"]`);
    if (fallback) return fallback;

    const headings = preview.querySelectorAll<HTMLElement>('h2, h3, h4');
    const normalizedKey = sectionKey.toLowerCase();
    for (const h of headings) {
        const id = (h.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const text = (h.textContent || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (id.includes(normalizedKey) || text.includes(normalizedKey)) {
            return h;
        }
    }
    return null;
}

export interface SectionAnchor {
    editorTop: number;
    previewTop: number;
}

export function getSectionAnchors(editor: HTMLElement, preview: HTMLElement): SectionAnchor[] {
    const anchors: SectionAnchor[] = [];
    const editorScroll = editor.scrollTop;
    const previewScroll = preview.scrollTop;
    const editorRect = editor.getBoundingClientRect();
    const previewRect = preview.getBoundingClientRect();

    for (const key of sectionKeysInOrder) {
        const editorEl = document.getElementById(`sec-${key}`);
        if (!editorEl) continue;

        const previewEl = findPreviewElement(preview, key);
        if (!previewEl) continue;

        const editorTop = Math.max(0, editorEl.getBoundingClientRect().top - editorRect.top + editorScroll);
        const previewTop = Math.max(0, previewEl.getBoundingClientRect().top - previewRect.top + previewScroll);

        anchors.push({ editorTop, previewTop });
    }

    anchors.sort((a, b) => a.editorTop - b.editorTop);
    return anchors;
}

export function computeInterpolatedScroll(
    sourceScroll: number,
    sourceMax: number,
    targetMax: number,
    anchors: SectionAnchor[],
    isEditorSource: boolean
): number {
    if (anchors.length < 2 || sourceMax <= 0 || targetMax <= 0) {
        const linearRatio = Math.min(1, Math.max(0, sourceScroll / Math.max(1, sourceMax)));
        return Math.round(linearRatio * targetMax);
    }

    const getSource = (a: SectionAnchor) => isEditorSource ? a.editorTop : a.previewTop;
    const getTarget = (a: SectionAnchor) => isEditorSource ? a.previewTop : a.editorTop;

    // Before first anchor
    if (sourceScroll <= getSource(anchors[0])) {
        const firstSrc = getSource(anchors[0]);
        const firstTgt = getTarget(anchors[0]);
        if (firstSrc <= 0) return 0;
        const ratio = Math.min(1, Math.max(0, sourceScroll / firstSrc));
        return Math.round(ratio * firstTgt);
    }

    // After last anchor
    const last = anchors[anchors.length - 1];
    if (sourceScroll >= getSource(last)) {
        const lastSrc = getSource(last);
        const lastTgt = getTarget(last);
        const remainingSrc = sourceMax - lastSrc;
        const remainingTgt = targetMax - lastTgt;
        if (remainingSrc <= 0 || remainingTgt <= 0) return lastTgt;
        const ratio = Math.min(1, Math.max(0, (sourceScroll - lastSrc) / remainingSrc));
        return Math.round(lastTgt + ratio * remainingTgt);
    }

    // Between anchors
    for (let i = 0; i < anchors.length - 1; i++) {
        const a1 = anchors[i];
        const a2 = anchors[i + 1];
        const s1 = getSource(a1);
        const s2 = getSource(a2);
        const t1 = getTarget(a1);
        const t2 = getTarget(a2);

        if (sourceScroll >= s1 && sourceScroll <= s2) {
            const spanSrc = s2 - s1;
            if (spanSrc <= 0) return t1;
            const ratio = (sourceScroll - s1) / spanSrc;
            return Math.round(t1 + ratio * (t2 - t1));
        }
    }

    return Math.round((sourceScroll / sourceMax) * targetMax);
}

export function useSyncScroll(options: UseSyncScrollOptions) {
    const { editorContainer, previewContainer, enabled } = options;

    let isSyncingToPreview = false;
    let isSyncingToEditor = false;
    let previewRafId: number | null = null;
    let editorRafId: number | null = null;
    let suppressUntil = 0;

    const handleEditorScroll = () => {
        if (!enabled.value || performance.now() < suppressUntil) return;
        if (isSyncingToEditor) return;

        const editor = editorContainer.value;
        const preview = previewContainer.value;
        if (!editor || !preview) return;

        const editorMax = editor.scrollHeight - editor.clientHeight;
        const previewMax = preview.scrollHeight - preview.clientHeight;
        if (editorMax <= 0 || previewMax <= 0) return;

        const anchors = getSectionAnchors(editor, preview);
        const targetPreviewTop = computeInterpolatedScroll(
            editor.scrollTop,
            editorMax,
            previewMax,
            anchors,
            true
        );

        isSyncingToPreview = true;
        preview.scrollTop = targetPreviewTop;

        if (previewRafId !== null) cancelAnimationFrame(previewRafId);
        previewRafId = requestAnimationFrame(() => {
            previewRafId = requestAnimationFrame(() => {
                isSyncingToPreview = false;
                previewRafId = null;
            });
        });
    };

    const handlePreviewScroll = () => {
        if (!enabled.value || performance.now() < suppressUntil) return;
        if (isSyncingToPreview) return;

        const editor = editorContainer.value;
        const preview = previewContainer.value;
        if (!editor || !preview) return;

        const previewMax = preview.scrollHeight - preview.clientHeight;
        const editorMax = editor.scrollHeight - editor.clientHeight;
        if (previewMax <= 0 || editorMax <= 0) return;

        const anchors = getSectionAnchors(editor, preview);
        const targetEditorTop = computeInterpolatedScroll(
            preview.scrollTop,
            previewMax,
            editorMax,
            anchors,
            false
        );

        isSyncingToEditor = true;
        editor.scrollTop = targetEditorTop;

        if (editorRafId !== null) cancelAnimationFrame(editorRafId);
        editorRafId = requestAnimationFrame(() => {
            editorRafId = requestAnimationFrame(() => {
                isSyncingToEditor = false;
                editorRafId = null;
            });
        });
    };

    let currentEditorEl: HTMLElement | null = null;
    let currentPreviewEl: HTMLElement | null = null;

    const detachListeners = () => {
        if (currentEditorEl) {
            currentEditorEl.removeEventListener('scroll', handleEditorScroll);
            currentEditorEl = null;
        }
        if (currentPreviewEl) {
            currentPreviewEl.removeEventListener('scroll', handlePreviewScroll);
            currentPreviewEl = null;
        }
        if (previewRafId !== null) cancelAnimationFrame(previewRafId);
        if (editorRafId !== null) cancelAnimationFrame(editorRafId);
    };

    const attachListeners = () => {
        detachListeners();
        if (!enabled.value) return;

        const editor = editorContainer.value;
        const preview = previewContainer.value;

        if (editor) {
            editor.addEventListener('scroll', handleEditorScroll, { passive: true });
            currentEditorEl = editor;
        }
        if (preview) {
            preview.addEventListener('scroll', handlePreviewScroll, { passive: true });
            currentPreviewEl = preview;
        }
    };

    watch([editorContainer, previewContainer, enabled], attachListeners, { immediate: true });

    if (getCurrentInstance()) {
        onUnmounted(() => {
            detachListeners();
        });
    }

    const alignSection = (sectionKey: string) => {
        const editor = editorContainer.value;
        const preview = previewContainer.value;
        if (!editor) return;

        // Suppress scroll sync events during smooth navigation animation
        suppressUntil = performance.now() + 1000;

        // Scroll Editor
        const sectionEl = document.getElementById(`sec-${sectionKey}`);
        if (sectionEl) {
            const editorRect = editor.getBoundingClientRect();
            const targetEditorTop = Math.max(0, sectionEl.getBoundingClientRect().top - editorRect.top + editor.scrollTop - 12);
            editor.scrollTo({ top: targetEditorTop, behavior: 'smooth' });
        }

        // Scroll Preview (if enabled)
        if (enabled.value && preview) {
            const previewEl = findPreviewElement(preview, sectionKey);
            if (previewEl) {
                const previewRect = preview.getBoundingClientRect();
                const targetPreviewTop = Math.max(0, previewEl.getBoundingClientRect().top - previewRect.top + preview.scrollTop - 12);
                preview.scrollTo({ top: targetPreviewTop, behavior: 'smooth' });
            } else if (sectionEl) {
                const editorMax = editor.scrollHeight - editor.clientHeight;
                const previewMax = preview.scrollHeight - preview.clientHeight;
                if (editorMax > 0 && previewMax > 0) {
                    const ratio = Math.min(1, Math.max(0, (sectionEl.offsetTop - 12) / editorMax));
                    preview.scrollTo({ top: Math.round(ratio * previewMax), behavior: 'smooth' });
                }
            }
        }
    };

    return {
        alignSection,
        handleEditorScroll,
        handlePreviewScroll,
    };
}
