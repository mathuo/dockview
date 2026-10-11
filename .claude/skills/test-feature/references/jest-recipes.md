# Jest recipes for the dockview engine

Copy-ready patterns taken from the existing suites. File paths are relative
to `packages/dockview-core/src/__tests__` unless stated. Enterprise specs
import the same symbols from `dockview` instead of relative paths.

## A minimal component

```ts
import { DockviewComponent } from '../../dockview/dockviewComponent';
import { IContentRenderer } from '../../dockview/types';

class TestPanel implements IContentRenderer {
    element = document.createElement('div');
    init(): void {}
    layout(): void {}
    dispose(): void {}
}

let container: HTMLElement;
let dockview: DockviewComponent;

beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    dockview = new DockviewComponent(container, {
        createComponent: () => new TestPanel(),
        // feature options go here, e.g. pinnedTabs: { enabled: true }
    });
    dockview.layout(1000, 1000); // jsdom has no layout: give it a size
});

afterEach(() => {
    dockview.dispose();
    container.remove();
});
```

Add panels with `dockview.addPanel({ id: 'a', component: 'default' })`;
position with `position: { direction: 'right', referencePanel: 'a' }`,
`floating: true`, or `await dockview.addPopoutGroup(panel)` (see popouts).

For a richer renderer that records `init`/`update`/`dispose` calls, copy
`PanelContentPartTest` from `dockview/dockviewComponent.spec.ts`.

## Enterprise specs

`packages/dockview-enterprise/src/__tests__/registerModules.ts` runs before
each enterprise spec file: all enterprise modules are registered and a valid
licence key is set. A default component therefore already has every module;
enable the feature through its option. To test the unlicensed path, reset
`LicenseManager` inside the test (see `licenseService.spec.ts`).

Option-gating specs should assert the two sides of the contract:

```ts
// optionsModules.spec.ts style: the diagnostic names the right module
// enterpriseModuleNames.spec.ts: options[] <-> OPTION_MODULE_RULES <-> ENTERPRISE_MODULE_NAMES
```

## Serialization round trip (from `pinnedTabs.spec.ts`)

```ts
test('a round-trip preserves state', () => {
    const source = make({ enabled: true });
    // ... build the layout
    const json = source.api.toJSON();

    const target = make({ enabled: true });
    target.api.fromJSON(json);

    expect(target.api.getPanel('c')!.api.isPinned).toBe(true);
});

test('a layout without the new key loads with the default (back-compat)', () => {
    const json = make({ enabled: true }).api.toJSON();
    expect(json.panels['a'].pinned).toBeUndefined();
    const target = make({ enabled: true });
    target.api.fromJSON(json);
    expect(target.api.getPanel('a')!.api.isPinned).toBe(false);
});
```

Also cover "saved with the feature on, restored with it off": the restored
layout must not carry state the user cannot interact with.

## Geometry

```ts
import { mockGetBoundingClientRect } from '../__test_utils__/utils';

jest.spyOn(element, 'getBoundingClientRect').mockImplementation(() =>
    mockGetBoundingClientRect({ left: 80, top: 100, width: 40, height: 60 })
);
```

`offsetWidth` / `clientWidth` are 0 in jsdom; define them with
`Object.defineProperty(el, 'offsetWidth', { value: 300, configurable: true })`
when a code path reads them. Anything whose correctness depends on the real
numbers (overflow, drop zones from pointer position) is an e2e spec.

## Async settling

```ts
import { exhaustMicrotaskQueue, exhaustAnimationFrame } from '../__test_utils__/utils';

await exhaustMicrotaskQueue();   // drain promise callbacks
await exhaustAnimationFrame();   // one rAF tick
```

For debounced or timed paths use `jest.useFakeTimers()` with
`jest.advanceTimersByTime(ms)`, and `jest.useRealTimers()` in `afterEach`.

## DOM events and drag

```ts
import { fireEvent } from '@testing-library/dom';
import { createOffsetDragOverEvent } from '../__test_utils__/utils';

fireEvent.pointerDown(tabEl, { clientX: 10, clientY: 10, button: 0 });
tabEl.dispatchEvent(createOffsetDragOverEvent({ clientX: 50, clientY: 20 }));
```

`PointerEvent` is a mock from `__mocks__/pointerEvent.js`; the shared
`PointerDragController` singleton is cancelled after every test by the root
`jest-setup.ts`, so a spec that drives a drag halfway does not poison the
next one.

## Popouts in jsdom

```ts
import { setupMockWindow, setupDeferredMockWindow } from '../__mocks__/mockWindow';

window.open = () => setupMockWindow();           // popout resolves on subscribe
await dockview.addPopoutGroup(panel);

// Stagger two popouts:
const first = setupDeferredMockWindow();
window.open = () => first.window;
const p = dockview.addPopoutGroup(panel);
first.load();
await p;
```

The mock window shares `document`, so a test can prove the group moved and
listeners were rewired, but not that a second document received focus. That
proof lives in `e2e/tests/popout*.spec.ts`.

## Leak checks

```ts
import { Emitter } from '../../events';

Emitter.setLeakageMonitorEnabled(true);
// ... exercise add / move / float / popout / remove
dockview.dispose();
expect(Emitter.MEMORY_LEAK_WATCHER.size).toBe(0);
Emitter.setLeakageMonitorEnabled(false);
```

`dockview/dockviewComponent.spec.ts` ("memory leakage") is the full version;
reuse its shape when a feature adds emitters or long-lived listeners.

## Partial mocks

```ts
import { fromPartial } from '@total-typescript/shoehorn';

const host = fromPartial<IPinnedTabsHost>({ id: 'x', options: {}, onDidAddGroup: emitter.event });
```

Prefer a real `DockviewComponent` for behaviour; use `fromPartial` for a
service's unit test when the host surface is small and the behaviour is pure.

## Binding specs

React:

```tsx
let api: DockviewApi;
render(<DockviewReact components={components} onReady={(e) => { api = e.api; }} />);
act(() => { api.addPanel({ id: 'a', component: 'default' }); });
await waitFor(() => expect(document.querySelector('.dv-tab')).toBeTruthy());
```

Vue (Vitest, `vi` not `jest`):

```ts
const wrapper = mount(DockviewVue, { props: { components, onReady } });
await flushPromises();
```

Angular:

```ts
TestBed.configureTestingModule({ imports: [DockviewAngularComponent] });
const fixture = TestBed.createComponent(DockviewAngularComponent);
fixture.componentInstance.components = components;
fixture.detectChanges();
```

Keep `dockview-angular.component.spec.ts`'s "forwards every
PROPERTY_KEYS_DOCKVIEW input" test green: it is the check that a new option
received its `@Input()`.
