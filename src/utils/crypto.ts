/**
 * Crypto utilities for calculating file hashes
 */

/**
 * Calculates the SHA-1 hash of a Blob/File
 * @param blob The file to hash
 * @returns SHA-1 hash as a hex string
 */
export async function calculateSha1(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
