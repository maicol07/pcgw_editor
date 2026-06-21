import { ofetch } from 'ofetch';
import { ref } from 'vue';
import pkg from '../../package.json';

export const rateLimitState = ref({
    isRateLimited: false,
    resetTime: 0,
    queueLength: 0,
});


const PROXY_PREFIX = ''; // Optional, e.g. 'https://cors-anywhere.herokuapp.com/'
const PCGW_API_URL = 'https://www.pcgamingwiki.com/w/api.php';

// Public OAuth client ID for the optional Google Drive cloud-sync feature.
// Set VITE_GOOGLE_CLIENT_ID at build time (or hardcode here). Empty = sync hidden.
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1034798646876-9pfp06so088l98gs477njt3fdgca97o9.apps.googleusercontent.com';

// httpOnly-cookie auth (#6). Must match the worker's ALLOWED_ORIGINS being set: both flip together.
// Default false keeps the legacy flow (session cookie in localStorage + sent in the request body).
export const HTTPONLY_AUTH = import.meta.env.VITE_HTTPONLY_AUTH === 'true';

export const API_CONFIG = {
    // New Worker-based login endpoint
    workerLoginUrl: 'https://pcgw-proxy-login.maicol07.workers.dev/api/login',

    // New Smart Proxy for authenticated requests
    workerProxyUrl: 'https://pcgw-proxy-login.maicol07.workers.dev/api/proxy',

    // New Smart Proxy for images
    workerImageUrl: 'https://pcgw-proxy-login.maicol07.workers.dev/api/image',

    // Allowlisted external proxy for third-party metadata APIs (replaces public corsproxy.io)
    workerExtUrl: 'https://pcgw-proxy-login.maicol07.workers.dev/api/ext',

    // Used for the initial logintoken request which often fails CORS on localhost
    proxyUrl: (import.meta.env.DEV && !PROXY_PREFIX) ? '/pcgw-api' : (PROXY_PREFIX + PCGW_API_URL),
    
    // Used for all other operations (data, login POST, CSRF, uploads)
    directUrl: PCGW_API_URL,
    
    proxyPrefix: PROXY_PREFIX
};

export const getWorkerLoginUrl = () => API_CONFIG.workerLoginUrl;
export const getWorkerProxyUrl = () => API_CONFIG.workerProxyUrl;
export const getWorkerImageUrl = () => API_CONFIG.workerImageUrl;
export const getExtProxyUrl = () => API_CONFIG.workerExtUrl;
export const getProxyApiUrl = () => API_CONFIG.proxyUrl;
export const getDirectApiUrl = () => API_CONFIG.directUrl;

/**
 * Wraps a direct PCGW image URL to go through the smart image proxy
 */
export const getProxiedImageUrl = (url: string | null): string | null => {
    if (!url) return null;
    // If it's already a proxied URL, local blob URL, or data URL, don't double-proxy it
    if (url.startsWith('blob:') || url.startsWith('data:') || url.includes('/api/image')) {
        return url;
    }
    // Only proxy pcgamingwiki.com images (including subdomains)
    if (url.includes('pcgamingwiki.com')) {
        return `${getWorkerImageUrl()}?url=${encodeURIComponent(url)}`;
    }
    return url;
};

// Hook for adding required headers for certain proxies (like cors-anywhere)
export const getApiHeaders = () => {
    const headers: Record<string, string> = {};
    if (API_CONFIG.proxyPrefix.includes('cors-anywhere')) {
        headers['X-Requested-With'] = 'XMLHttpRequest';
    }
    
    const userAgent = `${pkg.name}/${pkg.version} (https://github.com/maicol07/pcgw_editor_2; webmaster@maicol07.it) ofetch/1.5.1`;
    headers['User-Agent'] = userAgent;
    headers['Api-User-Agent'] = userAgent;

    return headers;
};

