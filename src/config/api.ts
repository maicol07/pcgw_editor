import { ofetch } from 'ofetch';
import pkg from '../../package.json';

const PROXY_PREFIX = ''; // Optional, e.g. 'https://cors-anywhere.herokuapp.com/'
const PCGW_API_URL = 'https://www.pcgamingwiki.com/w/api.php';

export const API_CONFIG = {
    // New Worker-based login endpoint
    workerLoginUrl: 'https://pcgw-proxy-login.maicol07.workers.dev/api/login',
    
    // New Smart Proxy for authenticated requests
    workerProxyUrl: 'https://pcgw-proxy-login.maicol07.workers.dev/api/proxy',

    // New Smart Proxy for images
    workerImageUrl: 'https://pcgw-proxy-login.maicol07.workers.dev/api/image',

    // Used for the initial logintoken request which often fails CORS on localhost
    proxyUrl: (import.meta.env.DEV && !PROXY_PREFIX) ? '/pcgw-api' : (PROXY_PREFIX + PCGW_API_URL),
    
    // Used for all other operations (data, login POST, CSRF, uploads)
    directUrl: PCGW_API_URL,
    
    proxyPrefix: PROXY_PREFIX
};

export const getWorkerLoginUrl = () => API_CONFIG.workerLoginUrl;
export const getWorkerProxyUrl = () => API_CONFIG.workerProxyUrl;
export const getWorkerImageUrl = () => API_CONFIG.workerImageUrl;
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
                    await new Promise(res => setTimeout(res, waitTime));
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
                this.requestTimes.push(Date.now());
                this.lastRequestTime = Date.now();
                resolve();
            }
        }
        this.isProcessing = false;
    }
}

const queue = new RequestQueue();

// Global custom ofetch instance that respects the queue and handles 429 retries
export const apiFetch = ofetch.create({
    retry: 3,
    retryDelay: (ctx) => {
        const retryAfter = ctx.response?.headers.get('Retry-After');
        if (retryAfter) {
            const parsed = parseInt(retryAfter, 10);
            if (!isNaN(parsed)) return parsed * 1000;
        }
        return 3000; // default 3s backoff
    },
    retryStatusCodes: [429, 500, 502, 503, 504],
    onRequest: async () => {
        await queue.waitForTurn();
    }
});
