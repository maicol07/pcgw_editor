import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pcgwAuth } from '../../../src/services/pcgwAuth';
import { ofetch } from 'ofetch';

// Mock ofetch
vi.mock('ofetch', () => ({
    ofetch: vi.fn()
}));

// Mock API URLs
vi.mock('../../../src/config/api', () => ({
    getWorkerLoginUrl: () => 'http://login-worker.test',
    getWorkerProxyUrl: () => 'http://proxy-worker.test',
    getDirectApiUrl: () => 'http://direct-api.test',
    getApiHeaders: () => ({})
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
        vi.mocked(ofetch).mockResolvedValueOnce({
            success: true,
            username: 'TestUser',
            sessionCookies: 'test-cookies'
        });
        
        // Mock the subsequent refreshCsrfToken call inside login
        vi.mocked(ofetch).mockResolvedValueOnce({
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
        vi.mocked(ofetch).mockResolvedValueOnce({
            error: { code: 'notloggedin' }
        });

        // Second call (login) succeeds
        vi.mocked(ofetch).mockResolvedValueOnce({
            success: true,
            username: 'TestUser',
            sessionCookies: 'new-cookies'
        });
        
        // Third call (refreshCsrfToken inside login) succeeds
        vi.mocked(ofetch).mockResolvedValueOnce({
            query: { tokens: { csrftoken: 'new-token' } }
        });

        // Fourth call (retry of original request) succeeds
        vi.mocked(ofetch).mockResolvedValueOnce({
            success: true,
            data: 'some-data'
        });

        // @ts-ignore - call private apiPost
        const result = await pcgwAuth.apiPost({ action: 'test' });

        expect(result.data).toBe('some-data');
        expect(pcgwAuth.sessionCookies).toBe('new-cookies');
        expect(ofetch).toHaveBeenCalledTimes(4);
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
        vi.mocked(ofetch).mockResolvedValueOnce({
            error: { code: 'notloggedin' }
        });
        
        // Logout call's ofetch
        vi.mocked(ofetch).mockResolvedValueOnce({ success: true });

        // @ts-ignore
        await expect(pcgwAuth.apiPost({ action: 'test' })).rejects.toThrow('PCGW session expired');
        
        expect(pcgwAuth.isLoggedIn).toBe(false);
        // 1: original request, 2: logout request
        expect(ofetch).toHaveBeenCalledTimes(2); 
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
        vi.mocked(ofetch).mockResolvedValueOnce({
            error: { code: 'notloggedin' }
        });

        // Login attempt fails
        vi.mocked(ofetch).mockResolvedValueOnce({
            success: false,
            data: 'Wrong password'
        });

        // Logout call's ofetch
        vi.mocked(ofetch).mockResolvedValueOnce({ success: true });

        // @ts-ignore
        await expect(pcgwAuth.apiPost({ action: 'test' })).rejects.toThrow('PCGW session expired');
        
        expect(pcgwAuth.isLoggedIn).toBe(false);
        // 1: original request, 2: login attempt, 3: logout request
        expect(ofetch).toHaveBeenCalledTimes(3); 
    });
});
