# Dockview Enterprise Features Analysis

*Research date: 2026-07-10. Sources: full codebase review (v7.0.2), the dockview.dev site, the
mathuo/dockview issue tracker, and a survey of open-source and commercial docking/layout
competitors plus open-core peers (AG Grid, MUI X, FullCalendar, Tiptap, Handsontable).*

---

## 1. Where the project stands today

**Adoption.** ~600k monthly npm downloads at the `dockview-core` level (583k core / 460k
`dockview` / 221k `dockview-react` / 23k `dockview-vue` / 3k `dockview-angular`, 30 days to
2026-07-08). ~3.3k GitHub stars, 10 releases Mar–Jun 2026, single maintainer, MIT.

**Monetization.** None yet — no pricing page, no sponsors, no paid tier. But the groundwork is
visibly laid: LinkedIn company page, newsletter, contact page, npm provenance/verified builds,
SonarCloud gates, and — most importantly — the v7 architecture.

**The v7 architecture is a ready-made enterprise seam.** The module system
(`registerModules()`, `defineModule()`, `ServiceCollection`, `assertModule()` with graceful
degradation) is explicitly modeled on AG Grid's community/enterprise registry. Separable
features already live in `dockview-modules` (TabGroupChips, ContextMenu, AdvancedDnD,
Accessibility), `KeyboardDockingModule` is deliberately held out of the default bundle, and
core comments reserve a per-component `modules` option "for a future version." No license-key
or gating code exists today; the registry is the purpose-built place to add it.

**Competitive position.** Dockview is arguably the most feature-complete *dedicated* web
docking library, free or paid. Open-source rivals are stagnant (GoldenLayout legacy, rc-dock
single-maintainer, FlexLayout niche) and no commercial vendor sells a standalone web docking
library — docking is always buried inside a $750–$1,400/dev/yr suite (Infragistics, Telerik,
DevExpress, Syncfusion). That leaves a genuinely open lane: **the AG Grid of layout managers**.

---

## 2. What competitors gate — and what enterprise buyers actually pay for

From the open-core peers:

| Peer | Free tier | Paid tier | Price point |
|---|---|---|---|
| AG Grid | Full production grid, ARIA, virtualization | Power features (pivot, Excel export, server-side model, tool panels) **+ SLA support** | $999/dev perpetual |
| MUI X | Basic components | Pro: power interactions ($299/yr) · Premium: data-heavy/export ($599/yr) · Enterprise: **pure SLA/CSM** ($1,399/yr, 15-seat min) | — |
| FullCalendar | Full core calendar | Timeline/resource views, print rendering, support tickets | $480 (1–10 seats) |
| Tiptap | MIT editor | Service-backed features only (collab, history, AI) | $49–$999/mo |

Docking features that are **commercial-only or missing from every open-source option** (the
credible enterprise axis):

1. **Auto-hide / pin-to-tray panes** — Infragistics, Telerik, DevExpress, Syncfusion all have
   it; no open-source web docking library does.
2. **Robust multi-window/multi-monitor workspaces** — popout restore on reload, position
   persistence, state sync, re-dock on close. GoldenLayout pioneered it and is now legacy.
3. **Workspace management** — named layouts, versioning/migration, diffing, per-user
   persistence. Everyone (dockview included) stops at "stringify JSON."
4. **Document host / dual-zone model** (VS-style tool panes vs document tabs) — Infragistics
   and DevExpress only.
5. **Accessibility compliance** — vendors sell the VPAT/Section 508/WCAG paperwork as much as
   the feature.
6. **Localization + RTL** — Infragistics ships locale packs; no OSS docking library has RTL.
7. **Theme designer tooling** — Telerik prices ThemeBuilder separately.
8. **Support, SLA, LTS** — the universal gate; MUI X Enterprise is *nothing but* this.

---

## 3. Demand signals from dockview's own tracker

Top open requests (98 open issues; demand is broad, not deep):

- **VS-style pinning/auto-hide** — #765 (top feature request), #1283 pinnable overlay edge groups
- **Proportional/percentage sizing & size preservation** — #814, #590, #708, #634, #974
- **Lifecycle veto events** (`onWillClose`) — #854, #1011
- **Keep-alive / virtualized rendering** — #718, #841
- **Mobile/touch polish** — #930, #696
- **RTL** — #388 (most-discussed after "window manager" #151)
- **Deeper Vue integration** — #908, #897
- **SSR/Next.js** — #659; popout-per-process #1291; VS-style drop indicators #918

Note the overlap: the #1 user request (pin/auto-hide) is also the #1 commercial-only
competitor feature. That is the flagship.

---

## 4. Recommended enterprise features, prioritized

### Tier 1 — flagship paid modules (highest value, clearest willingness-to-pay)

**1. Auto-hide / pinned edge trays (`@dockview/auto-hide`)**
VS/VS Code-style: pin a group to an edge tray, collapse to icon strip, flyover on hover/click,
restore on unpin. *Why:* top user request + the single most conspicuous feature that today
requires a $1,300/yr Infragistics seat. *Foundation already in core:* edge groups
(`edgeGroupService`, collapse/expand, `SerializedEdgeGroups`) are 60% of the way there.

