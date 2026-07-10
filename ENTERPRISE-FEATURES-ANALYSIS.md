# Dockview Enterprise Features Analysis (v8 baseline)

*Research date: 2026-07-10. Baseline: `v8-branch` @ `9feb136` (enterprise EULA v1.4), which
contains the current `dockview-enterprise` package. Sources: full codebase review of v8-branch
and master, dockview.dev, the issue tracker, and a survey of open-source and commercial
docking/layout competitors plus open-core peers (AG Grid, MUI X, FullCalendar, Tiptap).*

---

## 1. The enterprise offering as it stands (v8)

`dockview-enterprise` is a drop-in superset of the free `dockview` package: importing it
self-registers the paid modules; every feature is opt-in via a `DockviewOptions` field.
Enforcement is AG Grid-style: offline release-date-keyed licenses (FNV-1a checksum, forgeable
by design — "the watermark is the enforcement, not the key"), a discreet corner watermark when
unlicensed/expired, nothing ever disabled. EULA v1.4: per-developer, unlimited apps, annual
term, perpetual rights to versions released during the term, email support covering the latest
two majors. 30-day trial via dockview.dev; pricing lives on the external licensing worker, not
in-repo.

**Enterprise modules shipping today (10):**

| Module | What it does |
|---|---|
| Pinned tabs | VS Code/Chrome-style pinning; inline mode shipped, `separate-row` MVP-incomplete |
| Multi-row tabs | Wrapping tab headers (`overflow: { mode: 'wrap' }`); `maxRows` reserved, unbuilt |
| Drop guide | VS-style drop compass (inner ring per-group + outer layout-edge ring) |
| Smart guides | Figma-style alignment guides + magnetic snapping for floating groups |
| Auto-hide edge groups | Click-to-peek collapsed edge panels (VS tool-window style) |
| Dock to edge groups | Drag-to-edge creates zero-footprint edge groups |
| Layout history | Undo/redo of layout mutations (`api.undo/redo/canUndo`), spans popouts |
| Context menus | Tab + chip context menus (built-in and custom items) |
| Keyboard docking | Ctrl+M two-phase keyboard panel moves with preview + narration |
| Keyboard navigation | F6/Ctrl+] navigation, focus restore, float focus-trap |

Free tier keeps: all core docking, floating groups, popouts, edge groups, full DnD incl.
AdvancedDnD customization (custom overlays/ghosts), tab-group chips, serialization, theming,
ARIA/live-region a11y, all framework bindings.

