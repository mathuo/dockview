//! One ordered undo history across every window.
//!
//! Each window keeps dockview's own undo stack for the steps it made itself;
//! this module only sequences. It records a marker for every step a window
//! pushed locally and a full entry for every move between windows, in the
//! order they happened, and undo or redo hands the host the actions to take:
//! tell a window to undo or redo its own top step, or apply a layout the
//! orchestrator holds. Ordering is what makes cross-window undo safe: a
//! window's older local step is only reachable after the move that followed
//! it has been undone, which puts the moved panels back first, so a snapshot
//! can never resurrect a panel that now lives elsewhere.
//!
//! A move is recorded in two halves, one from each window, since each sees
//! only its own layout before and after. Like `hub.rs` and `workspace.rs`
//! this knows nothing about Tauri; layouts are opaque `serde_json::Value`s.

use std::fmt;
use std::sync::{Mutex, PoisonError};

use serde::Serialize;
use serde_json::Value;

/// How many steps are kept. Each move holds four layouts, so this bounds
/// memory as well as reach.
pub const DEPTH: usize = 50;

/// Which end of a move a window reported.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    From,
    To,
}

/// One window's view of a move: its layout before and after.
#[derive(Clone, Debug, PartialEq)]
pub struct Half {
    pub window: String,
    pub before: Value,
    pub after: Value,
}

#[derive(Clone, Debug, PartialEq)]
pub enum Entry {
    /// A step one window recorded in its own history.
    Local { window: String },
    /// A move between windows, keyed by the drag session that made it.
    Move {
        session: String,
        panels: Vec<String>,
        from: Option<Half>,
        to: Option<Half>,
    },
}

impl Entry {
    fn describe(&self) -> String {
        match self {
            Entry::Local { window } => format!("step in {window}"),
            Entry::Move {
                panels, from, to, ..
            } => format!(
                "move of {} from {} to {}",
                panels.join(", "),
                from.as_ref().map_or("?", |half| half.window.as_str()),
                to.as_ref().map_or("?", |half| half.window.as_str()),
            ),
        }
    }
}

/// What the host does to carry out an undo or redo, in order.
#[derive(Clone, Debug, PartialEq)]
pub enum Action {
    /// Tell the window to undo its own top step.
    UndoLocal { window: String },
    /// Tell the window to redo its own top step.
    RedoLocal { window: String },
    /// Replace the window's layout with one the orchestrator holds.
    ApplyLayout { window: String, layout: Value },
}

/// What was undone or redone, for the host to announce.
#[derive(Clone, Debug, PartialEq)]
pub struct Step {
    pub actions: Vec<Action>,
    /// Set when the step was a move between windows.
    pub moved: Option<Moved>,
}

#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Moved {
    pub session: String,
    pub panels: Vec<String>,
    pub from: String,
    pub to: String,
}

#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Info {
    pub undo_count: usize,
    pub redo_count: usize,
    pub next_undo: Option<String>,
    pub next_redo: Option<String>,
}

#[derive(Debug, PartialEq)]
pub enum HistoryError {
    Nothing,
    /// The top step is a move one window has not finished reporting.
    Incomplete(String),
    Poisoned,
}

impl fmt::Display for HistoryError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            HistoryError::Nothing => write!(f, "nothing to do"),
            HistoryError::Incomplete(session) => {
                write!(f, "move {session} is still being recorded")
            }
            HistoryError::Poisoned => write!(f, "the history's state is poisoned"),
        }
    }
}

impl std::error::Error for HistoryError {}

impl<T> From<PoisonError<T>> for HistoryError {
    fn from(_: PoisonError<T>) -> Self {
        HistoryError::Poisoned
    }
}

#[derive(Default)]
struct Stacks {
    undo: Vec<Entry>,
    redo: Vec<Entry>,
}

#[derive(Default)]
pub struct History {
    stacks: Mutex<Stacks>,
}

impl History {
    /// A window recorded a step of its own. Clears redo, as any new step does.
    pub fn push_local(&self, window: &str) -> Result<(), HistoryError> {
        let mut stacks = self.stacks.lock()?;
        stacks.undo.push(Entry::Local {
            window: window.to_string(),
        });
        stacks.redo.clear();
        trim(&mut stacks.undo);
        Ok(())
    }

