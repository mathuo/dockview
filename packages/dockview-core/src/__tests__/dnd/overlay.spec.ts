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
            minimumInViewportWidth: 0,
            minimumInViewportHeight: 0,
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

    test('that out-of-bounds dimensions are fixed', () => {
        const container = document.createElement('div');
        const content = document.createElement('div');

        document.body.appendChild(container);
        container.appendChild(content);

        const cut = new Overlay({
            height: 200,
            width: 100,
            left: -1000,
            top: -1000,
            minimumInViewportWidth: 0,
            minimumInViewportHeight: 0,
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

    test('setBounds', () => {
        const container = document.createElement('div');
        const content = document.createElement('div');

        document.body.appendChild(container);
        container.appendChild(content);

        const cut = new Overlay({
            height: 1000,
            width: 1000,
            left: 0,
            top: 0,
            minimumInViewportWidth: 0,
            minimumInViewportHeight: 0,
            container,
            content,
        });

        const element: HTMLElement = container.querySelector(
            '.dv-resize-container'
        )!;
        expect(element).toBeTruthy();

        jest.spyOn(element, 'getBoundingClientRect').mockImplementation(() => {
            return { left: 300, top: 400, width: 1000, height: 1000 } as any;
        });
        jest.spyOn(container, 'getBoundingClientRect').mockImplementation(
            () => {
                return { left: 0, top: 0, width: 1000, height: 1000 } as any;
            }
        );

        cut.setBounds({ height: 100, width: 200, left: 300, top: 400 });

        expect(element.style.height).toBe('100px');
        expect(element.style.width).toBe('200px');
        expect(element.style.left).toBe('300px');
        expect(element.style.top).toBe('400px');
    });

    test('that the resize handles are added', () => {
        const container = document.createElement('div');
        const content = document.createElement('div');

        const cut = new Overlay({
            height: 500,
            width: 500,
            left: 100,
            top: 200,
            minimumInViewportWidth: 0,
            minimumInViewportHeight: 0,
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
