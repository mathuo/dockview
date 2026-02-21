import { PopupService } from '../../../dockview/components/popupService';

describe('PopupService', () => {
    let root: HTMLElement;
    let service: PopupService;

    beforeEach(() => {
        root = document.createElement('div');
        document.body.appendChild(root);
        service = new PopupService(root);
    });

    afterEach(() => {
        service.dispose();
        root.remove();
    });

    describe('constructor', () => {
        test('prepends anchor element to root', () => {
            const anchor = root.querySelector('.dv-popover-anchor');
            expect(anchor).not.toBeNull();
            expect(root.firstChild).toBe(anchor);
        });

        test('anchor has position: relative', () => {
            const anchor = root.querySelector(
                '.dv-popover-anchor'
            ) as HTMLElement;
            expect(anchor.style.position).toBe('relative');
        });
    });

    describe('openPopover', () => {
        test('appends wrapper containing the element into the anchor', () => {
            const el = document.createElement('div');
            el.className = 'my-popup';

            service.openPopover(el, { x: 0, y: 0 });

            const anchor = root.querySelector('.dv-popover-anchor')!;
            expect(anchor.querySelector('.my-popup')).not.toBeNull();
        });

        test('wrapper is position: absolute', () => {
            const el = document.createElement('div');
            service.openPopover(el, { x: 0, y: 0 });

            const anchor = root.querySelector('.dv-popover-anchor')!;
            const wrapper = anchor.firstChild as HTMLElement;
            expect(wrapper.style.position).toBe('absolute');
        });

        test('applies default zIndex when none provided', () => {
            const el = document.createElement('div');
            service.openPopover(el, { x: 0, y: 0 });

            const anchor = root.querySelector('.dv-popover-anchor')!;
            const wrapper = anchor.firstChild as HTMLElement;
            expect(wrapper.style.zIndex).toBe('var(--dv-overlay-z-index)');
        });

        test('applies custom zIndex when provided', () => {
            const el = document.createElement('div');
            service.openPopover(el, { x: 0, y: 0, zIndex: '999' });

            const anchor = root.querySelector('.dv-popover-anchor')!;
            const wrapper = anchor.firstChild as HTMLElement;
            expect(wrapper.style.zIndex).toBe('999');
        });

        test('positions wrapper relative to anchor bounding rect', () => {
            const anchor = root.querySelector(
                '.dv-popover-anchor'
            ) as HTMLElement;
            jest.spyOn(anchor, 'getBoundingClientRect').mockReturnValue({
                left: 100,
                top: 50,
                right: 100,
                bottom: 50,
                width: 0,
                height: 0,
                x: 100,
                y: 50,
                toJSON: () => {},
            });

            const el = document.createElement('div');
            service.openPopover(el, { x: 250, y: 180 });

            const wrapper = anchor.firstChild as HTMLElement;
            expect(wrapper.style.left).toBe('150px'); // 250 - 100
            expect(wrapper.style.top).toBe('130px'); // 180 - 50
        });

        test('opening a second popover closes the first', () => {
            const el1 = document.createElement('div');
            el1.className = 'popup-1';
            const el2 = document.createElement('div');
            el2.className = 'popup-2';

            service.openPopover(el1, { x: 0, y: 0 });
            service.openPopover(el2, { x: 0, y: 0 });

            const anchor = root.querySelector('.dv-popover-anchor')!;
            expect(anchor.querySelector('.popup-1')).toBeNull();
            expect(anchor.querySelector('.popup-2')).not.toBeNull();
        });
    });

    describe('close', () => {
        test('removes the active wrapper from the DOM', () => {
            const el = document.createElement('div');
            el.className = 'my-popup';
            service.openPopover(el, { x: 0, y: 0 });

            service.close();

            const anchor = root.querySelector('.dv-popover-anchor')!;
            expect(anchor.querySelector('.my-popup')).toBeNull();
        });

        test('is a no-op when nothing is open', () => {
            expect(() => service.close()).not.toThrow();
        });
    });

    describe('pointerdown outside popover', () => {
        test('closes the popover', () => {
            const el = document.createElement('div');
            el.className = 'my-popup';
            service.openPopover(el, { x: 0, y: 0 });

            const outside = document.createElement('div');
            document.body.appendChild(outside);
            outside.dispatchEvent(
                new MouseEvent('pointerdown', { bubbles: true })
            );
            outside.remove();

            const anchor = root.querySelector('.dv-popover-anchor')!;
            expect(anchor.querySelector('.my-popup')).toBeNull();
        });

        test('does not close when clicking inside the popover', () => {
            const el = document.createElement('div');
            el.className = 'my-popup';
            service.openPopover(el, { x: 0, y: 0 });

            el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));

            const anchor = root.querySelector('.dv-popover-anchor')!;
            expect(anchor.querySelector('.my-popup')).not.toBeNull();
        });
    });

    describe('window resize', () => {
        test('closes the popover', () => {
            const el = document.createElement('div');
            el.className = 'my-popup';
            service.openPopover(el, { x: 0, y: 0 });

            window.dispatchEvent(new Event('resize'));

            const anchor = root.querySelector('.dv-popover-anchor')!;
            expect(anchor.querySelector('.my-popup')).toBeNull();
        });
    });

    describe('updateRoot', () => {
        test('moves anchor element into new root', () => {
            const newRoot = document.createElement('div');
            document.body.appendChild(newRoot);

            service.updateRoot(newRoot);

            expect(root.querySelector('.dv-popover-anchor')).toBeNull();
            expect(newRoot.querySelector('.dv-popover-anchor')).not.toBeNull();

            newRoot.remove();
        });

        test('new root is prepended with the anchor', () => {
            const newRoot = document.createElement('div');
            const existingChild = document.createElement('span');
            newRoot.appendChild(existingChild);
            document.body.appendChild(newRoot);

            service.updateRoot(newRoot);

            expect(newRoot.firstChild).toBe(
                newRoot.querySelector('.dv-popover-anchor')
            );

            newRoot.remove();
        });

        test('openPopover positions relative to new anchor location after updateRoot', () => {
            const newRoot = document.createElement('div');
            document.body.appendChild(newRoot);
            service.updateRoot(newRoot);

            const anchor = newRoot.querySelector(
                '.dv-popover-anchor'
            ) as HTMLElement;
            jest.spyOn(anchor, 'getBoundingClientRect').mockReturnValue({
                left: 300,
                top: 0,
                right: 300,
                bottom: 0,
                width: 0,
                height: 0,
                x: 300,
                y: 0,
                toJSON: () => {},
            });

            const el = document.createElement('div');
            service.openPopover(el, { x: 350, y: 20 });

            const wrapper = anchor.firstChild as HTMLElement;
            expect(wrapper.style.left).toBe('50px'); // 350 - 300
            expect(wrapper.style.top).toBe('20px'); // 20 - 0

            newRoot.remove();
        });
    });

    describe('dispose', () => {
        test('closes any active popover', () => {
            const el = document.createElement('div');
            el.className = 'my-popup';
            service.openPopover(el, { x: 0, y: 0 });

            service.dispose();

            const anchor = root.querySelector('.dv-popover-anchor')!;
            expect(anchor.querySelector('.my-popup')).toBeNull();
        });
    });
});
