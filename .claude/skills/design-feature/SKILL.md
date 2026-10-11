---
name: design-feature
description: Work out how to fix a dockview problem before touching code. Use this whenever the user reports or pastes a bug, a regression, a GitHub or Linear issue, a behaviour that is wrong in one layout, framework, theme or popout window, a flaky or failing test, or asks why dockview behaves a certain way; trigger on "fix", "broken", "regression", "doesn't work", "wrong when", "used to", "after upgrading". Also use it for small behavioural changes and new options, which it treats the same way: reproduce, find the cause, change the least. Produces a short fix note with the failing test, the root cause, the smallest correct change, the behaviour that must not change, and whether a Playwright spec is needed.
---

# Designing a dockview fix

Most dockview problems live between layers: a size that is right in the grid
and wrong in a floating group, an option that works in React and is ignored
in Angular, a layout that restores differently from how it was saved, a drag
that behaves in jsdom and not in Chrome. The wrong fix patches where the
symptom shows up; the right one restores the invariant that broke, and
changes nothing else. This skill is the thinking before the code.

Read `AGENTS.md` at the repo root and the `AGENTS.md` of the package you
expect to touch. Two of its rules carry the most weight here:

- **A bug fix changes the defect and nothing else.** Not a tidy-up, not a
  nearby improvement, and never a default that other users rely on. Passing
  tests are not permission: the absence of a test for the old behaviour does
  not mean nobody depends on it.
- **The failing test comes first.** A reproduction you can run is the
  definition of the problem; without it you are guessing at both the cause
  and the fix.

And two habits: follow the pattern the surrounding code already uses, and
reach for a Playwright spec when jsdom cannot show the problem.

## Step 1: pin the problem down

From the report (issue, message, failing CI job) write one line each for:

- **Observed** and **expected** behaviour, in dockview terms (panel, group,
  tab, floating, popout, edge group, maximised).
- **Where it shows**: which package, which framework binding, which browser,
  and whether it is also wrong in plain `dockview` without a binding. A bug
  only in one binding is usually plumbing, not engine.
- **Options in play**: copy the `DockviewOptions` from the report. An
  enterprise option that "does nothing" is often a missing module or a wrong
  `OPTION_MODULE_RULES` predicate, not the feature itself.
- **State in play**: created fresh, or restored with `fromJSON`? Saved by an
  older version? Inside a popout? After a drag, a resize, or a theme change?
- **Since when**: a version or commit, if the reporter gives one. Compare
  against `packages/docs/docs/releases/` to see whether the behaviour was a
  deliberate change.

Fill the gaps with a reproduction before theorising: fork the nearest
example under `packages/docs/templates/dockview/` or, faster, go straight to
Step 2. If the report cannot be reproduced at all, the fix note says so and
lists what was tried; do not guess a fix.

## Step 2: reproduce as a failing test

Pick the layer, write the spec, run it, and watch it fail for the reported
reason (not a setup error):

- **Engine behaviour**: a Jest spec driving a real `DockviewComponent` in
  `packages/dockview-core/src/__tests__/...` or, when the behaviour belongs
  to an enterprise module, `packages/dockview-enterprise/src/__tests__/...`
  (where all modules and a licence are preregistered). Put it in the file
  that already covers the area.
- **Binding behaviour**: a spec in the binding's `__tests__` when the engine
  spec passes but the wrapper misbehaves (props not forwarded, renderer
  lifecycle, change detection, slots).
- **Real-browser behaviour**: a Playwright spec under `e2e/tests` when the
  problem depends on measured widths, native drag and drop, pointer capture,
  real focus, or a popout's second document. The jsdom popout mock shares
  the main document, so cross-window bugs cannot be reproduced in Jest.

Name the test for the behaviour, not the issue number. The `test-feature`
skill has the harness recipes (mocks, geometry, popouts, async settling).

## Step 3: find the root cause

Trace from the failing assertion to the invariant that broke. Places that
account for most dockview bugs, with where to look:

