import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pcgwMedia } from './pcgwMedia';
import { pcgwAuth } from './pcgwAuth';
import { ofetch } from 'ofetch';

vi.mock('ofetch', () => ({
    ofetch: vi.fn()
}));

// Mock pcgwAuth to simulate logged-in state
vi.mock('./pcgwAuth', () => {
    return {
        pcgwAuth: {
            isLoggedIn: true,
            sessionCookies: 'testcookie=1',
            getCsrfToken: vi.fn().mockResolvedValue('testtoken')
        }
    };
});

const mockOfetch = vi.mocked(ofetch);

describe('PCGWMediaService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should add assert=user to uploadFile requests', async () => {
        mockOfetch.mockResolvedValueOnce({ success: true });
        
        const file = new Blob(['test content'], { type: 'text/plain' });
        await pcgwMedia.uploadFile(file, { filename: 'test.txt' });

        expect(mockOfetch).toHaveBeenCalledTimes(1);
        const callArgs = mockOfetch.mock.calls[0];
        const formData = callArgs[1]?.body as FormData;

        expect(formData).toBeInstanceOf(FormData);
        expect(formData.get('assert')).toBe('user');
        expect(formData.get('action')).toBe('upload');
    });

    it('should add assert=user and minor flags to editPage requests', async () => {
        mockOfetch.mockResolvedValueOnce({ edit: { result: 'Success', newrevid: 12345 } });
        
        await pcgwMedia.editPage('Test Page', 'New text', 'Test summary', undefined, true);

        expect(mockOfetch).toHaveBeenCalledTimes(1);
        const callArgs = mockOfetch.mock.calls[0];
        const formData = callArgs[1]?.body as FormData;

        expect(formData).toBeInstanceOf(FormData);
        expect(formData.get('assert')).toBe('user');
        expect(formData.get('action')).toBe('edit');
        expect(formData.get('minor')).toBe('1');
    });
});
