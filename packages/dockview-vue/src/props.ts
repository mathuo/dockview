/**
 * `withDefaults` entry that disables Vue's Boolean casting for the core
 * options: Vue casts an absent `Boolean` prop to `false` unless its
 * declaration has an own `default` key, and `false` would override
 * dockview-core's own defaults. A default of `undefined` keeps an omitted
 * option `undefined` so core's default applies.
 *
 * Typed as `object` so `withDefaults` does not fold the keys into the
 * component's public prop types, where Vue mistypes the union-valued options.
 */
export function undefinedDefaults(keys: readonly string[]): object {
    return Object.fromEntries(keys.map((key) => [key, undefined]));
}
