/**
 * License key validation — pure, dependency-free, synchronous.
 *
 * This is a re-implementation of the issuer's scheme
 * (`dockview-licencing/src/lib/{checksum,licence}.ts`) so `dockview-enterprise`
 * can verify a key entirely offline. It MUST stay byte-compatible with the
 * issuer — the cross-repo golden fixture in the spec (a real minted key) is
 * the guard against drift.
 *
 * The checksum is an FNV-1a integrity guard, NOT a signature: the whole scheme
 * is public and forgeable by design. The watermark is the enforcement, not the
 * key. See `enterprise-modules/license.md`.
 */

export type LicenseState =
    | 'valid' // within [ValidFrom, ValidUntil]
    | 'expired' // past ValidUntil — no longer licensed, watermarked
    | 'invalid' // checksum mismatch / malformed / corrupt
    | 'missing'; // no key supplied

export interface ParsedLicense {
    keyId: string;
    company: string;
    plan: string;
    appName: string;
    email: string;
    validFrom: Date | null;
    validUntil: Date | null;
    /** Every `[Key:Value]` segment, verbatim (post-sanitisation). */
    fields: Record<string, string>;
}

const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];

/**
 * UTF-8 encode a string to bytes without `TextEncoder` — so the checksum is
 * identical in every environment (browser, Node, and jsdom, which lacks
 * `TextEncoder`). Produces the same bytes the issuer's `TextEncoder` does.
 */
function* utf8Bytes(str: string): Generator<number> {
    for (let i = 0; i < str.length; i++) {
        let code = str.charCodeAt(i);
        if (code < 0x80) {
            yield code;
        } else if (code < 0x800) {
            yield 0xc0 | (code >> 6);
            yield 0x80 | (code & 0x3f);
        } else if (code >= 0xd800 && code <= 0xdbff) {
            // High surrogate — combine with the following low surrogate.
            const lo = str.charCodeAt(++i);
            code = 0x10000 + ((code - 0xd800) << 10) + (lo - 0xdc00);
            yield 0xf0 | (code >> 18);
            yield 0x80 | ((code >> 12) & 0x3f);
            yield 0x80 | ((code >> 6) & 0x3f);
            yield 0x80 | (code & 0x3f);
        } else {
            yield 0xe0 | (code >> 12);
            yield 0x80 | ((code >> 6) & 0x3f);
            yield 0x80 | (code & 0x3f);
        }
    }
}

/**
 * FNV-1a 64-bit, 16 lowercase hex chars. Byte-identical to the issuer's
 * `licenceChecksum` (which uses BigInt) — but computed here with two 32-bit
 * halves because this package targets < ES2020, where BigInt literals are
 * unavailable. Empty input returns the offset basis ("cbf29ce484222325").
 *
 * Prime 0x100000001b3 = (0x100 << 32) | 0x1b3. All intermediate products stay
 * below 2^53, so `Number` arithmetic is exact and the result matches BigInt.
 */
export function fnv1a(input: string): string {
    const P_HI = 0x100; // prime high word (256)
    const P_LO = 0x1b3; // prime low word (435)
    let hi = 0xcbf29ce4; // offset basis, high 32 bits
    let lo = 0x84222325; // offset basis, low 32 bits
    for (const b of utf8Bytes(input)) {
        lo = (lo ^ b) >>> 0; // FNV-1a XORs the byte into the low word
        // (hi:lo) * prime, keeping the low 64 bits.
        const loFull = lo * P_LO;
        const carry = Math.floor(loFull / 0x100000000);
        const nextLo = loFull >>> 0;
        const nextHi = (hi * P_LO + lo * P_HI + carry) >>> 0;
        hi = nextHi;
        lo = nextLo;
    }
    return hi.toString(16).padStart(8, '0') + lo.toString(16).padStart(8, '0');
}

/**
 * Strip characters that get accidentally pasted with a key (zero-width marks,
 * BOM, CR/LF) and trim — the noise that sneaks in when a key is copied from a
 * PDF or email.
 */
