import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { getApiHeaders, API_CONFIG, apiFetch, getProxiedImageUrl } from '../../../src/config/api';
import pkg from '../../../package.json';

describe('src/config/api.ts', () => {
    const originalProxyPrefix = API_CONFIG.proxyPrefix;

    afterEach(() => {
        // Reset proxyPrefix after each test
        API_CONFIG.proxyPrefix = originalProxyPrefix;
    });

    it('should generate getApiHeaders with correct User-Agent headers', () => {
        const headers = getApiHeaders();
        const expectedUserAgent = `${pkg.name}/${pkg.version} (https://github.com/maicol07/pcgw_editor_2; webmaster@maicol07.it) ofetch/1.5.1`;

        expect(headers).toHaveProperty('User-Agent', expectedUserAgent);
        expect(headers).toHaveProperty('Api-User-Agent', expectedUserAgent);
        expect(headers).not.toHaveProperty('X-Requested-With');
    });

    it('should add X-Requested-With header when using cors-anywhere proxy', () => {
        API_CONFIG.proxyPrefix = 'https://cors-anywhere.herokuapp.com/';
        const headers = getApiHeaders();
        const expectedUserAgent = `${pkg.name}/${pkg.version} (https://github.com/maicol07/pcgw_editor_2; webmaster@maicol07.it) ofetch/1.5.1`;

        expect(headers).toHaveProperty('X-Requested-With', 'XMLHttpRequest');
        expect(headers).toHaveProperty('User-Agent', expectedUserAgent);
        expect(headers).toHaveProperty('Api-User-Agent', expectedUserAgent);
    });

    describe('getProxiedImageUrl', () => {
        it('should return null for null input', () => {
            expect(getProxiedImageUrl(null)).toBeNull();
        });

        it('should return untouched local blob and data URLs', () => {
            expect(getProxiedImageUrl('blob:http://localhost:3000/1234')).toBe('blob:http://localhost:3000/1234');
            expect(getProxiedImageUrl('data:image/png;base64,1234')).toBe('data:image/png;base64,1234');
        });

        it('should return untouched URLs that do not belong to pcgamingwiki.com', () => {
            expect(getProxiedImageUrl('https://example.com/image.jpg')).toBe('https://example.com/image.jpg');
        });

        it('should proxy URLs that belong to pcgamingwiki.com', () => {
            const originalUrl = 'https://www.pcgamingwiki.com/w/images/a/ab/Cover.jpg';
            const expected = `https://pcgw-proxy-login.maicol07.workers.dev/api/image?url=${encodeURIComponent(originalUrl)}`;
            expect(getProxiedImageUrl(originalUrl)).toBe(expected);
        });

        it('should proxy pcgamingwiki subdomain URLs', () => {
            const subdomainUrl = 'https://images.pcgamingwiki.com/w/images/a/ab/Cover.jpg';
            const expected = `https://pcgw-proxy-login.maicol07.workers.dev/api/image?url=${encodeURIComponent(subdomainUrl)}`;
            expect(getProxiedImageUrl(subdomainUrl)).toBe(expected);
        });
    });
});

describe('apiFetch throttling and retry', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({}),
            text: async () => '',
            headers: new Headers()
        } as unknown as Response);
    });

    afterEach(() => {
        vi.runAllTimers(); // clear any pending timers so they don't leak
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('should space requests by at least 1 second (MIN_DELAY)', async () => {
        const fetchMock = global.fetch as any;
        
        // Fire two requests simultaneously
        apiFetch('/test1');
        apiFetch('/test2');

        // Fast forward 10ms
        await vi.advanceTimersByTimeAsync(10);
        expect(fetchMock).toHaveBeenCalledTimes(1); // First request is immediate

        // Fast forward 500ms - second request still hasn't fired due to MIN_DELAY
        await vi.advanceTimersByTimeAsync(500);
        expect(fetchMock).toHaveBeenCalledTimes(1);

        // Fast forward another 500ms (total 1000ms) - second request should now fire
        await vi.advanceTimersByTimeAsync(500);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

});
