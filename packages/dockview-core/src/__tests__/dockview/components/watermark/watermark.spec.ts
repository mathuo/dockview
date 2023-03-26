import { DockviewApi } from '../../../../api/component.api';
import { Watermark } from '../../../../dockview/components/watermark/watermark';

describe('watermark', () => {
    test('that the group is closed when the close button is clicked', () => {
        const cut = new Watermark();

        const mockApi = jest.fn<Partial<DockviewApi>, any[]>(() => {
            return {
                removeGroup: jest.fn(),
            };
        });
        const api = <DockviewApi>new mockApi();
        const group = jest.fn() as any;

        cut.init({ containerApi: api });
        cut.updateParentGroup(group, true);

        const closeEl = cut.element.querySelector('.close-action')!;

        expect(closeEl).toBeTruthy();

        closeEl.dispatchEvent(new Event('click'));

        expect(api.removeGroup).toHaveBeenCalledWith(group);
    });
});