**Competitive position after v8:** the enterprise tier has already claimed the two most
conspicuous commercial-only docking features (auto-hide trays, VS-style drop indicators) and
the top community asks (#765 pinning/auto-hide, #918 drop indicator). Dockview Enterprise is
now the only *standalone* web docking product on the market — Infragistics/Telerik/DevExpress
sell docking only inside $750–$1,400/dev/yr suites.

---

## 2. What peers gate and charge (unchanged context)

| Peer | Free tier | Paid tier | Price point |
|---|---|---|---|
| AG Grid | Full production grid, ARIA, virtualization | Power features + SLA support | $999/dev perpetual |
| MUI X | Basic components | Pro $299 / Premium $599 · Enterprise = **pure SLA/CSM** | $1,399/dev/yr (15-seat min) |
| FullCalendar | Full core calendar | Timeline/resource views, print, ticket quota | $480 (1–10 seats) |
| Tiptap | MIT editor | Service-backed features (collab, history, AI) | $49–$999/mo |

Docking features still commercial-only elsewhere or missing everywhere, **not yet in
dockview-enterprise**: workspace/layout versioning, multi-monitor workspace persistence,
document-host dual-zone model, i18n locale packs + RTL, compliance paperwork (VPAT),
virtualization at scale, theme designer tooling, numeric SLA/LTS commitments.

---

## 3. Recommended additions, prioritized

### Tier 1 — next enterprise modules (highest value, clear willingness-to-pay)

**1. Workspace management (`workspaces` module)**
Named layouts/perspectives, **serialization schema versioning + migration hooks** (serialized
layouts are unversioned today — surviving app releases that add/remove/rename panels is every
integrator's hand-rolled pain), partial (per-subtree) save/restore, layout diffing, pluggable
persistence adapters. *Why:* the single biggest remaining gap; every peer stops at "stringify
JSON"; IDE-scale customers all build this themselves badly. Natural fit next to the existing
`LayoutHistoryModule`.

**2. Multi-window workspace persistence (`multi-window` module)**
Popout restore across reloads with screen coordinates, multi-monitor position persistence,
cross-window state sync, graceful re-dock on window close/crash, optional popout-per-process
(#1291). *Why:* popout serialization round-trips today, but there is no workspace-level
multi-window layer; GoldenLayout's abandoned signature feature; the classic trading/monitoring
multi-monitor buyer. Keyboard docking already spanning popouts proves the plumbing.

**3. Finish the roadmap the code already reserves (fast, pre-sold wins)**
- **AdvancedOverflowModule** — `overflow.search`, `overflow.mru`, `overflow.thumbnails` are
  declared in `options.ts` and documented as "ignored until that module is present."
- **Pinned tabs `separate-row` completion** — cross-row DnD + custom row renderers.
- **`overflow.maxRows`** — bound the multi-row wrap.
These are already-designed option surfaces waiting for implementations — the cheapest way to
grow the paid feature table.

### Tier 2 — compliance & scale (what procurement requires)

**4. i18n locale packs + RTL**
Core ships a localization *seam* (overridable a11y/announcer strings) but no translations, and
RTL has zero footprint on the branch (issue #388). Ship maintained locale packs (es/ja/ko/de/
fr/zh at minimum — Infragistics ships locale packs as a selling point) and RTL layout
mirroring. RTL is hard and cross-cutting: exactly what OSS won't replicate.

**5. Performance-at-scale pack**
True keep-alive/virtualized rendering beyond `onlyWhenVisible` (#718, #841), tab-strip
virtualization for hundreds of tabs, deferred mount scheduling, perf instrumentation events.
v8's content-area dimension reporting already anticipates virtualized renderers. The MUI X
Premium analog ("large dataset canvas rendering").

**6. Accessibility compliance pack**
The features exist (keyboard nav, keyboard docking, live region, focus indicators); what's
missing is the **paperwork enterprises actually procure against**: a maintained VPAT /
WCAG 2.2 / Section 508 conformance statement plus third-party audit reports, published under
the enterprise tier. Near-zero engineering, real procurement value.

### Tier 3 — product & business layer

**7. Document host / dual-zone model** — first-class VS-style separation of tool panes vs a
central document area (typed zones, per-zone drop rules). Still Infragistics/DevExpress-only;
users currently approximate it with locked groups + edge groups.

**8. Theme designer + Figma kit** — visual builder emitting the CSS custom properties.
Classic paid add-on (Telerik ThemeBuilder); low engineering risk.

**9. Formal SLA / LTS tier ("Enterprise+")** — today support is qualitative ("direct support
and priority feature requests", email, latest two majors). Peers monetize the *guarantee*:
MUI X charges $1,399/dev/yr for SLA alone; AG Grid bundles Zendesk SLA. Add a priced tier
with response-time commitments, LTS branches with backported fixes, and private escalation.
As a small team, price this to fund the headcount it implies.

### Housekeeping (do regardless — trust and conversion)

- **Fix the Licensing feature-table discrepancies** on `features.mdx`: tab-group chips and
  custom chip renderers are listed Enterprise but are free in core `AllModules`; custom drop
  overlay / group drag preview are listed Enterprise but ride the free `AdvancedDnDModule`;
  keyboard navigation is listed free but ships in the enterprise package. Mislabeled-as-paid
  erodes trust; mislabeled-as-free creates support disputes.
- **Publish pricing on dockview.dev.** Every successful peer shows numbers; hiding them
  behind the licensing worker adds funnel friction for the exact developer-led buyers the
  per-dev model targets.
- **Keep the free-tier funnel healthy**: proportional sizing (#814), size preservation
  (#708/#634/#974), `onWillClose` veto (#854), Firefox drag (#932), Vue depth (#908) — these
  are table-stakes asks that shouldn't be gated and keep the ~600k-download funnel growing.

---

## 4. Net-new feature territory (no competitor precedent)

Everything above closes gaps against competitors or the code's own reserved surfaces. This
section is greenfield: features no docking library ships, matched to dockview's actual buyer
verticals (trading/monitoring terminals, IDE-like tools, dashboards, scientific viz).

### A. Vertical-defining modules (buyers already pay other vendors for these)

**A1. Linked panel channels (`channels` module)**
Bloomberg/TradingView-style color-channel linking: assign panels to a channel (color chip —
the tab-group chips UI is already the natural affordance) and panels in the same channel share
context — a symbol change in one propagates to the rest. Under it, a typed inter-panel message
bus (publish/subscribe with channel scoping, request/reply, late-joiner replay) that also works
across popout windows. *Why:* trading terminals are dockview's richest vertical and every one
of them hand-builds exactly this; no layout library offers it. It's also the missing
"application layer" that Lumino has (message passing) and dockview deliberately lacks.

**A2. Command palette + panel quick-open (`palette` module)**
Ctrl+Shift+P palette pre-wired with every layout command (move/float/popout/pin/maximize/
undo…), and Ctrl+P fuzzy quick-open over panels — plus an extension point for app commands.
The command inventory already exists as API methods and keyboard-docking actions; this is the
discoverable UI over it. Pairs with (and upsells) keyboard docking and navigation.

**A3. Agent-ready layout control (`agent` module)**
A declarative layout-intent API ("open X next to Y", "focus the logs", "save this as
perspective Z") with validation and dry-run, plus an official MCP server / tool schema so
in-app copilots and agents can drive the workspace safely. Every enterprise app is embedding
an assistant in 2026; "the docking library your copilot can operate" is a first-mover claim
no competitor is positioned to make. The `'user'`/`'api'` origin tagging on mutation events
already provides the audit distinction agents need.

### B. Service-backed features (Tiptap pattern — gate what needs a backend; recurring revenue)

**B1. Dockview Cloud workspaces** — cross-device workspace sync for end users, team layout
templates ("push this workspace to the team"), and follow-mode presence (see a colleague's
active panel, Figma/Live Share-style). Converts the one-time per-dev license into MRR and is
inherently ungameable — the value is the service, not the client code.

**B2. Workspace analytics** — privacy-safe usage events (panel opens/closes/dwell/resize,
layout churn) with an aggregation dashboard, so product teams learn which panels users
actually use. The mutation-transaction event stream is the ready-made instrumentation point.

### C. Platform & governance moat

**C1. Layout DevTools + testing kit** — a browser-devtools panel visualizing the layout tree,
serialized-state diffing, and time-travel scrubbing over layout history; plus Playwright
fixtures, layout assertion matchers, and a visual-regression harness. DX tooling of this kind
(ag-Grid has nothing comparable) compounds adoption; the history module already stores the
timeline.

**C2. Native shell pack (Electron/Tauri)** — tear-out to real native windows (not browser
popouts), OS window-manager/taskbar integration, `getScreenDetails()` multi-monitor placement.
Extends the Tier 1 multi-window work to the desktop-shell apps (IDEs, terminals) that are
dockview's most natural heavy users.

**C3. Governance & policy module** — admin-defined layout policy as data: non-closable/
non-movable panels by role, allowed-layout constraints, kiosk/locked presets, and audit-trail
export built on the origin-tagged mutation events. Sells to the same procurement motion as
the compliance pack; no UI library does layout governance at all.

**C4. Untrusted-panel sandboxing** — a first-class security boundary for apps hosting
third-party or plugin panels: iframe/worker isolation per panel, a capability-scoped panel
API (what a sandboxed panel may know/do), and postMessage plumbing that survives moves,
floats, and popouts. Turns "we host plugins" customers (the hardest enterprise segment) from
hand-rolling iframes into buyers.

**Where to start among these:** A1 (channels) and A2 (palette) are the strongest — modest,
self-contained client modules with obvious demos and a vertical that already pays for the
capability elsewhere. A3 (agent/MCP) is the cheapest differentiation per unit of effort and
markets itself. B1 (cloud) is the long-term revenue-model play but needs service operations;
sequence it after the client-side wins.

---

## 5. Suggested build order

1. **AdvancedOverflowModule + pinned separate-row + maxRows** — reserved surfaces, fastest
   new line items on the feature table.
2. **Workspace management** — biggest unclaimed value; pairs with existing layout history.
3. **Multi-window persistence** — flagship demo material for the multi-monitor segment.
4. **VPAT/compliance pack + locale packs** — cheap, unlocks procurement-driven deals.
5. **RTL, virtualization** — larger engineering bets; sequence by inbound demand.
6. **SLA/LTS tier** — launch once support capacity exists; it's the highest-margin item
   every peer eventually leans on.
