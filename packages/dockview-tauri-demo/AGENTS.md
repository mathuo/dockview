# AGENTS.md - dockview-tauri-demo

A private Tauri shell hosting dockview. It is a testbed for host-environment
behaviour — popout groups, native window isolation, cross-process layout sync —
not a published package and not a supported example.

## Shape

- `src/` — vanilla TypeScript against `dockview`, deliberately without a
  framework binding so the probes sit directly on the layer that popouts and
  window handling live in. `dockview-enterprise` is imported for its features.
- `src-tauri/` — the Rust shell. Commands: `host_info`, `open_dock_window`,
  `broadcast_layout`, `close_popout`, and the hub's `drag_start`,
  `peek_drag`, `claim_drop`, `drag_end`, `take_pending_group`. Window creation lives in
  Rust so the capability set stays at `core:default`.
- `src-tauri/src/hub.rs` — the orchestrator: which drag is in flight between
  windows and who claimed it. It imports nothing from Tauri and returns the
  release notices for the shell to deliver, so it can one day be lifted into
  a crate of its own behind any host. Keep it that way: no `AppHandle`, no
  window handling, no event emission in this module. `cargo test` covers it;
  the commands in `lib.rs` are thin wrappers over it.
- The window side (cross-window drag, workspace, shared undo) is
  `installMultiWindow` from `dockview-enterprise`
  (`packages/dockview-enterprise/src/multiWindow/`). Its in-memory
  orchestrator mirrors the three Rust modules here; keep the two in step,
  including the `DragPayload` shape (`panel` or `group`) and the release
  notice's `reason` (`claim` or `tear-off`).
- `src/hub.ts` — the Tauri `MultiWindowTransport`, over the commands and
  events in `bridge.ts`, plus the `Hub` wrapper the panels and the harness
  read the log from.
- `src-tauri/src/workspace.rs` — the workspace: which windows exist, their
  frames, and each one's dockview layout as opaque JSON, plus the atomic
  `FileStore`. Tauri-free and unit tested like `hub.rs`. The one field of a
  layout it reads is the keys of `panels`, to refuse duplicate panel ids
  across windows. `lib.rs` loads it before any window exists, creates the
  windows from it, records geometry from window events, and writes it on a
  debounce and on exit.
- `src-tauri/src/history.rs` — the one ordered undo history across windows:
  a marker per step a window recorded locally, a full entry per move
  between windows (two halves, one per window), and `undo` / `redo` that
  return the actions for the shell to carry out. Tauri-free and unit
  tested. Windows keep dockview's own `layoutHistory` for their local steps;
  this only sequences.
- Events the shell addresses to one window (`dockview:apply`, the undo and
  redo requests, `dockview:release`) name that window in the payload and
  are listened for on the window's own target, never with the global
  `listen`: a listener for "any" target hears events emitted to every
  window. Broadcasts (`dockview:moved`, `dockview:history`) use `listen`.
- `src/autotest.ts` and `scripts/measure-cross-window-drag.py` — the
  measurement harness. With `DOCKVIEW_DEMO_AUTOTEST` in the shell's
  environment a second window opens at a known position and each window
  reports panel geometry and the drag log as JSON lines on stdout; the
  driver turns that into an xdotool drag and judges it from the log, and
  with `--restart` closes the shell and checks both windows come back from
  the workspace file. It points `DOCKVIEW_DEMO_WORKSPACE` at a temporary
  file so no run starts from another's layout. It reads geometry through
  the public api (`panel.view.tab.element`), never by querying dockview's
  DOM.
- `popout.html` — dockview opens `/popout.html` by default, so the host has to
  serve it. It is a second Vite entry point.

## Build / Test

- `dev` / `build:web` — Vite. Requires the workspace packages to be built
  (`yarn build && yarn build:bundle` at the root): the demo imports
  `dockview/dist/styles/dockview.css` and the enterprise bundle from `dist/`.
- `tauri:dev` / `tauri:build` — the desktop shell, driven through the Rust
  `tauri-cli` (`cargo install tauri-cli --version "^2"`). Deliberately not the
  npm `@tauri-apps/cli`: its prebuilt binaries are ~36MB and would land in
  every `yarn install` in the repo, CI included, for a package almost nobody
  builds. Anyone building the shell already needs a Rust toolchain, so the CLI
  costs them nothing extra. Needs Tauri's platform prerequisites; CI does not
  build this.
- `typecheck` — `tsc --noEmit`. There is no JavaScript test target: what
  the frontend verifies cannot be asserted in jsdom. `cargo test --locked`
  in `src-tauri/` covers the orchestrator, and
  `scripts/measure-cross-window-drag.py` measures the real gesture between
  two windows under Xvfb (see the README).

## Conventions

- The frontend must keep working in a plain browser. Every Tauri entry point in
  `bridge.ts` is lazily imported and guarded by `isTauri()`, so the same build
  can be compared side by side in Chrome and in the shell. Do not import
  `@tauri-apps/api` at module scope.
- `src-tauri/Cargo.lock` is committed, as it is for any application crate.
  Update it through cargo rather than by hand, and keep `cargo check --locked`
  passing.
- The probe panels read dockview through its public API, never its DOM or CSS
  classes: `api.dndCapabilities` for the resolved drag-and-drop backends,
  `api.onWillShowOverlay` for drop-overlay activity. The selection shield is
  the one exception, sampled from `user-select` because it is applied and
  released inside a single drag with nothing public to observe.
- `host.ts` asks dockview's exported `getPopoutUrlError` for its verdict rather
  than restating the rules, so the panel cannot drift from the library while
  still explaining *why* a popout would be refused.
- `hub.ts` is the only file that knows both dockview-enterprise's
  multi-window install and Tauri: the install hangs off dockview's public
  hooks and reaches the shell only through the transport `hub.ts` builds
  from `bridge.ts`.
- Closing popout windows goes through `api.onWillClosePopoutWindow` in
  `src/main.ts`, registered once: it covers every popout the component opens,
  including the ones dockview opens for itself (the group context menu, a
  restored layout), which per-call `addPopoutGroup` options do not.
