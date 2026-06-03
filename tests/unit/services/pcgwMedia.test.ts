import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pcgwMedia } from '../../../src/services/pcgwMedia';
import { pcgwAuth } from '../../../src/services/pcgwAuth';
import { apiFetch } from '../../../src/config/api';

vi.mock('../../../src/config/api', () => ({
    getWorkerLoginUrl: () => 'http://login-worker.test',
    getWorkerProxyUrl: () => 'http://proxy-worker.test',
    getDirectApiUrl: () => 'http://direct-api.test',
    getApiHeaders: () => ({}),
    apiFetch: vi.fn()
}));

// Mock pcgwAuth to simulate logged-in state and intercept apiPost
vi.mock('../../../src/services/pcgwAuth', () => {
    return {
        pcgwAuth: {
            isLoggedIn: true,
            isAuthReady: true,
            sessionCookies: 'testcookie=1',
            getCsrfToken: vi.fn().mockResolvedValue('testtoken'),
            apiPost: vi.fn()
        }
    };
});

const mockOfetch = vi.mocked(apiFetch);
const mockPcgwAuth = vi.mocked(pcgwAuth);

describe('PCGWMediaService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should use pcgwAuth.apiPost for uploadFile', async () => {
        mockPcgwAuth.apiPost.mockResolvedValueOnce({ success: true });
        
        const file = new Blob(['test content'], { type: 'text/plain' });
        await pcgwMedia.uploadFile(file, { filename: 'test.txt' });

        expect(mockPcgwAuth.apiPost).toHaveBeenCalledTimes(1);
        const [formData, method] = mockPcgwAuth.apiPost.mock.calls[0];

        expect(formData).toBeInstanceOf(FormData);
        expect(method).toBe('POST');
        expect((formData as FormData).get('action')).toBe('upload');
        expect((formData as FormData).get('filename')).toBe('test.txt');
    });

    it('should use pcgwAuth.apiPost for editPage', async () => {
        mockPcgwAuth.apiPost.mockResolvedValueOnce({ edit: { result: 'Success', newrevid: 12345 } });
        
        await pcgwMedia.editPage('Test Page', 'New text', 'Test summary', undefined, true);

        expect(mockPcgwAuth.apiPost).toHaveBeenCalledTimes(1);
        const [formData, method] = mockPcgwAuth.apiPost.mock.calls[0];

        expect(formData).toBeInstanceOf(FormData);
        expect(method).toBe('POST');
        expect((formData as FormData).get('action')).toBe('edit');
        expect((formData as FormData).get('title')).toBe('Test Page');
        expect((formData as FormData).get('minor')).toBe('1');
    });

    it('should check if file exists using apiFetch direct API', async () => {
        mockOfetch.mockResolvedValueOnce({ query: { pages: { '1': { pageid: 123 } } } });
        
        const exists = await pcgwMedia.checkFileExists('test.txt');
        expect(exists).toBe(true);
        expect(mockOfetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
            query: expect.objectContaining({ action: 'query', titles: 'File:test.txt' })
        }));
    });
});