- **State lives in two places and disagrees**: model versus service, panel
  versus group, DOM versus model. Look at who owns the state
  (`dockviewPanel.ts`, `dockviewGroupPanelModel.ts`, the feature's service)
  and who else writes it.
- **Event order**: a listener that runs before the state it reads is set.
  `onWill*` events are cancellable and fire before; `onDid*` fire after.
  `strictEventsSequencing.ts` shows the ordering the engine promises.
- **Lifecycle**: a listener or DOM node that outlives its owner, or state not
  pruned on `onDidRemovePanel` / `onDidRemoveGroup`. Leak symptoms show up
  as "works the first time".
- **Serialization**: a field written by `toJSON` but ignored or defaulted by
  `deserializer.ts`, or honoured when the governing option is off.
- **Option plumbing**: key missing from `PROPERTY_KEYS_DOCKVIEW`, no Angular
  `@Input()`, a runtime `updateOptions` the service never listens for, or
  an `OPTION_MODULE_RULES` `when` that does not match how users set it.
- **Module seams**: a code path that assumes the service exists instead of
  going through `this.services.<x>?.`; the free bundle then differs from
  enterprise.
- **Window ownership**: `document` or `window` used directly where a popout
  group's element lives in another document.
- **Geometry**: a value measured at the wrong time (before layout, during a
  transition) or a mocked value in the spec hiding a real-browser difference.
- **Sizing and constraints**: `splitview`, `gridview` and the sash code
  redistribute space on add, remove and resize; check the invariant the
  reporter expected against what the code promises before calling it a bug.

Fix where the invariant breaks, not where the symptom is observed. If the
cause is in a shared primitive (`splitview`, `events`, `lifecycle`,
`droptarget`), expect the fix to affect every consumer and check them.

## Step 4: choose the smallest correct change

- Change the code that broke the invariant and nothing around it. No
  renames, no reformatting, no refactor "while here". Those are separate
  changes with their own review.
- Keep every default. If the only correct fix changes a long-standing
  behaviour (space redistribution on close, tab order, which panel becomes
  active, focus routing), stop: write up both options in the fix note, and
  prefer an opt-in option that leaves the default as it is. The maintainer
  decides.
- Match the surrounding pattern: the same guard style, the same event
  names, the same place for the check. If the neighbouring code solves the
  same problem differently, use its way.
- Fix all the places the invariant is enforced, not one. A clamp added to
  one code path while another path (keyboard, API call, restore) still
  bypasses it is half a fix.
- Comments describe the resulting code, briefly. Not "fixed", not "was",
  not the issue number.

## Step 5: blast radius

Before writing the fix note, check each of these and record the answer, even
when it is "not affected":

- Other callers of the function or event you are changing (`grep` them).
- The four layout kinds: grid, floating, popout, edge group; and maximised.
- The four bindings: does the fix need a binding change, or does the engine
  fix cover them?
- Layouts saved before the fix: do they still load, and load correctly?
- The docs page that describes the behaviour: is it now wrong, or did it
  always describe the intended behaviour the bug violated?
- User-visible behaviour change, even a correct one: a line in the current
  `releases/whats-new/` or `releases/migrating/` page.
- Public exports touched: `yarn gen`.

## Step 6: pin what must not change

For every default or behaviour the fix sits next to, add a spec that asserts
the current behaviour before you change anything. These specs are the
contract that the fix did not widen; they are also what lets the reviewer
accept it quickly.

## When the fix needs new surface

Sometimes the right fix is an option, an API method or an event rather than
a code change behind existing behaviour. Treat it as a small feature:

- New behaviour is opt-in and off by default, typed in core `options.ts`,
  listed in `PROPERTY_KEYS_DOCKVIEW`, with an Angular `@Input()`.
- It lands where the code it extends lives. A knob on a free behaviour is
  free; a knob on an enterprise module goes in that module. Genuinely new
  paid functionality is a maintainer decision, not yours: list it as an open
  question.
- `references/feature-footprint.md` is the full layer-by-layer list (option,
  contract, module rules, exports, serialization, bindings, docs page, four
  template variants, release notes) for the rarer case where the change is a
  real feature. Use it as the checklist; do not reach for it for a bug fix.

## Output: the fix note

Short, one line per bullet, written to the scratchpad or straight into the
reply. Its job is to be checkable, not persuasive.

```
# <Problem, in one line>

## Observed / expected
## Reproduction
Spec path and name; confirmed red for the reported reason. (Or: not reproducible, and what was tried.)
## Root cause
file:line, the invariant that breaks, and why the symptom appears where it does.
## Fix
What changes. What deliberately does not.
## Behaviour that must not change
Defaults nearby, and the pinning specs that guard them.
## Blast radius
Callers, layout kinds, bindings, saved layouts, docs, release note, gen.
## Tests
Unit specs; e2e specs (run locally, not in CI); pinning specs.
## Open questions for the maintainer
Only if a default would change or the fix needs new surface.
```

Then implement in that order: red spec, fix, pinning specs green, and hand
the branch to the `review-feature` skill before opening a pull request.
