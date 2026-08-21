import { ref, watch, onScopeDispose } from 'vue';
import { getActivePinia } from 'pinia';
import { useDebounceFn } from '@vueuse/core';
import { renderWikitextToHtml } from '../utils/renderer';
import { sanitizeHtml } from '../utils/sanitize';
import { getProxiedImageUrl } from '../config/api';
import { useUiStore } from '../stores/ui';

const proxyHtmlImages = (html: string): string => {
    if (!html) return '';
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const imgs = doc.querySelectorAll('img');
        let modified = false;
        imgs.forEach(img => {
            // A. Handle src attribute
            const src = img.getAttribute('src');
            if (src) {
                let fullUrl = src;
                if (src.startsWith('//')) {
                    fullUrl = `https:${src}`;
                } else if (src.startsWith('/')) {
                    fullUrl = `https://www.pcgamingwiki.com${src}`;
                }
                
                if (fullUrl.includes('pcgamingwiki.com')) {
                    const proxied = getProxiedImageUrl(fullUrl);
                    if (proxied) {
                        img.setAttribute('src', proxied);
                        modified = true;
                    }
                }
            }
            
            // B. Handle srcset attribute (multi-resolution sources)
            const srcset = img.getAttribute('srcset');
            if (srcset) {
                const proxiedSrcset = srcset.split(',').map(part => {
                    const trimmed = part.trim();
                    if (!trimmed) return part;
                    
                    const tokens = trimmed.split(/\s+/);
                    const itemUrl = tokens[0];
                    const descriptor = tokens.slice(1).join(' ');
                    
                    let fullUrl = itemUrl;
                    if (itemUrl.startsWith('//')) {
                        fullUrl = `https:${itemUrl}`;
                    } else if (itemUrl.startsWith('/')) {
                        fullUrl = `https://www.pcgamingwiki.com${itemUrl}`;
                    }
                    
                    if (fullUrl.includes('pcgamingwiki.com')) {
                        const proxied = getProxiedImageUrl(fullUrl);
                        if (proxied) {
                            return descriptor ? `${proxied} ${descriptor}` : proxied;
                        }
                    }
                    return trimmed;
                }).join(', ');
                
                img.setAttribute('srcset', proxiedSrcset);
                modified = true;
            }
        });
        return modified ? doc.body.innerHTML : html;
    } catch (e) {
        console.error('Failed to proxy HTML images:', e);
        return html;
    }
};

export type PreviewMode = 'Local' | 'API';

export function usePreview(
    wikitextSource: () => string,
    titleSource: () => string
) {
    const uiStore = getActivePinia() ? useUiStore() : null;
    const previewMode = ref<PreviewMode>('API');
    const renderedHtml = ref('');
    const isLoading = ref(false);
    const error = ref('');
    const isPending = ref(false); // True during debounce
    let abortController: AbortController | null = null;


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
            renderedHtml.value = sanitizeHtml(proxyHtmlImages(data.parse.text['*']));
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

    // useDebounceFn instead of a hand-rolled debounce: the local one leaked its pending timeout
    // (nothing cleared it on unmount) and left isPending stuck true if the component went away
    // mid-wait. VueUse ties the timer to the current effect scope.
    const runFetch = useDebounceFn((newText: string) => {
        isPending.value = false;
        fetchPreview(newText);
    }, () => uiStore?.previewDebounce || 300);

    const debouncedFetch = (newText: string) => {
        isPending.value = true;
        runFetch(newText);
    };

    // The in-flight request outlived the component too: it was only aborted by the *next* call.
    onScopeDispose(() => {
        abortController?.abort();
        abortController = null;
    });

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
