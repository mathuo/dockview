/**
 * The drag sessions an orchestrator tracks: announced by a source window,
 * claimed by at most one destination, or ended unclaimed. Pure state; the
 * orchestrator decides what to do with each outcome.
 */

import type { DragPayload } from './types';

export interface DragSession {
    from: string;
    payload: DragPayload;
}

interface Tracked extends DragSession {
    /** Set once the source reported its drag over; the value is `tearOff`. */
    ended?: boolean;
}

export interface Release {
    from: string;
    session: string;
    to: string;
}

export interface Claim {
    payload: DragPayload;
    release: Release;
}

export type DragEnd =
    | { outcome: 'settled' }
    | { outcome: 'discarded' }
    | { outcome: 'torn-off'; label: string; release: Release };

export class DragHub {
    private readonly sessions = new Map<string, Tracked>();
    private readonly pending = new Map<string, DragPayload>();

    start(session: string, drag: DragSession): void {
        this.sessions.set(session, { ...drag });
    }

    /** The payload of a drag in flight; throws otherwise. */
    peek(session: string): DragPayload {
        return this.inFlight(session).payload;
    }

    /** Take the drag for `to`. The first claim wins; a second throws. */
    claim(session: string, to: string): Claim {
        const taken = this.inFlight(session);
        this.sessions.delete(session);
        return {
            payload: taken.payload,
            release: { from: taken.from, session, to },
        };
    }

    /**
     * The source reported its drag over. Nothing happens yet; the drag
     * stays claimable until {@link expire}. Returns whether it was in
     * flight, so an already-claimed drag needs no expiry.
     */
    end(session: string, tearOff: boolean): boolean {
        const tracked = this.sessions.get(session);
        if (!tracked) {
            return false;
        }
        tracked.ended = tearOff;
        return true;
    }

    /**
     * Settle an ended drag nobody claimed: discard it, or, when the source
     * asked for a tear-off, park its payload under a new window label from
     * `newLabel` for that window to collect with {@link takePending}.
     */
    expire(session: string, newLabel: () => string): DragEnd {
        const tracked = this.sessions.get(session);
        if (!tracked || tracked.ended === undefined) {
            return { outcome: 'settled' };
        }
        this.sessions.delete(session);
        if (!tracked.ended) {
            return { outcome: 'discarded' };
        }
        const label = newLabel();
        this.pending.set(label, tracked.payload);
        return {
            outcome: 'torn-off',
            label,
            release: { from: tracked.from, session, to: label },
        };
    }

    /** The payload parked for a torn-off window, left in place. */
    peekPending(label: string): DragPayload | null {
        return this.pending.get(label) ?? null;
    }

    takePending(label: string): DragPayload | null {
        const payload = this.pending.get(label) ?? null;
        this.pending.delete(label);
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
