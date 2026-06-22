import { describe, it, expect } from 'vitest';
import { deriveKey, encrypt, decrypt, randomSalt } from '@/services/sync/crypto';

describe('sync crypto', () => {
    it('round-trips a JSON payload', async () => {
        const salt = randomSalt();
        const key = await deriveKey('correct horse battery staple', salt);
        const payload = JSON.stringify({ hello: 'world', n: 42, arr: [1, 2, 3] });
        const { iv, ct } = await encrypt(key, payload);
        expect(await decrypt(key, iv, ct)).toBe(payload);
    });

    it('fails to decrypt with the wrong passphrase', async () => {
        const salt = randomSalt();
        const right = await deriveKey('right', salt);
        const { iv, ct } = await encrypt(right, 'secret');
        const wrong = await deriveKey('wrong', salt);
        await expect(decrypt(wrong, iv, ct)).rejects.toBeTruthy();
    });
});
