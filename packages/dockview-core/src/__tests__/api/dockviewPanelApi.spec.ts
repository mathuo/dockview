import { DockviewPanelApiImpl } from '../../api/dockviewPanelApi';
import { DockviewComponent } from '../../dockview/dockviewComponent';
import { DockviewPanel, IDockviewPanel } from '../../dockview/dockviewPanel';
import { DockviewGroupPanel } from '../../dockview/dockviewGroupPanel';

describe('groupPanelApi', () => {
    test('title', () => {
        const panelMock = jest.fn<DockviewPanel, []>(() => {
            return {
                update: jest.fn(),
                setTitle: jest.fn(),
            } as any;
        });
        const groupMock = jest.fn<DockviewGroupPanel, []>(() => {
            return {} as any;
        });

        const panel = new panelMock();
        const group = new groupMock();

        const cut = new DockviewPanelApiImpl(panel, group);

        cut.setTitle('test_title');
        expect(panel.setTitle).toBeCalledTimes(1);
        expect(panel.setTitle).toBeCalledWith('test_title');
    });

    test('updateParameters', () => {
        const groupPanel: Partial<IDockviewPanel> = {
            id: 'test_id',
            update: jest.fn(),
        };

        const accessor: Partial<DockviewComponent> = {
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            options: {},
        };
        const groupViewPanel = new DockviewGroupPanel(
            <DockviewComponent>accessor,
            '',
            {}
        );

        const cut = new DockviewPanelApiImpl(
            <IDockviewPanel>groupPanel,
            <DockviewGroupPanel>groupViewPanel
        );

        cut.updateParameters({ keyA: 'valueA' });

        expect(groupPanel.update).toHaveBeenCalledWith({
            params: { keyA: 'valueA' },
        });
        expect(groupPanel.update).toHaveBeenCalledTimes(1);
    });

    test('onDidGroupChange', () => {
        const groupPanel: Partial<IDockviewPanel> = {
            id: 'test_id',
        };

        const accessor: Partial<DockviewComponent> = {
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            options: {},
        };
        const groupViewPanel = new DockviewGroupPanel(
            <DockviewComponent>accessor,
            '',
            {}
        );

        const cut = new DockviewPanelApiImpl(
            <IDockviewPanel>groupPanel,
            <DockviewGroupPanel>groupViewPanel
        );

        let events = 0;

        const disposable = cut.onDidGroupChange(() => {
            events++;
        });

        expect(events).toBe(0);
        expect(cut.group).toBe(groupViewPanel);

        const groupViewPanel2 = new DockviewGroupPanel(
            <DockviewComponent>accessor,
            '',
            {}
        );
        cut.group = groupViewPanel2;
        expect(events).toBe(1);
        expect(cut.group).toBe(groupViewPanel2);

        disposable.dispose();
    });
});
