import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePreview } from './usePreview';
import { ref, nextTick } from 'vue';
import * as renderer from '../utils/renderer';

describe('usePreview', () => {
    let mockFetch: any;

    beforeEach(() => {
        vi.restoreAllMocks();
        mockFetch = vi.fn();
        global.fetch = mockFetch;
        // Mock the renderer
        vi.spyOn(renderer, 'renderWikitextToHtml').mockImplementation((text, title) => `LOCAL_HTML: ${text} | ${title}`);
    });

    it('should initially default to API mode', () => {
        const wikitextSource = () => '';
        const titleSource = () => 'TestPage';
        const { previewMode } = usePreview(wikitextSource, titleSource);

        expect(previewMode.value).toBe('API');
    });

    it('should use renderWikitextToHtml when previewMode is Local', async () => {
        const wikitext = ref('Hello World');
        const title = ref('TestPage');
        const { previewMode, renderedHtml, isLoading } = usePreview(() => wikitext.value, () => title.value);
        
        previewMode.value = 'Local';
        
        // Wait for watchers to trigger
        await nextTick();
        
        expect(renderedHtml.value).toBe('LOCAL_HTML: Hello World | TestPage');
        expect(isLoading.value).toBe(false);
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should abort API request when switching to Local mode', async () => {
        const wikitext = ref('Fetching API...');
        const title = ref('TestPage');
        
        // Make fetch slow to simulate pending request
        let resolveFetch: any;
        mockFetch.mockReturnValueOnce(new Promise(resolve => {
            resolveFetch = resolve;
        }));

        const { previewMode, renderedHtml, isLoading } = usePreview(() => wikitext.value, () => title.value);

        // Force an API request (trigger watch)
        wikitext.value = 'New Content';
        await nextTick();
        
        // Fast-forward debounce
        await new Promise(r => setTimeout(r, 550));
        
        expect(isLoading.value).toBe(true);
        expect(mockFetch).toHaveBeenCalledTimes(1);

        // Capture the abort signal
        const callArgs = mockFetch.mock.calls[0][1];
        const signal = callArgs.signal;
        expect(signal).toBeInstanceOf(AbortSignal);
        
        const abortSpy = vi.fn();
        signal.addEventListener('abort', abortSpy);

        // Switch to Local mode while API request is pending
        previewMode.value = 'Local';
        await nextTick();

        // The abortController should be aborted
        expect(abortSpy).toHaveBeenCalled();
        expect(signal.aborted).toBe(true);
        
        // Should immediately switch to local render
        expect(isLoading.value).toBe(false);
        expect(renderedHtml.value).toBe('LOCAL_HTML: New Content | TestPage');
        
        // Resolve the mocked fetch (simulate the request returning after abort, but we actually throw AbortError in browser, 
        // handle the mock gracefully)
        const abortError = new Error('The operation was aborted');
        abortError.name = 'AbortError';
        resolveFetch(Promise.reject(abortError));
        
        await nextTick();
        
        // It shouldn't fallback to the old renderer after catching AbortError because we returned early
        expect(renderedHtml.value).toBe('LOCAL_HTML: New Content | TestPage');
    });
});
