/**
 * A window's side of the workspace. The orchestrator owns the file: it
 * creates every window from it and hands each one its layout at start, and
 * each window reports its layout back whenever it changes. The dockview
 * part stays here, `fromJSON` on the way in and `toJSON` on the way out; the
 * orchestrator stores the result without reading it.
 *
 * Like `crossWindowDnd.ts`, this reaches the orchestrator only through the
 * transport it is given.
 */

import type { DockviewApi, SerializedDockview } from 'dockview';

/** How a window reaches the orchestrator's workspace. */
export interface WorkspaceTransport {
    /** This window's identity, as the orchestrator names it. */
    label(): Promise<string>;
    /** The layout to start with, or null to build the window's defaults. */
    initialLayout(label: string): Promise<SerializedDockview | null>;
    /** Report the layout. Rejects if it names a panel another window holds. */
    layoutChanged(label: string, layout: SerializedDockview): Promise<void>;
}

export interface WorkspaceOptions {
    /** Builds the window's default layout when the orchestrator has none for it. */
    buildDefaults(label: string): void;
    /** How long after a change the layout is reported. */
    debounceMs?: number;
    onLog?(line: string): void;
}

export interface WindowWorkspace {
    /** Resolves once the window holds its initial layout, restored or default. */
    readonly ready: Promise<{ label: string; restored: boolean }>;
    dispose(): void;
}

export function installWorkspace(
    api: DockviewApi,
    transport: WorkspaceTransport,
    options: WorkspaceOptions
): WindowWorkspace {
    const debounceMs = options.debounceMs ?? 300;
    const log = options.onLog ?? (() => undefined);
    const teardown: (() => void)[] = [];
    let label = 'browser';
    let timer: ReturnType<typeof setTimeout> | undefined;

    const report = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            void transport
                .layoutChanged(label, api.toJSON())
                .catch((err: unknown) => {
                    log(`layout refused — ${String(err)}`);
                });
        }, debounceMs);
    };

    const ready = (async () => {
        label = await transport.label();
        const layout = await transport.initialLayout(label);
        let restored = false;

        if (layout) {
            try {
                api.fromJSON(layout);
                restored = true;
                log(`restored layout with ${api.panels.length} panel(s)`);
            } catch (err: unknown) {
                log(
                    `could not restore layout — ${String(err)}; building defaults`
                );
                api.clear();
                options.buildDefaults(label);
            }
        } else {
            options.buildDefaults(label);
        }

        // Only report from here on, so a half-built default layout and the
        // restore itself are not written back over what the file held.
        teardown.push(api.onDidLayoutChange(report).dispose);
        report();

        return { label, restored };
    })();

    return {
        ready,
        dispose() {
            clearTimeout(timer);
            for (const fn of teardown.splice(0)) {
                fn();
            }
        },
    };
}
