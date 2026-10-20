/**
 * A window's side of the workspace. The orchestrator owns the whole: it
 * knows every window, hands each one its layout at start, and each window
 * reports its layout back whenever it changes. The dockview part stays
 * here, `fromJSON` on the way in and `toJSON` on the way out; the
 * orchestrator stores the result without reading it.
 */

import type { DockviewApi, SerializedDockview } from 'dockview';
import type { MultiWindowTransport } from './types';

export interface WindowWorkspaceOptions {
    /** Builds the window's default layout when the orchestrator has none for it. */
    buildDefaults?(windowId: string): void;
    /** How long after a change the layout is reported. Default 300 ms. */
    debounceMs?: number;
    onLog?(line: string): void;
}

export interface WindowWorkspace {
    /** Resolves once the window holds its initial layout, restored or default. */
    readonly ready: Promise<{ windowId: string; restored: boolean }>;
    dispose(): void;
}

export function installWindowWorkspace(
    api: DockviewApi,
    transport: MultiWindowTransport,
    options: WindowWorkspaceOptions = {}
): WindowWorkspace {
    const debounceMs = options.debounceMs ?? 300;
    const log = options.onLog ?? (() => undefined);
    const teardown: (() => void)[] = [];
    let windowId = '';
    let timer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;

    const report = () => {
        clearTimeout(timer);
        if (disposed) {
            return;
        }
        timer = setTimeout(() => {
            void transport
                .reportLayout(windowId, api.toJSON())
                .catch((err: unknown) => {
                    log(`layout refused: ${String(err)}`);
                });
        }, debounceMs);
    };

    const ready = (async () => {
        let layout: SerializedDockview | null = null;
        try {
            windowId = await transport.windowId();
            layout = await transport.loadLayout(windowId);
        } catch (err: unknown) {
            // The orchestrator could not be reached: the window still has to
            // show something, and may reach it later.
            log(
                `no layout from the orchestrator: ${String(err)}; building defaults`
            );
        }
        let restored = false;

        if (disposed) {
            return { windowId, restored };
        }

        if (layout) {
            try {
                api.fromJSON(layout);
                restored = true;
                log(`restored layout with ${api.panels.length} panel(s)`);
            } catch (err: unknown) {
                log(
                    `could not restore layout: ${String(err)}; building defaults`
                );
                api.clear();
                options.buildDefaults?.(windowId);
            }
        } else {
            options.buildDefaults?.(windowId);
        }

        // Only report from here on, so a half-built default layout and the
        // restore itself are not written back over what the orchestrator
        // held.
        if (!disposed) {
            teardown.push(api.onDidLayoutChange(report).dispose);
            report();
        }

        return { windowId, restored };
    })();

    return {
        ready,
        dispose() {
            disposed = true;
            clearTimeout(timer);
            for (const fn of teardown.splice(0)) {
                fn();
            }
        },
    };
}
