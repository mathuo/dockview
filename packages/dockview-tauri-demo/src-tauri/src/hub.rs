//! The orchestrator: the one party that knows which drag is in flight
//! between windows and which window has claimed it.
//!
//! Windows are peers. Each runs its own dockview instance in its own
//! JavaScript context, so a group moving between two of them is a copy:
//! serialized by the source when the drag starts, rebuilt by the destination
//! when the drop lands, and only then removed from the source. This module
//! holds that in-flight state and decides who wins. It knows nothing about
//! Tauri, windows or IPC: the shell wraps each method in a command and
//! delivers the [`Release`] notices this module hands back. That boundary is
//! deliberate, so the module can one day be lifted into a crate of its own
//! and sit behind any host, not only Tauri.
//!
//! The serialized group is opaque here: a `serde_json::Value` that the
//! frontend produces with `serializeGroup` and consumes with
//! `addGroupFromJSON`. The orchestrator never looks inside it.

use std::collections::HashMap;
use std::fmt;
use std::sync::{Mutex, PoisonError};

use serde::{Deserialize, Serialize};
use serde_json::Value;

/// One group in flight between windows.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DragSession {
    /// The window the drag started in; the one told to let go on a claim.
    pub from: String,
    /// `panel` for a single tab, `group` for a whole group. The frontend
    /// uses it to know what to remove on release; the orchestrator does not.
    pub kind: String,
    /// A `SerializedDockviewGroup`, opaque here.
    pub envelope: Value,
}

/// Tells the source window that another window has taken its group.
#[derive(Clone, Debug, Serialize, PartialEq)]
pub struct Release {
    /// The window to deliver this to.
    pub from: String,
    pub session: String,
    /// The window that took the group.
    pub to: String,
}

/// A successful claim: the group for the claimant, and the notice for the
/// source.
#[derive(Clone, Debug, PartialEq)]
pub struct Claim {
    pub envelope: Value,
    pub release: Release,
}

/// What became of a drag the source reported over.
#[derive(Clone, Debug, PartialEq)]
pub enum DragEnd {
    /// Nothing was in flight under that id: a window claimed it already, or
    /// the drag was never announced.
    Settled,
    /// The drag was unclaimed and has been forgotten.
    Discarded,
    /// The drag was unclaimed and the source asked for it to live on: the
    /// group now waits under `label` for a window of that name to collect
    /// it with [`Hub::take_pending`], and the source is told to let go.
    TornOff { label: String, release: Release },
}

#[derive(Debug, PartialEq)]
pub enum HubError {
    /// No drag under that session id: claimed already, ended, or never
    /// announced.
    NotInFlight(String),
    /// A lock was poisoned by a panic elsewhere; the state is suspect.
    Poisoned,
}

impl fmt::Display for HubError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            HubError::NotInFlight(session) => {
                write!(f, "drag session {session} is not in flight")
            }
            HubError::Poisoned => write!(f, "the drag hub's state is poisoned"),
        }
    }
}

impl std::error::Error for HubError {}

impl<T> From<PoisonError<T>> for HubError {
    fn from(_: PoisonError<T>) -> Self {
        HubError::Poisoned
    }
}

/// The in-flight state. One instance per host process.
#[derive(Default)]
pub struct Hub {
    /// Drags in flight, keyed by the session id the source put on the
    /// drag's `DataTransfer`. Removed on claim or when the drag ends.
    sessions: Mutex<HashMap<String, DragSession>>,
    /// Groups waiting for a window that has not loaded yet, keyed by that
    /// window's label.
    pending: Mutex<HashMap<String, Value>>,
}

impl Hub {
    /// The source announces a drag, handing over the serialized group so the
    /// drop can be completed from here alone, even if the source is busy or
    /// gone by then.
    pub fn start(&self, session: String, drag: DragSession) -> Result<(), HubError> {
        self.sessions.lock()?.insert(session, drag);
        Ok(())
    }

    /// A destination reads the group before deciding to claim it, so it can
    /// refuse one it cannot take without the source letting go.
    pub fn peek(&self, session: &str) -> Result<Value, HubError> {
        self.sessions
            .lock()?
            .get(session)
            .map(|drag| drag.envelope.clone())
            .ok_or_else(|| HubError::NotInFlight(session.to_string()))
    }

    /// A destination claims the drop. The first claim wins: the session is
    /// removed under the lock, so a second claimant finds nothing.
    pub fn claim(&self, session: &str, to: String) -> Result<Claim, HubError> {
        let taken = self
            .sessions
            .lock()?
            .remove(session)
            .ok_or_else(|| HubError::NotInFlight(session.to_string()))?;

        Ok(Claim {
            envelope: taken.envelope,
            release: Release {
                from: taken.from,
                session: session.to_string(),
                to,
            },
        })
    }

