import {
    getPaneData,
    getPanelData,
    LocalSelectionTransfer,
    PanelTransfer,
    PaneTransfer,
} from '../../dnd/dataTransfer';

describe('dataTransfer', () => {
    describe('getPanelData', () => {
        test('should be undefined when there is no local transfer object', () => {
            expect(getPanelData()).toBeUndefined();
        });

        test('should be undefined when there is a local transfer object that is not a PanelTransfer', () => {
            LocalSelectionTransfer.getInstance<PaneTransfer>().setData(
                [new PaneTransfer('viewId', 'groupId')],
                PaneTransfer.prototype
            );

            expect(getPanelData()).toBeUndefined();
        });

        test('should retrieve the PanelTransfer object when transfer is active', () => {
            const transferObject = new PanelTransfer(
                'viewId',
                'groupId',
                'panelId'
            );
            LocalSelectionTransfer.getInstance<PanelTransfer>().setData(
                [transferObject],
                PanelTransfer.prototype
            );

            expect(getPanelData()).toBe(transferObject);
        });

        test('should retrieve the PanelTransfer when a new transfer overrides an existing one', () => {
            LocalSelectionTransfer.getInstance<PaneTransfer>().setData(
                [new PaneTransfer('viewId', 'groupId')],
                PaneTransfer.prototype
            );

            expect(getPanelData()).toBeUndefined();

            const transferObject = new PanelTransfer(
                'viewId',
                'groupId',
                'panelId'
            );
            LocalSelectionTransfer.getInstance<PanelTransfer>().setData(
                [transferObject],
                PanelTransfer.prototype
            );

            expect(getPanelData()).toBe(transferObject);
        });
    });

    describe('getPaneData', () => {
        test('should be undefined when there is no local transfer object', () => {
            expect(getPaneData()).toBeUndefined();
        });

        test('should be undefined when there is a local transfer object that is not a PaneTransfer', () => {
            LocalSelectionTransfer.getInstance<PanelTransfer>().setData(
                [new PanelTransfer('viewId', 'groupId', 'panelId')],
                PanelTransfer.prototype
            );

            expect(getPaneData()).toBeUndefined();
        });

        test('should retrieve the PaneTransfer object when transfer is active', () => {
            const transferObject = new PaneTransfer('viewId', 'groupId');
            LocalSelectionTransfer.getInstance<PaneTransfer>().setData(
                [transferObject],
                PaneTransfer.prototype
            );

            expect(getPaneData()).toBe(transferObject);
        });

        test('should retrieve the PanelTransfer when a new transfer overrides an existing one', () => {
            LocalSelectionTransfer.getInstance<PanelTransfer>().setData(
                [new PanelTransfer('viewId', 'groupId', 'panelId')],
                PanelTransfer.prototype
            );

            expect(getPaneData()).toBeUndefined();

            const transferObject = new PaneTransfer('viewId', 'groupId');
            LocalSelectionTransfer.getInstance<PaneTransfer>().setData(
                [transferObject],
                PaneTransfer.prototype
            );

            expect(getPaneData()).toBe(transferObject);
        });
    });
});