function cleanKey(key: string): string {
    // CR, LF, zero-width space/non-joiner/joiner (U+200B–200D), BOM (U+FEFF).
    return key.replace(/\r|\n|\u200B|\u200C|\u200D|\uFEFF/g, '').trim();
}

/** Parse `DD_MMM_YYYY` (UTC) → Date, rejecting impossible dates (e.g. 31_Feb). */
function parseLicenseDate(value: string): Date | null {
    const m = /^(\d{2})_([A-Za-z]{3})_(\d{4})$/.exec(value);
    if (!m) {
        return null;
    }
    const day = Number(m[1]);
    const month = MONTHS.indexOf(m[2]);
    const year = Number(m[3]);
    if (month === -1) {
        return null;
    }
    const date = new Date(Date.UTC(year, month, day));
    // Reject overflow (e.g. 31_Feb rolling into March).
    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month ||
        date.getUTCDate() !== day
    ) {
        return null;
    }
    return date;
}

/**
 * Parse + integrity-check a key. Returns the parsed license, or `null` if the
 * key is malformed, truncated, or its checksum doesn't match the body.
 */
export function parseLicenseKey(key: string): ParsedLicense | null {
    const cleaned = cleanKey(key);
    // Body and checksum are separated by the `__` delimiter; split on the LAST
    // one so a `_`-containing body can't be confused with the delimiter.
    const idx = cleaned.lastIndexOf('__');
    if (idx === -1) {
        return null;
    }
    const body = cleaned.slice(0, idx);
    const checksum = cleaned.slice(idx + 2);
    if (!/^[0-9a-f]{16}$/.test(checksum) || fnv1a(body) !== checksum) {
        return null;
    }

    const fields: Record<string, string> = {};
    // Keys are simple tokens (no `:`/`]`); a value is bracket-free but may
    // contain `_` (spaces were encoded to `_` at mint time).
    for (const match of body.matchAll(/\[([A-Za-z]+):([^\]]*)\]/g)) {
        fields[match[1]] = match[2];
    }

    return {
        keyId: fields.KeyId ?? '',
        company: fields.Company ?? '',
        plan: fields.Plan ?? '',
        appName: fields.AppName ?? '',
        email: fields.Email ?? '',
        validFrom: fields.ValidFrom ? parseLicenseDate(fields.ValidFrom) : null,
        validUntil: fields.ValidUntil
            ? parseLicenseDate(fields.ValidUntil)
            : null,
        fields,
    };
}

/**
 * Validate a key against the running dockview build's `releaseDate` (injected,
 * so the result is deterministic and testable; the service passes the baked-in
 * `DOCKVIEW_RELEASE_DATE`).
 *
 * Enforcement is VERSION-based, not wall-clock: a key covers every dockview
 * version released on or before its `ValidUntil` date. If this build was
 * released after `ValidUntil` the key is `expired` (watermarked); otherwise it
 * is `valid` — so a deployed app on a covered version keeps working forever,
 * and only upgrading to a build past the license window trips the watermark. A
 * build released before `ValidFrom` is treated leniently as `valid`.
 */
export function validateLicense(
    key: string | undefined,
    releaseDate: Date
): LicenseState {
    if (!key || !cleanKey(key)) {
        return 'missing';
    }
    const parsed = parseLicenseKey(key);
    if (!parsed || !parsed.validUntil) {
        return 'invalid';
    }
    // Compare at UTC-date granularity (keys carry dates, not times): a build
    // released on the ValidUntil day is still covered.
    const release = Date.UTC(
        releaseDate.getUTCFullYear(),
        releaseDate.getUTCMonth(),
        releaseDate.getUTCDate()
    );
    if (release > parsed.validUntil.getTime()) {
        return 'expired';
    }
    return 'valid';
}

/** Whether a state means "licensed" (no watermark). */
export function isValidLicense(state: LicenseState): boolean {
    return state === 'valid';
}
