// Deep-imports a dockview-core internal on purpose. `ENTERPRISE_MODULE_NAMES`
// is not part of core's public API — core holds it only to word its own
// missing-module messages — and widening the published surface just to make it
// testable would be a worse trade than this one test-only reach. Specs are
// excluded from the tsc build (see tsconfig `exclude`), so this path never
// ships.
import { ENTERPRISE_MODULE_NAMES } from '../../../dockview-core/src/dockview/modules';
import { OPTION_MODULE_RULES } from '../../../dockview-core/src/dockview/optionsModules';
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

/**
 * The second half of the same problem. `OPTION_MODULE_RULES` in core says which
 * option needs which module; it is hand-written, and core cannot derive it —
 * it can't import the modules it might be missing. So an enterprise option can
 * be added with no rule, and it fails *silently*: the free user sets it, nothing
 * happens, nothing is logged. `keyboardNavigation` shipped exactly that way.
 *
 * Each module declares the options that must name it (`DockviewModule.options`)
 * and this pins the declaration to core's table, in both directions.
 *
 * Know what this does *not* buy you: coverage is measured against the
 * declaration, which is itself hand-written. An option added with **neither** a
 * declaration nor a rule passes both tests and stays just as silent. This
 * narrows the manual step to one place — next to the module that knows the
 * answer — rather than eliminating it. Adding an option to a module means adding
 * it to `options` too, and nothing here will remind you.
 */
describe('OPTION_MODULE_RULES covers every gated enterprise option', () => {
    const declared = Modules.flatMap((m) =>
        (m.options ?? []).map((optionKey) => ({
            moduleName: m.moduleName,
            optionKey,
        }))
    );

    const ruled = OPTION_MODULE_RULES.map((r) => ({
        moduleName: r.moduleName,
        optionKey: r.optionKey as string,
    }));

    const key = (p: { moduleName: string; optionKey: string }) =>
        `${p.optionKey} -> ${p.moduleName}`;

    test('every option a module claims has a rule naming that module', () => {
        const ruledKeys = new Set(ruled.map(key));
        const uncovered = declared
            .filter((d) => !ruledKeys.has(key(d)))
            .map(key)
            .sort();

        // If this fails: setting that option on the free package does nothing
        // and says nothing. Add a rule to optionsModules.ts.
        expect(uncovered).toEqual([]);
    });

    test('every rule naming an enterprise module is claimed by it', () => {
        const declaredKeys = new Set(declared.map(key));
        const unclaimed = ruled
            .filter((r) => ENTERPRISE_MODULE_NAMES.has(r.moduleName))
            .filter((r) => !declaredKeys.has(key(r)))
            .map(key)
            .sort();

        // If this fails: core demands a module for an option the module doesn't
        // own — the `dockToEdgeGroups` class of bug, where the wrong module gets
        // named (or a free feature gets billed as paid).
        expect(unclaimed).toEqual([]);
    });
});
