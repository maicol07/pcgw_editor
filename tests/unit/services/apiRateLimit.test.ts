import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';

const mockFetch = vi.fn();

// Stub global fetch before importing the api config module to capture the mock
vi.stubGlobal('fetch', mockFetch);

let rateLimitState: any;
let apiFetch: any;
let testIndex = 0;

describe('apiRateLimitState', () => {
    beforeAll(async () => {
        const apiModule = await import('../../../src/config/api');
        rateLimitState = apiModule.rateLimitState;
        apiFetch = apiModule.apiFetch;
    });

    beforeEach(() => {
        testIndex++;
        rateLimitState.value = {
            isRateLimited: false,
            resetTime: 0,
            queueLength: 0,
        };
        mockFetch.mockReset();
        vi.useFakeTimers();
        // Use a progressive offset per test to ensure the clock is always far ahead of previous tests
        vi.advanceTimersByTime(testIndex * 1000000);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should have initial empty rate limit state', () => {
        expect(rateLimitState.value.isRateLimited).toBe(false);
        expect(rateLimitState.value.resetTime).toBe(0);
        expect(rateLimitState.value.queueLength).toBe(0);
    });

    it('should update rateLimitState when a 429 response is returned and clear it after timeout', async () => {
        mockFetch.mockImplementation(() => {
            return Promise.resolve({
                status: 429,
                headers: new Headers({
                    'Retry-After': '5'
                }),
                text: () => Promise.resolve('Rate limited'),
                body: null
            });
        });

        const promise = apiFetch('https://example.com/api', {
            retry: 1
        }).catch(() => {});

        // Advance a tiny bit of time to let the initial request resolve and trigger retryDelay
        await vi.advanceTimersByTimeAsync(100);

        // It should be rate limited now
        expect(rateLimitState.value.isRateLimited).toBe(true);
        expect(rateLimitState.value.resetTime).toBeGreaterThan(Date.now());

        // Fast-forward time past the 5-second (5000ms) delay
        await vi.advanceTimersByTimeAsync(5000);

        // It should have cleared the rate limited state
        expect(rateLimitState.value.isRateLimited).toBe(false);
        expect(rateLimitState.value.resetTime).toBe(0);

        await promise;
    });

    it('should fallback to 3s delay on 429 when Retry-After is missing', async () => {
        mockFetch.mockImplementation(() => {
            return Promise.resolve({
                status: 429,
                headers: new Headers({}),
                text: () => Promise.resolve('Rate limited'),
                body: null
            });
        });

        const promise = apiFetch('https://example.com/api2', {
            retry: 1
        }).catch(() => {});

        // Advance a tiny bit of time to let the initial request resolve and trigger retryDelay
        await vi.advanceTimersByTimeAsync(100);

        expect(rateLimitState.value.isRateLimited).toBe(true);
        
        // Fast-forward time past the 3-second (3000ms) delay
        await vi.advanceTimersByTimeAsync(3000);

        expect(rateLimitState.value.isRateLimited).toBe(false);

        await promise;
    });
});
