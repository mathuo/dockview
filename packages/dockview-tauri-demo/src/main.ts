import 'dockview/dist/styles/dockview.css';
import './styles.css';

// Importing the enterprise package registers its feature modules for every
// dockview instance in this webview.
import 'dockview-enterprise';

import { type IContentRenderer, createDockview, themeAbyss } from 'dockview';
import { closeNativePopout } from './bridge';
import { resolveDndStrategy } from './dnd';
import { type Hub, installHub, randomId } from './hub';
import {
    HostPanel,
    HubPanel,
    LayoutSyncPanel,
    NativeWindowPanel,
    PopoutPanel,
    ScratchPanel,
} from './panels';

// Assigned once the instance exists; the hub panel is created lazily by
// dockview, after that.
let hub: Hub | undefined;

const renderers: Record<string, () => IContentRenderer> = {
    host: () => new HostPanel(),
    popout: () => new PopoutPanel(),
    native: () => new NativeWindowPanel(),
    sync: () => new LayoutSyncPanel(),
    hub: () => new HubPanel(() => hub),
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
    createComponent: (options) =>
        renderers[options.name]?.() ?? new ScratchPanel(),
});

hub = installHub(api);

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

api.addPanel({ id: 'host', component: 'host', title: 'Host' });

api.addPanel({
    id: 'popout',
    component: 'popout',
    title: 'Popouts',
    position: { referencePanel: 'host', direction: 'right' },
    initialWidth: width(0.62),
});

api.addPanel({
    id: 'native',
    component: 'native',
    title: 'Native windows',
    position: { referencePanel: 'popout', direction: 'below' },
    initialHeight: height(0.45),
});

api.addPanel({
    id: 'sync',
    component: 'sync',
    title: 'Layout sync',
    position: { referencePanel: 'native', direction: 'within' },
    inactive: true,
});

api.addPanel({
    id: 'hub',
    component: 'hub',
    title: 'Cross-window drag',
    position: { referencePanel: 'native', direction: 'within' },
    inactive: true,
});

api.addPanel({
    id: 'scratch',
    component: 'scratch',
    title: 'Scratch',
    position: { referencePanel: 'host', direction: 'below' },
    initialHeight: height(0.3),
});
