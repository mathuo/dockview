// Deep-imports a dockview-core internal on purpose. `ENTERPRISE_MODULE_NAMES`
// is not part of core's public API — core holds it only to word its own
// missing-module messages — and widening the published surface just to make it
// testable would be a worse trade than this one test-only reach. Specs are
// excluded from the tsc build (see tsconfig `exclude`), so this path never
// ships.
import { ENTERPRISE_MODULE_NAMES } from '../../../dockview-core/src/dockview/modules';
import { Modules } from '../index';

/**
 * `dockview-core` mirrors the enterprise module names so a missing-module error
 * can say "this ships in dockview-enterprise, here's how to install it". Core
 * can't import this package to derive that list (the whole point of the split),
 * so the mirror is hand-maintained and can silently drift.
 *
 * Drift is not a cosmetic problem: an enterprise module missing from the set
 * degrades its error from "npm install dockview-enterprise" to a bare "not
 * registered", which is exactly the uninformative failure the message exists to
 * prevent — and it would only surface to a user who doesn't have the package.
 * This test is the only thing holding the two in sync.
 */
describe('ENTERPRISE_MODULE_NAMES mirrors dockview-enterprise', () => {
    const shipped = Modules.map((m) => m.moduleName);

    test('every module this package registers is named in core', () => {
        const missing = shipped
            .filter((name) => !ENTERPRISE_MODULE_NAMES.has(name))
            .sort();

        // If this fails: add the names to ENTERPRISE_MODULE_NAMES in
        // dockview-core/src/dockview/modules.ts.
        expect(missing).toEqual([]);
    });

    test('core names no module this package no longer ships', () => {
        const shippedNames = new Set(shipped);
        const stale = [...ENTERPRISE_MODULE_NAMES]
            .filter((name) => !shippedNames.has(name))
            .sort();

        // If this fails: a module was renamed or moved to core (free), and
        // ENTERPRISE_MODULE_NAMES still claims it's paid — users would be told
        // to install a package they don't need.
        expect(stale).toEqual([]);
    });
});
