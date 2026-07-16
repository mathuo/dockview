import { DockviewComponent } from '../../dockview/dockviewComponent';
import { IContentRenderer } from '../../dockview/types';

class TestPanel implements IContentRenderer {
    element = document.createElement('div');
    init(): void {
        // noop
    }
    layout(): void {
        // noop
    }
    dispose(): void {
        // noop
    }
}

/**
 * `ownsElement` is the cross-document containment primitive the keyboard
 * accessibility services use instead of a single-document `rootElement.contains`,
 * so a keydown / focus inside a popped-out window (a separate `document`) is
 * still recognised as belonging to this dock. jsdom can't open a real second
 * window, so the popout document is simulated by stubbing `getPopoutWindows`.
 */
describe('DockviewComponent.ownsElement', () => {
    let container: HTMLElement;
    let dockview: DockviewComponent;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
        });
        dockview.layout(800, 600);
    });

    afterEach(() => {
        dockview.dispose();
        container.remove();
    });

    test('owns an element inside its own shell', () => {
        dockview.addPanel({ id: 'panel1', component: 'default' });
        const tab = container.querySelector('.dv-tab')!;
        expect(dockview.ownsElement(tab)).toBe(true);
        expect(dockview.ownsElement(dockview.element)).toBe(true);
    });

    test('does not own an element in the main document outside the dock', () => {
        const stray = document.createElement('div');
        document.body.appendChild(stray);
        expect(dockview.ownsElement(stray)).toBe(false);
        stray.remove();
    });

    test('does not own a foreign-document element with no matching popout', () => {
        const foreignDoc =
            document.implementation.createHTMLDocument('foreign');
        const node = foreignDoc.createElement('div');
        foreignDoc.body.appendChild(node);
        expect(dockview.ownsElement(node)).toBe(false);
    });

    test('owns an element in a popout document it controls', () => {
        const popoutDoc = document.implementation.createHTMLDocument('popout');
        const node = popoutDoc.createElement('div');
        popoutDoc.body.appendChild(node);
        const popoutWindow = { document: popoutDoc } as unknown as Window;

        jest.spyOn(dockview, 'getPopoutWindows').mockReturnValue([
            popoutWindow,
        ]);

        expect(dockview.ownsElement(node)).toBe(true);

        // A node in a *different* foreign document is still not owned.
        const otherDoc = document.implementation.createHTMLDocument('other');
        const otherNode = otherDoc.createElement('div');
        otherDoc.body.appendChild(otherNode);
        expect(dockview.ownsElement(otherNode)).toBe(false);
    });

    test('a same-document popout never claims sibling main-document nodes', () => {
        // The jsdom mock popout shares the main document; ownsElement must fall
        // back to true containment for it (not blanket-own the whole document).
        const samedocWindow = { document } as unknown as Window;
        jest.spyOn(dockview, 'getPopoutWindows').mockReturnValue([
            samedocWindow,
        ]);

        const stray = document.createElement('div');
        document.body.appendChild(stray);
        expect(dockview.ownsElement(stray)).toBe(false);
        stray.remove();
    });
});