// Queue system to handle the 20 requests/minute rate limit from PCGamingWiki
class RequestQueue {
    private queue: (() => void)[] = [];
    private isProcessing = false;
    private requestTimes: number[] = [];
    private readonly RATE_LIMIT = 18; // Max 18 requests per minute to be safe (limit is 20)
    private readonly TIME_WINDOW = 60 * 1000; // 60 seconds
    private readonly MIN_DELAY = 1000; // 1 second minimum between requests
    private lastRequestTime = 0;

    async waitForTurn(): Promise<void> {
        return new Promise(resolve => {
            this.queue.push(resolve);
            rateLimitState.value.queueLength = this.queue.length;
            this.processQueue();
        });
    }

    private async processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;
        this.isProcessing = true;

        while (this.queue.length > 0) {
            const now = Date.now();
            
            // Clean up old request times outside the 60s window
            this.requestTimes = this.requestTimes.filter(time => now - time < this.TIME_WINDOW);

            // Wait if we hit the limit
            if (this.requestTimes.length >= this.RATE_LIMIT) {
                const oldestRequest = this.requestTimes[0];
                const waitTime = this.TIME_WINDOW - (now - oldestRequest);
                if (waitTime > 0) {
                    rateLimitState.value.isRateLimited = true;
                    rateLimitState.value.resetTime = Date.now() + waitTime;
                    rateLimitState.value.queueLength = this.queue.length;

                    await new Promise(res => setTimeout(res, waitTime));

                    // After waiting, check if still at the rate limit
                    const nextNow = Date.now();
                    const activeRequests = this.requestTimes.filter(time => nextNow - time < this.TIME_WINDOW);
                    if (activeRequests.length < this.RATE_LIMIT) {
                        if (rateLimitState.value.resetTime <= nextNow) {
                            rateLimitState.value.isRateLimited = false;
                            rateLimitState.value.resetTime = 0;
                        }
                    }
                    continue;
                }
            }

            // Enforce minimum delay to prevent burst limits
            const timeSinceLast = Date.now() - this.lastRequestTime;
            if (timeSinceLast < this.MIN_DELAY) {
                await new Promise(res => setTimeout(res, this.MIN_DELAY - timeSinceLast));
            }

            const resolve = this.queue.shift();
            if (resolve) {
                rateLimitState.value.queueLength = this.queue.length;
                this.requestTimes.push(Date.now());
                this.lastRequestTime = Date.now();
                resolve();
            }
        }
        
        this.isProcessing = false;

        if (this.queue.length === 0) {
            rateLimitState.value.queueLength = 0;
            if (rateLimitState.value.resetTime <= Date.now()) {
                rateLimitState.value.isRateLimited = false;
                rateLimitState.value.resetTime = 0;
            }
        }
    }
}

const queue = new RequestQueue();

// Global custom ofetch instance that respects the queue and handles 429 retries
export const apiFetch = ofetch.create({
    // In httpOnly mode the browser must attach the worker's httpOnly session cookie.
    // 'same-origin' otherwise, so legacy CORS '*' responses aren't blocked as credentialed.
    credentials: HTTPONLY_AUTH ? 'include' : 'same-origin',
    retry: 3,
    retryDelay: (ctx) => {
        let delay = 3000;
        const retryAfter = ctx.response?.headers.get('Retry-After');
        if (retryAfter) {
            const parsed = parseInt(retryAfter, 10);
            if (!isNaN(parsed)) delay = parsed * 1000;
        }

        // Update rate limit state if we get a 429 status code
        if (ctx.response?.status === 429) {
            rateLimitState.value.isRateLimited = true;
            rateLimitState.value.resetTime = Date.now() + delay;

            // Set a timer to clear the state once the retry delay is done
            setTimeout(() => {
                if (rateLimitState.value.resetTime <= Date.now()) {
                    rateLimitState.value.isRateLimited = false;
                    rateLimitState.value.resetTime = 0;
                }
            }, delay);
        }

        return delay;
    },
    retryStatusCodes: [429, 500, 502, 503, 504],
    onRequest: async () => {
        await queue.waitForTurn();
    }
});

