import { describe, it, expect } from 'vitest';
import { snapshotSchema, MIN_PASSPHRASE_LENGTH } from '../../../src/services/sync/snapshotSchema';

// applySnapshot() writes this payload into the workspace store, aiConfig.keys and the
// pcgw_auth_data_v2 localStorage key. Decryption proves the passphrase, not the shape — so the
// schema is the actual trust boundary for a blob fetched from Google Drive.

const validSnapshot = {
    v: 1,
    updatedAt: 1770000000000,
    deviceId: 'device-a',
    pages: [{
        id: 'p1',
        title: 'Some Game',
        wikitext: '{{Infobox game}}',
        baseWikitext: '{{Infobox game}}',
        lastModified: 1770000000000,
    }],
    activePageId: 'p1',
    settings: { theme: 'dark', densityMode: 'compact' },
    ai: { provider: 'google', model: 'gemini', keys: { google: 'k' } },
    auth: { username: 'u', isLoggedIn: true },
    tombstones: { gone: 1769000000000 },
};

describe('snapshotSchema', () => {
    it('accepts a well-formed snapshot', () => {
        const r = snapshotSchema.safeParse(validSnapshot);
        expect(r.success).toBe(true);
    });

    it('strips a password smuggled into auth', () => {
        const r = snapshotSchema.safeParse({
            ...validSnapshot,
            auth: { username: 'u', isLoggedIn: true, password: 'hunter2' },
        });
        expect(r.success).toBe(true);
        expect(r.success && 'password' in r.data.auth!).toBe(false);
    });

    it('rejects an arbitrary theme value instead of writing it to the UI store', () => {
        const r = snapshotSchema.safeParse({
            ...validSnapshot,
            settings: { theme: 'javascript:alert(1)' },
        });
        expect(r.success).toBe(false);
    });

    it('rejects an unknown AI provider', () => {
        const r = snapshotSchema.safeParse({
            ...validSnapshot,
            ai: { provider: 'evilcorp', keys: { evilcorp: 'k' } },
        });
        expect(r.success).toBe(false);
    });

    it('rejects pages that are not objects of the expected shape', () => {
        expect(snapshotSchema.safeParse({ ...validSnapshot, pages: ['nope'] }).success).toBe(false);
        expect(snapshotSchema.safeParse({ ...validSnapshot, pages: [{ id: 'x' }] }).success).toBe(false);
    });

    it('rejects a non-numeric lastModified, which drives last-write-wins merging', () => {
        const r = snapshotSchema.safeParse({
            ...validSnapshot,
            pages: [{ ...validSnapshot.pages[0], lastModified: 'yesterday' }],
        });
        expect(r.success).toBe(false);
    });

    it('rejects wholly unexpected payloads', () => {
        for (const bad of [null, undefined, 'string', 42, [], {}]) {
            expect(snapshotSchema.safeParse(bad).success).toBe(false);
        }
    });

    it('tolerates unknown future keys so a newer app version stays loadable', () => {
        const r = snapshotSchema.safeParse({ ...validSnapshot, somethingNew: { a: 1 } });
        expect(r.success).toBe(true);
        expect(r.success && 'somethingNew' in r.data).toBe(false);
    });

    it('defaults missing collections rather than yielding undefined', () => {
        const { pages, tombstones, settings, ...rest } = validSnapshot;
        const r = snapshotSchema.safeParse(rest);
        expect(r.success).toBe(true);
        if (r.success) {
            expect(r.data.pages).toEqual([]);
            expect(r.data.tombstones).toEqual({});
            expect(r.data.settings).toEqual({});
        }
    });

    it('requires a passphrase long enough for PBKDF2 to matter', () => {
        expect(MIN_PASSPHRASE_LENGTH).toBeGreaterThanOrEqual(12);
    });
});
