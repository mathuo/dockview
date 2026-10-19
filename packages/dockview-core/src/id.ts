/**
 * A random, RFC 4122 version 4 formatted id, with no dependencies.
 *
 * Uses `crypto.randomUUID` where the platform offers it, which needs a secure
 * context, and otherwise fills 16 random bytes from `crypto.getRandomValues`,
 * falling back to `Math.random` where no `crypto` exists at all. The fallbacks
 * matter in practice: a custom-scheme origin such as `tauri://localhost` is
 * not always a secure context, so `randomUUID` can be absent there.
 *
 * Intended for consumers that need ids unique across dockview instances, for
 * example as a `groupIdGenerator` or to name panels that move between
 * windows, where the default sequential group ids would collide.
 */
export function generateId(): string {
    const crypto = globalThis.crypto;

    if (typeof crypto?.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    const bytes = new Uint8Array(16);

    if (typeof crypto?.getRandomValues === 'function') {
        crypto.getRandomValues(bytes);
    } else {
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = Math.floor(Math.random() * 256);
        }
    }

    // Version 4, RFC 4122 variant.
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (byte) =>
        byte.toString(16).padStart(2, '0')
    ).join('');

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
