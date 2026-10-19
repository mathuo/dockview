# dockview-tauri-demo

A small [Tauri](https://tauri.app) desktop shell hosting dockview. It exists to
answer questions the browser test suite cannot: what a native webview does with
popout groups, what happens at the boundary between two native windows, and how
layout state can cross that boundary.

Not published — an internal testbed, not a supported example.

## Running it

The demo consumes the workspace packages, so build them first:

```sh
yarn install
yarn build && yarn build:bundle
```

Then, from this directory:

```sh
yarn dev            # the frontend in a browser, no Rust needed
yarn tauri:dev      # the desktop shell
```

The shell drives Tauri through the Rust CLI rather than the npm one, so that
its ~36MB of prebuilt binaries stay out of everyone else's `yarn install`.
Install it once:

```sh
cargo install tauri-cli --version "^2"
```

`yarn tauri:build` produces a release bundle; `cargo tauri build --no-bundle`
stops at the binary. Tauri's
[prerequisites](https://tauri.app/start/prerequisites/) cover the platform
toolchains; on Linux that means the WebKitGTK development packages:

```sh
sudo apt-get install -y libwebkit2gtk-4.1-dev libgtk-3-dev \
  librsvg2-dev libxdo-dev libssl-dev pkg-config build-essential
```

The bundle icon is a single PNG. Run `yarn tauri icon` to generate the full
per-platform icon set if you need a signed, distributable build.

## What each panel is for

**Host** — what the page thinks it is running inside: origin, protocol, webview
engine, and whether dockview would accept this origin as a popout target (asked
of dockview's own exported guard, `getPopoutUrlError`).

**Popouts** — the popout mechanism, checked in pieces. It reports the popout URL
verdict, probes `window.open` directly (does a handle come back, and is the
document reachable), and pops out its own group.

It also reproduces the refused-origin case from any origin, by aiming a popout
at a `tauri://` URL — from a page served over http that is another origin, so
the guard fails at the same check as a genuine cross-origin popout would. One button takes the interactive path, the
other saves a layout containing a popout, reopens it on the refused origin, and
reports whether every panel came back visible. Both run in a plain browser, so
the macOS/Linux release behaviour can be checked without packaging anything.

**Native windows** — asks Rust to build a second native window running the same
frontend. That webview has its own JavaScript context, so no DOM can be moved
into it from here.

**Cross-window drag** — drags a tab or a group from one native window's
dockview into another's, with the shell as the hub. Reports the drag backend
in use, counts each stage of a drag, and logs what crossed. See
[Dragging between windows](#dragging-between-windows).

**Layout sync** — serializes the layout and fans it out over Tauri's event bus,
so windows on either side of the process boundary converge on the same
arrangement without sharing a DOM. What that whole-layout resync costs, and
what dockview would need for a group to run in a window it cannot script, is
measured in [docs/unscriptable-windows.md](docs/unscriptable-windows.md).

The frontend degrades in a plain browser: the Tauri-only panels report that the
shell is missing instead of failing.

## Where the host and the browser diverge

dockview opens popout groups with `window.open` and then moves the group's DOM
into the new document. Two things have to hold, and a native shell is where they
stop being free:

1. **The popout URL must be same-origin with the page.** dockview compares
   scheme and host and refuses `javascript:`, `data:`, `blob:`, `vbscript:`
   and `file:` outright, because a popout still shares `window.opener` with
   the host page. Under `tauri dev` the webview loads the Vite dev server over
   http. Release builds differ by platform: Windows and Android serve the app
   from `http://tauri.localhost`, macOS and Linux from `tauri://localhost`.
   Both are origins of their own, so `/popout.html` resolves same-origin in
   every case; the Host panel reports which one you are in.

2. **The opened window must be script-accessible.** That depends on how the
   window was created. Windows built through Tauri's `WebviewWindow` API are
   separate webviews with separate JavaScript contexts, which is the point of
   the Native windows panel and the reason the Layout sync panel moves
   serialized state rather than DOM. A window that the page opens with
   `window.open` is scriptable only if the host answers the request with a
   webview *related* to the opener: the same web process on WebKitGTK, the
   same configuration on WKWebView, the same environment on WebView2. Tauri
   exposes that as `WebviewWindowBuilder::on_new_window`; a window declared
   in `tauri.conf.json` has no handler, and `window.open` returns null from
   it. The demo therefore builds every window in Rust (`src-tauri/src/lib.rs`)
   and answers `window.open` there.

   There are two ways to answer. `Create` returns a Tauri-built window
   (labelled `popout-N`, titled from its document, sized from the
   `window.open` features on macOS and Windows); the demo uses it. `Allow` is
   wry's own per-platform window creation, kept behind `DOCKVIEW_POPOUT=allow`
   for comparison; on WebKitGTK it ignores the features and opens 200×200.

### Drag-and-drop: dockview's default, and why it matters across windows

The demo runs dockview's default `dndStrategy`, `'auto'`: HTML5 drag-and-drop
for mouse input, pointer events for touch and pen. The pointer backend is a
deliberate fallback, not the default, and the distinction matters here: only
an HTML5 drag rides an OS drag session, so only an HTML5 drag can leave the
window it started in. Pointer events stop at the window edge, which makes a
drag between a popout and the main window impossible on the pointer backend
no matter what the host does.

The demo used to force `'pointer'`, on the strength of an HTML5 tab drag in an
embedded webview that rendered a native drag image while the page never got
`dragover`. That symptom is host-specific and now measurable rather than
assumed:

- `?dnd=html5` or `?dnd=pointer` on the URL (or `VITE_DND` at build time)
  forces a backend.
- The Host panel reports the requested strategy and the backends it resolved
  to (`api.dndCapabilities`, since `'auto'` decides from the device), plus a
  live count of drop-overlay events (`api.onWillShowOverlay`): a drag that
  docks a panel without raising it is the pointer path; a count that rises
  during an HTML5 drag means `dragover` reached the page. Both come from
  dockview rather than from reading its DOM.
- Every window is built with `disable_drag_drop_handler()` (the
  `dragDropEnabled: false` window option). Tauri's own drag-drop interception
  is the documented reason HTML5 drag-and-drop misbehaves in WebView2, and
  the demo does not use file drops.

Measured on Linux (WebKitGTK 2.52.6, release build, driven under Xvfb with
`xdotool`) with the HTML5 backend: dragging the Scratch tab into another group
raised the drop-overlay count off zero and docked the panel, with `dragDropEnabled`
at its default and with it off; and dragging a tab out of a popout window
into the main window docked it there and closed the emptied popout. One
harness note: under Xvfb there is no pointing device, WebKit reports a coarse
primary pointer, and `'auto'` therefore resolves to the pointer backend, so
those runs force `VITE_DND=html5`; on a desktop `'auto'` gives HTML5 for the
mouse.

### Dragging between windows

Two native windows are two dockview instances in two JavaScript contexts, so
a tab cannot be dragged between them the way it is dragged between groups.
What does cross a window boundary is an OS drag session, and only an HTML5
drag rides one. The demo builds on that, with the shell as a hub and no
window owning any other:

1. **Drag start.** `onWillDragPanel` / `onWillDragGroup` put a session id on
   the drag's `DataTransfer` under `application/x-dockview-hub`, serialize
   the group (`api.serializeGroup`, or a one-panel group for a single tab)
   and hand it to the shell with `drag_start`. Serializing up front means the
   drop can be completed even if the source window is busy by then.
2. **Drag over.** The destination's dockview sees a drag it did not start
   and asks through `onUnhandledDragOver`; the demo accepts it when the hub
   type is present, so the normal drop overlay and compass show. A browser
   exposes a drag's types but not its data until the drop, which is why the
   type carries the meaning and the session id waits.
3. **Drop.** `onDidDrop` reads the session id, reads the group with
   `peek_drag` to refuse one whose panel ids it already holds, claims it
   with `claim_drop`, and rebuilds the group where the drop landed: `addGroupFromJSON` next to
   the target group or at a layout edge, or, for a drop on a group's centre
   or tab bar, `addPanel` into that group. A group's id travels with it;
   every window uses `groupIdGenerator` with random ids so it does not
   collide on arrival.
4. **Release.** The first claim wins. The shell removes the session and
   emits `dockview:release` to the source window, which removes its copy of
   the panel or group. A second claim, or a claim for a drag the shell never
   saw, is refused and nothing is added.
5. **Drag end.** The source reports `drag_end`. With the panel's tear-off
   box ticked, an unclaimed drag becomes a new window that starts with the
   group (`take_pending_group` on load), the hub's replacement for a popout.
   It is off by default because HTML5 cannot tell a drop on the desktop from
   an Escape-cancelled drag.

What the whole gesture loses is renderer-held state: the panel is rebuilt
from its serialized `params`, so scroll position, half-typed text and focus
do not survive the crossing. A panel that wants to keep state across windows
has to put it in `params`.

Not yet measured: whether each webview engine delivers a cross-process HTML5
drop with its custom type intact. The Cross-window drag panel's counters say
where a drag stops: `drags started` rising with nothing on the other side
means the drag never reached the second window; `drag-overs accepted` rising
with `drops claimed` at zero means the drop landed but the shell refused it,
and the log says why.

### Measured in a release build

Running a packaged build on Linux (WebKitGTK, tauri 2.11.5, webview 2.52.6),
the Host panel reports:

```
runtime                     tauri
engine                      WebKitGTK
origin                      tauri://localhost
protocol                    tauri:
release origin is http(s)   false
```

and, with the guard comparing scheme and host and the Rust side answering
`window.open`, both popout probes pass and a real popout opens:

```
allowed: tauri://localhost/popout.html — same-origin (tauri://localhost)
window.open is scriptable — The opener can reach the new window's document, so
dockview can move panel DOM into it.
popout group opened
```

The popout is a second native window showing the group with dockview's styles
cloned in; both answers render it. Before either half was in place the
probes failed independently: the guard refused the `tauri:` scheme, and
`window.open` returned null because no window had an `on_new_window` handler.
Each alone is not enough, and closing needs two more pieces, both in
`src-tauri/src/lib.rs`:

- **The page closing the window.** dockview calls `close()` on a popout when
  its group is closed or redocked. wry answers WebKitGTK's `close` signal by
  destroying the webview widget only, leaving the window on screen blank, so
  the demo destroys the Tauri window from the widget's `destroy`. Windows
  destroys the window in wry itself. macOS is different: wry's UI delegate
  has no `webViewDidClose:`, so `close()` does nothing there and the opener,
  which has IPC, asks the shell instead (`close_popout`, keyed by a label the
  shell injects into the popout document). dockview reports every popout it
  lets go of through `api.onWillClosePopoutWindow`, while the window is still
  there, so `src/main.ts` routes them all through the shell with one listener;
  the `window.open` probe asks directly.
- **The user closing the window.** Nothing, as of dockview 8.4: a native close
  tears the webview down without running the page's unload handlers, so the
  `beforeunload` dockview once relied on never arrives, but it also polls the
  window's `closed` flag and that flag does flip when wry destroys the webview.
  The shell used to hold the close request, tell the page to unload and destroy
  the window afterwards; that is no longer needed.

Measured on Linux: the probe's window closes on `handle.close()`, closing a
popped-out group's last tab closes its window, and closing the popout window
from the window manager returns the group to the main window. That last one was
re-measured with nothing held on the Rust side (WebKitGTK 2.52.6, under Xvfb,
the popout closed with `wmctrl -c`): the opener's handle reported `closed`, and
the group was back in the main window a tick later, with every panel intact.
Windows created through Tauri's own API remain
separate contexts; sharing layout state across those over IPC is still the
route for them, which is what the Native windows and Layout sync panels are
for.

Enterprise features are governed by a licence key; set one with
`LicenseManager.setLicenseKey()` in `src/main.ts` when exercising them. See
<https://dockview.dev/enterprise>.

## Layout

```
docs/           design notes
src/            frontend
  main.ts       builds the dockview instance and its panels
  panels.ts     the five probe panels plus a scratch panel
  crossWindowDnd.ts  cross-window drag and drop, an interceptor over dockview's drag hooks
  hub.ts        the Tauri transport that interceptor reaches the shell through
  host.ts       host-environment detection and the popout URL diagnosis
  probes.ts     window.open probes
  bridge.ts     lazy wrapper over the Tauri IPC surface
src-tauri/      Rust shell: host info, native window creation, layout broadcast
  src/hub.rs    the drag orchestrator, Tauri-free and unit tested
popout.html     served at /popout.html, dockview's default popout target
```
