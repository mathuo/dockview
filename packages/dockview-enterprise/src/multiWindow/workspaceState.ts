/**
 * The windows an orchestrator knows and what each holds: a frame, for the
 * party that creates windows, and a dockview layout as opaque JSON. The one
 * thing read out of a layout is its panel ids, to refuse giving two windows
 * the same panel.
 */

import type { SerializedDockview } from 'dockview';

export const WORKSPACE_FORMAT_VERSION = 1;

export interface WindowGeometry {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface WindowRecord {
    id: string;
    geometry?: WindowGeometry;
    layout?: SerializedDockview;
}

/** The whole workspace, in the shape a host persists. */
export interface WorkspaceState {
    version: number;
    windows: WindowRecord[];
}

/**
 * A move the orchestrator announced: until the source reports the panel
 * gone, the destination may report it held without that counting as a
 * duplicate. The two windows of a move report in either order.
 */
interface PendingMove {
    panel: string;
    from: string;
    to: string;
}

export class WorkspaceRegistry {
    private readonly windows: WindowRecord[];
    private readonly pending: PendingMove[] = [];

    constructor(state?: WorkspaceState) {
        if (state && state.version !== WORKSPACE_FORMAT_VERSION) {
            throw new Error(
                `workspace format ${state.version} is not the supported ${WORKSPACE_FORMAT_VERSION}`
            );
        }
        this.windows = clone(state?.windows ?? []);
    }

    snapshot(): WorkspaceState {
        return {
            version: WORKSPACE_FORMAT_VERSION,
            windows: clone(this.windows),
        };
    }

    windowIds(): string[] {
        return this.windows.map((window) => window.id);
    }

    window(windowId: string): WindowRecord | undefined {
        const record = this.windows.find((window) => window.id === windowId);
        return record ? clone(record) : undefined;
    }

    ensureWindow(windowId: string): void {
        this.entry(windowId);
    }

    expectMove(panels: string[], from: string, to: string): void {
        for (const panel of panels) {
            const index = this.pending.findIndex(
                (entry) => entry.panel === panel
            );
            if (index !== -1) {
                this.pending.splice(index, 1);
            }
            this.pending.push({ panel, from, to });
        }
    }

    setGeometry(windowId: string, geometry: WindowGeometry): void {
        this.entry(windowId).geometry = { ...geometry };
    }

    /**
     * Store a window's reported layout, refusing one that names a panel
     * another window's stored layout holds, unless an announced move
     * explains it.
     */
    setLayout(windowId: string, layout: SerializedDockview): void {
        const incoming = panelIds(layout);
        for (const other of this.windows) {
            if (other.id === windowId || !other.layout) {
                continue;
            }
            const theirs = new Set(panelIds(other.layout));
            const duplicate = incoming.find(
                (id) =>
                    theirs.has(id) &&
                    !this.pending.some(
                        (entry) =>
                            entry.panel === id &&
                            entry.from === other.id &&
                            entry.to === windowId
                    )
            );
            if (duplicate) {
                throw new Error(
                    `panel ${duplicate} is already held by window ${other.id}`
                );
            }
        }
        // A source reporting without the panel completes the move.
        const kept = this.pending.filter(
            (entry) => entry.from !== windowId || incoming.includes(entry.panel)
        );
        this.pending.splice(0, this.pending.length, ...kept);
        this.entry(windowId).layout = clone(layout);
    }

    /** Store a layout the orchestrator itself applied, which it trusts. */
    setLayoutUnchecked(windowId: string, layout: SerializedDockview): void {
        this.entry(windowId).layout = clone(layout);
    }

    loadLayout(windowId: string): SerializedDockview | null {
        const record = this.windows.find((window) => window.id === windowId);
        return record?.layout ? clone(record.layout) : null;
    }

    removeWindow(windowId: string): WindowRecord | undefined {
        const index = this.windows.findIndex(
            (window) => window.id === windowId
        );
        if (index === -1) {
            return undefined;
        }
        return this.windows.splice(index, 1)[0];
    }

    private entry(windowId: string): WindowRecord {
        let record = this.windows.find((window) => window.id === windowId);
        if (!record) {
            record = { id: windowId };
            this.windows.push(record);
        }
        return record;
    }
}

function panelIds(layout: SerializedDockview): string[] {
    return Object.keys(layout.panels ?? {});
}

/** Layouts and records are plain JSON; copy them so callers cannot alias state. */
function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
}
