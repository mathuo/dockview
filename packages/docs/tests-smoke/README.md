# Docs live-example smoke tests

Loads every generated live example (`static/templates/**/index.html`) in a real
headless browser, across all four frameworks (React, TypeScript, Vue, Angular),
and asserts each one actually renders.

## Why

Two docs regressions slipped through because nothing exercised the generated
examples end to end:

1. A SystemJS boilerplate pointed at a build output the packages no longer ship,
   so every example 404'd its dockview import at runtime.
2. A `dockview-vue` change made the component render two root nodes, so the theme
   and layout class no longer reached the dock and it painted blank.

Neither is caught by unit tests, and neither is caught by a plain "did the root
element mount" check: in case 2 the root is in the DOM with a non-zero bounding
box, but clipped to zero height by a collapsed parent. So the suite asserts the
signals that actually distinguish a working example:

- the component root mounts, and
- its **visible size after ancestor clipping** is non-zero (catches blank /
  collapsed renders), and
- there are **no module-resolution errors** — a `>= 400` on a package/app module,
  or `is not a function` / `Cannot find module` / `is not defined` /
  `failed to fetch dynamically imported` in the console (catches stale mappings).

## Run

```sh
# build the package bundles the examples load (once)
yarn nx run-many -t build,build:bundle \
    -p dockview-core dockview dockview-react dockview-vue dockview-angular dockview-enterprise

# from packages/docs — regenerates templates against the local bundles, then runs
npm run test:smoke
```

`test:smoke` starts two servers itself (the ESM package server on :1111 and a
static server over `static/`), so no separate `npm start` is needed.

The external framework libraries (SystemJS, TypeScript, React, Vue, Angular) load
from jsdelivr. They are fetched through Node with an on-disk cache
(`cdn-mirror.ts`), so each asset is downloaded once per run and the suite also
works behind an HTTPS proxy where the browser cannot reach the CDN directly. Set
`DOCKVIEW_SMOKE_CDN_CACHE` to pin the cache directory.

## Known-skipped examples

A few examples are skipped with a reason (see `KNOWN_ISSUES` in `smoke.spec.ts`):
pre-existing example-source issues (a namespace React import that breaks the UMD
interop; an Angular `NG0202` decorator-metadata loss in the in-browser
transpiler) that are unrelated to what this suite guards and are tracked
separately. The `demo-dockview` template is the special `/demo` example and is
covered elsewhere.
