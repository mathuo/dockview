# Issue #1066 — How to use setSize() or initialWidth in dockview-core / Examples are broken

- URL: https://github.com/mathuo/dockview/issues/1066
- Filed against version: unspecified (filed early 2026)
- Investigated: 2026-05-16
- Investigated by: Claude (Opus 4.7, 1M ctx)

## Summary

The reporter (and a follow-up commenter, @kyletully) say:

1. The example at https://dockview.dev/docs/core/panels/resizing is broken
   for non-React users; they want a plain-JS example showing
   `initialWidth` / `initialHeight` or `panel.group.api.setSize()` in action.
2. Setting `initialWidth` / `initialHeight` on `addPanel({...})` "never works".
3. Calling `panel.group.api.setSize()` from the initial-mount lifecycle does
   nothing, but does work once deferred (RAF / `setTimeout(..., 1)`).

This is really three sub-claims tangled together.

## Reproduces on master?

**Mixed. Splitting them out:**

- **(1) Vanilla example is missing — CONFIRMED.** The `/templates/dockview/resize/`
  directory ships only `react/` and `vue/` subfolders. There is no
  `typescript/` (vanilla JS) template. The Code Runner iframe URL is
  `/templates/${id}/${frameworkName}/index.html` and maps JavaScript →
  `typescript`. So when a user selects "JavaScript" on the docs Framework
  toggle for `/docs/core/panels/resizing`, the iframe loads a 404. The
  docs page also lacks any inline plain-JS snippet — only the React-shaped
  `props.api.setSize(...)` example is shown. **This is the "examples are
  broken" the reporter is complaining about, and it is a real docs gap.**

- **(2) `initialWidth` / `initialHeight` ignored on the first panel —
  CONFIRMED, behaviour-as-coded.** `DockviewComponent.addPanel` only forwards
  `initial.width` / `initial.height` to the new group's size in the branches
  that split off from an existing sibling (lines 2285-2288 for `direction`,
  2354-2360 for `relativeLocation`, 2395-2401 for the "no active group" path).
  In every case the value is fed to either `createGroupAtLocation(loc, size)`
  or `referenceGroup.api.setSize({...})`. None of those have any effect when
  there is only one group/view in the gridview because:
   - For a single view the splitview gives it 100% of the orthogonal axis;
     `Sizing.Distribute` and any explicit `size` collapse to the same result.
   - `setSize` fires `_onDidSizeChange` → `gridviewPanel._onDidChange` →
     `splitview.onDidChange()`, which pins the firing view's size and
     redistributes the *remaining* space across the *other* views. With zero
     other views there is nothing to redistribute against.

  So the first `addPanel({ initialWidth: 100 })` on a fresh dock will always
  produce a panel at full container width. Subsequent splits do honour
  `initialWidth` because there's a sibling to take/give space. This matches
  the reporter's experience word-for-word.

- **(3) `setSize` "doesn't work from initial mount" — NOT A CORE BUG.**
  `DockviewReact` calls `api.layout(clientWidth, clientHeight)` immediately
  before `onReady`, so by the time the user's `onReady` callback runs the
  layout has dimensions. However @kyletully is calling `setSize` from a
  StimulusJS `connect` (component-mount) hook — which can fire before the
  container element has been measured by the browser (zero clientWidth/Height
  is common inside flex/grid parents mid-mount). When the dock has 0×0
  dimensions, `setSize` runs through `splitview.onDidChange` against a 0-size
  axis and clamps to 0. After a RAF/timeout the parent has measured itself
  and `setSize` clamps against the real size. That's an integration issue,
  not a bug in dockview, but it's worth surfacing in the docs.

## Relevant code

- **`setSize` plumbing**:
  - `packages/dockview-core/src/api/gridviewPanelApi.ts:65-67` —
    `setSize` just fires `_onDidSizeChange`.
  - `packages/dockview-core/src/gridview/gridviewPanel.ts:239-244` —
    converts that into `_onDidChange` on the gridview node.
  - `packages/dockview-core/src/splitview/splitview.ts:357-385` —
    `onDidChange` handler that actually resizes. Branches on the firing
    item, pins its size, redistributes everyone else.
  - `packages/dockview-core/src/api/dockviewGroupPanelApi.ts:119-125` —
    `DockviewGroupPanelApiImpl.setSize` stores a pending size and applies
    immediately; pending size is re-applied on `onDidVisibilityChange` so
    that hidden groups remember the request. **No pending-size queue for
    "before-layout" or "before-siblings".**

- **`initialWidth` / `initialHeight` handling**:
  - Types: `packages/dockview-core/src/dockview/options.ts:389-390`
    (`AddPanelOptions`), `dockview/dockviewGroupPanelModel.ts:76-77`.
  - Application points in `dockview/dockviewComponent.ts`:
    - line 2234-2237 — destructured into `initial`.
    - lines 2285-2288 — fresh "orthogonalize" group branch.
    - lines 2339-2342 — referenceGroup is floating/edge/center.
    - lines 2354-2360 — splitting an existing group orientation-aware.
    - lines 2395-2401 — empty dock / no `activeGroup` branch.
    - lines 2540-2545 — `addGroup` uses `initialWidth`/`Height` analogously.

