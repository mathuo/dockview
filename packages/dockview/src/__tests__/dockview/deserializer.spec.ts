import {
    DefaultDeserializer,
    PanelDeserializerOptions,
} from '../../dockview/deserializer';
import { DockviewComponent } from '../../dockview/dockviewComponent';
import { Groupview } from '../../groupview/groupview';
import { GroupPanel } from '../../groupview/groupviewPanel';

describe('deserializer', () => {
    test('fromJSON', () => {
        const openPanel = jest.fn();

        const model = jest.fn<Groupview, []>(() => {
            const result: Partial<Groupview> = {
                openPanel,
            };

            return result as Groupview;
        });

        const panel1 = jest.fn();
        const panel2 = jest.fn();

        const groupMock = jest.fn<GroupPanel, []>(() => {
            const result: Partial<GroupPanel> = {
                model: new model(),
                panels: <any>[panel1, panel2],
                activePanel: null,
            };

            return result as GroupPanel;
        });
        const group = new groupMock();
        const createGroup = jest.fn().mockReturnValue(new groupMock());

        const dockviewComponentMock = jest.fn<DockviewComponent, []>(() => {
            const value: Partial<DockviewComponent> = {
                createGroup,
            };

            return <DockviewComponent>value;
        });

        const createPanel = jest
            .fn()
            .mockImplementation((child) => ({ id: child }));

        const panelDeserializer: PanelDeserializerOptions = {
            createPanel,
        };

        const dockviewComponent = new dockviewComponentMock();

        const cut = new DefaultDeserializer(
            dockviewComponent,
            panelDeserializer
        );

        cut.fromJSON({
            type: 'leaf',
            size: 100,
            visible: true,
            data: {
                hideHeader: true,
                locked: true,
                id: 'id',
                views: ['view1', 'view2'],
                activeView: 'view2',
            },
        });

        expect(createGroup).toBeCalledWith({
            id: 'id',
            locked: true,
            hideHeader: true,
        });
        expect(createGroup).toBeCalledTimes(1);

        expect(createPanel).toBeCalledWith('view1', group);
        expect(createPanel).toBeCalledWith('view2', group);
        expect(createPanel).toBeCalledTimes(2);

        expect(openPanel).toBeCalledWith(
            { id: 'view1' },
            { skipSetActive: true }
        );
        expect(openPanel).toBeCalledWith(
            { id: 'view2' },
            { skipSetActive: false }
        );

        expect(openPanel).toBeCalledWith(panel2);
        expect(openPanel).toBeCalledTimes(3);
    });
});
