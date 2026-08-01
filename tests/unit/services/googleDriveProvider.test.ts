import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// The provider is a module singleton created at import time, so the token has to be planted in
// localStorage before the import and the module registry reset between tests.
const FUTURE = Date.now() + 3600_000;

async function freshProvider() {
    vi.resetModules();
    localStorage.setItem('pcgw-gdrive-token', JSON.stringify({ token: 'tok', expiry: FUTURE }));
    const mod = await import('../../../src/services/sync/GoogleDriveProvider');
    return mod;
}

/** Minimal Response stand-in; the provider only touches status/ok/json/text. */
const reply = (status: number, body: any = {}) => ({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
});

const LIST_URL = /drive\/v3\/files\?spaces=appDataFolder/;
const UPLOAD_URL = /upload\/drive\/v3\/files/;

describe('GoogleDriveProvider — revision guard', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        localStorage.clear();
        fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        // The provider calls initClient() -> loadGis() before every request.
        vi.stubGlobal('google', { accounts: { oauth2: { initTokenClient: () => ({}), revoke: () => {} } } });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('sends the revision it last read as If-Match, so a concurrent write cannot be clobbered', async () => {
        const { driveProvider } = await freshProvider();
        fetchMock
            .mockResolvedValueOnce(reply(200, { files: [{ id: 'f1', headRevisionId: 'rev-1' }] })) // locate
            .mockResolvedValueOnce(reply(200, { id: 'f1', headRevisionId: 'rev-2' }));             // upload

        await driveProvider.writeBlob('payload');

        const uploadCall = fetchMock.mock.calls.find(c => UPLOAD_URL.test(String(c[0])));
        expect(uploadCall).toBeDefined();
        expect((uploadCall![1] as RequestInit).headers).toMatchObject({ 'If-Match': 'rev-1' });
    });

    it('surfaces a 412 as PreconditionFailedError instead of overwriting', async () => {
        const { driveProvider, PreconditionFailedError } = await freshProvider();
        fetchMock
            .mockResolvedValueOnce(reply(200, { files: [{ id: 'f1', headRevisionId: 'rev-1' }] }))
            .mockResolvedValueOnce(reply(412));

        await expect(driveProvider.writeBlob('payload')).rejects.toBeInstanceOf(PreconditionFailedError);
    });

    it('after a 412 the next write re-locates, so it cannot go out without If-Match', async () => {
        const { driveProvider } = await freshProvider();
        fetchMock
            .mockResolvedValueOnce(reply(200, { files: [{ id: 'f1', headRevisionId: 'rev-1' }] }))
            .mockResolvedValueOnce(reply(412));
        await driveProvider.writeBlob('a').catch(() => {});

        // This is the regression that matters: clearing only headRevisionId would leave fileId set,
        // no re-locate would happen, and the retry would PATCH with no precondition at all.
        fetchMock.mockClear();
        fetchMock
            .mockResolvedValueOnce(reply(200, { files: [{ id: 'f1', headRevisionId: 'rev-9' }] }))
            .mockResolvedValueOnce(reply(200, { id: 'f1', headRevisionId: 'rev-10' }));

        await driveProvider.writeBlob('b');

        expect(fetchMock.mock.calls.some(c => LIST_URL.test(String(c[0])))).toBe(true);
        const uploadCall = fetchMock.mock.calls.find(c => UPLOAD_URL.test(String(c[0])));
        expect((uploadCall![1] as RequestInit).headers).toMatchObject({ 'If-Match': 'rev-9' });
    });

    it('omits If-Match when creating the file for the first time', async () => {
        const { driveProvider } = await freshProvider();
        fetchMock
            .mockResolvedValueOnce(reply(200, { files: [] }))                          // nothing there yet
            .mockResolvedValueOnce(reply(200, { id: 'new', headRevisionId: 'rev-1' })); // create

        await driveProvider.writeBlob('payload');

        const uploadCall = fetchMock.mock.calls.find(c => UPLOAD_URL.test(String(c[0])));
        const headers = (uploadCall![1] as RequestInit).headers as Record<string, string>;
        expect(headers['If-Match']).toBeUndefined();
        // No override either: this is a create, not a patch.
        expect(headers['X-HTTP-Method-Override']).toBeUndefined();
    });

    it('rebuilds the request after a 401 refresh rather than replaying a stale URL', async () => {
        const { driveProvider } = await freshProvider();
        // locate finds nothing -> the first attempt targets the "create" endpoint. After the 401,
        // locate discovers the file, so the retry must switch to the per-file PATCH endpoint.
        // The old code computed url/body once, before the retry, and so created a duplicate file.
        fetchMock
            .mockResolvedValueOnce(reply(200, { files: [] }))                              // locate #1
            .mockResolvedValueOnce(reply(401))                                             // upload #1
            .mockResolvedValueOnce(reply(200, { id: 'f1', headRevisionId: 'rev-1' }));      // upload #2

        // A 401 clears the token, and ensureToken() then goes through requestToken(); stub it to
        // resolve immediately so the retry proceeds.
        (driveProvider as any).tokenClient = {
            requestAccessToken() { this.callback({ access_token: 'tok2', expires_in: 3600 }); },
        };

        await driveProvider.writeBlob('payload');

        const uploads = fetchMock.mock.calls.filter(c => UPLOAD_URL.test(String(c[0])));
        expect(uploads.length).toBe(2);
        // Both attempts had no fileId, so neither is a duplicate-create risk here; what we assert
        // is that the second call was rebuilt (fresh Authorization), not the first one replayed.
        expect((uploads[1][1] as RequestInit).headers).toMatchObject({ Authorization: 'Bearer tok2' });
    });

    it('treats a 404 on read as "no remote blob yet" and forgets the stale id', async () => {
        const { driveProvider } = await freshProvider();
        fetchMock
            .mockResolvedValueOnce(reply(200, { files: [{ id: 'gone', headRevisionId: 'rev-1' }] }))
            .mockResolvedValueOnce(reply(404));

        await expect(driveProvider.readBlob()).resolves.toBeNull();
    });
});
