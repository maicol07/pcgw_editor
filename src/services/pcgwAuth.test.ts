import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pcgwAuth } from './pcgwAuth';
import { ofetch } from 'ofetch';
import { getWorkerProxyUrl } from '../config/api';

vi.mock('ofetch', () => ({
    ofetch: vi.fn()
}));

const mockOfetch = vi.mocked(ofetch);

describe('PCGWAuthService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
        pcgwAuth['authData'].value = {
            username: 'testuser',
            isLoggedIn: true,
            sessionCookies: 'testcookie=1'
        };

        mockOfetch.mockResolvedValueOnce({ success: true });

        // Use a generic request to test apiPost implicitly
        await pcgwAuth.refreshCsrfToken();

        expect(mockOfetch).toHaveBeenCalledWith(getWorkerProxyUrl(), expect.objectContaining({
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
        pcgwAuth['authData'].value = {
            username: 'testuser',
            password: 'testpassword',
            isLoggedIn: true,
            sessionCookies: 'oldcookie=1'
        };
        localStorage.setItem('autoReLogin', 'true');

        // First mock: failure due to assertuserfailed
        mockOfetch.mockResolvedValueOnce({
            error: { code: 'assertuserfailed' }
        });

        // Second mock: successful re-login
        mockOfetch.mockResolvedValueOnce({
            success: true,
            username: 'testuser',
            sessionCookies: 'newcookie=1'
        });

        // Third mock: successful refreshCsrfToken after re-login
        mockOfetch.mockResolvedValueOnce({
            query: { tokens: { csrftoken: 'newtoken' } }
        });

        // Fourth mock: successful retry of original request
        mockOfetch.mockResolvedValueOnce({ success: true });

        // Trigger request implicitly
        await pcgwAuth['apiPost']({ action: 'test' });

        expect(mockOfetch).toHaveBeenCalledTimes(4); // 1st try + login + csrf + 2nd try
        expect(pcgwAuth.sessionCookies).toBe('newcookie=1');
    });

    it('should logout if re-login fails or autoReLogin is false on assertuserfailed', async () => {
        pcgwAuth['authData'].value = {
            username: 'testuser',
            password: 'testpassword',
            isLoggedIn: true,
            sessionCookies: 'oldcookie=1'
        };
        localStorage.setItem('autoReLogin', 'false');

        mockOfetch.mockResolvedValueOnce({
            error: { code: 'assertuserfailed' }
        });

        // Logout call mock
        mockOfetch.mockResolvedValueOnce({ success: true });

        await expect(pcgwAuth['apiPost']({ action: 'test' })).rejects.toThrow('PCGW session expired. Please log in again.');

        expect(pcgwAuth.isLoggedIn).toBe(false);
        expect(pcgwAuth.sessionCookies).toBe('');
    });
    
    it('should preserve credentials on logout if autoReLogin is true', async () => {
        pcgwAuth['authData'].value = {
            username: 'testuser',
            password: 'testpassword',
            isLoggedIn: true,
            sessionCookies: 'testcookie=1'
        };
        localStorage.setItem('autoReLogin', 'true');
        
        mockOfetch.mockResolvedValueOnce({ success: true }); // logout call
        
        await pcgwAuth.logout();
        
        expect(pcgwAuth.isLoggedIn).toBe(false);
        expect(pcgwAuth.username).toBe('testuser');
        expect(pcgwAuth.password).toBe('testpassword');
        expect(pcgwAuth.sessionCookies).toBe('');
    });

    it('should attempt login in apiPost if cookies are missing and autoReLogin is true', async () => {
        pcgwAuth['authData'].value = {
            username: 'testuser',
            password: 'testpassword',
            isLoggedIn: false,
            sessionCookies: undefined
        };
        localStorage.setItem('autoReLogin', 'true');

        // 1st mock: successful login
        mockOfetch.mockResolvedValueOnce({
            success: true,
            username: 'testuser',
            sessionCookies: 'newcookie=1'
        });

        // 2nd mock: refreshCsrfToken
        mockOfetch.mockResolvedValueOnce({
            query: { tokens: { csrftoken: 'newtoken' } }
        });

        // 3rd mock: actual request
        mockOfetch.mockResolvedValueOnce({ success: true });

        await pcgwAuth.apiPost({ action: 'test' });

        expect(mockOfetch).toHaveBeenCalledTimes(3);
        expect(pcgwAuth.sessionCookies).toBe('newcookie=1');
        expect(pcgwAuth.isLoggedIn).toBe(true);
    });
});
