/**
 * A window's side of the workspace. The orchestrator owns the whole: it
 * knows every window, hands each one its layout at start, and each window
 * reports its layout back whenever it changes. The dockview part stays
 * here, `fromJSON` on the way in and `toJSON` on the way out; the
 * orchestrator stores the result without reading it.
 */

import type { DockviewApi } from 'dockview';
import type { MultiWindowTransport } from './types';

export interface WindowWorkspaceOptions {
    /** Builds the window's default layout when the orchestrator has none for it. */
    buildDefaults?(label: string): void;
    /** How long after a change the layout is reported. Default 300 ms. */
    debounceMs?: number;
    onLog?(line: string): void;
}

export interface WindowWorkspace {
    /** Resolves once the window holds its initial layout, restored or default. */
    readonly ready: Promise<{ label: string; restored: boolean }>;
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
    let label = '';
    let timer: ReturnType<typeof setTimeout> | undefined;

    const report = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            void transport
                .layoutChanged(label, api.toJSON())
                .catch((err: unknown) => {
                    log(`layout refused: ${String(err)}`);
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
                    `could not restore layout: ${String(err)}; building defaults`
                );
                api.clear();
                options.buildDefaults?.(label);
            }
        } else {
            options.buildDefaults?.(label);
        }

        // Only report from here on, so a half-built default layout and the
        // restore itself are not written back over what the orchestrator
        // held.
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