    /// One window reports its half of a move. The first half to arrive
    /// places the move in the order; the second completes it.
    pub fn record_move(
        &self,
        session: &str,
        panels: &[String],
        role: Role,
        half: Half,
    ) -> Result<(), HistoryError> {
        let mut stacks = self.stacks.lock()?;

        let existing = stacks.undo.iter_mut().find(
            |entry| matches!(entry, Entry::Move { session: recorded, .. } if recorded == session),
        );

        match existing {
            Some(Entry::Move { from, to, .. }) => match role {
                Role::From => *from = Some(half),
                Role::To => *to = Some(half),
            },
            _ => {
                let (from, to) = match role {
                    Role::From => (Some(half), None),
                    Role::To => (None, Some(half)),
                };
                stacks.undo.push(Entry::Move {
                    session: session.to_string(),
                    panels: panels.to_vec(),
                    from,
                    to,
                });
                stacks.redo.clear();
                trim(&mut stacks.undo);
            }
        }
        Ok(())
    }

    pub fn undo(&self) -> Result<Step, HistoryError> {
        let mut stacks = self.stacks.lock()?;
        let entry = stacks.undo.last().ok_or(HistoryError::Nothing)?;
        let step = match entry {
            Entry::Local { window } => Step {
                actions: vec![Action::UndoLocal {
                    window: window.clone(),
                }],
                moved: None,
            },
            Entry::Move {
                session,
                panels,
                from,
                to,
            } => {
                let (from, to) = complete(session, from, to)?;
                // Take the panels out of the destination before putting them
                // back in the source, so no two windows hold them at once.
                Step {
                    actions: vec![
                        Action::ApplyLayout {
                            window: to.window.clone(),
                            layout: to.before.clone(),
                        },
                        Action::ApplyLayout {
                            window: from.window.clone(),
                            layout: from.before.clone(),
                        },
                    ],
                    moved: Some(Moved {
                        session: session.clone(),
                        panels: panels.clone(),
                        // Undone, the panels travel back.
                        from: to.window.clone(),
                        to: from.window.clone(),
                    }),
                }
            }
        };
        let entry = stacks.undo.pop().expect("checked above");
        stacks.redo.push(entry);
        Ok(step)
    }

    pub fn redo(&self) -> Result<Step, HistoryError> {
        let mut stacks = self.stacks.lock()?;
        let entry = stacks.redo.last().ok_or(HistoryError::Nothing)?;
        let step = match entry {
            Entry::Local { window } => Step {
                actions: vec![Action::RedoLocal {
                    window: window.clone(),
                }],
                moved: None,
            },
            Entry::Move {
                session,
                panels,
                from,
                to,
            } => {
                let (from, to) = complete(session, from, to)?;
                Step {
                    actions: vec![
                        Action::ApplyLayout {
                            window: from.window.clone(),
                            layout: from.after.clone(),
                        },
                        Action::ApplyLayout {
                            window: to.window.clone(),
                            layout: to.after.clone(),
                        },
                    ],
                    moved: Some(Moved {
                        session: session.clone(),
                        panels: panels.clone(),
                        from: from.window.clone(),
                        to: to.window.clone(),
                    }),
                }
            }
        };
        let entry = stacks.redo.pop().expect("checked above");
        stacks.undo.push(entry);
        Ok(step)
    }

    pub fn info(&self) -> Result<Info, HistoryError> {
        let stacks = self.stacks.lock()?;
        Ok(Info {
            undo_count: stacks.undo.len(),
            redo_count: stacks.redo.len(),
            next_undo: stacks.undo.last().map(Entry::describe),
            next_redo: stacks.redo.last().map(Entry::describe),
        })
    }

    /// Forget a window's steps, when it closes.
    pub fn forget_window(&self, window: &str) -> Result<(), HistoryError> {
        let mut stacks = self.stacks.lock()?;
        let involves = |entry: &Entry| match entry {
            Entry::Local { window: w } => w == window,
            Entry::Move { from, to, .. } => {
                from.as_ref().is_some_and(|half| half.window == window)
                    || to.as_ref().is_some_and(|half| half.window == window)
            }
        };
        stacks.undo.retain(|entry| !involves(entry));
        stacks.redo.retain(|entry| !involves(entry));
        Ok(())
    }
}

fn complete<'a>(
    session: &str,
    from: &'a Option<Half>,
    to: &'a Option<Half>,
) -> Result<(&'a Half, &'a Half), HistoryError> {
    match (from, to) {
        (Some(from), Some(to)) => Ok((from, to)),
        _ => Err(HistoryError::Incomplete(session.to_string())),
    }
}

