// Native WebCrypto: PBKDF2 -> AES-GCM. No dependency.
// The salt lives inside the synced envelope so any device + passphrase can derive the key.

const enc = new TextEncoder();
const dec = new TextDecoder();

function bufToB64(buf: ArrayBuffer): string {
    let bin = '';
    for (const b of new Uint8Array(buf)) bin += String.fromCharCode(b);
    return btoa(bin);
}

function b64ToBytes(b64: string): Uint8Array {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

export function randomSalt(): string {
    return bufToB64(crypto.getRandomValues(new Uint8Array(16)).buffer);
}

export async function deriveKey(passphrase: string, saltB64: string): Promise<CryptoKey> {
    const baseKey = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: b64ToBytes(saltB64), iterations: 200_000, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false, // non-extractable: storable in IndexedDB but never readable as raw bytes
        ['encrypt', 'decrypt'],
    );
}

export async function encrypt(key: CryptoKey, plaintext: string): Promise<{ iv: string; ct: string }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
    return { iv: bufToB64(iv.buffer), ct: bufToB64(ct) };
}

export async function decrypt(key: CryptoKey, ivB64: string, ctB64: string): Promise<string> {
    // Throws OperationError on a wrong key/passphrase or tampered data.
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(ivB64) }, key, b64ToBytes(ctB64));
    return dec.decode(pt);
}
