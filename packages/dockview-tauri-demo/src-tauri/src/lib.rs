mod history;
mod hub;
mod workspace;

use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::sync::Mutex;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use tauri::{
    webview::{NewWindowFeatures, NewWindowResponse},
    AppHandle, Emitter, Manager, RunEvent, State, Url, WebviewUrl, WebviewWindow,
    WebviewWindowBuilder, WindowEvent,
};

use history::{Action, History, Role, Step};
use hub::{DragEnd, DragSession, Hub, Release};
use workspace::{FileStore, Geometry, Store, Workspace, WorkspaceState};

/// Event carrying a serialized dockview layout between native windows.
const LAYOUT_EVENT: &str = "dockview:layout";

/// Event telling the window a drag started in that another window has taken
/// the dragged group, so it can remove its own copy.
const RELEASE_EVENT: &str = "dockview:release";

/// Broadcast after panels moved between windows, by a drop or by undo or
/// redo of one, so app code has one event for it.
const MOVED_EVENT: &str = "dockview:moved";
/// Broadcast whenever the global history changes.
const HISTORY_EVENT: &str = "dockview:history";
/// Sent to one window: replace your layout with this one.
const APPLY_EVENT: &str = "dockview:apply";
/// Sent to one window: undo, or redo, your own top step.
const UNDO_REQUEST_EVENT: &str = "dockview:undo-request";
const REDO_REQUEST_EVENT: &str = "dockview:redo-request";

/// Labels for the windows a tear-off creates; see `POPOUT_COUNT`.
static TEAR_OFF_COUNT: AtomicUsize = AtomicUsize::new(0);

