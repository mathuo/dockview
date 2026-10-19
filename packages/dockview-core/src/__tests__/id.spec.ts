import { generateId } from '../id';

const UUID_V4 =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/**
 * Swap `globalThis.crypto` for the duration of a test. The property is a
 * getter on the global in Node, so it is redefined rather than assigned.
 */
function withCrypto(value: unknown, fn: () => void): void {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    Object.defineProperty(globalThis, 'crypto', {
        value,
        configurable: true,
        writable: true,
    });
    try {
        fn();
    } finally {
        if (descriptor) {
            Object.defineProperty(globalThis, 'crypto', descriptor);
        } else {
            delete (globalThis as { crypto?: unknown }).crypto;
        }
    }
}

describe('generateId', () => {
    test('is a version 4, RFC 4122 variant uuid', () => {
        expect(generateId()).toMatch(UUID_V4);
    });

    test('does not repeat', () => {
        const ids = new Set<string>();
        for (let i = 0; i < 1000; i++) {
            ids.add(generateId());
        }
        expect(ids.size).toBe(1000);
    });

    test('uses crypto.randomUUID when the platform offers it', () => {
        const randomUUID = jest
            .fn()
            .mockReturnValue('11111111-2222-4333-8444-555555555555');

        withCrypto({ randomUUID }, () => {
            expect(generateId()).toBe('11111111-2222-4333-8444-555555555555');
        });

        expect(randomUUID).toHaveBeenCalledTimes(1);
    });

    test('falls back to crypto.getRandomValues without randomUUID', () => {
        const getRandomValues = jest.fn((bytes: Uint8Array) => {
            bytes.fill(0xff);
            return bytes;
        });

        withCrypto({ getRandomValues }, () => {
            // All-ones bytes, with the version and variant bits forced.
            expect(generateId()).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
        });

        expect(getRandomValues).toHaveBeenCalledTimes(1);
    });

    test('falls back to Math.random without crypto at all', () => {
        const random = jest.spyOn(Math, 'random').mockReturnValue(0);

        withCrypto(undefined, () => {
            expect(generateId()).toBe('00000000-0000-4000-8000-000000000000');
        });

        expect(random).toHaveBeenCalledTimes(16);
        random.mockRestore();
    });
});
