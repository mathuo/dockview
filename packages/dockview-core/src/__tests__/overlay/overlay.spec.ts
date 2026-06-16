import { Overlay } from '../../overlay/overlay';
import { mockGetBoundingClientRect } from '../__test_utils__/utils';

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
            return mockGetBoundingClientRect({
                left: 80,
                top: 100,
                width: 40,
                height: 50,
            });
        });
        jest.spyOn(container, 'getBoundingClientRect').mockImplementation(
            () => {
                return mockGetBoundingClientRect({
                    left: 20,
                    top: 30,
                    width: 100,
                    height: 100,
                });
            }
        );

        cut.setBounds();

        expect(cut.toJSON()).toEqual({
            top: 70,
            left: 60,
            width: 40,
            height: 50,
        });

        cut.dispose();
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
            return mockGetBoundingClientRect({
                left: 80,
                top: 100,
                width: 40,
                height: 50,
            });
        });
        jest.spyOn(container, 'getBoundingClientRect').mockImplementation(
            () => {
                return mockGetBoundingClientRect({
                    left: 20,
                    top: 30,
                    width: 100,
                    height: 100,
                });
            }
        );

        cut.setBounds();

        expect(cut.toJSON()).toEqual({
            bottom: -20,
            right: 0,
            width: 40,
            height: 50,
        });

        cut.dispose();
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
            return mockGetBoundingClientRect({
                left: 80,
                top: 100,
                width: 40,
                height: 50,
            });
        });
        jest.spyOn(container, 'getBoundingClientRect').mockImplementation(
            () => {
                return mockGetBoundingClientRect({
                    left: 20,
                    top: 30,
                    width: 100,
                    height: 100,
                });
            }
        );

        cut.setBounds();

        expect(cut.toJSON()).toEqual({
            top: 70,
            left: 60,
            width: 40,
            height: 50,
        });

        cut.dispose();
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
            return mockGetBoundingClientRect({
                left: 80,
                top: 100,
                width: 40,
                height: 50,
            });
        });
        jest.spyOn(container, 'getBoundingClientRect').mockImplementation(
            () => {
                return mockGetBoundingClientRect({
                    left: 20,
                    top: 30,
                    width: 100,
                    height: 100,
                });
            }
        );

        cut.setBounds();

        expect(cut.toJSON()).toEqual({
            bottom: -20,
            right: 0,
            width: 40,
            height: 50,
        });

        cut.dispose();
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
            return mockGetBoundingClientRect({
                left: 300,
                top: 400,
                width: 200,
                height: 100,
            });
        });
        jest.spyOn(container, 'getBoundingClientRect').mockImplementation(
            () => {
                return mockGetBoundingClientRect({
                    left: 0,
                    top: 0,
                    width: 1000,
                    height: 1000,
                });
            }
        );

        cut.setBounds({ height: 100, width: 200, left: 300, top: 400 });

        expect(element.style.height).toBe('100px');
        expect(element.style.width).toBe('200px');
        expect(element.style.left).toBe('300px');
        expect(element.style.top).toBe('400px');

        cut.dispose();
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
            return mockGetBoundingClientRect({
                left: 500,
                top: 500,
                width: 200,
                height: 100,
            });
        });
        jest.spyOn(container, 'getBoundingClientRect').mockImplementation(
            () => {
                return mockGetBoundingClientRect({
                    left: 0,
                    top: 0,
                    width: 1000,
                    height: 1000,
                });
            }
        );

        cut.setBounds({ height: 100, width: 200, right: 300, bottom: 400 });

        expect(element.style.height).toBe('100px');
        expect(element.style.width).toBe('200px');
        expect(element.style.right).toBe('300px');
        expect(element.style.bottom).toBe('400px');

        cut.dispose();
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

    test('aria-level attributes and corresponding z-index', () => {
        const container = document.createElement('div');
        const content = document.createElement('div');

        const createOverlay = () =>
            new Overlay({
                height: 500,
                width: 500,
                left: 100,
                top: 200,
                minimumInViewportWidth: 0,
                minimumInViewportHeight: 0,
                container,
                content,
            });

        const overlay1 = createOverlay();

        const zIndexValue = (delta: number) =>
            `calc(var(--dv-overlay-z-index, 999) + ${delta})`;

        expect(overlay1.element.getAttribute('aria-level')).toBe('0');
        expect(overlay1.element.style.zIndex).toBe(zIndexValue(0));

        const overlay2 = createOverlay();
        const overlay3 = createOverlay();

        expect(overlay1.element.getAttribute('aria-level')).toBe('0');
        expect(overlay2.element.getAttribute('aria-level')).toBe('1');
        expect(overlay3.element.getAttribute('aria-level')).toBe('2');
        expect(overlay1.element.style.zIndex).toBe(zIndexValue(0));
        expect(overlay2.element.style.zIndex).toBe(zIndexValue(2));
        expect(overlay3.element.style.zIndex).toBe(zIndexValue(4));

        overlay2.bringToFront();

        expect(overlay1.element.getAttribute('aria-level')).toBe('0');
        expect(overlay2.element.getAttribute('aria-level')).toBe('2');
        expect(overlay3.element.getAttribute('aria-level')).toBe('1');
        expect(overlay1.element.style.zIndex).toBe(zIndexValue(0));
        expect(overlay2.element.style.zIndex).toBe(zIndexValue(4));
        expect(overlay3.element.style.zIndex).toBe(zIndexValue(2));

        overlay1.bringToFront();

        expect(overlay1.element.getAttribute('aria-level')).toBe('2');
        expect(overlay2.element.getAttribute('aria-level')).toBe('1');
        expect(overlay3.element.getAttribute('aria-level')).toBe('0');
        expect(overlay1.element.style.zIndex).toBe(zIndexValue(4));
        expect(overlay2.element.style.zIndex).toBe(zIndexValue(2));
        expect(overlay3.element.style.zIndex).toBe(zIndexValue(0));

        overlay2.dispose();

        expect(overlay1.element.getAttribute('aria-level')).toBe('1');
        expect(overlay3.element.getAttribute('aria-level')).toBe('0');
        expect(overlay1.element.style.zIndex).toBe(zIndexValue(2));
        expect(overlay3.element.style.zIndex).toBe(zIndexValue(0));

        overlay1.dispose();

        expect(overlay3.element.getAttribute('aria-level')).toBe('0');
        expect(overlay3.element.style.zIndex).toBe(zIndexValue(0));
    });

    describe('resize edge cases (PR #1028)', () => {
        test('resizing from left after extending beyond right edge should not snap to full width', () => {
            const container = document.createElement('div');
            const content = document.createElement('div');

            document.body.appendChild(container);
            container.appendChild(content);

            const overlay = new Overlay({
                height: 100,
                width: 200,
                left: 50,
                top: 50,
                minimumInViewportWidth: 50,
                minimumInViewportHeight: 50,
                container,
                content,
            });

            const element = overlay.element;

            // Mock container bounds (400x400 viewport)
            jest.spyOn(container, 'getBoundingClientRect').mockImplementation(
                () =>
                    mockGetBoundingClientRect({
                        left: 0,
                        top: 0,
                        width: 400,
                        height: 400,
                    })
            );

            // Mock overlay bounds extending beyond right edge
            jest.spyOn(element, 'getBoundingClientRect').mockImplementation(
                () =>
                    mockGetBoundingClientRect({
                        left: 350,
                        top: 50,
                        width: 200,
                        height: 100,
                    })
            );

            const leftHandle = container.querySelector(
                '.dv-resize-handle-left'
            ) as HTMLElement;
            expect(leftHandle).toBeTruthy();

            // Simulate mousedown on left handle
            const pointerDownEvent = new MouseEvent('pointerdown', {
                clientX: 350, // Start position at left edge of overlay
                clientY: 100,
                bubbles: true,
            }) as any;
            pointerDownEvent.pointerId = 1;
            leftHandle.dispatchEvent(pointerDownEvent);

            // Simulate dragging left handle inward (should resize width, not snap to container width)
            const pointerMoveEvent = new MouseEvent('pointermove', {
                clientX: 300, // Drag 50px to the right
                clientY: 100,
                bubbles: true,
            }) as any;
            pointerMoveEvent.pointerId = 1;
            window.dispatchEvent(pointerMoveEvent);

            // Check that overlay didn't snap to full container width (400px)
            const bounds = overlay.toJSON();
            expect(bounds.width).toBeLessThan(400);
            // After the fix, left position should be constrained to >= 0 (not negative)
            expect('left' in bounds ? bounds.left : 0).toBeGreaterThanOrEqual(
                0
            );

            overlay.dispose();
        });

        test('resizing from top after extending beyond bottom edge should not snap to full height', () => {
            const container = document.createElement('div');
            const content = document.createElement('div');

            document.body.appendChild(container);
            container.appendChild(content);

            const overlay = new Overlay({
                height: 200,
                width: 100,
                left: 50,
                top: 50,
                minimumInViewportWidth: 50,
                minimumInViewportHeight: 50,
                container,
                content,
            });

            const element = overlay.element;

            // Mock container bounds (400x400 viewport)
            jest.spyOn(container, 'getBoundingClientRect').mockImplementation(
                () =>
                    mockGetBoundingClientRect({
                        left: 0,
                        top: 0,
                        width: 400,
                        height: 400,
                    })
            );

            // Mock overlay bounds extending beyond bottom edge
            jest.spyOn(element, 'getBoundingClientRect').mockImplementation(
                () =>
                    mockGetBoundingClientRect({
                        left: 50,
                        top: 350,
                        width: 100,
                        height: 200,
                    })
            );

            const topHandle = container.querySelector(
                '.dv-resize-handle-top'
            ) as HTMLElement;
            expect(topHandle).toBeTruthy();

            // Simulate mousedown on top handle
            const pointerDownEvent = new MouseEvent('pointerdown', {
                clientX: 100,
                clientY: 350, // Start position at top edge of overlay
                bubbles: true,
            }) as any;
            pointerDownEvent.pointerId = 1;
            topHandle.dispatchEvent(pointerDownEvent);

            // Simulate dragging top handle downward (should resize height, not snap to container height)
            const pointerMoveEvent = new MouseEvent('pointermove', {
                clientX: 100,
                clientY: 300, // Drag 50px down
                bubbles: true,
            }) as any;
            pointerMoveEvent.pointerId = 1;
            window.dispatchEvent(pointerMoveEvent);

            // Check that overlay didn't snap to full container height (400px)
            const bounds = overlay.toJSON();
            expect(bounds.height).toBeLessThan(400);
            // After the fix, top position should be constrained to >= 0 (not negative)
            expect('top' in bounds ? bounds.top : 0).toBeGreaterThanOrEqual(0);

            overlay.dispose();
        });

        test('resizing should respect container bounds and not allow negative positions', () => {
            const container = document.createElement('div');
            const content = document.createElement('div');

            document.body.appendChild(container);
            container.appendChild(content);

            const overlay = new Overlay({
                height: 100,
                width: 100,
                left: 20,
                top: 20,
                minimumInViewportWidth: 50,
                minimumInViewportHeight: 50,
                container,
                content,
            });

            const element = overlay.element;

            // Mock container bounds (200x200 viewport)
            jest.spyOn(container, 'getBoundingClientRect').mockImplementation(
                () =>
                    mockGetBoundingClientRect({
                        left: 0,
                        top: 0,
                        width: 200,
                        height: 200,
                    })
            );

            // Mock overlay bounds
            jest.spyOn(element, 'getBoundingClientRect').mockImplementation(
                () =>
                    mockGetBoundingClientRect({
                        left: 20,
                        top: 20,
                        width: 100,
                        height: 100,
                    })
            );

            const leftHandle = container.querySelector(
                '.dv-resize-handle-left'
            ) as HTMLElement;
            expect(leftHandle).toBeTruthy();

            // Simulate mousedown on left handle
            const pointerDownEvent = new MouseEvent('pointerdown', {
                clientX: 20,
                clientY: 70,
                bubbles: true,
            }) as any;
            pointerDownEvent.pointerId = 1;
            leftHandle.dispatchEvent(pointerDownEvent);

            // Simulate dragging left handle way beyond left edge (should be constrained)
            const pointerMoveEvent = new MouseEvent('pointermove', {
                clientX: -100, // Try to drag beyond container
                clientY: 70,
                bubbles: true,
            }) as any;
            pointerMoveEvent.pointerId = 1;
            window.dispatchEvent(pointerMoveEvent);

            // Check that left position is constrained to >= 0
            const bounds = overlay.toJSON();
            expect('left' in bounds ? bounds.left : 0).toBeGreaterThanOrEqual(
                0
            );

            overlay.dispose();
        });

        test('resizing should respect maximum dimensions when constrained by container size', () => {
            const container = document.createElement('div');
            const content = document.createElement('div');

            document.body.appendChild(container);
            container.appendChild(content);

            const overlay = new Overlay({
                height: 50,
                width: 50,
                left: 10,
                top: 10,
                minimumInViewportWidth: 25,
                minimumInViewportHeight: 25,
                container,
                content,
            });

            const element = overlay.element;

            // Mock small container bounds (100x100 viewport)
            jest.spyOn(container, 'getBoundingClientRect').mockImplementation(
                () =>
                    mockGetBoundingClientRect({
                        left: 0,
                        top: 0,
                        width: 100,
                        height: 100,
                    })
            );

            // Mock overlay bounds
            jest.spyOn(element, 'getBoundingClientRect').mockImplementation(
                () =>
                    mockGetBoundingClientRect({
                        left: 10,
                        top: 10,
                        width: 50,
                        height: 50,
                    })
            );

            const rightHandle = container.querySelector(
                '.dv-resize-handle-right'
            ) as HTMLElement;
            expect(rightHandle).toBeTruthy();

            // Simulate mousedown on right handle
            const pointerDownEvent = new MouseEvent('pointerdown', {
                clientX: 60,
                clientY: 35,
                bubbles: true,
            }) as any;
            pointerDownEvent.pointerId = 1;
            rightHandle.dispatchEvent(pointerDownEvent);

            // Simulate dragging right handle way beyond container (should be constrained)
            const pointerMoveEvent = new MouseEvent('pointermove', {
                clientX: 200, // Try to drag way beyond container width
                clientY: 35,
                bubbles: true,
            }) as any;
            pointerMoveEvent.pointerId = 1;
            window.dispatchEvent(pointerMoveEvent);

            // Check that width is constrained to fit within container
            const bounds = overlay.toJSON();
            expect(bounds.width).toBeLessThanOrEqual(90); // 100 - 10 (left position)

            overlay.dispose();
        });
    });

    describe('header', () => {
        test('inserts the header above the content and flags the container', () => {
            const container = document.createElement('div');
            const content = document.createElement('div');
            const header = document.createElement('div');
            header.className = 'dv-floating-titlebar';

            document.body.appendChild(container);

            const overlay = new Overlay({
                height: 200,
                width: 100,
                left: 10,
                top: 20,
                minimumInViewportWidth: 0,
                minimumInViewportHeight: 0,
                container,
                content,
                header,
            });

            expect(
                overlay.element.classList.contains(
                    'dv-resize-container-with-titlebar'
                )
            ).toBeTruthy();

            // header is rendered before the content
            const children = Array.from(overlay.element.children);
            expect(children.indexOf(header)).toBeLessThan(
                children.indexOf(content)
            );

            overlay.dispose();
        });

        test('headerHeight reflects the header element, 0 when absent', () => {
            const container = document.createElement('div');
            const content = document.createElement('div');
            const header = document.createElement('div');

            Object.defineProperty(header, 'offsetHeight', {
                configurable: true,
                value: 22,
            });

            document.body.appendChild(container);

            const withHeader = new Overlay({
                height: 200,
                width: 100,
                left: 10,
                top: 20,
                minimumInViewportWidth: 0,
                minimumInViewportHeight: 0,
                container,
                content,
                header,
            });
            expect(withHeader.headerHeight).toBe(22);
            withHeader.dispose();

            const withoutHeader = new Overlay({
                height: 200,
                width: 100,
                left: 10,
                top: 20,
                minimumInViewportWidth: 0,
                minimumInViewportHeight: 0,
                container,
                content: document.createElement('div'),
            });
            expect(withoutHeader.headerHeight).toBe(0);
            withoutHeader.dispose();
        });

        test('setupDrag on the header moves the overlay', () => {
            const container = document.createElement('div');
            const content = document.createElement('div');
            const header = document.createElement('div');

            document.body.appendChild(container);

            const overlay = new Overlay({
                height: 50,
                width: 50,
                left: 10,
                top: 10,
                minimumInViewportWidth: 0,
                minimumInViewportHeight: 0,
                container,
                content,
                header,
            });

            jest.spyOn(container, 'getBoundingClientRect').mockImplementation(
                () =>
                    mockGetBoundingClientRect({
                        left: 0,
                        top: 0,
                        width: 100,
                        height: 100,
                    })
            );
            jest.spyOn(
                overlay.element,
                'getBoundingClientRect'
            ).mockImplementation(() =>
                mockGetBoundingClientRect({
                    left: 10,
                    top: 10,
                    width: 50,
                    height: 50,
                })
            );

            overlay.setupDrag(header);

            const down = new MouseEvent('pointerdown', {
                clientX: 20,
                clientY: 20,
                bubbles: true,
            }) as any;
            down.pointerId = 1;
            header.dispatchEvent(down);

            const move = new MouseEvent('pointermove', {
                clientX: 40,
                clientY: 40,
                bubbles: true,
            }) as any;
            move.pointerId = 1;
            window.dispatchEvent(move);

            expect(
                overlay.element.classList.contains(
                    'dv-resize-container-dragging'
                )
            ).toBeTruthy();

            const up = new MouseEvent('pointerup', { bubbles: true }) as any;
            up.pointerId = 1;
            window.dispatchEvent(up);

            overlay.dispose();
        });
    });

    describe('drag position transform', () => {
        function setupDraggableOverlay(options: {
            transformDragPosition?: Parameters<
                typeof Overlay
            >[0]['transformDragPosition'];
            getSiblingBoxes?: () => readonly {
                left: number;
                top: number;
                width: number;
                height: number;
            }[];
        }) {
            const container = document.createElement('div');
            const content = document.createElement('div');
            document.body.appendChild(container);
            container.appendChild(content);

            const overlay = new Overlay({
                height: 100,
                width: 100,
                left: 50,
                top: 50,
                minimumInViewportWidth: 0,
                minimumInViewportHeight: 0,
                container,
                content,
                ...options,
            });

            jest.spyOn(container, 'getBoundingClientRect').mockImplementation(
                () =>
                    mockGetBoundingClientRect({
                        left: 0,
                        top: 0,
                        width: 400,
                        height: 400,
                    })
            );
            jest.spyOn(
                overlay.element,
                'getBoundingClientRect'
            ).mockImplementation(() =>
                mockGetBoundingClientRect({
                    left: 50,
                    top: 50,
                    width: 100,
                    height: 100,
                })
            );

            const dragTarget = document.createElement('div');
            container.appendChild(dragTarget);
            overlay.setupDrag(dragTarget);

            const drag = (clientX: number, clientY: number) => {
                const down = new MouseEvent('pointerdown', {
                    clientX: 60,
                    clientY: 60,
                    bubbles: true,
                }) as any;
                down.pointerId = 1;
                dragTarget.dispatchEvent(down);

                const move = new MouseEvent('pointermove', {
                    clientX,
                    clientY,
                    bubbles: true,
                }) as any;
                move.pointerId = 1;
                window.dispatchEvent(move);
            };

            return { overlay, drag };
        }

        test('receives the proposed box, container and sibling boxes', () => {
            const calls: any[] = [];
            const siblings = [{ left: 0, top: 0, width: 10, height: 10 }];
            const { overlay, drag } = setupDraggableOverlay({
                getSiblingBoxes: () => siblings,
                transformDragPosition: (ctx) => {
                    calls.push(ctx);
                },
            });

            drag(200, 200);

            expect(calls.length).toBeGreaterThan(0);
            expect(calls[0].proposed).toMatchObject({
                width: 100,
                height: 100,
            });
            expect(calls[0].container).toEqual({ width: 400, height: 400 });
            expect(calls[0].others).toEqual(siblings);

            overlay.dispose();
        });

        test('a returned position is applied (pin to top-left)', () => {
            const { overlay, drag } = setupDraggableOverlay({
                transformDragPosition: () => ({ top: 0, left: 0 }),
            });
            const spy = jest.spyOn(overlay, 'setBounds');

            drag(300, 300);

            // top <= bottom and left <= right at (0,0), so it anchors top-left.
            expect(spy).toHaveBeenLastCalledWith({ top: 0, left: 0 });

            overlay.dispose();
        });

        test('runs before the container clamp (out-of-bounds is still clamped in)', () => {
            const { overlay, drag } = setupDraggableOverlay({
                // Ask for a position far outside the 400x400 container.
                transformDragPosition: () => ({ top: 100000, left: 100000 }),
            });
            const spy = jest.spyOn(overlay, 'setBounds');

            drag(200, 200);

            // The raw 100000 must never reach setBounds — it's clamped to the
            // container range first (every applied offset stays near the
            // 400x400 container, nowhere near the requested 100000).
            const bounds = spy.mock.calls.at(-1)![0] as Record<string, number>;
            for (const value of Object.values(bounds)) {
                expect(Math.abs(value)).toBeLessThan(1000);
            }

            overlay.dispose();
        });

        test('no transform → sibling boxes are never gathered', () => {
            const getSiblingBoxes = jest.fn(() => []);
            const { overlay, drag } = setupDraggableOverlay({
                getSiblingBoxes,
            });

            drag(200, 200);

            expect(getSiblingBoxes).not.toHaveBeenCalled();

            overlay.dispose();
        });
    });
});
