import { fireEvent } from '@testing-library/dom';
import {
    DockviewComponent,
    IContentRenderer,
    TabDragEvent,
    GroupDragEvent,
} from '../../index';

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
 * onWillDragPanel / onWillDragGroup are dispatched by AdvancedDnDModule when a
 * tab or the void container starts a drag.
 */
describe('advanced dnd: onWillDrag hooks', () => {
    test('that dragging a tab triggers onWillDragPanel', () => {
        const container = document.createElement('div');
        const dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
        });

        dockview.layout(1000, 500);
        dockview.addPanel({ id: 'panel_1', component: 'default' });

        const tabDragEvents: TabDragEvent[] = [];
        const groupDragEvents: GroupDragEvent[] = [];

        dockview.onWillDragPanel((event) => {
            tabDragEvents.push(event);
        });
        dockview.onWillDragGroup((event) => {
            groupDragEvents.push(event);
        });

        const el = dockview.element.querySelector('.dv-tab')!;
        expect(el).toBeTruthy();

        fireEvent.dragStart(el);

        expect(tabDragEvents).toHaveLength(1);
        expect(groupDragEvents).toHaveLength(0);

        dockview.dispose();
    });

    test('that dragging a group triggers onWillDragGroup', () => {
        const container = document.createElement('div');
        const dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
        });

        dockview.layout(1000, 500);
        dockview.addPanel({ id: 'panel_1', component: 'default' });

        const tabDragEvents: TabDragEvent[] = [];
        const groupDragEvents: GroupDragEvent[] = [];

        dockview.onWillDragPanel((event) => {
            tabDragEvents.push(event);
        });
        dockview.onWillDragGroup((event) => {
            groupDragEvents.push(event);
        });

        const el = dockview.element.querySelector('.dv-void-container')!;
        expect(el).toBeTruthy();

        fireEvent.dragStart(el);

        expect(tabDragEvents).toHaveLength(0);
        expect(groupDragEvents).toHaveLength(1);

        dockview.dispose();
    });
});
