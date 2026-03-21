import { ref, watch } from 'vue';
import { renderWikitextToHtml } from '../utils/renderer';

export type PreviewMode = 'Local' | 'API';

export function usePreview(
    wikitextSource: () => string,
    titleSource: () => string
) {
    const previewMode = ref<PreviewMode>('API');
    const renderedHtml = ref('');
    const isLoading = ref(false);
    const error = ref('');
    const isPending = ref(false); // True during debounce
    let abortController: AbortController | null = null;

    // Simple Debounce
    const debounce = (fn: Function, delay: number) => {
        let timeoutId: any;
        return (...args: any[]) => {
            isPending.value = true;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                isPending.value = false;
                fn(...args);
            }, delay);
        };
    };

    const fetchPreview = async (text: string) => {
        // Cancel any pending request
        if (abortController) {
            abortController.abort();
            abortController = null;
        }

        if (previewMode.value === 'Local') {
            isLoading.value = false;
            renderedHtml.value = renderWikitextToHtml(text, titleSource());
            return;
        }

        // Don't fetch empty text
        if (!text.trim()) {
            renderedHtml.value = '';
            return;
        }

        isLoading.value = true;
        error.value = '';

        const params = new URLSearchParams({
            action: 'parse',
            format: 'json',
            contentmodel: 'wikitext',
            prop: 'text',
            disablelimitreport: 'true',
            origin: '*',
            text: text,
            title: titleSource() || 'Main Page'
        });

        abortController = new AbortController();

        try {
            const response = await fetch('https://www.pcgamingwiki.com/w/api.php', {
                method: 'POST',
                body: params,
                signal: abortController.signal
            });

            if (!response.ok) {
                const body = await response.text();
                throw new Error(`HTTP ${response.status}: ${body.substring(0, 100)}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.info || 'API Error');
            }
            renderedHtml.value = data.parse.text['*'];
        } catch (e: any) {
            if (e.name === 'AbortError') {
                // Request cancelled intentionally
                return;
            }
            console.error("Preview fetch failed:", e);
            error.value = `Failed to load preview: ${e.message}. Using local renderer.`;
            // Fallback
            renderedHtml.value = renderWikitextToHtml(text, titleSource());
        } finally {
            isLoading.value = false;
        }
    };

    const debouncedFetch = debounce((newText: string) => {
        fetchPreview(newText);
    }, 500);

    // Watchers
    watch(wikitextSource, (newVal) => {
        debouncedFetch(newVal);
    }, { immediate: true });

    watch(previewMode, () => {
        fetchPreview(wikitextSource());
    });

    // Watch title change to update preview context if in API mode
    watch(titleSource, () => {
        if (previewMode.value === 'API') {
            debouncedFetch(wikitextSource());
        }
    });

    return {
        previewMode,
        renderedHtml,
        isLoading,
        isPending,
        error
    };
}