fn trim(stack: &mut Vec<Entry>) {
    while stack.len() > DEPTH {
        stack.remove(0);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn half(window: &str, before: &str, after: &str) -> Half {
        Half {
            window: window.into(),
            before: json!({ "state": before }),
            after: json!({ "state": after }),
        }
    }

    fn moved(history: &History) {
        history
            .record_move("s1", &["p".into()], Role::From, half("main", "A0", "A1"))
            .unwrap();
        history
            .record_move("s1", &["p".into()], Role::To, half("dock-2", "B0", "B1"))
            .unwrap();
    }

    #[test]
    fn a_local_step_undoes_and_redoes_in_its_window() {
        let history = History::default();
        history.push_local("main").unwrap();

        assert_eq!(
            history.undo().unwrap().actions,
            vec![Action::UndoLocal {
                window: "main".into()
            }]
        );
        assert_eq!(
            history.redo().unwrap().actions,
            vec![Action::RedoLocal {
                window: "main".into()
            }]
        );
    }

    #[test]
    fn a_move_undoes_destination_first_then_source_with_before_layouts() {
        let history = History::default();
        moved(&history);

        let step = history.undo().unwrap();

        assert_eq!(
            step.actions,
            vec![
                Action::ApplyLayout {
                    window: "dock-2".into(),
                    layout: json!({ "state": "B0" })
                },
                Action::ApplyLayout {
                    window: "main".into(),
                    layout: json!({ "state": "A0" })
                },
            ]
        );
        assert_eq!(
            step.moved,
            Some(Moved {
                session: "s1".into(),
                panels: vec!["p".into()],
                from: "dock-2".into(),
                to: "main".into()
            })
        );
    }

    #[test]
    fn a_move_redoes_source_first_then_destination_with_after_layouts() {
        let history = History::default();
        moved(&history);
        history.undo().unwrap();

        let step = history.redo().unwrap();

        assert_eq!(
            step.actions,
            vec![
                Action::ApplyLayout {
                    window: "main".into(),
                    layout: json!({ "state": "A1" })
                },
                Action::ApplyLayout {
                    window: "dock-2".into(),
                    layout: json!({ "state": "B1" })
                },
            ]
        );
        assert_eq!(step.moved.unwrap().to, "dock-2");
    }

    #[test]
    fn the_halves_may_arrive_in_either_order() {
        let history = History::default();
        history
            .record_move("s1", &["p".into()], Role::To, half("dock-2", "B0", "B1"))
            .unwrap();
        history
            .record_move("s1", &["p".into()], Role::From, half("main", "A0", "A1"))
            .unwrap();

        assert_eq!(history.info().unwrap().undo_count, 1);
        assert!(history.undo().is_ok());
    }

    #[test]
    fn an_incomplete_move_cannot_be_undone_yet() {
        let history = History::default();
        history
            .record_move("s1", &["p".into()], Role::From, half("main", "A0", "A1"))
            .unwrap();

        assert_eq!(history.undo(), Err(HistoryError::Incomplete("s1".into())));
        // Still on the stack for when the other half arrives.
        assert_eq!(history.info().unwrap().undo_count, 1);
    }

    #[test]
    fn steps_unwind_in_the_order_they_happened_across_windows() {
        let history = History::default();
        history.push_local("main").unwrap();
        moved(&history);
        history.push_local("dock-2").unwrap();

        assert_eq!(
            history.undo().unwrap().actions,
            vec![Action::UndoLocal {
                window: "dock-2".into()
            }]
        );
        assert!(history.undo().unwrap().moved.is_some());
        assert_eq!(
            history.undo().unwrap().actions,
            vec![Action::UndoLocal {
                window: "main".into()
            }]
        );
        assert_eq!(history.undo(), Err(HistoryError::Nothing));
    }

    #[test]
    fn a_new_step_clears_redo() {
        let history = History::default();
        history.push_local("main").unwrap();
        history.undo().unwrap();
        assert_eq!(history.info().unwrap().redo_count, 1);

        history.push_local("dock-2").unwrap();

        assert_eq!(history.info().unwrap().redo_count, 0);
        assert_eq!(history.redo(), Err(HistoryError::Nothing));
    }

    #[test]
    fn the_stack_is_bounded() {
        let history = History::default();
        for _ in 0..(DEPTH + 10) {
            history.push_local("main").unwrap();
        }
        assert_eq!(history.info().unwrap().undo_count, DEPTH);
    }

    #[test]
    fn a_closed_window_takes_its_steps_with_it() {
        let history = History::default();
        history.push_local("main").unwrap();
        moved(&history);
        history.push_local("dock-2").unwrap();

        history.forget_window("dock-2").unwrap();

        let info = history.info().unwrap();
        assert_eq!(info.undo_count, 1);
        assert_eq!(info.next_undo.as_deref(), Some("step in main"));
    }

    #[test]
    fn info_describes_the_next_steps() {
        let history = History::default();
        moved(&history);
        assert_eq!(
            history.info().unwrap().next_undo.as_deref(),
            Some("move of p from main to dock-2")
        );
        history.undo().unwrap();
        assert_eq!(
            history.info().unwrap().next_redo.as_deref(),
            Some("move of p from main to dock-2")
        );
    }
}