- **Docs page + missing template**:
  - `packages/docs/docs/core/panels/resizing.mdx` — only React-shaped
    `props.api.setSize` snippet; embeds `<CodeRunner id="dockview/resize"/>`.
  - `packages/docs/templates/dockview/resize/` — only `react/` and `vue/`.
    A `typescript/` sibling is required for the JS framework toggle to load.
  - `packages/docs/docs/core/panels/add.mdx:224-235` — also documents
    `initialWidth`/`initialHeight` with the same React shape and the caveat
    "the dock will make a best attempt … but it may not always be possible".
    The reporter likely landed here too.

## Recent commits that may have touched this

- `git log --grep='setSize\|initialWidth\|initialHeight'` (whole history):
  - `638beb4e8` — "Preserve group size when setting visibility to false
    (issue #1050)". This added the pending-size cache in
    `DockviewGroupPanelApiImpl` (lines 109-115, 119-125). It does NOT
    queue setSize calls made before the panel has siblings — only across
    visibility transitions.
  - `debdcb8d8` / merge `fe5a88263` — original `panel.api.setSize` →
    `group.api.setSize` link (2022).
  - `38dd08755` — docs vertical-split + variant toggle (unrelated to JS
    template for `resize`).
- `git log -- packages/docs/templates/dockview/resize/` only shows the
  Vue3 / multi-framework re-organisation commits (`b0d98102f`, `bc278f2be`,
  `7eff1da98`, `b0e4c6d92`, `7ccc0b543`). **No typescript template was
  ever added** — this is a pre-existing docs gap, not a regression.
- No commit since the issue was filed (Jan 2026) addresses single-group
  `initialWidth` or adds a vanilla resize template.

## Verdict

**CONFIRMED_BUG (documentation gap + behavioural surprise).**

Concretely:

- The Code Runner for `core/panels/resizing` 404s when the framework
  selector is on JavaScript, because `packages/docs/templates/dockview/resize/`
  has no `typescript/` variant. The MDX page also has no inline plain-JS
  snippet. This is the "examples are broken" claim, and it is real.
- `initialWidth` / `initialHeight` silently no-op on the first panel of an
  empty dock. The behaviour is internally consistent (`setSize` on a
  single-view splitview can't do anything) but the docs don't say so, and
  every user trying the canonical "add three panels, give the first one a
  fixed width" pattern hits it. This is the "never works no matter what I
  try" claim.
- The "setSize during component mount does nothing" sub-claim is a
  consequence of dockview being mounted into a zero-sized container in the
  reporter's host framework; not a core bug, but the docs should warn that
  `setSize` is silently bounded by the current container size.

## Notes / fix sketch

Three independent fixes, in increasing order of complexity:

1. **Add the missing vanilla template** (low risk, highest user impact):
   Mirror `packages/docs/templates/dockview/resize/react` into
   `packages/docs/templates/dockview/resize/typescript`, using
   `dockview-core`'s vanilla API (`createDockview`, `event.api.addPanel`,
   panel renderer using `setSize` from a button click). Re-run
   `build-templates`. The Code Runner iframe will then load for the
   JavaScript framework toggle and the reporter has the example they asked
   for. While at it, scan the other template directories listed in the
   investigation (`constraints`, `demo-dockview`, `dnd-events`, `dnd-external`,
   `edge-groups`, `floating-groups`, `group-actions`, `layout`, `nested`,
   `popout-group`, `render-mode`, `resize`, `resize-container`) for the
   same gap — most are React+Vue only.

2. **Tighten the docs** (low risk):
   - In `core/panels/add.mdx` next to the `initialWidth` block, spell out
     "if this is the only panel in the dock, `initialWidth` has no effect
     because the panel takes the full container width; the value is only
     consulted when the panel is split off a sibling." Same caveat in
     `core/panels/resizing.mdx`.
   - In `resizing.mdx`, add a plain-JS snippet next to the React one and
     warn that `setSize` is clamped to the current `width`/`height` of the
     dock element, so calling it before the host container has been
     measured will be a no-op.

3. **Optional behavioural change (medium risk)**:
   If we want `initialWidth` to "just work" on the first panel, the gridview
   could honour the value when there are zero siblings by interpreting it as
   the *fixed* size of the root view, and treating the remaining space as
   "reserved for future siblings". That has knock-on effects on the watermark
   path and on layouts that legitimately want the single view to fill the
   container, so it would need a flag (e.g. `reserveInitialSize: true`) or
   a major version note. **Not recommended for #1066 alone**; the
   docs+vanilla-example route satisfies the reporter's actual ask.
