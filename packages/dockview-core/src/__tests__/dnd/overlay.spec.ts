import { Overlay } from '../../dnd/overlay';

const mockGetBoundingClientRect = ({ left, top, height, width }: { left: number, top: number, height: number, width: number }) => {
    const result = { left, top, height, width, right: left + width, bottom: top + height, x: left, y: top };
    return {
        ...result, toJSON: () => (result)
    }
}

describe('overlay', () => {
    test('toJSON, top left', () => {
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
            return mockGetBoundingClientRect({ left: 80, top: 100, width: 40, height: 50 });
        });
        jest.spyOn(container, 'getBoundingClientRect').mockImplementation(
            () => {
                return mockGetBoundingClientRect({ left: 20, top: 30, width: 100, height: 100 });
            }
        );

        expect(cut.toJSON()).toEqual({
            top: 70,
            left: 60,
            width: 40,
            height: 50,
        });
    });

    test('toJSON, bottom right', () => {
        const container = document.createElement('div');
        const content = document.createElement('div');

        document.body.appendChild(container);
        container.appendChild(content);

        const cut = new Overlay({
            height: 200,
            width: 100,
            right: 10,
            bottom: 20,
            minimumInViewportWidth: 0,
            minimumInViewportHeight: 0,
            container,
            content,
        });

        jest.spyOn(
            container.childNodes.item(0) as HTMLElement,
            'getBoundingClientRect'
        ).mockImplementation(() => {
            return mockGetBoundingClientRect({ left: 80, top: 100, width: 40, height: 50 });
        });
        jest.spyOn(container, 'getBoundingClientRect').mockImplementation(
            () => {
                return mockGetBoundingClientRect({ left: 20, top: 30, width: 100, height: 100 });
            }
        );

        expect(cut.toJSON()).toEqual({
            bottom: -20,
            right: 0,
            width: 40,
            height: 50,
        });
    });

    test('that out-of-bounds dimensions are fixed, top left', () => {
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
            return mockGetBoundingClientRect({ left: 80, top: 100, width: 40, height: 50 });
        });
        jest.spyOn(container, 'getBoundingClientRect').mockImplementation(
            () => {
                return mockGetBoundingClientRect({ left: 20, top: 30, width: 100, height: 100 });
            }
        );

        expect(cut.toJSON()).toEqual({
            top: 70,
            left: 60,
            width: 40,
            height: 50,
        });
    });

    test('that out-of-bounds dimensions are fixed, bottom right', () => {
        const container = document.createElement('div');
        const content = document.createElement('div');

        document.body.appendChild(container);
        container.appendChild(content);

        const cut = new Overlay({
            height: 200,
            width: 100,
            bottom: -1000,
            right: -1000,
            minimumInViewportWidth: 0,
            minimumInViewportHeight: 0,
            container,
            content,
        });

        jest.spyOn(
            container.childNodes.item(0) as HTMLElement,
            'getBoundingClientRect'
        ).mockImplementation(() => {
            return mockGetBoundingClientRect({ left: 80, top: 100, width: 40, height: 50 });
        });
        jest.spyOn(container, 'getBoundingClientRect').mockImplementation(
            () => {
                return mockGetBoundingClientRect({ left: 20, top: 30, width: 100, height: 100 });
            }
        );

        expect(cut.toJSON()).toEqual({
            bottom: -20,
            right: 0,
            width: 40,
            height: 50,
        });
    });

    test('setBounds, top left', () => {
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
            return mockGetBoundingClientRect({ left: 300, top: 400, width: 200, height: 100 });
        });
        jest.spyOn(container, 'getBoundingClientRect').mockImplementation(
            () => {
                return mockGetBoundingClientRect({ left: 0, top: 0, width: 1000, height: 1000 });
            }
        );

        cut.setBounds({ height: 100, width: 200, left: 300, top: 400 });

        expect(element.style.height).toBe('100px');
        expect(element.style.width).toBe('200px');
        expect(element.style.left).toBe('300px');
        expect(element.style.top).toBe('400px');
    });

    test('setBounds, bottom right', () => {
        const container = document.createElement('div');
        const content = document.createElement('div');

        document.body.appendChild(container);
        container.appendChild(content);

        const cut = new Overlay({
            height: 1000,
            width: 1000,
            right: 0,
            bottom: 0,
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
            return mockGetBoundingClientRect({ left: 500, top: 500, width: 200, height: 100 });
        });
        jest.spyOn(container, 'getBoundingClientRect').mockImplementation(
            () => {
                return mockGetBoundingClientRect({ left: 0, top: 0, width: 1000, height: 1000 });
            }
        );

        cut.setBounds({ height: 100, width: 200, right: 300, bottom: 400 });

        expect(element.style.height).toBe('100px');
        expect(element.style.width).toBe('200px');
        expect(element.style.right).toBe('300px');
        expect(element.style.bottom).toBe('400px');
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
