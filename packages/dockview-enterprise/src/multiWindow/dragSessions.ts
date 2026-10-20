/**
 * The drag sessions an orchestrator tracks: announced by a source window,
 * accepted by at most one destination, or ended unaccepted. Pure state; the
 * orchestrator decides what to do with each outcome.
 */

import type { DragPayload } from './types';

export interface DragSession {
    from: string;
    payload: DragPayload;
}

interface Tracked extends DragSession {
    /** Set once the source reported its drag over; the value is `detach`. */
    ended?: boolean;
}

export interface Release {
    from: string;
    session: string;
    to: string;
}

export interface Accept {
    payload: DragPayload;
    release: Release;
}

export type DragEnd =
    | { outcome: 'settled' }
    | { outcome: 'discarded' }
    | { outcome: 'detached'; windowId: string; release: Release };

export class DragSessions {
    private readonly sessions = new Map<string, Tracked>();
    private readonly pending = new Map<string, DragPayload>();

    start(session: string, drag: DragSession): void {
        this.sessions.set(session, { ...drag });
    }

    /** The payload of a drag in flight; throws otherwise. */
    peek(session: string): DragPayload {
        return this.inFlight(session).payload;
    }

    /** Take the drag for `to`. The first accept wins; a second throws. */
    accept(session: string, to: string): Accept {
        const taken = this.inFlight(session);
        this.sessions.delete(session);
        return {
            payload: taken.payload,
            release: { from: taken.from, session, to },
        };
    }

    /**
     * The source reported its drag over. Nothing happens yet; the drag
     * stays acceptable until {@link expire}. Returns whether it was in
     * flight, so an already-accepted drag needs no expiry.
     */
    end(session: string, detach: boolean): boolean {
        const tracked = this.sessions.get(session);
        if (!tracked) {
            return false;
        }
        tracked.ended = detach;
        return true;
    }

    /**
     * Settle an ended drag nobody accepted: discard it, or, when the source
     * asked for a detach, park its payload under a new window windowId from
     * `newWindowId` for that window to collect with {@link takeDetachedDrag}.
     */
    expire(session: string, newWindowId: () => string): DragEnd {
        const tracked = this.sessions.get(session);
        if (tracked?.ended === undefined) {
            return { outcome: 'settled' };
        }
        this.sessions.delete(session);
        if (!tracked.ended) {
            return { outcome: 'discarded' };
        }
        const windowId = newWindowId();
        this.pending.set(windowId, tracked.payload);
        return {
            outcome: 'detached',
            windowId,
            release: { from: tracked.from, session, to: windowId },
        };
    }

    /** The payload parked for a detached window, left in place. */
    peekPending(windowId: string): DragPayload | null {
        return this.pending.get(windowId) ?? null;
    }

    takeDetachedDrag(windowId: string): DragPayload | null {
        const payload = this.pending.get(windowId) ?? null;
        this.pending.delete(windowId);
        return payload;
    }

    private inFlight(session: string): Tracked {
        const tracked = this.sessions.get(session);
        if (!tracked) {
            throw new Error(`drag session ${session} is not in flight`);
        }
        return tracked;
    }
}
