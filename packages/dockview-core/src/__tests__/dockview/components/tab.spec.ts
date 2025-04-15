import { fireEvent } from '@testing-library/dom';
import {
    LocalSelectionTransfer,
    PanelTransfer,
} from '../../../dnd/dataTransfer';
import { fromPartial } from '@total-typescript/shoehorn';
import { Tab } from '../../../tabs/tab';
import { DroptargetOptions } from '../../../dnd/droptarget';

describe('tab', () => {
    test('that empty tab has inactive-tab class', () => {
        const options = fromPartial<DroptargetOptions>({
            canDisplayOverlay: jest.fn(),
            acceptedTargetZones: ['top', 'bottom', 'left', 'right', 'center'],
        });

        const cut = new Tab('panel1', 'accessor1', 'group1', options);
        expect(cut.element.className).toBe('dv-tab dv-inactive-tab');
    });

    test('that active tab has active-tab class', () => {
        const options = fromPartial<DroptargetOptions>({
            canDisplayOverlay: jest.fn(),
            acceptedTargetZones: ['top', 'bottom', 'left', 'right', 'center'],
        });

        const cut = new Tab('panel1', 'accessor1', 'group1', options);

        cut.setActive(true);
        expect(cut.element.className).toBe('dv-tab dv-active-tab');

        cut.setActive(false);
        expect(cut.element.className).toBe('dv-tab dv-inactive-tab');
    });

    test('that an external event does not render a drop target and calls through to the group model', () => {
        const options = fromPartial<DroptargetOptions>({
            canDisplayOverlay: jest.fn(),
            acceptedTargetZones: ['top', 'bottom', 'left', 'right', 'center'],
        });

        const cut = new Tab('panel1', 'accessor1', 'group1', options);

        jest.spyOn(cut.element, 'offsetHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(cut.element, 'offsetWidth', 'get').mockImplementation(
            () => 100
        );

        fireEvent.dragEnter(cut.element);
        fireEvent.dragOver(cut.element);

        expect(options.canDisplayOverlay).toHaveBeenCalled();

        expect(
            cut.element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(0);
    });

    test('that if you drag over yourself a drop target is shown', () => {
        const options = fromPartial<DroptargetOptions>({
            canDisplayOverlay: jest.fn().mockImplementation(() => true),
            acceptedTargetZones: ['top', 'bottom', 'left', 'right', 'center'],
        });

        const cut = new Tab('panel1', 'accessor1', 'group1', options);

        jest.spyOn(cut.element, 'offsetHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(cut.element, 'offsetWidth', 'get').mockImplementation(
            () => 100
        );

        LocalSelectionTransfer.getInstance().setData(
            [new PanelTransfer('accessor1', 'anothergroupid', 'panel1')],
            PanelTransfer.prototype
        );

        fireEvent.dragEnter(cut.element);
        fireEvent.dragOver(cut.element);

        expect(options.canDisplayOverlay).toHaveBeenCalledTimes(1);

        expect(
            cut.element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(1);
    });

    test('that if you drag over another tab a drop target is shown', () => {
        const options = fromPartial<DroptargetOptions>({
            canDisplayOverlay: jest.fn().mockImplementation(() => true),
            acceptedTargetZones: ['top', 'bottom', 'left', 'right', 'center'],
        });

        const cut = new Tab('panel1', 'accessor1', 'group1', options);

        jest.spyOn(cut.element, 'offsetHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(cut.element, 'offsetWidth', 'get').mockImplementation(
            () => 100
        );

        LocalSelectionTransfer.getInstance().setData(
            [new PanelTransfer('accessor1', 'anothergroupid', 'panel2')],
            PanelTransfer.prototype
        );

        fireEvent.dragEnter(cut.element);
        fireEvent.dragOver(cut.element);

        expect(options.canDisplayOverlay).toBeCalledTimes(1);

        expect(
            cut.element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(1);
    });

    test('that dropping on a tab with the same id but from a different component should not render a drop over and call through to the group model', () => {
        const options = fromPartial<DroptargetOptions>({
            canDisplayOverlay: jest.fn(),
            acceptedTargetZones: ['top', 'bottom', 'left', 'right', 'center'],
        });

        const cut = new Tab('panel1', 'accessor1', 'group1', options);

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

        expect(options.canDisplayOverlay).toBeCalledTimes(1);

        expect(
            cut.element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(0);
    });

    test('that dropping on a tab from a different component should not render a drop over and call through to the group model', () => {
        const options = fromPartial<DroptargetOptions>({
            canDisplayOverlay: jest.fn(),
            acceptedTargetZones: ['top', 'bottom', 'left', 'right', 'center'],
        });

        const cut = new Tab('panel1', 'accessor1', 'group1', options);

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

        expect(options.canDisplayOverlay).toBeCalledTimes(1);

        expect(
            cut.element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(0);
    });
});
