---
name: review-feature
description: Review a dockview branch, diff or pull request against this repo's own rules, iterating until a full pass finds nothing new. Run it before opening any pull request on this repo, without being asked, and whenever the user says "review", "self-review", "check this before I push", "is this ready", "look over my changes", or a PR event (CI failure, review comment, Sonar finding) arrives. It covers correctness, preserved defaults, the module and option plumbing, framework parity, serialization compatibility, docs rules, Sonar smells, generated files and test coverage, and it fixes what it finds on a branch you own.
---

# Reviewing a dockview change

A review here is not one read of the diff. It is a loop: read, run, fix,
re-read, until a complete pass over the current diff turns up nothing. One
pass always misses something, because fixing a finding changes the diff, and
because the first read is anchored on what the author meant rather than what
the code does. Stop only when the last full pass had no findings and every
check below is green.

This skill runs before every pull request is opened on this repo, on the
author's own branch, and again on each CI or review event. On a branch you
own, fix findings; on someone else's branch, report them (see Output).

## The loop

```
1. Scope      what changed, what kind of change, what it claims
2. Read       the diff against the checklist, note every finding with a file:line
3. Run        lint, format, gen, the affected test projects, build if types changed
4. Fix        findings and failures on your own branch; re-run step 3
5. Re-read    the *new* diff from scratch (not just the fixed hunks)
6. Repeat     from 2 until a pass produces zero findings and step 3 is green
7. Report     verdict, what was fixed, what remains and why
```

Each pass reads the whole current diff, not only the parts you touched in
the previous fix. A fix for one finding regularly introduces the next one
(an unused import, a now-redundant guard, a comment describing the old
behaviour). Two clean passes in a row is the bar when the change is large.

## 1. Scope

```bash
git fetch origin master
git diff --stat origin/master...HEAD
git log --oneline origin/master..HEAD
```

Classify: bug fix, feature, docs, refactor, tooling. Read the linked issue
or design note. Write down, in one line each, what the change claims to do
and which behaviours it must leave untouched. Those lines are what the rest
of the review verifies.

## 2. Read: the checklist

`references/review-checklist.md` is the full list, grouped by layer, with
the file each item points at. The items that block a merge on their own:

**Behaviour**

- A bug fix changes the defect and nothing else. Look for any altered
  default (size redistribution, ordering, focus, overlay timing) that the
  issue did not ask for, even when tests pass. Missing coverage of the old
  behaviour is not permission to change it.
- Every new capability is off by default and opt-in through a typed option.
- The free package behaves identically with the module absent: every call
  into a service goes through `?.`, and "service missing" equals "option
  disabled".

**Plumbing**

- New option key: in `PROPERTY_KEYS_DOCKVIEW`, with an Angular `@Input()`;
  enterprise options also in `OPTION_MODULE_RULES`, the module's `options`,
  `ENTERPRISE_MODULE_NAMES`, and the enterprise `Modules` array.
- New public symbol: exported from `packages/dockview-core/src/index.ts`
  and `__generated__/dockview-core-exports.txt` regenerated.
- Serialized fields are optional on read, so pre-feature layouts load, and
  state saved with a feature on restores sanely with it off.
- Disposables: new emitters, listeners and DOM are owned by a
  `CompositeDisposable` or returned from the module's `init`; per-panel
  bookkeeping is pruned on remove.
- Anything touching `document` or `window` resolves the group's owning
  window so popouts keep working.
- Enterprise code imports from `dockview`, never `dockview-core` or `dist/`.

**Code quality (Sonar reports "new issues: 0" or the PR is not ready)**

- No redundant `?? {}` / `|| {}` in spreads, unused symbols, needless casts,
  `as any` where `fromPartial` fits, cognitive-complexity spikes, duplicated
  blocks that a helper already covers.
- Comments describe the current code, not the change ("was", "now", "fixed
  in", PR numbers). Brief.
- The change follows the pattern of its nearest neighbour (same option
  shape, host/service split, event naming, class naming). A second way of
  doing something the repo already does is a finding.

**Tests**

- Bug fix: a spec that fails without the fix exists and is named for the
  behaviour, not the issue number.
- Feature: off-by-default, opt-in, gating, runtime update, round trip and
  disposal specs as the `test-feature` skill lists.
- Behaviour that only a real browser can show (measured widths, native
  drop, second document) has an e2e spec, and the PR says it ran locally.
- The whole affected project passes, not just the new file.

**Docs and public surface**

- Public prose (README, docs site, release notes, package READMEs) never
  names `dockview-core`, modules or `registerModules`, never lists the
  enterprise features inline, never describes the unlicensed watermark.
  British spelling, no em dashes, no filler words (`packages/docs/AGENTS.md`).
- A feature page has all four template variants, with `LicenseManager`
  boilerplate only when the feature is enterprise; the example is registered
  in `examples.tsx`; licence table and whats-new updated.
- TypeDoc comments exist on every new public option, method and event
  (`<DocRef>` renders them).
- The PR body follows `.github/pull_request_template.md`: type, affected
  packages, how to test, checklist.

## 3. Run

Run what CI runs, locally, before claiming anything is green:

```bash
yarn lint
yarn format:check          # docs package is excluded on purpose; do not format it
yarn gen:check             # or: yarn gen && git diff --exit-code __generated__/
npx jest --selectProjects dockview-core dockview-enterprise    # plus react/angular if touched
cd packages/dockview-vue && npx vitest run                     # if core or vue touched
npx nx run dockview-core:build:cjs                             # if public types changed
```

For a PR number, pull the real Sonar findings rather than trusting the
summary comment, which can lag a commit:

```
https://sonarcloud.io/api/issues/search?componentKeys=dockview_dockview&pullRequest=<PR>&issueStatuses=OPEN,CONFIRMED&resolved=false
```

A red CI job, a failing spec, or a stale generated file is a finding in
its own right; do not report a verdict while any of them stands.

## 4. Fix, then 5. re-read

On a branch you own, fix every finding in the same pass rather than listing
it for later: the point of reviewing before the PR is that the PR arrives
clean. Keep each fix to what the finding needs; widening the change
mid-review creates new review surface. After fixing, re-run step 3 and then
start the next pass from the top of the diff.

Findings you deliberately leave (a pre-existing issue outside the diff, a
default change that needs the maintainer's call) are recorded in the report
with the reason, not dropped.

On a branch you do not own, do not push. Report with enough context for the
author to act without re-deriving it.

## 7. Output

```
## Verdict
Ready / Not ready (one line why)

## Passes
N passes; last pass found nothing new. Checks run: lint, format, gen, jest(core, enterprise), vitest(vue), e2e(<specs>)

## Fixed in this review
- file:line — what and why (cite the rule)

## Open findings
Blocking:
- file:line — defect, the realistic path to it, the fix
Should fix:
- ...
Nits (optional):
- ...

## Deliberately left
- file:line — why (out of scope / needs maintainer / pre-existing)

## Verified and fine
Short list of the risky areas checked that need no action, so the reader
knows they were looked at (defaults preserved, round trip, disposal, Angular input, gen).
```

Rank findings by consequence to a user of the library, not by how easy they
are to spot. Every finding names a file and line and quotes the rule or
the failure path; "consider" without a reason is not a finding. Do not flag
what the formatter owns, docs formatting, or style outside the diff.
