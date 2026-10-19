use std::collections::HashMap;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::{
    webview::{NewWindowFeatures, NewWindowResponse},
    AppHandle, Emitter, Manager, State, Url, WebviewUrl, WebviewWindow, WebviewWindowBuilder,
};

/// Event carrying a serialized dockview layout between native windows.
const LAYOUT_EVENT: &str = "dockview:layout";

/// Event telling the window a drag started in that another window has taken
/// the dragged group, so it can remove its own copy.
const RELEASE_EVENT: &str = "dockview:release";

/// Labels for the windows a tear-off creates; see `POPOUT_COUNT`.
static TEAR_OFF_COUNT: AtomicUsize = AtomicUsize::new(0);

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

/// One group in flight between windows. The source window serializes the
/// group when the drag starts, so the drop can be completed from here alone
/// even if the source has become unresponsive by then.
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DragSession {
    from: String,
    /// `panel` for a single tab, `group` for a whole group.
    kind: String,
    /// A `SerializedDockviewGroup`, opaque to the shell.
    envelope: serde_json::Value,
}

/// The hub: the one place that knows which drag is in flight and which
/// window has claimed it. Windows are peers; none of them owns the others.
#[derive(Default)]
struct Hub {
    /// Drags in flight, keyed by the session id the source put on the
    /// drag's `DataTransfer`. Removed on claim or when the drag ends.
    sessions: Mutex<HashMap<String, DragSession>>,
    /// Groups waiting for a window that has not loaded yet, keyed by that
    /// window's label; see `open_window_with_group`.
    pending: Mutex<HashMap<String, serde_json::Value>>,
}

#[derive(Serialize, Clone)]
struct ReleaseNotice {
    session: String,
    to: String,
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
    let mut sessions = hub.sessions.lock().map_err(|err| err.to_string())?;
    sessions.insert(
        session,
        DragSession {
            from,
            kind,
            envelope,
        },
    );
    Ok(())
}

/// The destination window looks at a drag before claiming it, to refuse a
/// group whose panel ids it already holds without taking it from the source.
#[tauri::command]
fn peek_drag(hub: State<Hub>, session: String) -> Result<serde_json::Value, String> {
    let sessions = hub.sessions.lock().map_err(|err| err.to_string())?;
    sessions
        .get(&session)
        .map(|taken| taken.envelope.clone())
        .ok_or_else(|| format!("drag session {session} is not in flight"))
}

/// The destination window claims the drag it just received a drop for. The
/// first claim wins: the session is removed, its envelope returned to the
/// claimant, and the source told to release its copy. A second claim for the
/// same session, or a claim for a drag the shell never saw, is refused.
#[tauri::command]
fn claim_drop(
    app: AppHandle,
    hub: State<Hub>,
    session: String,
    to: String,
) -> Result<serde_json::Value, String> {
    let taken = {
        let mut sessions = hub.sessions.lock().map_err(|err| err.to_string())?;
        sessions.remove(&session)
    };

    let Some(taken) = taken else {
        return Err(format!("drag session {session} is not in flight"));
    };

    app.emit_to(&taken.from, RELEASE_EVENT, ReleaseNotice { session, to })
        .map_err(|err| err.to_string())?;

    Ok(taken.envelope)
}

/// The source window reports the end of its drag. An unclaimed session is
/// dropped, or, when the source asks and nothing claimed it, turned into a
/// new window holding the group: the hub's replacement for a popout.
#[tauri::command]
async fn drag_end(
    app: AppHandle,
    hub: State<'_, Hub>,
    session: String,
    tear_off: bool,
) -> Result<Option<String>, String> {
    let unclaimed = {
        let mut sessions = hub.sessions.lock().map_err(|err| err.to_string())?;
        sessions.remove(&session)
    };

    let Some(unclaimed) = unclaimed else {
        return Ok(None);
    };

    if !tear_off {
        return Ok(None);
    }

    let label = format!("dock-torn-{}", TEAR_OFF_COUNT.fetch_add(1, Ordering::Relaxed));
    open_window_with_group(&app, &hub, &label, unclaimed.envelope)?;

    app.emit_to(
        &unclaimed.from,
        RELEASE_EVENT,
        ReleaseNotice {
            session,
            to: label.clone(),
        },
    )
    .map_err(|err| err.to_string())?;

    Ok(Some(label))
}

/// Builds a window that will start with `envelope` as its only group. The
/// window's frontend collects it with `take_pending_group` once dockview is
/// ready, since nothing can be pushed into a webview before it has loaded.
fn open_window_with_group(
    app: &AppHandle,
    hub: &Hub,
    label: &str,
    envelope: serde_json::Value,
) -> Result<(), String> {
    {
        let mut pending = hub.pending.lock().map_err(|err| err.to_string())?;
        pending.insert(label.to_string(), envelope);
    }

    build_dock_window(app, label, &format!("dockview — {label}"), (900.0, 600.0))
        .map_err(|err| err.to_string())?;

    Ok(())
}

/// A freshly loaded window asks whether a group is waiting for it.
#[tauri::command]
fn take_pending_group(
    hub: State<Hub>,
    label: String,
) -> Result<Option<serde_json::Value>, String> {
    let mut pending = hub.pending.lock().map_err(|err| err.to_string())?;
    Ok(pending.remove(&label))
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
    WebviewWindowBuilder::new(app, label, WebviewUrl::App("index.html".into()))
        .title(title)
        .inner_size(size.0, size.1)
        // Tauri's own drag-drop interception is the documented reason HTML5
        // drag-and-drop misbehaves in WebView2; the demo takes no file drops.
        .disable_drag_drop_handler()
        .on_new_window(move |url, features| open_related_window(&handle, url, features))
        .build()
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
            take_pending_group
        ])
        .run(tauri::generate_context!())
        .expect("error while running the dockview tauri demo");
}