**2. Workspace management suite (`@dockview/workspaces`)**
Named layouts/perspectives, save/restore slots, **layout schema versioning + migration hooks**
(survive app releases that add/remove panels), layout diffing, partial (per-subtree)
serialization, pluggable persistence adapters (localStorage/REST/your backend). *Why:* every
serious IDE-like product builds this by hand on top of `toJSON`; nobody ships it. This is the
"boring, valuable, clearly-work" module enterprises pay for. *Foundation:* serialization +
`onDidLayoutChange` exist; versioning/migration is greenfield.

**3. Layout history: undo/redo (`@dockview/history`)**
Transactional undo/redo of layout mutations, grouped by gesture, with an audit-log event
stream (who/what/when — `'user'` vs `'api'` origin). *Why:* v7 shipped the perfect hooks
(`onWillMutateLayout`/`onDidMutateLayout` with origin tagging) and no docking library has
undo/redo. Cheap to build on the transaction events, high perceived value, demo-able in
10 seconds.

**4. Advanced multi-window workspaces (`@dockview/multi-window`)**
Popout persistence across reloads (reopen popouts with positions), multi-monitor coordinate
persistence, cross-window state sync, graceful re-dock on window close/crash, optional
popout-per-process (#1291). *Why:* GoldenLayout's abandoned signature feature; dockview v7's
nested popout layouts + popout lifecycle events are the base. This is the feature trading/
monitoring/dashboard shops (the classic multi-monitor buyers) will pay for.

### Tier 2 — compliance & scale (what procurement departments require)

**5. Accessibility compliance pack**
Keep basic ARIA/keyboard nav free (AG Grid keeps ARIA free — gating basic a11y is bad optics
and legal poison for customers). Gate the *advanced* layer: `KeyboardDockingModule` (already
held out of the default bundle: spatial focus, Ctrl+M keyboard docking with live preview +
narration) **plus a maintained VPAT / WCAG 2.2 / Section 508 conformance statement and audit
reports**. *Why:* enterprise buyers pay for the paperwork; the module is already built.

**6. Internationalization pack: RTL + locale bundles**
RTL layout mirroring (zero support today — no `dir="rtl"` handling anywhere in core or
theme.scss; issue #388), plus shipped locale packs for the existing `DockviewMessages` a11y/
context-menu catalog (the i18n catalog shipped in v7; only English exists). *Why:* matches
Infragistics' gated i18n; RTL is a hard, cross-cutting feature that OSS won't replicate soon.

**7. Performance at scale (`@dockview/virtual`)**
True keep-alive/virtualized panel rendering beyond `onlyWhenVisible` (#718, #841): tab-strip
virtualization for hundreds of tabs, deferred mount scheduling, memory budgets, perf
instrumentation/metrics events. *Why:* the docking analog of MUI X Premium's "large dataset
canvas rendering"; the buyers are the same IDE-scale apps that buy Tier 1.

### Tier 3 — ecosystem & services (recurring revenue, lower build cost)

**8. Document host / dual-zone model** — first-class VS-style separation of tool panes vs a
central document area (typed zones, per-zone drop rules, document-tab affordances). Currently
Infragistics/DevExpress-only; dockview users hand-roll it with locked groups.

**9. Theme designer + design kit** — visual theme builder emitting the CSS custom properties,
plus a Figma kit. Classic paid add-on (Telerik ThemeBuilder); low engineering risk.

**10. Support / SLA / LTS tier** — guaranteed response times, private issue escalation,
LTS branches with backported fixes, migration assistance. *The most universal gate* — MUI X
charges $1,399/dev/yr for support alone. As a single-maintainer project this is also the
offering that most needs headcount planning.

---

## 5. Packaging & pricing recommendation

Follow the **AG Grid pattern (a): MIT core + feature-gated enterprise package + support** —
the module registry was explicitly built in its image:

- **Community (MIT, unchanged):** everything shipping today, including the current
  `dockview-modules` set, framework bindings (a differentiator — FullCalendar charges for
  connectors), touch/mobile, basic a11y, serialization, floating groups, basic popouts.
  Do not claw back anything already free; it poisons trust and the current feature set is
  table stakes vs FlexLayout/rc-dock anyway.
- **Enterprise (single `dockview-enterprise` package, license key, ~$749–$999/dev perpetual
  with 1yr updates, AG Grid-style):** Tiers 1 + 2 modules above. `assertModule`'s graceful
  degradation already gives the right unlicensed behavior (console warning, feature no-ops,
  never crashes).
- **Enterprise+ / SLA (per-org subscription):** support SLA, LTS, VPAT, priority issues,
  theme designer access.

**Community goodwill to protect the funnel:** keep shipping the top small asks free —
`onWillClose` veto (#854), proportional sizing (#814), size preservation (#708/#634/#974),
Firefox drag fix (#932), deeper Vue SFC support (#908). The free tier's health is the
marketing engine; the paid tier sells what OSS demonstrably never builds (trays, workspace
versioning, multi-monitor, compliance, SLA).

**Build order** (leverage vs effort): History (3) → Auto-hide (1) → Workspaces (2) →
Compliance pack (5) → Multi-window (4) → i18n/RTL (6) → Virtual (7) → the rest.
History and Auto-hide are the fastest path to a sellable, demo-able v1 because their core
hooks (mutation transactions, edge groups) shipped in v7.
