import { DockviewComponent } from '../../dockview/dockviewComponent';
import { DockviewGroupPanel } from '../../groupview/dockviewGroupPanel';

describe('gridviewPanel', () => {
    test('get panel', () => {
        const accessorMock = jest.fn<DockviewComponent, []>(() => {
            return {
                onDidAddPanel: jest.fn(),
                onDidRemovePanel: jest.fn(),
                options: {},
            } as any;
        });

        const accessor = new accessorMock();

        const cut = new DockviewGroupPanel(accessor, 'id', {});

        expect(cut.params).toEqual(undefined);

        cut.update({ params: { variableA: 'A', variableB: 'B' } });

        expect(cut.params).toEqual({ variableA: 'A', variableB: 'B' });
    });
});
