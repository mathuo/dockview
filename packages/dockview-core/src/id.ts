/**
 * A random id in RFC 4122 version 4 (uuid) form, from the platform's Web
 * Crypto and nothing else.
 *
 * `crypto.randomUUID` is used where the platform offers it. It is only
 * defined in a secure context, and a custom-scheme origin such as
 * `tauri://localhost` is not always one, so elsewhere the id is built from
 * 16 bytes of `crypto.getRandomValues`, which every browser and webview
 * provides. Without Web Crypto at all the call throws, since no id would be
 * worth having in that case.
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

    if (typeof crypto?.getRandomValues !== 'function') {
        throw new Error(
            'dockview: generateId requires crypto.getRandomValues or crypto.randomUUID'
        );
    }

    const bytes = crypto.getRandomValues(new Uint8Array(16));

    // RFC 4122 section 4.4: mark the id as version 4 (random) in the high
    // bits of byte 6, and as the RFC variant in the high bits of byte 8.
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (byte) =>
        byte.toString(16).padStart(2, '0')
    ).join('');

    // Group as 8-4-4-4-12 so the result reads the same as `randomUUID()`.
    return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20),
    ].join('-');
}
