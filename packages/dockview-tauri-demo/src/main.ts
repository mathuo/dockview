import 'dockview/dist/styles/dockview.css';
import './styles.css';

// Importing the enterprise package registers its feature modules for every
// dockview instance in this webview.
import 'dockview-enterprise';

import { createDockview, type IContentRenderer, themeAbyss } from 'dockview';
import type { SharedHistory } from 'dockview-enterprise';
import { installAutotest } from './autotest';
import { closeNativePopout } from './bridge';
import { resolveDndStrategy } from './dnd';
import {
    type Hub,
    installHistory,
    installHub,
    installWorkspace,
    randomId,
} from './hub';
import {
    HistoryPanel,
    HostPanel,
    HubPanel,
    LayoutSyncPanel,
    NativeWindowPanel,
    PopoutPanel,
    ScratchPanel,
    WorkspacePanel,
} from './panels';

// Assigned once the instance exists; the hub panel is created lazily by
// dockview, after that.
let hub: Hub | undefined;
let history: SharedHistory | undefined;

const renderers: Record<string, () => IContentRenderer> = {
    host: () => new HostPanel(),
    popout: () => new PopoutPanel(),
    native: () => new NativeWindowPanel(),
    sync: () => new LayoutSyncPanel(),
    hub: () => new HubPanel(() => hub),
    workspace: () => new WorkspacePanel(),
    history: () =>
        new HistoryPanel(
            () => history,
            () => hub
        ),
    scratch: () => new ScratchPanel(),
};

const container = document.getElementById('app');

if (!container) {
    throw new Error('missing #app container');
}

const dndStrategy = resolveDndStrategy();

const api = createDockview(container, {
    theme: themeAbyss,
    dndStrategy,
    // Every window numbers its groups from "1" by default, so a group
    // moved between windows would collide on arrival. Random ids let a
    // group keep its id wherever the hub lands it.
    groupIdGenerator: randomId,
    // Each window keeps its own undo stack; the shell sequences them with
    // the moves between windows. An applied layout arrives through
    // fromJSON and must not wipe the stack.
    layoutHistory: { enabled: true, clearOnFromJSON: false },
    createComponent: (options) =>
        renderers[options.name]?.() ?? new ScratchPanel(),
});

hub = installHub(api);
history = installHistory(api, (line) => console.info(`history: ${line}`));
installAutotest(api, hub);

/**
 * wry's macOS UI delegate has no `webViewDidClose:`, so the `close()` dockview
 * calls on a popout window does nothing there and the shell has to destroy it.
 * One listener covers every popout this instance opens; the simulation's
 * throwaway instance registers its own.
 */
api.onWillClosePopoutWindow(({ window }) => {
    void closeNativePopout(window);
});

const width = (fraction: number) =>
    Math.round(container.clientWidth * fraction);
const height = (fraction: number) =>
    Math.round(container.clientHeight * fraction);

/**
 * Every window builds the same probe panels. Panel ids have to be unique
 * across the windows a group can move between, so every window but the
 * main one suffixes its ids with its label; a panel that crosses keeps the
 * id it was born with.
 */
function buildDefaults(label: string): void {
    const id = (name: string) =>
        label === 'main' || label === 'browser' ? name : `${name}-${label}`;

    api.addPanel({ id: id('host'), component: 'host', title: 'Host' });

    api.addPanel({
        id: id('popout'),
        component: 'popout',
        title: 'Popouts',
        position: { referencePanel: id('host'), direction: 'right' },
        initialWidth: width(0.62),
    });

    api.addPanel({
        id: id('native'),
        component: 'native',
        title: 'Native windows',
        position: { referencePanel: id('popout'), direction: 'below' },
        initialHeight: height(0.45),
    });

    api.addPanel({
        id: id('sync'),
        component: 'sync',
        title: 'Layout sync',
        position: { referencePanel: id('native'), direction: 'within' },
        inactive: true,
    });

    api.addPanel({
        id: id('hub'),
        component: 'hub',
        title: 'Cross-window drag',
        position: { referencePanel: id('native'), direction: 'within' },
        inactive: true,
    });

    api.addPanel({
        id: id('workspace'),
        component: 'workspace',
        title: 'Workspace',
        position: { referencePanel: id('native'), direction: 'within' },
        inactive: true,
    });

    api.addPanel({
        id: id('history'),
        component: 'history',
        title: 'Undo',
        position: { referencePanel: id('native'), direction: 'within' },
        inactive: true,
    });

    api.addPanel({
        id: id('scratch'),
        component: 'scratch',
        title: 'Scratch',
        position: { referencePanel: id('host'), direction: 'below' },
        initialHeight: height(0.3),
    });
}

/**
 * The orchestrator decides what this window starts with: the layout it
 * held for this label, or nothing, in which case the defaults are built.
 * From then on every layout change is reported back to it.
 */
installWorkspace(api, {
    buildDefaults,
    onLog: (line) => console.info(`workspace: ${line}`),
});
