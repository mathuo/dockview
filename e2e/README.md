# End-to-end (cross-window) tests

Playwright tests that run dockview in a **real browser**. They exist for the
behaviour the jsdom unit tests cannot reach: anything spanning more than one
`document` — popout windows, cross-window focus routing, per-window listeners
and per-window live regions. (The unit-test `setupMockWindow` mock reuses the
main document, so a popout there is not a genuine second window.)

## Layout

- `fixtures/index.html` — loads the built UMD bundles, creates a
  `DockviewComponent` with `keyboardNavigation` enabled, and exposes a small
  `window.__dv` handle (`addPanel`, `popoutActiveGroup`, `groupCount`).
- `fixtures/popout.html` — the served target a popout window navigates to
  before dockview injects the group (avoids an `about:blank` 404).
- `tests/` — the specs.

## Running

The fixture loads the UMD bundles from `dist/`, so build them first:

```bash
yarn nx run-many -t build:bundle -p dockview-core dockview-enterprise
yarn playwright install chromium   # first time only
yarn test:e2e
```

The Playwright config starts a zero-dependency static server
(`python3 -m http.server 4321`) over the repo root; no extra tooling needed.

## Adding cross-window tests

Drive the layout through `window.__dv` (or add to it), capture the popout with
`context.waitForEvent('page')`, and assert against the popout `Page`. This is
the harness the popout focus / live-region work builds on.
