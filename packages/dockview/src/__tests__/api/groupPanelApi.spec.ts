import { DockviewComponent } from '../../dockview/dockviewComponent';
import { DockviewPanelApiImpl, TitleEvent } from '../../api/groupPanelApi';
import { IDockviewPanel } from '../../groupview/groupPanel';
import { GroupPanel } from '../../groupview/groupviewPanel';

describe('groupPanelApi', () => {
    test('title', () => {
        const groupPanel: Partial<IDockviewPanel> = {
            id: 'test_id',
            title: 'test_title',
        };

        const accessor: Partial<DockviewComponent> = {
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
        };
        const groupViewPanel = new GroupPanel(
            <DockviewComponent>accessor,
            '',
            {}
        );

        const cut = new DockviewPanelApiImpl(
            <IDockviewPanel>groupPanel,
            <GroupPanel>groupViewPanel
        );

        let events: TitleEvent[] = [];

        const disposable = cut.onDidTitleChange((event) => {
            events.push(event);
        });

        expect(events.length).toBe(0);
        expect(cut.title).toBe('test_title');

        cut.setTitle('test_title_2');
        expect(events.length).toBe(1);
        expect(events[0]).toEqual({ title: 'test_title_2' });
        expect(cut.title).toBe('test_title'); // title should remain unchanged

        disposable.dispose();
    });

    test('onDidGroupChange', () => {
        const groupPanel: Partial<IDockviewPanel> = {
            id: 'test_id',
        };

        const accessor: Partial<DockviewComponent> = {
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
        };
        const groupViewPanel = new GroupPanel(
            <DockviewComponent>accessor,
            '',
            {}
        );

        const cut = new DockviewPanelApiImpl(
            <IDockviewPanel>groupPanel,
            <GroupPanel>groupViewPanel
        );

        let events = 0;

        const disposable = cut.onDidGroupChange(() => {
            events++;
        });

        expect(events).toBe(0);
        expect(cut.group).toBe(groupViewPanel);

        const groupViewPanel2 = new GroupPanel(
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
