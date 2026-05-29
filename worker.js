/**
 * @typedef {Object} Env
 * 
 * Cloudflare Worker to proxy authenticated requests to PCGW API
 */

export default {
    /**
     * @param {Request} request 
     * @param {Env} env 
     * @param {ExecutionContext} ctx 
     * @returns {Promise<Response>}
     */
    async fetch(request, env, ctx) {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, api-user-agent, User-Agent, X-Requested-With',
        };

        const clientUserAgent = request.headers.get('api-user-agent') || request.headers.get('user-agent') || 'PCGW-WorkerBridge/1.0';

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);
        const PCGW_API = 'https://www.pcgamingwiki.com/w/api.php';

        // ==========================================
        // 1. LOGIN ENDPOINT (Unchanged and working)
        // ==========================================
        if (request.method === 'POST' && url.pathname === '/api/login') {
            try {
                const body = await request.json();
                const { username, password } = body;

                if (!username || !password) return new Response(JSON.stringify({ error: 'Username and password required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });

                const tokenResponse = await fetch(`${PCGW_API}?action=query&meta=tokens&type=login&format=json`, {
                    headers: { 'User-Agent': clientUserAgent }
                });
                const tokenData = await tokenResponse.json();
                const loginToken = tokenData?.query?.tokens?.logintoken;
                const initialCookies = tokenResponse.headers.get('set-cookie') || '';

                if (!loginToken) throw new Error('Unable to obtain login token');

                const loginParams = new URLSearchParams();
                loginParams.append('action', 'login');
                loginParams.append('lgname', username);
                loginParams.append('lgpassword', password);
                loginParams.append('lgtoken', loginToken);
                loginParams.append('format', 'json');

                const loginResponse = await fetch(PCGW_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': initialCookies, 'User-Agent': clientUserAgent },
                    body: loginParams.toString()
                });

                const loginResult = await loginResponse.json();
                const authCookies = loginResponse.headers.get('set-cookie') || initialCookies;

                if (loginResult?.login?.result === 'Success') {
                    return new Response(JSON.stringify({ success: true, username: loginResult.login.lgusername, sessionCookies: authCookies }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
                } else {
                    return new Response(JSON.stringify({ success: false, data: loginResult }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
                }
            } catch (error) {
                return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
            }
        }

        // ==========================================
        // 2. ENDPOINT: GENERIC SMART PROXY (Text & Files)
        // ==========================================
        if (request.method === 'POST' && url.pathname === '/api/proxy') {
            try {
                const contentType = request.headers.get('content-type') || '';
                let cookies, method, params = {};
                let isMultipart = false;
                let mwFormData = new FormData(); // Used only if there is a file

                // A. PAYLOAD MANAGEMENT (JSON vs FormData)
                if (contentType.includes('multipart/form-data')) {
                    isMultipart = true;
                    const formData = await request.formData();
                    cookies = formData.get('cookies');
                    method = formData.get('method') || 'POST'; // Uploads are always POST

                    // Everything else (including files) must be passed to MediaWiki
                    for (const [key, value] of formData.entries()) {
                        if (key !== 'cookies' && key !== 'method') {
                            mwFormData.append(key, value);
                            params[key] = value; // Save a textual reference
                        }
                    }
                    if (!mwFormData.has('format')) mwFormData.append('format', 'json');
                } else {
                    // Classic JSON logic
                    const body = await request.json();
                    cookies = body.cookies;
                    method = body.method || 'GET';
                    params = body.params || {};
                    if (!params.format) params.format = 'json';
                }

                if (!cookies) return new Response(JSON.stringify({ error: 'No cookies provided' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });

                let mwResponse;

                // B. EXECUTION OF THE MEDIAWIKI REQUEST
                if (method.toUpperCase() === 'POST') {
                    // Automatically retrieve the CSRF token
                    const tokenReq = await fetch(`${PCGW_API}?action=query&meta=tokens&format=json`, {
                        headers: { 'Cookie': cookies, 'User-Agent': clientUserAgent }
                    });
                    const tokenData = await tokenReq.json();
                    const csrfToken = tokenData?.query?.tokens?.csrftoken;

                    // Prepare options for the MediaWiki call
                    let fetchOptions = {
                        method: 'POST',
                        headers: {
                            'Cookie': cookies,
                            'User-Agent': clientUserAgent
                        }
                    };

                    if (isMultipart) {
                        // If it is a file, add the token to the FormData
                        if (csrfToken) mwFormData.append('token', csrfToken);
                        fetchOptions.body = mwFormData;
                        // IMPORTANT: Do not set the Content-Type manually here! 
                        // Fetch will calculate it automatically, adding the correct "boundary" for files.
                    } else {
                        // If it is normal text (JSON), use urlencoded
                        if (csrfToken) params.token = csrfToken;
                        fetchOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                        const mwParams = new URLSearchParams();
                        for (const [key, value] of Object.entries(params)) {
                            mwParams.append(key, value);
                        }
                        fetchOptions.body = mwParams.toString();
                    }

                    mwResponse = await fetch(PCGW_API, fetchOptions);

                } else {
                    // GET logic unchanged...
                    const getUrl = new URL(PCGW_API);
                    for (const [key, value] of Object.entries(params)) {
                        getUrl.searchParams.append(key, value);
                    }
                    mwResponse = await fetch(getUrl.toString(), {
                        method: 'GET',
                        headers: { 'Cookie': cookies, 'User-Agent': clientUserAgent }
                    });
                }

                const responseText = await mwResponse.text();
                let mwData;
                try {
                    mwData = JSON.parse(responseText);
                } catch {
                    mwData = { error: 'Invalid JSON from MediaWiki', raw: responseText };
                }

                const responseHeaders = { 'Content-Type': 'application/json', ...corsHeaders };
                const retryAfter = mwResponse.headers.get('retry-after');
                if (retryAfter) responseHeaders['Retry-After'] = retryAfter;

                return new Response(JSON.stringify(mwData), { 
                    status: mwResponse.status, 
                    headers: responseHeaders 
                });

            } catch (error) {
                return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
            }
        }

        // ==========================================
        // 3. ENDPOINT: IMAGE PROXY AND CACHE
        // ==========================================
        if (request.method === 'GET' && url.pathname === '/api/image') {
            try {
                const targetUrlStr = url.searchParams.get('url');
                if (!targetUrlStr) {
                    return new Response(JSON.stringify({ error: 'URL parameter is required' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json', ...corsHeaders }
                    });
                }

                let targetUrl;
                try {
                    targetUrl = new URL(targetUrlStr);
                } catch {
                    return new Response(JSON.stringify({ error: 'Invalid URL parameter' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json', ...corsHeaders }
                    });
                }

                // Security check: restrict proxying to pcgamingwiki.com domains only to prevent SSRF / open proxy abuse
                const allowedHostnames = [
                    'www.pcgamingwiki.com',
                    'pcgamingwiki.com',
                    'images.pcgamingwiki.com',
                    'thumbnails.pcgamingwiki.com'
                ];
                if (!allowedHostnames.includes(targetUrl.hostname)) {
                    return new Response(JSON.stringify({ error: 'Host not allowed' }), {
                        status: 403,
                        headers: { 'Content-Type': 'application/json', ...corsHeaders }
                    });
                }

                // Caching strategy using Cache API
                let cache = null;
                try {
                    cache = caches.default;
                } catch (e) {
                    console.warn('Cache API not available in this environment:', e);
                }

                // The request URL (with search params) uniquely identifies this image
                const cacheKey = new Request(request.url, {
                    method: 'GET',
                    headers: { 'Accept': request.headers.get('Accept') || '*/*' }
                });

                if (cache) {
                    const cachedResponse = await cache.match(cacheKey);
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                }

                // Fetch from PCGW
                const fetchHeaders = {
                    'User-Agent': clientUserAgent,
                    'Accept': request.headers.get('Accept') || '*/*'
                };

                const imageResponse = await fetch(targetUrl.toString(), {
                    method: 'GET',
                    headers: fetchHeaders
                });

                if (!imageResponse.ok) {
                    return new Response(JSON.stringify({ error: `Failed to fetch image from PCGW: ${imageResponse.statusText}` }), {
                        status: imageResponse.status,
                        headers: { 'Content-Type': 'application/json', ...corsHeaders }
                    });
                }

                // Clone headers and add CORS / Caching directives
                const responseHeaders = new Headers(imageResponse.headers);
                for (const [key, value] of Object.entries(corsHeaders)) {
                    responseHeaders.set(key, value);
                }

                // Cache-Control: Cache for 10 minutes (600 seconds)
                responseHeaders.set('Cache-Control', 'public, max-age=600, s-maxage=600');

                const proxiedResponse = new Response(imageResponse.body, {
                    status: imageResponse.status,
                    statusText: imageResponse.statusText,
                    headers: responseHeaders
                });

                // Save to cache asynchronously if the response is successful and cache is available
                if (cache && imageResponse.ok) {
                    ctx.waitUntil(cache.put(cacheKey, proxiedResponse.clone()));
                }

                return proxiedResponse;

            } catch (error) {
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }
        }

        return new Response(JSON.stringify({ message: 'Worker Bridge Active. Endpoints: /api/login, /api/proxy, /api/image' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
};