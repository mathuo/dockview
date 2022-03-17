import { IDockviewComponent, IGroupPanel } from '../..';
import { DockviewPanelApiImpl, TitleEvent } from '../../api/groupPanelApi';
import { GroupviewPanel } from '../../groupview/groupviewPanel';

describe('groupPanelApi', () => {
    test('title', () => {
        const groupPanel: Partial<IGroupPanel> = {
            id: 'test_id',
            title: 'test_title',
        };

        const accessor: Partial<IDockviewComponent> = {};
        const groupViewPanel = new GroupviewPanel(
            <IDockviewComponent>accessor,
            '',
            {}
        );

        const cut = new DockviewPanelApiImpl(
            <IGroupPanel>groupPanel,
            <GroupviewPanel>groupViewPanel
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
        const groupPanel: Partial<IGroupPanel> = {
            id: 'test_id',
        };

        const accessor: Partial<IDockviewComponent> = {};
        const groupViewPanel = new GroupviewPanel(
            <IDockviewComponent>accessor,
            '',
            {}
        );

        const cut = new DockviewPanelApiImpl(
            <IGroupPanel>groupPanel,
            <GroupviewPanel>groupViewPanel
        );

        let events = 0;

        const disposable = cut.onDidGroupChange(() => {
            events++;
        });

        expect(events).toBe(0);
        expect(cut.group).toBe(groupViewPanel);

        const groupViewPanel2 = new GroupviewPanel(
            <IDockviewComponent>accessor,
            '',
            {}
        );
        cut.group = groupViewPanel2;
        expect(events).toBe(1);
        expect(cut.group).toBe(groupViewPanel2);

        disposable.dispose();
    });
});
