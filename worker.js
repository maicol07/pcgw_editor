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
            'Access-Control-Allow-Headers': 'Content-Type',
        };

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

                const tokenResponse = await fetch(`${PCGW_API}?action=query&meta=tokens&type=login&format=json`);
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
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': initialCookies, 'User-Agent': 'PCGW-WorkerBridge/1.0' },
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
                        headers: { 'Cookie': cookies, 'User-Agent': 'PCGW-WorkerBridge/1.0' }
                    });
                    const tokenData = await tokenReq.json();
                    const csrfToken = tokenData?.query?.tokens?.csrftoken;

                    // Prepare options for the MediaWiki call
                    let fetchOptions = {
                        method: 'POST',
                        headers: {
                            'Cookie': cookies,
                            'User-Agent': 'PCGW-WorkerBridge/1.0'
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
                        headers: { 'Cookie': cookies, 'User-Agent': 'PCGW-WorkerBridge/1.0' }
                    });
                }

                const mwData = await mwResponse.json();
                return new Response(JSON.stringify(mwData), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });

            } catch (error) {
                return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
            }
        }

        return new Response(JSON.stringify({ message: 'Worker Bridge Active. Endpoints: /api/login, /api/proxy' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
};