/// The panel ids a `SerializedDockviewGroup` carries: its `group.views`. The
/// one field of an envelope the shell reads, for move events and for the
/// workspace's reconciliation of the two windows' reports.
fn envelope_panels(envelope: &serde_json::Value) -> Vec<String> {
    envelope
        .pointer("/group/views")
        .and_then(serde_json::Value::as_array)
        .map(|views| {
            views
                .iter()
                .filter_map(serde_json::Value::as_str)
                .map(str::to_string)
                .collect()
        })
        .unwrap_or_default()
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct MovedNotice {
    session: String,
    panels: Vec<String>,
    from: String,
    to: String,
    /// `drop`, `undo` or `redo`.
    reason: &'static str,
}

fn broadcast_history(app: &AppHandle) {
    match app.state::<History>().info() {
        Ok(info) => {
            if let Err(err) = app.emit(HISTORY_EVENT, info) {
                eprintln!("history: could not broadcast: {err}");
            }
        }
        Err(err) => eprintln!("history: {err}"),
    }
}

/// Carries out an undo or redo step the history handed back.
fn carry_out(app: &AppHandle, step: Step, reason: &'static str) -> Result<(), String> {
    for action in step.actions {
        match action {
            // Every payload names its window: a listener registered for
            // "any" target hears events emitted to every window, so the
            // receiver filters as well as the sender targeting.
            Action::UndoLocal { window } => app
                .emit_to(
                    &window,
                    UNDO_REQUEST_EVENT,
                    serde_json::json!({ "window": window }),
                )
                .map_err(|err| err.to_string())?,
            Action::RedoLocal { window } => app
                .emit_to(
                    &window,
                    REDO_REQUEST_EVENT,
                    serde_json::json!({ "window": window }),
                )
                .map_err(|err| err.to_string())?,
            Action::ApplyLayout { window, layout } => {
                app.state::<Workspace>()
                    .set_layout_unchecked(&window, layout.clone())
                    .map_err(|err| err.to_string())?;
                app.state::<Persistence>().mark_dirty();
                app.emit_to(
                    &window,
                    APPLY_EVENT,
                    serde_json::json!({ "window": window, "layout": layout }),
                )
                .map_err(|err| err.to_string())?;
            }
        }
    }
    if let Some(moved) = step.moved {
        app.emit(
            MOVED_EVENT,
            MovedNotice {
                session: moved.session,
                panels: moved.panels,
                from: moved.from,
                to: moved.to,
                reason,
            },
        )
        .map_err(|err| err.to_string())?;
    }
    broadcast_history(app);
    Ok(())
}

fn perform_undo(app: &AppHandle) -> Result<(), String> {
    let step = app
        .state::<History>()
        .undo()
        .map_err(|err| err.to_string())?;
    carry_out(app, step, "undo")
}

fn perform_redo(app: &AppHandle) -> Result<(), String> {
    let step = app
        .state::<History>()
        .redo()
        .map_err(|err| err.to_string())?;
    carry_out(app, step, "redo")
}

/// A window recorded a step in its own history.
#[tauri::command]
fn history_push(app: AppHandle, history: State<History>, label: String) -> Result<(), String> {
    history.push_local(&label).map_err(|err| err.to_string())?;
    broadcast_history(&app);
    Ok(())
}

#[derive(Deserialize)]
#[serde(rename_all = "lowercase")]
enum MoveRole {
    From,
    To,
}

/// A window reports its half of a move: its layout before and after.
#[tauri::command]
fn move_recorded(
    app: AppHandle,
    history: State<History>,
    session: String,
    label: String,
    role: MoveRole,
    panels: Vec<String>,
    before: serde_json::Value,
    after: serde_json::Value,
) -> Result<(), String> {
    let role = match role {
        MoveRole::From => Role::From,
        MoveRole::To => Role::To,
    };
    history
        .record_move(
            &session,
            &panels,
            role,
            history::Half {
                window: label,
                before,
                after,
            },
        )
        .map_err(|err| err.to_string())?;
    broadcast_history(&app);
    Ok(())
}

/// Undo the most recent step anywhere.
#[tauri::command]
fn undo(app: AppHandle) -> Result<(), String> {
    perform_undo(&app)
}

/// Redo the most recently undone step anywhere.
#[tauri::command]
fn redo(app: AppHandle) -> Result<(), String> {
    perform_redo(&app)
}

#[tauri::command]
fn history_info(history: State<History>) -> Result<history::Info, String> {
    history.info().map_err(|err| err.to_string())
}

/// Set in the environment to run the measurement harness: a second window
/// opens at a known position, and the frontend reports its geometry and the
/// hub's log as JSON lines on stdout for `scripts/measure-cross-window-drag.py`
/// to drive. See the README's "Dragging between windows".
const AUTOTEST_ENV: &str = "DOCKVIEW_DEMO_AUTOTEST";

fn autotest() -> bool {
    std::env::var_os(AUTOTEST_ENV).is_some()
}

/// Overrides where the workspace file lives; the harness points it at a
/// temporary file so a measurement never starts from a previous run.
const WORKSPACE_ENV: &str = "DOCKVIEW_DEMO_WORKSPACE";

/// How long after a change the workspace file is written. Changes come in
/// bursts (a drag is two layout reports and a few geometry events) and the
/// file is small, so this only coalesces, it does not risk much.
const SAVE_DEBOUNCE: Duration = Duration::from_millis(500);

/// The windows the workspace records: the ones running the frontend. Popout
/// windows belong to the dockview instance that opened them and travel
/// inside its layout.
fn is_dock_window(label: &str) -> bool {
    label == "main" || label.starts_with("dock-")
}

fn workspace_path(app: &AppHandle) -> PathBuf {
    if let Some(path) = std::env::var_os(WORKSPACE_ENV) {
        return PathBuf::from(path);
    }
    match app.path().app_data_dir() {
        Ok(dir) => dir.join("workspace.json"),
        Err(err) => {
            eprintln!("workspace: no app data dir ({err}); using the working directory");
            PathBuf::from("workspace.json")
        }
    }
}

/// The host's side of persistence: the store, whether anything changed since
/// the last write, and whether the app is on its way out (so windows closing
/// as part of the exit are not mistaken for the user closing them).
struct Persistence {
    store: FileStore,
    dirty: AtomicBool,
    exiting: AtomicBool,
    last_saved: Mutex<Option<SystemTime>>,
}

impl Persistence {
    fn mark_dirty(&self) {
        self.dirty.store(true, Ordering::Relaxed);
    }

    /// Writes the workspace if anything changed since the last write.
    fn save_if_dirty(&self, workspace: &Workspace) {
        if !self.dirty.swap(false, Ordering::Relaxed) {
            return;
        }
        match workspace.snapshot() {
            Ok(snapshot) => match self.store.save(&snapshot) {
                Ok(()) => {
                    if let Ok(mut last) = self.last_saved.lock() {
                        *last = Some(SystemTime::now());
                    }
                }
                Err(err) => {
                    eprintln!(
                        "workspace: could not save {}: {err}",
                        self.store.path().display()
                    );
                    self.dirty.store(true, Ordering::Relaxed);
                }
            },
            Err(err) => eprintln!("workspace: {err}"),
        }
    }
}

/// Records a window's current frame, in logical pixels, which is what the
/// builder takes when the window is recreated.
fn record_geometry(app: &AppHandle, window: &tauri::Window) {
    let (Ok(position), Ok(size), Ok(scale)) = (
        window.outer_position(),
        window.inner_size(),
        window.scale_factor(),
    ) else {
        return;
    };
    let position = position.to_logical::<f64>(scale);
    let size = size.to_logical::<f64>(scale);
    let geometry = Geometry {
        x: position.x.round() as i32,
        y: position.y.round() as i32,
        width: size.width.round() as u32,
        height: size.height.round() as u32,
    };
    if let Err(err) = app
        .state::<Workspace>()
        .set_geometry(window.label(), geometry)
    {
        eprintln!("workspace: {err}");
        return;
    }
    app.state::<Persistence>().mark_dirty();
}

/// A window reports its dockview layout; the orchestrator keeps it and
/// writes the workspace shortly after. Refused, and nothing recorded, if the
/// layout names a panel another window holds.
#[tauri::command]
fn layout_changed(
    workspace: State<Workspace>,
    persistence: State<Persistence>,
    label: String,
    layout: serde_json::Value,
) -> Result<(), String> {
    workspace
        .set_layout(&label, layout)
        .map_err(|err| err.to_string())?;
    persistence.mark_dirty();
    Ok(())
}

/// A freshly loaded window asks what layout to start with: the one it last
/// reported, or the one the workspace file held for it. `None` means build
/// the defaults.
#[tauri::command]
fn initial_layout(
    workspace: State<Workspace>,
    label: String,
) -> Result<Option<serde_json::Value>, String> {
    workspace
        .initial_layout(&label)
        .map_err(|err| err.to_string())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct WorkspaceWindowInfo {
    label: String,
    geometry: Option<Geometry>,
    has_layout: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct WorkspaceInfo {
    path: String,
    /// Milliseconds since the Unix epoch, or `None` if never written this run.
    last_saved: Option<u64>,
    windows: Vec<WorkspaceWindowInfo>,
}

/// What the Workspace panel shows.
#[tauri::command]
fn workspace_info(
    workspace: State<Workspace>,
    persistence: State<Persistence>,
) -> Result<WorkspaceInfo, String> {
    let snapshot = workspace.snapshot().map_err(|err| err.to_string())?;
    let last_saved = persistence
        .last_saved
        .lock()
        .map_err(|err| err.to_string())?
        .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
        .map(|since| since.as_millis() as u64);
    Ok(WorkspaceInfo {
        path: persistence.store.path().display().to_string(),
        last_saved,
        windows: snapshot
            .windows
            .into_iter()
            .map(|window| WorkspaceWindowInfo {
                label: window.label,
                geometry: window.geometry,
                has_layout: window.layout.is_some(),
            })
            .collect(),
    })
}

/// Labels for the windows `window.open` creates; a label must be unique for
/// the life of the app, so this only ever counts up.
static POPOUT_COUNT: AtomicUsize = AtomicUsize::new(0);

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct HostInfo {
    tauri_version: String,
    webview_version: String,
    platform: String,
    arch: String,
    /// Whether release builds on this platform serve the app over http(s).
    /// Where they do not, the app is served from `tauri://localhost`.
    http_origin: bool,
}

#[derive(Serialize, Clone)]
struct LayoutBroadcast {
    from: String,
    layout: serde_json::Value,
}

/// Delivers a release notice to the window it names.
fn deliver(app: &AppHandle, release: Release) -> Result<(), String> {
    app.emit_to(&release.from, RELEASE_EVENT, &release)
        .map_err(|err| err.to_string())
}

/// The source window announces a drag. Called from `onWillDragPanel` /
/// `onWillDragGroup`, before the pointer can have left the window.
#[tauri::command]
fn drag_start(
    hub: State<Hub>,
    session: String,
    from: String,
    kind: String,
    envelope: serde_json::Value,
) -> Result<(), String> {
    hub.start(
        session,
        DragSession {
            from,
            kind,
            envelope,
        },
    )
    .map_err(|err| err.to_string())
}

/// The destination window looks at a drag before claiming it, to refuse a
/// group whose panel ids it already holds without taking it from the source.
#[tauri::command]
fn peek_drag(hub: State<Hub>, session: String) -> Result<serde_json::Value, String> {
    hub.peek(&session).map_err(|err| err.to_string())
}

/// The destination window claims the drag it just received a drop for. The
/// first claim wins: the claimant gets the group and the source is told to
/// release its copy. A second claim, or a claim for a drag the shell never
/// saw, is refused.
#[tauri::command]
fn claim_drop(
    app: AppHandle,
    hub: State<Hub>,
    session: String,
    to: String,
) -> Result<serde_json::Value, String> {
    let claim = hub
        .claim(&session, to.clone())
        .map_err(|err| err.to_string())?;
    let panels = envelope_panels(&claim.envelope);
    let from = claim.release.from.clone();
    app.state::<Workspace>()
        .expect_move(&panels, &from, &to)
        .map_err(|err| err.to_string())?;
    deliver(&app, claim.release)?;
    app.emit(
        MOVED_EVENT,
        MovedNotice {
            session,
            panels,
            from,
            to,
            reason: "drop",
        },
    )
    .map_err(|err| err.to_string())?;
    Ok(claim.envelope)
}

/// How long a drag stays claimable after its source reported it over. The
/// source's `dragend` fires the instant the drop lands in another window,
/// and that window's claim is a separate IPC message that routinely arrives
/// later.
const DRAG_END_GRACE: std::time::Duration = std::time::Duration::from_millis(1500);

/// The source window reports the end of its drag. Nothing happens yet: the
/// drag stays claimable for `DRAG_END_GRACE`, after which an unclaimed one
/// is discarded, or, when the source asked, turned into a new window holding
/// the group: the hub's replacement for a popout. The source learns either
/// outcome through the release event, or through silence.
#[tauri::command]
fn drag_end(
    app: AppHandle,
    hub: State<Hub>,
    session: String,
    tear_off: bool,
) -> Result<(), String> {
    let in_flight = hub.end(&session, tear_off).map_err(|err| err.to_string())?;
    if !in_flight {
        return Ok(());
    }

    std::thread::spawn(move || {
        std::thread::sleep(DRAG_END_GRACE);
        let ended = app.state::<Hub>().expire(&session, || {
            format!(
                "dock-torn-{}",
                TEAR_OFF_COUNT.fetch_add(1, Ordering::Relaxed)
            )
        });
        match ended {
            Ok(DragEnd::TornOff { label, release }) => {
                let handle = app.clone();
                let result = app.run_on_main_thread(move || {
                    match build_dock_window(
                        &handle,
                        &label,
                        &format!("dockview — {label}"),
                        (900.0, 600.0),
                        None,
                    ) {
                        Ok(_) => {
                            if let Err(err) = deliver(&handle, release) {
                                eprintln!("tear-off: could not release the source: {err}");
                            }
                        }
                        Err(err) => eprintln!("tear-off: could not open {label}: {err}"),
                    }
                });
                if let Err(err) = result {
                    eprintln!("tear-off: {err}");
                }
            }
            Ok(DragEnd::Settled | DragEnd::Discarded) => {}
            Err(err) => eprintln!("drag_end: {err}"),
        }
    });

    Ok(())
}

/// A freshly loaded window asks whether a group is waiting for it; the
/// window's frontend collects it once dockview is ready, since nothing can be
/// pushed into a webview before it has loaded.
#[tauri::command]
fn take_pending_group(hub: State<Hub>, label: String) -> Result<Option<serde_json::Value>, String> {
    hub.take_pending(&label).map_err(|err| err.to_string())
}

#[tauri::command]
fn host_info() -> HostInfo {
    HostInfo {
        tauri_version: tauri::VERSION.to_string(),
        webview_version: tauri::webview_version().unwrap_or_else(|_| "unknown".to_string()),
        platform: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        http_origin: cfg!(any(windows, target_os = "android")),
    }
}

/// Answers a page's `window.open` with a window whose webview is *related*
/// to the opener: same web process on WebKitGTK, same configuration on
/// WKWebView, same environment on WebView2. That relation is what makes the
/// returned handle scriptable, and a scriptable handle is what dockview's
/// popout groups move their DOM into. A window declared in `tauri.conf.json`
/// has no such handler, and `window.open` returns null from it.
fn open_related_window(
    app: &AppHandle,
    url: Url,
    features: NewWindowFeatures,
) -> NewWindowResponse<tauri::Wry> {
    // Two ways to answer. `Create` (the default) returns a Tauri-built
    // window: labelled, titled from its document, and sized from the
    // `window.open` features on macOS and Windows. `Allow` is wry's own
    // per-platform window creation, kept behind `DOCKVIEW_POPOUT=allow` for
    // comparison; on WebKitGTK it ignores the features and opens 200x200.
    if std::env::var("DOCKVIEW_POPOUT").as_deref() == Ok("allow") {
        return NewWindowResponse::Allow;
    }

    let label = format!("popout-{}", POPOUT_COUNT.fetch_add(1, Ordering::Relaxed));

    // `about:blank`: the engine itself navigates the new webview to the
    // requested URL; loading it here too would be a second navigation.
    let built = WebviewWindowBuilder::new(
        app,
        label.clone(),
        WebviewUrl::External("about:blank".parse().expect("static URL")),
    )
    .window_features(features)
    .title(url.as_str())
    // Lets the opener, which has IPC, name this window to `close_popout`.
    .initialization_script(format!(
        "window.__DOCKVIEW_POPOUT_LABEL__ = {};",
        serde_json::to_string(&label).expect("a string serializes")
    ))
    .on_document_title_changed(|window, title| {
        let _ = window.set_title(&title);
    })
    .build();

    match built {
        Ok(window) => {
            honour_script_close(&window);
            NewWindowResponse::Create { window }
        }
        Err(err) => {
            eprintln!("window.open for {url} refused: {err}");
            NewWindowResponse::Deny
        }
    }
}

/// Makes `window.close()` from the page close the native window. wry answers
/// WebKitGTK's `close` signal by destroying the webview widget only, which
/// leaves the window on screen, blank; closing the window from the widget's
/// `destroy` runs after that whatever the handler order. On Windows wry
/// destroys the window itself; on macOS its UI delegate has no
/// `webViewDidClose:`, so nothing closes it yet. dockview calls `close()` on
/// a popout when its group is closed or redocked.
fn honour_script_close(window: &WebviewWindow) {
    #[cfg(target_os = "linux")]
    {
        use gtk::prelude::WidgetExt;
        let handle = window.clone();
        let result = window.with_webview(move |webview| {
            webview.inner().connect_destroy(move |_| {
                let _ = handle.destroy();
            });
        });
        if let Err(err) = result {
            eprintln!("popout: could not hook window.close: {err}");
        }
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = window;
    }
}

/// Destroys a window this shell created for `window.open`. wry's macOS UI
/// delegate has no `webViewDidClose:`, so `handle.close()` from the opener
/// does nothing there; the opener asks here instead.
#[tauri::command]
fn close_popout(app: AppHandle, label: String) -> Result<(), String> {
    if !label.starts_with("popout-") {
        return Err(format!("{label} is not a popout window"));
    }
    match app.get_webview_window(&label) {
        Some(window) => window.destroy().map_err(|err| err.to_string()),
        None => Ok(()),
    }
}

/// Every window running the frontend is built here rather than declared in
/// `tauri.conf.json`, so each one answers `window.open` (see
/// `open_related_window`).
fn build_dock_window(
    app: &AppHandle,
    label: &str,
    title: &str,
    size: (f64, f64),
    geometry: Option<Geometry>,
) -> tauri::Result<WebviewWindow> {
    let handle = app.clone();
    let mut builder = WebviewWindowBuilder::new(app, label, WebviewUrl::App("index.html".into()))
        .title(title)
        // Tauri's own drag-drop interception is the documented reason HTML5
        // drag-and-drop misbehaves in WebView2; the demo takes no file drops.
        .disable_drag_drop_handler()
        .on_new_window(move |url, features| open_related_window(&handle, url, features));

    builder = match geometry {
        Some(geometry) => builder
            .position(f64::from(geometry.x), f64::from(geometry.y))
            .inner_size(f64::from(geometry.width), f64::from(geometry.height)),
        None => builder.inner_size(size.0, size.1),
    };

    if autotest() {
        builder = builder.initialization_script("window.__DOCKVIEW_AUTOTEST__ = true;");
    }

    let window = builder.build()?;

    // On record from the moment it exists, frame included, so a workspace
    // saved before the window reports a layout, or before the user moves
    // it, still brings the window back where it was.
    if let Err(err) = app.state::<Workspace>().ensure_window(label) {
        eprintln!("workspace: {err}");
    }
    record_geometry(app, &window.as_ref().window());

    Ok(window)
}

/// The frontend's side of the measurement harness: one JSON line per report
/// on stdout, where the driver script reads them.
#[tauri::command]
fn autotest_report(label: String, kind: String, payload: serde_json::Value) {
    use std::io::Write;
    let line = serde_json::json!({ "label": label, "kind": kind, "payload": payload });
    let mut stdout = std::io::stdout().lock();
    let _ = writeln!(stdout, "{line}");
    let _ = stdout.flush();
}

/// Builds another native window running the same frontend. The new webview is
/// a separate context: it shares no JavaScript heap with its opener, so panel
/// DOM cannot be moved into it the way a popout group would.
#[tauri::command]
async fn open_dock_window(app: AppHandle, label: String) -> Result<(), String> {
    build_dock_window(
        &app,
        &label,
        &format!("dockview — {label}"),
        (1000.0, 700.0),
        None,
    )
    .map_err(|err| err.to_string())?;

    Ok(())
}

/// Fans a serialized layout out to every window, including the sender, which
/// filters itself out by label.
#[tauri::command]
fn broadcast_layout(app: AppHandle, from: String, layout: serde_json::Value) -> Result<(), String> {
    app.emit(LAYOUT_EVENT, LayoutBroadcast { from, layout })
        .map_err(|err| err.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .manage(Hub::default())
        .manage(History::default())
        .setup(|app| {
            let handle = app.handle().clone();

            // The workspace is the orchestrator's: it is read once here,
            // before any window exists, and every window is created from it.
            let store = FileStore::new(workspace_path(&handle));
            let restored = match store.load() {
                Ok(Some(state)) => state,
                Ok(None) => WorkspaceState::default(),
                Err(err) => {
                    eprintln!(
                        "workspace: could not read {}: {err}; starting fresh",
                        store.path().display()
                    );
                    WorkspaceState::default()
                }
            };
            let recorded: Vec<(String, Option<Geometry>)> = restored
                .windows
                .iter()
                .filter(|window| is_dock_window(&window.label))
                .map(|window| (window.label.clone(), window.geometry))
                .collect();
            app.manage(Workspace::restore(restored));
            app.manage(Persistence {
                store,
                dirty: AtomicBool::new(false),
                exiting: AtomicBool::new(false),
                last_saved: Mutex::new(None),
            });

            if !recorded.iter().any(|(label, _)| label == "main") {
                build_dock_window(&handle, "main", "dockview + Tauri", (1280.0, 820.0), None)?;
            }
            for (label, geometry) in &recorded {
                let title = if label == "main" {
                    "dockview + Tauri".to_string()
                } else {
                    format!("dockview — {label}")
                };
                build_dock_window(&handle, label, &title, (1000.0, 700.0), *geometry)?;
            }

            // The harness needs two windows at known places from the start.
            if autotest() {
                eprintln!("{AUTOTEST_ENV} is set: opening dock-2 and reporting on stdout");
                if !recorded.iter().any(|(label, _)| label == "dock-2") {
                    build_dock_window(
                        &handle,
                        "dock-2",
                        "dockview — dock-2",
                        (1000.0, 700.0),
                        Some(Geometry {
                            x: 1300,
                            y: 0,
                            width: 1000,
                            height: 700,
                        }),
                    )?;
                }
            }

            // The harness drives undo and redo over stdin, since it cannot
            // reach the commands and synthetic key events need a focus the
            // headless display does not give.
            if autotest() {
                let driver = handle.clone();
                std::thread::spawn(move || {
                    use std::io::BufRead;
                    for line in std::io::stdin().lock().lines() {
                        let result = match line.as_deref().map(str::trim) {
                            Ok("undo") => perform_undo(&driver),
                            Ok("redo") => perform_redo(&driver),
                            Ok(_) => Ok(()),
                            Err(_) => break,
                        };
                        if let Err(err) = result {
                            eprintln!("autotest: {err}");
                        }
                    }
                });
            }

            // Writes coalesce here rather than on every event.
            std::thread::spawn(move || loop {
                std::thread::sleep(SAVE_DEBOUNCE);
                handle
                    .state::<Persistence>()
                    .save_if_dirty(&handle.state::<Workspace>());
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            let label = window.label().to_string();
            if !is_dock_window(&label) {
                return;
            }
            let app = window.app_handle();
            match event {
                WindowEvent::Moved(_) | WindowEvent::Resized(_) => {
                    record_geometry(app, window);
                }
                WindowEvent::CloseRequested { .. } if label == "main" => {
                    // Closing the main window closes the app, keeping every
                    // window on record for next time.
                    app.state::<Persistence>()
                        .exiting
                        .store(true, Ordering::Relaxed);
                }
                WindowEvent::Destroyed => {
                    let persistence = app.state::<Persistence>();
                    if label != "main" && !persistence.exiting.load(Ordering::Relaxed) {
                        // The user closed one window: it, and the panels it
                        // held, leave the workspace.
                        if let Err(err) = app.state::<Workspace>().remove_window(&label) {
                            eprintln!("workspace: {err}");
                        }
                        if let Err(err) = app.state::<History>().forget_window(&label) {
                            eprintln!("history: {err}");
                        }
                        persistence.mark_dirty();
                        broadcast_history(app);
                    }
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![
            host_info,
            open_dock_window,
            broadcast_layout,
            close_popout,
            drag_start,
            peek_drag,
            claim_drop,
            drag_end,
            take_pending_group,
            layout_changed,
            initial_layout,
            workspace_info,
            history_push,
            move_recorded,
            undo,
            redo,
            history_info,
            autotest_report
        ])
        .build(tauri::generate_context!())
        .expect("error while building the dockview tauri demo");

    app.run(|app, event| match event {
        RunEvent::ExitRequested { .. } => {
            app.state::<Persistence>()
                .exiting
                .store(true, Ordering::Relaxed);
        }
        RunEvent::Exit => {
            // The last write: everything is already in memory, so nothing
            // has to be collected from the closing windows.
            app.state::<Persistence>()
                .save_if_dirty(&app.state::<Workspace>());
        }
        _ => {}
    });
}
