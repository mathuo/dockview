mod hub;

use std::sync::atomic::{AtomicUsize, Ordering};

use serde::Serialize;
use tauri::{
    webview::{NewWindowFeatures, NewWindowResponse},
    AppHandle, Emitter, Manager, State, Url, WebviewUrl, WebviewWindow, WebviewWindowBuilder,
};

use hub::{DragEnd, DragSession, Hub, Release};

/// Event carrying a serialized dockview layout between native windows.
const LAYOUT_EVENT: &str = "dockview:layout";

/// Event telling the window a drag started in that another window has taken
/// the dragged group, so it can remove its own copy.
const RELEASE_EVENT: &str = "dockview:release";

/// Labels for the windows a tear-off creates; see `POPOUT_COUNT`.
static TEAR_OFF_COUNT: AtomicUsize = AtomicUsize::new(0);

/// Set in the environment to run the measurement harness: a second window
/// opens at a known position, and the frontend reports its geometry and the
/// hub's log as JSON lines on stdout for `scripts/measure-cross-window-drag.py`
/// to drive. See the README's "Dragging between windows".
const AUTOTEST_ENV: &str = "DOCKVIEW_DEMO_AUTOTEST";

fn autotest() -> bool {
    std::env::var_os(AUTOTEST_ENV).is_some()
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
    let claim = hub.claim(&session, to).map_err(|err| err.to_string())?;
    deliver(&app, claim.release)?;
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
) -> tauri::Result<WebviewWindow> {
    let handle = app.clone();
    let mut builder = WebviewWindowBuilder::new(app, label, WebviewUrl::App("index.html".into()))
        .title(title)
        .inner_size(size.0, size.1)
        // Tauri's own drag-drop interception is the documented reason HTML5
        // drag-and-drop misbehaves in WebView2; the demo takes no file drops.
        .disable_drag_drop_handler()
        .on_new_window(move |url, features| open_related_window(&handle, url, features));

    if autotest() {
        builder = builder.initialization_script("window.__DOCKVIEW_AUTOTEST__ = true;");
    }

    builder.build()
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
    tauri::Builder::default()
        .manage(Hub::default())
        .setup(|app| {
            build_dock_window(app.handle(), "main", "dockview + Tauri", (1280.0, 820.0))?;

            // The harness needs two windows at known places from the start.
            if autotest() {
                eprintln!("{AUTOTEST_ENV} is set: opening dock-2 and reporting on stdout");
                let second = build_dock_window(
                    app.handle(),
                    "dock-2",
                    "dockview — dock-2",
                    (1000.0, 700.0),
                )?;
                second.set_position(tauri::PhysicalPosition::new(1300, 0))?;
            }
            Ok(())
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
            autotest_report
        ])
        .run(tauri::generate_context!())
        .expect("error while running the dockview tauri demo");
}
