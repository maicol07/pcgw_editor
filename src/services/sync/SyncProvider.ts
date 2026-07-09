// A storage backend for the encrypted sync blob. Only Google Drive is implemented today;
// the interface keeps adding Dropbox/OneDrive a ~50-line drop-in later.
export interface SyncProvider {
    /** OAuth consent (must be triggered from a user gesture). */
    connect(): Promise<void>;
    /** Returns a valid access token, refreshing silently; throws if re-consent is needed. */
    ensureToken(): Promise<string>;
    /** Re-authenticates and gets a new token (opens the OAuth popup). */
    reconnect(): Promise<void>;
    /** Read the blob file, or null if it doesn't exist yet. */
    readBlob(): Promise<string | null>;
    /** Create or overwrite the blob file. */
    writeBlob(data: string): Promise<void>;
    /** Forget the token (and revoke it if possible). */
    disconnect(): void;
}
