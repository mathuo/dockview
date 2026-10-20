/**
 * The frontend half of the measurement harness. When the shell was started
 * with `DOCKVIEW_DEMO_AUTOTEST` set it injects a flag into every window;
 * this then reports where each panel's tab and content sit, and mirrors the
 * cross-window drag log, as JSON lines on the shell's stdout. The driver
 * script turns the geometry into real pointer drags with xdotool and reads
 * the log back to judge them. Inert otherwise.
 */

import type { DockviewApi, IDockviewPanel } from 'dockview';
import { autotestReport, onAutotestCommand } from './bridge';
import type { ShellMultiWindow } from './transport';

export function isAutotest(): boolean {
    return (
        (globalThis as { __DOCKVIEW_AUTOTEST__?: boolean })
            .__DOCKVIEW_AUTOTEST__ === true
    );
}

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

function rect(element: HTMLElement): Rect {
    const box = element.getBoundingClientRect();
    return {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
    };
}

function describe(panel: IDockviewPanel) {
    return {
        group: panel.group.id,
        tab: rect(panel.view.tab.element),
        content: rect(panel.view.content.element),
    };
}

export function installAutotest(
    api: DockviewApi,
    multiWindow: ShellMultiWindow
): void {
    if (!isAutotest()) {
        return;
    }

    const report = (kind: string, payload: unknown) => {
        void autotestReport(kind, payload).catch(() => {
            // the harness is best effort
        });
    };

    multiWindow.onLog((line) => report('log', line));
    void onAutotestCommand((command) => {
        if (command === 'detach') {
            multiWindow.detach = true;
            report('log', 'detach on');
        }
    });

    const geometry = () => {
        const panels: Record<string, ReturnType<typeof describe>> = {};
        for (const panel of api.panels) {
            panels[panel.id] = describe(panel);
        }
        report('rects', {
            panels,
            groups: api.groups.map((group) => group.id),
            dnd: api.dndCapabilities,
        });
    };

    // Layout changes arrive in bursts; report once they settle.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
        clearTimeout(timer);
        timer = setTimeout(geometry, 300);
    };
    api.onDidLayoutChange(schedule);
    schedule();
}
