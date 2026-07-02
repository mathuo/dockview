/**
 * The UTC publish date of this dockview build — the single value that dates the
 * build for license validation.
 *
 * License enforcement is version-based: a key covers every dockview version
 * released on or before its `ValidUntil` date, so a deployed app on a covered
 * version never watermarks over time; only running a build published AFTER the
 * license window does. `validateLicense` compares this against the key's
 * `ValidUntil`.
 *
 * Stamped at BUILD time: the placeholder in `RAW` below is replaced with the
 * build date by the rollup bundle step (which produces the published
 * `main`/`module` entry). In dev, tests, or a raw non-bundle consumer it is left
 * untouched and we fall back to the current date — those paths never validate a
 * production license (tests inject their own date).
 */
const RAW = '__DOCKVIEW_RELEASE_DATE__';

const ISO = /^\d{4}-\d{2}-\d{2}$/.test(RAW)
    ? RAW
    : new Date().toISOString().slice(0, 10);

export const DOCKVIEW_RELEASE_DATE = new Date(`${ISO}T00:00:00.000Z`);
