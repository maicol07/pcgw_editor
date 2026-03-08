const PROXY_PREFIX = ''; // Optional, e.g. 'https://cors-anywhere.herokuapp.com/'
const PCGW_API_URL = 'https://www.pcgamingwiki.com/w/api.php';

export const API_CONFIG = {
    // New Worker-based login endpoint
    workerLoginUrl: 'https://pcgw-proxy-login.maicol07.workers.dev/api/login',
    
    // New Smart Proxy for authenticated requests
    workerProxyUrl: 'https://pcgw-proxy-login.maicol07.workers.dev/api/proxy',

    // Used for the initial logintoken request which often fails CORS on localhost
    proxyUrl: (import.meta.env.DEV && !PROXY_PREFIX) ? '/pcgw-api' : (PROXY_PREFIX + PCGW_API_URL),
    
    // Used for all other operations (data, login POST, CSRF, uploads)
    directUrl: PCGW_API_URL,
    
    proxyPrefix: PROXY_PREFIX
};

export const getWorkerLoginUrl = () => API_CONFIG.workerLoginUrl;
export const getWorkerProxyUrl = () => API_CONFIG.workerProxyUrl;
export const getProxyApiUrl = () => API_CONFIG.proxyUrl;
export const getDirectApiUrl = () => API_CONFIG.directUrl;

// Hook for adding required headers for certain proxies (like cors-anywhere)
export const getApiHeaders = () => {
    const headers: Record<string, string> = {};
    if (API_CONFIG.proxyPrefix.includes('cors-anywhere')) {
        headers['X-Requested-With'] = 'XMLHttpRequest';
    }
    return headers;
};
