import { DockviewApi } from '../../../../api/component.api';
import { Watermark } from '../../../../dockview/components/watermark/watermark';
import { fromPartial } from '@total-typescript/shoehorn';

describe('watermark', () => {
    test('that the group is closed when the close button is clicked', () => {
        const cut = new Watermark();
        const api = fromPartial<DockviewApi>({
            removeGroup: jest.fn(),
        });
        const group = jest.fn() as any;

        cut.init({ containerApi: api, group });

        const closeEl = cut.element.querySelector('.dv-close-action')!;

        expect(closeEl).toBeTruthy();

        closeEl.dispatchEvent(new Event('click'));

        expect(api.removeGroup).toHaveBeenCalledWith(group);
    });
});
