import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pcgwAuth } from '../../../src/services/pcgwAuth';
import { apiFetch, getWorkerProxyUrl } from '../../../src/config/api';

// Mock API URLs
vi.mock('../../../src/config/api', () => ({
    getWorkerLoginUrl: () => 'http://login-worker.test',
    getWorkerProxyUrl: () => 'http://proxy-worker.test',
    getDirectApiUrl: () => 'http://direct-api.test',
    getApiHeaders: () => ({}),
    apiFetch: vi.fn()
}));

describe('pcgwAuth.ts - Session Refresh and Login', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        // Reset auth state manually since it's a singleton
        // @ts-ignore - access private authData for testing
        pcgwAuth.authData.value = {
            username: '',
            isLoggedIn: false,
            password: '',
            sessionCookies: ''
        };
    });

    it('successfully logs in and stores credentials', async () => {
        vi.mocked(apiFetch).mockResolvedValueOnce({
            success: true,
            username: 'TestUser',
            sessionCookies: 'test-cookies'
        });
        
        // Mock the subsequent refreshCsrfToken call inside login
        vi.mocked(apiFetch).mockResolvedValueOnce({
            query: { tokens: { csrftoken: 'test-token' } }
        });

        const success = await pcgwAuth.login('TestUser', 'TestPass');
        
        expect(success).toBe(true);
        expect(pcgwAuth.isLoggedIn).toBe(true);
        expect(pcgwAuth.username).toBe('TestUser');
        expect(pcgwAuth.sessionCookies).toBe('test-cookies');
        // @ts-ignore
        expect(pcgwAuth.authData.value.password).toBe('TestPass');
        // @ts-ignore
        expect(pcgwAuth.authData.value.csrfToken).toBe('test-token');
    });

    it('automatically re-logs in when session expires if autoReLogin is enabled', async () => {
        // Setup initial "logged in" state
        // @ts-ignore
        pcgwAuth.authData.value = {
            username: 'TestUser',
            isLoggedIn: true,
            password: 'TestPass',
            sessionCookies: 'old-cookies'
        };
        localStorage.setItem('autoReLogin', 'true');

        // First call fails with notloggedin
        vi.mocked(apiFetch).mockResolvedValueOnce({
            error: { code: 'notloggedin' }
        });

        // Second call (login) succeeds
        vi.mocked(apiFetch).mockResolvedValueOnce({
            success: true,
            username: 'TestUser',
            sessionCookies: 'new-cookies'
        });
        
        // Third call (refreshCsrfToken inside login) succeeds
        vi.mocked(apiFetch).mockResolvedValueOnce({
            query: { tokens: { csrftoken: 'new-token' } }
        });

        // Fourth call (retry of original request) succeeds
        vi.mocked(apiFetch).mockResolvedValueOnce({
            success: true,
            data: 'some-data'
        });

        // @ts-ignore - call private apiPost
        const result = await pcgwAuth.apiPost({ action: 'test' });

        expect(result.data).toBe('some-data');
        expect(pcgwAuth.sessionCookies).toBe('new-cookies');
        expect(apiFetch).toHaveBeenCalledTimes(4);
    });

    it('does not re-log in if autoReLogin is disabled', async () => {
        // @ts-ignore
        pcgwAuth.authData.value = {
            username: 'TestUser',
            isLoggedIn: true,
            password: 'TestPass',
            sessionCookies: 'old-cookies'
        };
        localStorage.setItem('autoReLogin', 'false');

        // First call fails
        vi.mocked(apiFetch).mockResolvedValueOnce({
            error: { code: 'notloggedin' }
        });
        
        // Logout call's apiFetch
        vi.mocked(apiFetch).mockResolvedValueOnce({ success: true });

        // @ts-ignore
        await expect(pcgwAuth.apiPost({ action: 'test' })).rejects.toThrow('PCGW session expired');
        
        expect(pcgwAuth.isLoggedIn).toBe(false);
        // 1: original request, 2: logout request
        expect(apiFetch).toHaveBeenCalledTimes(2); 
    });

    it('logs out and throws if auto-re-login fails', async () => {
        // @ts-ignore
        pcgwAuth.authData.value = {
            username: 'TestUser',
            isLoggedIn: true,
            password: 'TestPass',
            sessionCookies: 'old-cookies'
        };
        localStorage.setItem('autoReLogin', 'true');

        // First call fails
        vi.mocked(apiFetch).mockResolvedValueOnce({
            error: { code: 'notloggedin' }
        });

        // Login attempt fails
        vi.mocked(apiFetch).mockResolvedValueOnce({
            success: false,
            data: 'Wrong password'
        });

        // Logout call's apiFetch
        vi.mocked(apiFetch).mockResolvedValueOnce({ success: true });

        // @ts-ignore
        await expect(pcgwAuth.apiPost({ action: 'test' })).rejects.toThrow('PCGW session expired');
        
        expect(pcgwAuth.isLoggedIn).toBe(false);
        // 1: original request, 2: login attempt, 3: logout request
        expect(apiFetch).toHaveBeenCalledTimes(3); 
    });
});

