import { z } from 'zod';

/**
 * Shape of the decrypted sync snapshot.
 *
 * applySnapshot() writes straight into the workspace store, aiConfig.keys and the
 * pcgw_auth_data_v2 localStorage key. Decryption proves the blob was produced by someone holding
 * the passphrase, but not that its contents are well-formed — so a tampered or corrupted blob used
 * to be applied verbatim, up to and including credential injection. Everything crossing that
 * boundary is validated here first.
 *
 * Unknown keys are stripped rather than rejected, so a snapshot written by a newer version of the
 * app still loads on an older one.
 */
const pageSchema = z.object({
    id: z.string().min(1),
    title: z.string(),
    wikitext: z.string(),
    baseWikitext: z.string(),
    lastModified: z.number().finite(),
    template: z.enum(['blank', 'singleplayer', 'multiplayer', 'unknown']).optional(),
    pcgwPageTitle: z.string().optional(),
    localRevisionId: z.number().finite().optional(),
    onlineRevisionId: z.number().finite().optional(),
});

// Mirrors ThemeMode / DensityMode in stores/ui.ts. Keeping these as enums rather than z.string()
// means a hostile snapshot cannot push an arbitrary value into the UI store.
const settingsSchema = z.object({
    theme: z.enum(['system', 'light', 'dark']).optional(),
    densityMode: z.enum(['normal', 'comfortable', 'compact']).optional(),
    fontFamily: z.string().optional(),
    autoUploadDescription: z.boolean().optional(),
    autoReLogin: z.boolean().optional(),
    navRailCollapsed: z.boolean().optional(),
});

// Keys are spelled out rather than z.record(z.enum(...)): in Zod 4 an enum key type is treated as
// exhaustive, so a record would demand all three providers be present.
const aiSchema = z.object({
    provider: z.enum(['google', 'openai', 'anthropic']).optional(),
    model: z.string().optional(),
    keys: z.object({
        google: z.string().optional(),
        openai: z.string().optional(),
        anthropic: z.string().optional(),
    }).optional(),
});

// `password` is deliberately absent: it is stripped before upload and must never be
// re-introduced by a downloaded snapshot.
const authSchema = z.object({
    username: z.string(),
    isLoggedIn: z.boolean(),
    csrfToken: z.string().optional(),
    sessionCookies: z.string().optional(),
});

export const snapshotSchema = z.object({
    v: z.number(),
    updatedAt: z.number().finite(),
    deviceId: z.string(),
    pages: z.array(pageSchema).default([]),
    activePageId: z.string().nullable().optional(),
    settings: settingsSchema.default({}),
    ai: aiSchema.optional(),
    auth: authSchema.nullable().optional(),
    tombstones: z.record(z.string(), z.number().finite()).default({}),
});

export type Snapshot = z.infer<typeof snapshotSchema>;

/** Minimum passphrase length. Short passphrases undercut PBKDF2 no matter the iteration count. */
export const MIN_PASSPHRASE_LENGTH = 12;