    /// The source reports its drag over. An unclaimed drag is discarded, or,
    /// when `tear_off` is set, parked under the label `new_label` yields for
    /// a new window to collect.
    pub fn end(
        &self,
        session: &str,
        tear_off: bool,
        new_label: impl FnOnce() -> String,
    ) -> Result<DragEnd, HubError> {
        let Some(unclaimed) = self.sessions.lock()?.remove(session) else {
            return Ok(DragEnd::Settled);
        };

        if !tear_off {
            return Ok(DragEnd::Discarded);
        }

        let label = new_label();
        self.pending
            .lock()?
            .insert(label.clone(), unclaimed.envelope);

        Ok(DragEnd::TornOff {
            release: Release {
                from: unclaimed.from,
                session: session.to_string(),
                to: label.clone(),
            },
            label,
        })
    }

    /// A freshly loaded window collects the group parked for it, if any.
    pub fn take_pending(&self, label: &str) -> Result<Option<Value>, HubError> {
        Ok(self.pending.lock()?.remove(label))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn drag(from: &str) -> DragSession {
        DragSession {
            from: from.to_string(),
            kind: "panel".to_string(),
            envelope: json!({ "group": { "id": "g", "views": ["p"] }, "panels": {} }),
        }
    }

    #[test]
    fn a_claim_returns_the_group_and_releases_the_source() {
        let hub = Hub::default();
        hub.start("s1".into(), drag("main")).unwrap();

        let claim = hub.claim("s1", "dock-2".into()).unwrap();

        assert_eq!(claim.envelope, drag("main").envelope);
        assert_eq!(
            claim.release,
            Release {
                from: "main".into(),
                session: "s1".into(),
                to: "dock-2".into()
            }
        );
    }

    #[test]
    fn the_first_claim_wins() {
        let hub = Hub::default();
        hub.start("s1".into(), drag("main")).unwrap();

        hub.claim("s1", "dock-2".into()).unwrap();

        assert_eq!(
            hub.claim("s1", "dock-3".into()),
            Err(HubError::NotInFlight("s1".into()))
        );
    }

    #[test]
    fn a_peek_leaves_the_drag_in_flight() {
        let hub = Hub::default();
        hub.start("s1".into(), drag("main")).unwrap();

        assert_eq!(hub.peek("s1").unwrap(), drag("main").envelope);
        assert!(hub.claim("s1", "dock-2".into()).is_ok());
    }

    #[test]
    fn an_unknown_session_is_refused() {
        let hub = Hub::default();

        assert_eq!(hub.peek("nope"), Err(HubError::NotInFlight("nope".into())));
        assert_eq!(
            hub.claim("nope", "dock-2".into()),
            Err(HubError::NotInFlight("nope".into()))
        );
    }

    #[test]
    fn ending_a_claimed_drag_is_settled() {
        let hub = Hub::default();
        hub.start("s1".into(), drag("main")).unwrap();
        hub.claim("s1", "dock-2".into()).unwrap();

        assert_eq!(
            hub.end("s1", true, || "x".into()).unwrap(),
            DragEnd::Settled
        );
    }

    #[test]
    fn ending_an_unclaimed_drag_discards_it() {
        let hub = Hub::default();
        hub.start("s1".into(), drag("main")).unwrap();

        assert_eq!(
            hub.end("s1", false, || "x".into()).unwrap(),
            DragEnd::Discarded
        );
        assert_eq!(hub.peek("s1"), Err(HubError::NotInFlight("s1".into())));
    }

    #[test]
    fn a_tear_off_parks_the_group_for_the_new_window() {
        let hub = Hub::default();
        hub.start("s1".into(), drag("main")).unwrap();

        let ended = hub.end("s1", true, || "dock-torn-0".into()).unwrap();

        assert_eq!(
            ended,
            DragEnd::TornOff {
                label: "dock-torn-0".into(),
                release: Release {
                    from: "main".into(),
                    session: "s1".into(),
                    to: "dock-torn-0".into()
                }
            }
        );
        assert_eq!(
            hub.take_pending("dock-torn-0").unwrap(),
            Some(drag("main").envelope)
        );
        // Collected once.
        assert_eq!(hub.take_pending("dock-torn-0").unwrap(), None);
    }

    #[test]
    fn a_window_with_nothing_parked_gets_none() {
        let hub = Hub::default();
        assert_eq!(hub.take_pending("main").unwrap(), None);
    }
}
