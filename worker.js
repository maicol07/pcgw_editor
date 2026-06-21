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
        // httpOnly-cookie mode (#6) is opt-in: set ALLOWED_ORIGINS (comma-separated) to the app's
        // production origin(s). Credentialed CORS forbids '*', so we reflect a single allowlisted
        // origin. When unset, the worker stays in legacy mode (session cookies travel in the body).
        const allowedOrigins = (env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
        const reqOrigin = request.headers.get('Origin') || '';
        const credentialed = allowedOrigins.includes(reqOrigin);
        const corsHeaders = credentialed
            ? {
                'Access-Control-Allow-Origin': reqOrigin,
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, api-user-agent, User-Agent, X-Requested-With, Authorization, Client-ID',
                'Vary': 'Origin',
            }
            : {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, api-user-agent, User-Agent, X-Requested-With, Authorization, Client-ID',
            };

        const clientUserAgent = request.headers.get('api-user-agent') || request.headers.get('user-agent') || 'PCGW-WorkerBridge/1.0';

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);
        const PCGW_API = 'https://www.pcgamingwiki.com/w/api.php';

        // Reads the MediaWiki session cookies, preferring the httpOnly `mw` cookie (#6 mode) and
        // falling back to the legacy body-supplied value.
        const cookieFromHeader = () => {
            const raw = request.headers.get('Cookie') || '';
            const m = raw.match(/(?:^|;\s*)mw=([^;]+)/);
            return m ? decodeURIComponent(m[1]) : '';
        };

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
                    const headers = { 'Content-Type': 'application/json', ...corsHeaders };
                    const respBody = { success: true, username: loginResult.login.lgusername, httpOnly: credentialed };
                    if (credentialed) {
                        // #6: keep the MediaWiki session server-side in an httpOnly cookie the page JS can't read.
                        headers['Set-Cookie'] = `mw=${encodeURIComponent(authCookies)}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=2592000`;
                    } else {
                        respBody.sessionCookies = authCookies; // legacy mode
                    }
                    return new Response(JSON.stringify(respBody), { headers });
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

                // #6: in httpOnly mode the client sends no body cookies — read them from the httpOnly cookie.
                cookies = cookies || cookieFromHeader();
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
        // 2b. ENDPOINT: ALLOWLISTED EXTERNAL PROXY (replaces the public corsproxy.io)
        // Adds CORS to third-party metadata APIs without leaking the caller's (user-supplied)
        // Twitch/RAWG credentials to an anonymous proxy. Host allowlist prevents open-proxy abuse.
        // ==========================================
        if (url.pathname === '/api/ext') {
            const targetStr = url.searchParams.get('url');
            if (!targetStr) {
                return new Response(JSON.stringify({ error: 'url parameter is required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
            }
            let target;
            try {
                target = new URL(targetStr);
            } catch {
                return new Response(JSON.stringify({ error: 'Invalid url parameter' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
            }

            const allowedHosts = ['api.rawg.io', 'api.vndb.org', 'id.twitch.tv', 'api.igdb.com', 'store.steampowered.com'];
            if (target.protocol !== 'https:' || !allowedHosts.includes(target.hostname)) {
                return new Response(JSON.stringify({ error: 'Host not allowed' }), { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
            }

            try {
                // Forward only the headers these APIs need (e.g. IGDB's Client-ID / Authorization).
                const fwdHeaders = { 'User-Agent': clientUserAgent };
                for (const h of ['content-type', 'authorization', 'client-id']) {
                    const v = request.headers.get(h);
                    if (v) fwdHeaders[h] = v;
                }

                const upstream = await fetch(target.toString(), {
                    method: request.method,
                    headers: fwdHeaders,
                    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text(),
                });

                const respHeaders = { 'Content-Type': upstream.headers.get('content-type') || 'application/json', ...corsHeaders };
                return new Response(upstream.body, { status: upstream.status, headers: respHeaders });
            } catch (error) {
                return new Response(JSON.stringify({ error: error.message }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
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