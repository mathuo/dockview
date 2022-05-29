import { Tab } from '../../groupview/tab';

describe('tab', () => {
    test('that empty tab has inactive-tab class', () => {
        const accessorMock = jest.fn();
        const groupMock = jest.fn();

        const cut = new Tab('panelId', new accessorMock(), new groupMock());

        expect(cut.element.className).toBe(
            'dockview-tab dockview-inactive-tab'
        );
    });

    test('that active tab has active-tab class', () => {
        const accessorMock = jest.fn();
        const groupMock = jest.fn();

        const cut = new Tab('panelId', new accessorMock(), new groupMock());

        cut.setActive(true);
        expect(cut.element.className).toBe('dockview-tab dockview-active-tab');

        cut.setActive(false);
        expect(cut.element.className).toBe(
            'dockview-tab dockview-inactive-tab'
        );
    });
});
