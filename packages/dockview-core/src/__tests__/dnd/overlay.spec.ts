import { Overlay } from '../../dnd/overlay';

describe('overlay', () => {
    test('toJSON', () => {
        const container = document.createElement('div');
        const content = document.createElement('div');

        document.body.appendChild(container);
        container.appendChild(content);

        const cut = new Overlay({
            height: 200,
            width: 100,
            left: 10,
            top: 20,
            minX: 0,
            minY: 0,
            container,
            content,
        });

        jest.spyOn(
            container.childNodes.item(0) as HTMLElement,
            'getBoundingClientRect'
        ).mockImplementation(() => {
            return { left: 80, top: 100, width: 40, height: 50 } as any;
        });
        jest.spyOn(container, 'getBoundingClientRect').mockImplementation(
            () => {
                return { left: 20, top: 30, width: 100, height: 100 } as any;
            }
        );

        expect(cut.toJSON()).toEqual({
            top: 70,
            left: 60,
            width: 40,
            height: 50,
        });
    });

    test('that the resize handles are added', () => {
        const container = document.createElement('div');
        const content = document.createElement('div');

        const cut = new Overlay({
            height: 500,
            width: 500,
            left: 100,
            top: 200,
            minX: 0,
            minY: 0,
            container,
            content,
        });

        expect(container.querySelector('.dv-resize-handle-top')).toBeTruthy();
        expect(
            container.querySelector('.dv-resize-handle-bottom')
        ).toBeTruthy();
        expect(container.querySelector('.dv-resize-handle-left')).toBeTruthy();
        expect(container.querySelector('.dv-resize-handle-right')).toBeTruthy();
        expect(
            container.querySelector('.dv-resize-handle-topleft')
        ).toBeTruthy();
        expect(
            container.querySelector('.dv-resize-handle-topright')
        ).toBeTruthy();
        expect(
            container.querySelector('.dv-resize-handle-bottomleft')
        ).toBeTruthy();
        expect(
            container.querySelector('.dv-resize-handle-bottomright')
        ).toBeTruthy();

        cut.dispose();
    });
});
