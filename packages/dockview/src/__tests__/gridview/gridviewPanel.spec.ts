import { DockviewComponent } from '../../dockview/dockviewComponent';
import { GroupPanel } from '../../groupview/groupviewPanel';

describe('gridviewPanel', () => {
    test('get panel', () => {
        const accessorMock = jest.fn<DockviewComponent, []>(() => {
            return {} as any;
        });

        const accessor = new accessorMock();

        const cut = new GroupPanel(accessor, 'id', {});

        expect(cut.params).toEqual(undefined);

        cut.update({ params: { variableA: 'A', variableB: 'B' } });

        expect(cut.params).toEqual({ variableA: 'A', variableB: 'B' });
    });
});
