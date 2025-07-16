import { fireEvent } from '@testing-library/dom';
import {
    LocalSelectionTransfer,
    PanelTransfer,
} from '../../../dnd/dataTransfer';
import { DockviewComponent } from '../../../dockview/dockviewComponent';
import { DockviewGroupPanel } from '../../../dockview/dockviewGroupPanel';
import { DockviewGroupPanelModel } from '../../../dockview/dockviewGroupPanelModel';
import { Tab } from '../../../dockview/components/tab/tab';
import { IDockviewPanel } from '../../../dockview/dockviewPanel';
import { fromPartial } from '@total-typescript/shoehorn';

describe('tab', () => {
    test('that empty tab has inactive-tab class', () => {
        const accessor = fromPartial<DockviewComponent>({
            options: {}
        });
        const groupMock = jest.fn();

        const cut = new Tab(
            { id: 'panelId' } as IDockviewPanel,
            accessor,
            new groupMock()
        );

        expect(cut.element.className).toBe('dv-tab dv-inactive-tab');
    });

    test('that active tab has active-tab class', () => {
        const accessor = fromPartial<DockviewComponent>({
            options: {}
        });
        const groupMock = jest.fn();

        const cut = new Tab(
            { id: 'panelId' } as IDockviewPanel,
            accessor,
            new groupMock()
        );

        cut.setActive(true);
        expect(cut.element.className).toBe('dv-tab dv-active-tab');

        cut.setActive(false);
        expect(cut.element.className).toBe('dv-tab dv-inactive-tab');
    });

    test('that an external event does not render a drop target and calls through to the group model', () => {
        const accessor = fromPartial<DockviewComponent>({
            id: 'testcomponentid',
            options: {}
        });

        const groupView = fromPartial<DockviewGroupPanelModel>({
            canDisplayOverlay: jest.fn(),
        });

        const groupPanel = fromPartial<DockviewGroupPanel>({
            id: 'testgroupid',
            model: groupView,
        });

        const cut = new Tab(
            { id: 'panelId' } as IDockviewPanel,
            accessor,
            groupPanel
        );

        jest.spyOn(cut.element, 'offsetHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(cut.element, 'offsetWidth', 'get').mockImplementation(
            () => 100
        );

        fireEvent.dragEnter(cut.element);
        fireEvent.dragOver(cut.element);

        expect(groupView.canDisplayOverlay).toHaveBeenCalled();

        expect(
            cut.element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(0);
    });

    test('that if you drag over yourself a drop target is shown', () => {
        const accessor = fromPartial<DockviewComponent>({
            id: 'testcomponentid',
            options: {}
        });

        const groupView = fromPartial<DockviewGroupPanelModel>({
            canDisplayOverlay: jest.fn(),
        });

        const groupPanel = fromPartial<DockviewGroupPanel>({
            id: 'testgroupid',
            model: groupView,
        });

        const cut = new Tab(
            { id: 'panel1' } as IDockviewPanel,
            accessor,
            groupPanel
        );

        jest.spyOn(cut.element, 'offsetHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(cut.element, 'offsetWidth', 'get').mockImplementation(
            () => 100
        );

        LocalSelectionTransfer.getInstance().setData(
            [new PanelTransfer('testcomponentid', 'anothergroupid', 'panel1')],
            PanelTransfer.prototype
        );

        fireEvent.dragEnter(cut.element);
        fireEvent.dragOver(cut.element);

        expect(groupView.canDisplayOverlay).toHaveBeenCalledTimes(0);

        expect(
            cut.element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(1);
    });

    test('that if you drag over another tab a drop target is shown', () => {
        const accessor = fromPartial<DockviewComponent>({
            id: 'testcomponentid',
            options: {}
        });

        const groupView = fromPartial<DockviewGroupPanelModel>({
            canDisplayOverlay: jest.fn(),
        });

        const groupPanel = fromPartial<DockviewGroupPanel>({
            id: 'testgroupid',
            model: groupView,
        });

        const cut = new Tab(
            { id: 'panel1' } as IDockviewPanel,
            accessor,
            groupPanel
        );

        jest.spyOn(cut.element, 'offsetHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(cut.element, 'offsetWidth', 'get').mockImplementation(
            () => 100
        );

        LocalSelectionTransfer.getInstance().setData(
            [new PanelTransfer('testcomponentid', 'anothergroupid', 'panel2')],
            PanelTransfer.prototype
        );

        fireEvent.dragEnter(cut.element);
        fireEvent.dragOver(cut.element);

        expect(groupView.canDisplayOverlay).toBeCalledTimes(0);

        expect(
            cut.element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(1);
    });

    test('that dropping on a tab with the same id but from a different component should not render a drop over and call through to the group model', () => {
        const accessor = fromPartial<DockviewComponent>({
            id: 'testcomponentid',
            options: {}
        });

        const groupView = fromPartial<DockviewGroupPanelModel>({
            canDisplayOverlay: jest.fn(),
        });

        const groupPanel = fromPartial<DockviewGroupPanel>({
            id: 'testgroupid',
            model: groupView,
        });

        const cut = new Tab(
            { id: 'panel1' } as IDockviewPanel,
            accessor,
            groupPanel
        );

        jest.spyOn(cut.element, 'offsetHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(cut.element, 'offsetWidth', 'get').mockImplementation(
            () => 100
        );

        LocalSelectionTransfer.getInstance().setData(
            [
                new PanelTransfer(
                    'anothercomponentid',
                    'anothergroupid',
                    'panel1'
                ),
            ],
            PanelTransfer.prototype
        );

        fireEvent.dragEnter(cut.element);
        fireEvent.dragOver(cut.element);

        expect(groupView.canDisplayOverlay).toBeCalledTimes(1);

        expect(
            cut.element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(0);
    });

    test('that dropping on a tab from a different component should not render a drop over and call through to the group model', () => {
        const accessor = fromPartial<DockviewComponent>({
            id: 'testcomponentid',
            options: {}
        });

        const groupView = fromPartial<DockviewGroupPanelModel>({
            canDisplayOverlay: jest.fn(),
        });

        const groupPanel = fromPartial<DockviewGroupPanel>({
            id: 'testgroupid',
            model: groupView,
        });

        const cut = new Tab(
            { id: 'panel1' } as IDockviewPanel,
            accessor,
            groupPanel
        );

        jest.spyOn(cut.element, 'offsetHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(cut.element, 'offsetWidth', 'get').mockImplementation(
            () => 100
        );

        LocalSelectionTransfer.getInstance().setData(
            [
                new PanelTransfer(
                    'anothercomponentid',
                    'anothergroupid',
                    'panel2'
                ),
            ],
            PanelTransfer.prototype
        );

        fireEvent.dragEnter(cut.element);
        fireEvent.dragOver(cut.element);

        expect(groupView.canDisplayOverlay).toBeCalledTimes(1);

        expect(
            cut.element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(0);
    });

    describe('disableDnd option', () => {
        test('that tab is draggable by default (disableDnd not set)', () => {
            const accessor = fromPartial<DockviewComponent>({
                options: {}
            });
            const groupMock = jest.fn();

            const cut = new Tab(
                { id: 'panelId' } as IDockviewPanel,
                accessor,
                new groupMock()
            );

            expect(cut.element.draggable).toBe(true);
        });

        test('that tab is draggable when disableDnd is false', () => {
            const accessor = fromPartial<DockviewComponent>({
                options: { disableDnd: false }
            });
            const groupMock = jest.fn();

            const cut = new Tab(
                { id: 'panelId' } as IDockviewPanel,
                accessor,
                new groupMock()
            );

            expect(cut.element.draggable).toBe(true);
        });

        test('that tab is not draggable when disableDnd is true', () => {
            const accessor = fromPartial<DockviewComponent>({
                options: { disableDnd: true }
            });
            const groupMock = jest.fn();

            const cut = new Tab(
                { id: 'panelId' } as IDockviewPanel,
                accessor,
                new groupMock()
            );

            expect(cut.element.draggable).toBe(false);
        });

        test('that updateDragAndDropState updates draggable attribute based on disableDnd option', () => {
            const options = { disableDnd: false };
            const accessor = fromPartial<DockviewComponent>({
                options
            });
            const groupMock = jest.fn();

            const cut = new Tab(
                { id: 'panelId' } as IDockviewPanel,
                accessor,
                new groupMock()
            );

            expect(cut.element.draggable).toBe(true);

            // Simulate option change
            options.disableDnd = true;
            cut.updateDragAndDropState();
            expect(cut.element.draggable).toBe(false);

            // Change back
            options.disableDnd = false;
            cut.updateDragAndDropState();
            expect(cut.element.draggable).toBe(true);
        });
    });
});
