import { Gridview } from '../../gridview/gridview';
import { Orientation } from '../../splitview/core/splitview';

describe('gridview', () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
    });

    test('dispose of gridview', () => {
        expect(container.childNodes.length).toBe(0);

        const gridview = new Gridview(
            false,
            { separatorBorder: '' },
            Orientation.HORIZONTAL
        );

        container.appendChild(gridview.element);

        expect(container.childNodes.length).toBe(1);

        gridview.dispose();

        expect(container.childNodes.length).toBe(0);
    });
});