describe('PCGWAuthService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // @ts-ignore
        pcgwAuth['authData'].value = {
            username: '',
            isLoggedIn: false,
            sessionCookies: undefined,
            csrfToken: undefined,
            password: undefined
        };
        localStorage.clear();
    });

    it('should add assert=user to apiPost requests', async () => {
        // @ts-ignore
        pcgwAuth['authData'].value = {
            username: 'testuser',
            isLoggedIn: true,
            sessionCookies: 'testcookie=1'
        };

        vi.mocked(apiFetch).mockResolvedValueOnce({ success: true });

        // Use a generic request to test apiPost implicitly
        await pcgwAuth.refreshCsrfToken();

        expect(apiFetch).toHaveBeenCalledWith(getWorkerProxyUrl(), expect.objectContaining({
            method: 'POST',
            body: expect.objectContaining({
                cookies: 'testcookie=1',
                method: 'GET',
                params: expect.objectContaining({
                    action: 'query',
                    meta: 'tokens',
                    type: 'csrf',
                    assert: 'user' // Verify assert=user is added
                })
            })
        }));
    });

    it('should trigger re-login on assertuserfailed if autoReLogin is true', async () => {
        // @ts-ignore
        pcgwAuth['authData'].value = {
            username: 'testuser',
            password: 'testpassword',
            isLoggedIn: true,
            sessionCookies: 'oldcookie=1'
        };
        localStorage.setItem('autoReLogin', 'true');

        // First mock: failure due to assertuserfailed
        vi.mocked(apiFetch).mockResolvedValueOnce({
            error: { code: 'assertuserfailed' }
        });

        // Second mock: successful re-login
        vi.mocked(apiFetch).mockResolvedValueOnce({
            success: true,
            username: 'testuser',
            sessionCookies: 'newcookie=1'
        });

        // Third mock: successful refreshCsrfToken after re-login
        vi.mocked(apiFetch).mockResolvedValueOnce({
            query: { tokens: { csrftoken: 'newtoken' } }
        });

        // Fourth mock: successful retry of original request
        vi.mocked(apiFetch).mockResolvedValueOnce({ success: true });

        // Trigger request implicitly
        // @ts-ignore
        await pcgwAuth['apiPost']({ action: 'test' });

        expect(apiFetch).toHaveBeenCalledTimes(4); // 1st try + login + csrf + 2nd try
        expect(pcgwAuth.sessionCookies).toBe('newcookie=1');
    });

    it('should logout if re-login fails or autoReLogin is false on assertuserfailed', async () => {
        // @ts-ignore
        pcgwAuth['authData'].value = {
            username: 'testuser',
            password: 'testpassword',
            isLoggedIn: true,
            sessionCookies: 'oldcookie=1'
        };
        localStorage.setItem('autoReLogin', 'false');

        vi.mocked(apiFetch).mockResolvedValueOnce({
            error: { code: 'assertuserfailed' }
        });

        // Logout call mock
        vi.mocked(apiFetch).mockResolvedValueOnce({ success: true });

        // @ts-ignore
        await expect(pcgwAuth['apiPost']({ action: 'test' })).rejects.toThrow('PCGW session expired. Please log in again.');

        expect(pcgwAuth.isLoggedIn).toBe(false);
        expect(pcgwAuth.sessionCookies).toBe('');
    });
    
    it('should preserve credentials on logout if autoReLogin is true', async () => {
        // @ts-ignore
        pcgwAuth['authData'].value = {
            username: 'testuser',
            password: 'testpassword',
            isLoggedIn: true,
            sessionCookies: 'testcookie=1'
        };
        localStorage.setItem('autoReLogin', 'true');
        
        vi.mocked(apiFetch).mockResolvedValueOnce({ success: true }); // logout call
        
        await pcgwAuth.logout();
        
        expect(pcgwAuth.isLoggedIn).toBe(false);
        expect(pcgwAuth.username).toBe('testuser');
        expect(pcgwAuth.password).toBe('testpassword');
        expect(pcgwAuth.sessionCookies).toBe('');
    });

    it('should attempt login in apiPost if cookies are missing and autoReLogin is true', async () => {
        // @ts-ignore
        pcgwAuth['authData'].value = {
            username: 'testuser',
            password: 'testpassword',
            isLoggedIn: false,
            sessionCookies: undefined
        };
        localStorage.setItem('autoReLogin', 'true');

        // 1st mock: successful login
        vi.mocked(apiFetch).mockResolvedValueOnce({
            success: true,
            username: 'testuser',
            sessionCookies: 'newcookie=1'
        });

        // 2nd mock: refreshCsrfToken
        vi.mocked(apiFetch).mockResolvedValueOnce({
            query: { tokens: { csrftoken: 'newtoken' } }
        });

        // 3rd mock: actual request
        vi.mocked(apiFetch).mockResolvedValueOnce({ success: true });

        // @ts-ignore
        await pcgwAuth.apiPost({ action: 'test' });

        expect(apiFetch).toHaveBeenCalledTimes(3);
        expect(pcgwAuth.sessionCookies).toBe('newcookie=1');
        expect(pcgwAuth.isLoggedIn).toBe(true);
    });

    it('should trigger re-login and update token on badtoken if autoReLogin is true', async () => {
        // @ts-ignore
        pcgwAuth['authData'].value = {
            username: 'testuser',
            password: 'testpassword',
            isLoggedIn: true,
            sessionCookies: 'oldcookie=1',
            csrfToken: 'oldtoken'
        };
        localStorage.setItem('autoReLogin', 'true');

        // 1st mock: failure due to badtoken
        vi.mocked(apiFetch).mockResolvedValueOnce({
            error: { code: 'badtoken' }
        });

        // 2nd mock: successful login
        vi.mocked(apiFetch).mockResolvedValueOnce({
            success: true,
            username: 'testuser',
            sessionCookies: 'newcookie=1'
        });

        // 3rd mock: refreshCsrfToken after login
        vi.mocked(apiFetch).mockResolvedValueOnce({
            query: { tokens: { csrftoken: 'newtoken' } }
        });

        // 4th mock: retry of original request
        vi.mocked(apiFetch).mockResolvedValueOnce({ success: true });

        // Pass a FormData with old token
        const formData = new FormData();
        formData.append('token', 'oldtoken');

        // @ts-ignore
        await pcgwAuth.apiPost(formData);

        expect(apiFetch).toHaveBeenCalledTimes(4);
        expect(pcgwAuth.sessionCookies).toBe('newcookie=1');
        expect(pcgwAuth.isLoggedIn).toBe(true);
        // @ts-ignore
        expect(pcgwAuth['authData'].value.csrfToken).toBe('newtoken');

        // Check that the retry had the new cookie and updated token
        const lastCallArgs = vi.mocked(apiFetch).mock.calls[3];
        const lastBody = lastCallArgs[1]?.body as FormData;
        expect(lastBody.get('cookies')).toBe('newcookie=1');
        expect(lastBody.get('token')).toBe('newtoken');
    });
});
