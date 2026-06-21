import { useStorage } from '@vueuse/core';
import { ref } from 'vue';
import { getWorkerLoginUrl, getWorkerProxyUrl, getApiHeaders, apiFetch, HTTPONLY_AUTH } from '../config/api';

const AUTH_STORAGE_KEY = 'pcgw_auth_data_v2';

export interface AuthData {
    username: string;
    isLoggedIn: boolean;
    csrfToken?: string;
    sessionCookies?: string;
    password?: string; // legacy on-disk field; migrated to in-memory and stripped on init
}

class PCGWAuthService {
    private authData = useStorage<AuthData>(AUTH_STORAGE_KEY, {
        username: '',
        isLoggedIn: false
    });

    // Password is kept in memory only (never written to disk). Survives session-cookie
    // expiry within a tab session for auto-relogin, but a full reload requires logging in again.
    private sessionPassword = ref<string | undefined>();

    private _isInitializing = ref(false);

    constructor() {
        // Migrate away any password persisted by older versions: keep it for this session, wipe from storage.
        if (this.authData.value.password) {
            this.sessionPassword.value = this.authData.value.password;
            delete this.authData.value.password;
        }
    }

    get isLoggedIn() {
        return this.authData.value.isLoggedIn;
    }

    get isAuthReady() {
        const autoReLogin = localStorage.getItem('autoReLogin') === 'true';
        return this.authData.value.isLoggedIn || (autoReLogin && !!this.authData.value.username && !!this.sessionPassword.value);
    }

    get username() {
        return this.authData.value.username;
    }

    get sessionCookies() {
        return this.authData.value.sessionCookies || '';
    }

    get password() {
        return this.sessionPassword.value || '';
    }

    async apiPost(params: Record<string, any> | FormData, method: 'GET' | 'POST' = 'POST', retry = true): Promise<any> {
        // In httpOnly mode the session lives in a cookie the worker reads itself; no body cookie to check.
        if (!HTTPONLY_AUTH && !this.authData.value.sessionCookies) {
            const autoReLogin = localStorage.getItem('autoReLogin') === 'true';
            if (autoReLogin && this.authData.value.username && this.sessionPassword.value) {
                console.log('No session cookies, but autoReLogin is active. Attempting login...');
                const success = await this.login(this.authData.value.username, this.sessionPassword.value);
                if (!success) {
                    throw new Error('No session cookies available and automatic re-login failed');
                }
            } else {
                throw new Error('No session cookies available');
            }
        }

        let body: any;
        if (params instanceof FormData) {
            body = params;
            // Ensure cookies and assert are present in FormData
            // Always set/update cookies to ensure the latest cookies are sent
            // (httpOnly mode: worker reads the session from its own cookie, so send none)
            if (!HTTPONLY_AUTH) body.set('cookies', this.authData.value.sessionCookies);
            if (!body.has('assert')) body.append('assert', 'user');
            if (!body.has('method')) body.append('method', method);
            
            // If the FormData has a token, update it with the latest CSRF token
            if (body.has('token') && this.authData.value.csrfToken) {
                body.set('token', this.authData.value.csrfToken);
            }
        } else {
            body = {
                cookies: this.authData.value.sessionCookies,
                method,
                params: {
                    ...params,
                    assert: 'user'
                }
            };
            // If the params object has a token, update it with the latest CSRF token
            if (this.authData.value.csrfToken) {
                if ('token' in body.params) {
                    body.params.token = this.authData.value.csrfToken;
                }
                if ('token' in params) {
                    params.token = this.authData.value.csrfToken;
                }
            }
        }

        const res = await apiFetch(getWorkerProxyUrl(), {
            method: 'POST',
            body,
            headers: getApiHeaders()
        });

        // Handle MediaWiki auth errors reactively
        if (res?.error?.code === 'notloggedin' || res?.error?.code === 'readapidenied' || res?.error?.code === 'assertuserfailed' || res?.error?.code === 'badtoken') {
            if (retry) {
                const autoReLogin = localStorage.getItem('autoReLogin') === 'true';
                if (autoReLogin && this.authData.value.username && this.sessionPassword.value) {
                    console.log(`PCGW session expired for user ${this.authData.value.username}. Attempting automatic re-login...`);
                    const success = await this.login(this.authData.value.username, this.sessionPassword.value);
                    if (success) {
                        console.log('Re-login successful, retrying original request...');
                        return this.apiPost(params, method, false);
                    } else {
                        console.error('Automatic re-login failed.');
                    }
                }
                
                // If we reach here, either auto-login is off or failed
                console.warn('Session expired and auto-login not possible or failed. Logging out.');
                this.logout();
                throw new Error('PCGW session expired. Please log in again.');
            }
        }

        return res;
    }

    async login(username: string, password: string): Promise<boolean> {
        this._isInitializing.value = true;
        try {
            const loginRes = await apiFetch<{ success: boolean; username: string; sessionCookies?: string; httpOnly?: boolean; data?: any }>(getWorkerLoginUrl(), {
                method: 'POST',
                body: {
                    username,
                    password
                },
                headers: getApiHeaders()
            });

            // In httpOnly mode the session is in a cookie, so no sessionCookies in the body.
            if (loginRes.success && (loginRes.sessionCookies || HTTPONLY_AUTH)) {
                // IMPORTANT: Use the username provided (which contains @Bot suffix if applicable)
                // mediawiki might return just the base username in loginRes.username
                this.authData.value.username = username;
                this.authData.value.sessionCookies = loginRes.sessionCookies;
                this.sessionPassword.value = password;
                this.authData.value.isLoggedIn = true;
                
                // Get CSRF token for future edits/uploads
                // This might need to go through the proxy as well
                await this.refreshCsrfToken();
                return true;
            } else {
                console.error('Login failed:', loginRes.data || 'Unknown error');
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            return false;
        } finally {
            this._isInitializing.value = false;
        }
    }

    async refreshCsrfToken(): Promise<string | null> {
        try {
            const res = await this.apiPost({
                action: 'query',
                meta: 'tokens',
                type: 'csrf'
            }, 'GET');
            
            const token = res?.query?.tokens?.csrftoken;
            if (token) {
                this.authData.value.csrfToken = token;
            }
            return token;
        } catch (e) {
            console.error('Failed to get CSRF token:', e);
            return null;
        }
    }

    async logout() {
        try {
            await this.apiPost({ action: 'logout' }, 'POST', false);
        } catch (e) {
            console.error('Logout error:', e);
        }
        
        const autoReLogin = localStorage.getItem('autoReLogin') === 'true';
        const preservedUsername = autoReLogin ? this.authData.value.username : '';
        const preservedPassword = autoReLogin ? this.sessionPassword.value : undefined;

        this.authData.value.username = preservedUsername;
        this.authData.value.isLoggedIn = false;
        this.authData.value.csrfToken = undefined;
        this.authData.value.sessionCookies = undefined;
        this.sessionPassword.value = preservedPassword;
    }

    async getCsrfToken(): Promise<string | null> {
        if (!this.authData.value.csrfToken || this.authData.value.csrfToken === '+\\') {
            return await this.refreshCsrfToken();
        }
        return this.authData.value.csrfToken;
    }
}

export const pcgwAuth = new PCGWAuthService();
