import { Droptarget } from '../../dnd/droptarget';
import { IDockviewPanel } from '../../dockview/dockviewPanel';
import { Emitter } from '../../events';
import {
    IRenderable,
    OverlayRenderContainer,
} from '../../overlay/overlayRenderContainer';
import { fromPartial } from '@total-typescript/shoehorn';
import {
    Writable,
    exhaustMicrotaskQueue,
    exhaustAnimationFrame,
} from '../__test_utils__/utils';
import { DockviewComponent } from '../../dockview/dockviewComponent';
import { DockviewGroupPanel } from '../../dockview/dockviewGroupPanel';

describe('overlayRenderContainer', () => {
    let referenceContainer: IRenderable;
    let parentContainer: HTMLElement;

    beforeEach(() => {
        parentContainer = document.createElement('div');

        referenceContainer = {
            element: document.createElement('div'),
            dropTarget: fromPartial<Droptarget>({}),
        };
    });

    test('that attach(...) and detach(...) mutate the DOM as expected', () => {
        const cut = new OverlayRenderContainer(
            parentContainer,
            fromPartial<DockviewComponent>({})
        );

        const panelContentEl = document.createElement('div');

        const onDidVisibilityChange = new Emitter<any>();
        const onDidDimensionsChange = new Emitter<any>();
        const onDidLocationChange = new Emitter<any>();

        const panel = fromPartial<IDockviewPanel>({
            api: {
                id: 'test_panel_id',
                onDidVisibilityChange: onDidVisibilityChange.event,
                onDidDimensionsChange: onDidDimensionsChange.event,
                onDidLocationChange: onDidLocationChange.event,
                isVisible: true,
                location: { type: 'grid' },
            },
            view: {
                content: {
                    element: panelContentEl,
                },
            },
            group: {
                api: {
                    location: { type: 'grid' },
                },
            },
        });

        cut.attach({ panel, referenceContainer });

        expect(panelContentEl.parentElement?.parentElement).toBe(
            parentContainer
        );

        cut.detatch(panel);

        expect(panelContentEl.parentElement?.parentElement).toBeUndefined();
    });

    test('add a view that is not currently in the DOM', async () => {
        const cut = new OverlayRenderContainer(
            parentContainer,
            fromPartial<DockviewComponent>({})
        );

        const panelContentEl = document.createElement('div');

        const onDidVisibilityChange = new Emitter<any>();
        const onDidDimensionsChange = new Emitter<any>();
        const onDidLocationChange = new Emitter<any>();

        const panel = fromPartial<IDockviewPanel>({
            api: {
                id: 'test_panel_id',
                onDidVisibilityChange: onDidVisibilityChange.event,
                onDidDimensionsChange: onDidDimensionsChange.event,
                onDidLocationChange: onDidLocationChange.event,
                isVisible: true,
                location: { type: 'grid' },
            },
            view: {
                content: {
                    element: panelContentEl,
                },
            },
            group: {
                api: {
                    location: { type: 'grid' },
                },
            },
        });

        (parentContainer as jest.Mocked<HTMLDivElement>).getBoundingClientRect =
            jest
                .fn<DOMRect, []>()
                .mockReturnValueOnce(
                    fromPartial<DOMRect>({
                        left: 100,
                        top: 200,
                        width: 1000,
                        height: 500,
                    })
                )
                .mockReturnValueOnce(
                    fromPartial<DOMRect>({
                        left: 101,
                        top: 201,
                        width: 1000,
                        height: 500,
                    })
                )
                .mockReturnValueOnce(
                    fromPartial<DOMRect>({
                        left: 100,
                        top: 200,
                        width: 1000,
                        height: 500,
                    })
                );

        (
            referenceContainer.element as jest.Mocked<HTMLDivElement>
        ).getBoundingClientRect = jest
            .fn<DOMRect, []>()
            .mockReturnValueOnce(
                fromPartial<DOMRect>({
                    left: 150,
                    top: 300,
                    width: 100,
                    height: 200,
                })
            )
            .mockReturnValueOnce(
                fromPartial<DOMRect>({
                    left: 150,
                    top: 300,
                    width: 101,
                    height: 201,
                })
            )
            .mockReturnValueOnce(
                fromPartial<DOMRect>({
                    left: 150,
                    top: 300,
                    width: 100,
                    height: 200,
                })
            );

        const container = cut.attach({ panel, referenceContainer });

        await exhaustMicrotaskQueue();
        await exhaustAnimationFrame();

        expect(panelContentEl.parentElement).toBe(container);
        expect(container.parentElement).toBe(parentContainer);

        expect(container.style.display).toBe('');

        expect(container.style.left).toBe('50px');
        expect(container.style.top).toBe('100px');
        expect(container.style.width).toBe('100px');
        expect(container.style.height).toBe('200px');
        expect(
            referenceContainer.element.getBoundingClientRect
        ).toHaveBeenCalledTimes(1);

        onDidDimensionsChange.fire({});
        await exhaustAnimationFrame();
        expect(container.style.display).toBe('');

        expect(container.style.left).toBe('49px');
        expect(container.style.top).toBe('99px');
        expect(container.style.width).toBe('101px');
        expect(container.style.height).toBe('201px');
        expect(
            referenceContainer.element.getBoundingClientRect
        ).toHaveBeenCalledTimes(2);

        (panel as Writable<IDockviewPanel>).api.isVisible = false;
        onDidVisibilityChange.fire({});
        expect(container.style.display).toBe('none');
        expect(
            referenceContainer.element.getBoundingClientRect
        ).toHaveBeenCalledTimes(2);

        (panel as Writable<IDockviewPanel>).api.isVisible = true;
        onDidVisibilityChange.fire({});
        expect(container.style.display).toBe('');

        expect(container.style.left).toBe('49px');
        expect(container.style.top).toBe('99px');
        expect(container.style.width).toBe('101px');
        expect(container.style.height).toBe('201px');
        expect(
            referenceContainer.element.getBoundingClientRect
        ).toHaveBeenCalledTimes(2);
    });

    test('related z-index from `aria-level` set on floating panels', async () => {
        const group = fromPartial<DockviewGroupPanel>({});

        const element = document.createElement('div');
        element.setAttribute('aria-level', '2');
        const spy = jest.spyOn(element, 'getAttribute');

        const accessor = fromPartial<DockviewComponent>({
            floatingGroups: [
                {
                    group,
                    overlay: {
                        element,
                    },
                },
            ],
        });

        const cut = new OverlayRenderContainer(parentContainer, accessor);

        const panelContentEl = document.createElement('div');

        const onDidVisibilityChange = new Emitter<any>();
        const onDidDimensionsChange = new Emitter<any>();
        const onDidLocationChange = new Emitter<any>();

        const panel = fromPartial<IDockviewPanel>({
            api: {
                id: 'test_panel_id',
                onDidVisibilityChange: onDidVisibilityChange.event,
                onDidDimensionsChange: onDidDimensionsChange.event,
                onDidLocationChange: onDidLocationChange.event,
                isVisible: true,
                group,
                location: { type: 'floating' },
            },
            view: {
                content: {
                    element: panelContentEl,
                },
            },
            group: {
                api: {
                    location: { type: 'floating' },
                },
            },
        });

        cut.attach({ panel, referenceContainer });

        await exhaustMicrotaskQueue();

        expect(spy).toHaveBeenCalledWith('aria-level');
        expect(panelContentEl.parentElement!.style.zIndex).toBe(
            'calc(var(--dv-overlay-z-index, 999) + 5)'
        );
    });

    test('that frequent resize calls are batched to prevent shaking (issue #988)', async () => {
        const cut = new OverlayRenderContainer(
            parentContainer,
            fromPartial<DockviewComponent>({})
        );

        const panelContentEl = document.createElement('div');
        const onDidVisibilityChange = new Emitter<any>();
        const onDidDimensionsChange = new Emitter<any>();
        const onDidLocationChange = new Emitter<any>();

        const panel = fromPartial<IDockviewPanel>({
            api: {
                id: 'test_panel_id',
                onDidVisibilityChange: onDidVisibilityChange.event,
                onDidDimensionsChange: onDidDimensionsChange.event,
                onDidLocationChange: onDidLocationChange.event,
                isVisible: true,
                location: { type: 'grid' },
            },
            view: {
                content: {
                    element: panelContentEl,
                },
            },
            group: {
                api: {
                    location: {
                        type: 'grid',
                    },
                },
            },
        });

        jest.spyOn(
            referenceContainer.element,
            'getBoundingClientRect'
        ).mockReturnValue(
            fromPartial<DOMRect>({
                left: 100,
                top: 200,
                width: 150,
                height: 250,
            })
        );

        jest.spyOn(parentContainer, 'getBoundingClientRect').mockReturnValue(
            fromPartial<DOMRect>({
                left: 50,
                top: 100,
                width: 200,
                height: 300,
            })
        );

        const container = cut.attach({ panel, referenceContainer });

        // Wait for initial positioning
        await exhaustMicrotaskQueue();
        await exhaustAnimationFrame();

        expect(container.style.left).toBe('50px');
        expect(container.style.top).toBe('100px');

        // Simulate rapid resize events that could cause shaking
        onDidDimensionsChange.fire({});
        onDidDimensionsChange.fire({});
        onDidDimensionsChange.fire({});
        onDidDimensionsChange.fire({});
        onDidDimensionsChange.fire({});

        // Even with multiple rapid events, only one RAF should be scheduled
        await exhaustAnimationFrame();

        expect(container.style.left).toBe('50px');
        expect(container.style.top).toBe('100px');
        expect(container.style.width).toBe('150px');
        expect(container.style.height).toBe('250px');

        // Verify that DOM measurements are cached within the same frame
        // Should be called initially and possibly one more time for visibility change
        expect(
            referenceContainer.element.getBoundingClientRect
        ).toHaveBeenCalledTimes(2);
        expect(parentContainer.getBoundingClientRect).toHaveBeenCalledTimes(2);
    });

    test('updateAllPositions forces position recalculation for visible panels', async () => {
        const cut = new OverlayRenderContainer(
            parentContainer,
            fromPartial<DockviewComponent>({})
        );

        const panelContentEl1 = document.createElement('div');
        const panelContentEl2 = document.createElement('div');

        const onDidVisibilityChange1 = new Emitter<any>();
        const onDidDimensionsChange1 = new Emitter<any>();
        const onDidLocationChange1 = new Emitter<any>();

        const onDidVisibilityChange2 = new Emitter<any>();
        const onDidDimensionsChange2 = new Emitter<any>();
        const onDidLocationChange2 = new Emitter<any>();

        const panel1 = fromPartial<IDockviewPanel>({
            api: {
                id: 'panel1',
                onDidVisibilityChange: onDidVisibilityChange1.event,
                onDidDimensionsChange: onDidDimensionsChange1.event,
                onDidLocationChange: onDidLocationChange1.event,
                isVisible: true,
                location: { type: 'grid' },
            },
            view: {
                content: {
                    element: panelContentEl1,
                },
            },
            group: {
                api: {
                    location: { type: 'grid' },
                },
            },
        });

        const panel2 = fromPartial<IDockviewPanel>({
            api: {
                id: 'panel2',
                onDidVisibilityChange: onDidVisibilityChange2.event,
                onDidDimensionsChange: onDidDimensionsChange2.event,
                onDidLocationChange: onDidLocationChange2.event,
                isVisible: false, // This panel is not visible
                location: { type: 'grid' },
            },
            view: {
                content: {
                    element: panelContentEl2,
                },
            },
            group: {
                api: {
                    location: { type: 'grid' },
                },
            },
        });

        // Mock getBoundingClientRect for consistent testing
        jest.spyOn(
            referenceContainer.element,
            'getBoundingClientRect'
        ).mockReturnValue(
            fromPartial<DOMRect>({
                left: 100,
                top: 200,
                width: 150,
                height: 250,
            })
        );

        jest.spyOn(parentContainer, 'getBoundingClientRect').mockReturnValue(
            fromPartial<DOMRect>({
                left: 50,
                top: 100,
                width: 200,
                height: 300,
            })
        );

        // Attach both panels
        const container1 = cut.attach({ panel: panel1, referenceContainer });
        const container2 = cut.attach({ panel: panel2, referenceContainer });

        await exhaustMicrotaskQueue();
        await exhaustAnimationFrame();

        // Clear previous calls to getBoundingClientRect
        jest.clearAllMocks();

        // Call updateAllPositions
        cut.updateAllPositions();

        // Should trigger resize for visible panels only
        await exhaustAnimationFrame();

        // Verify that positioning was updated for visible panel
        expect(container1.style.left).toBe('50px');
        expect(container1.style.top).toBe('100px');
        expect(container1.style.width).toBe('150px');
        expect(container1.style.height).toBe('250px');

        // Verify getBoundingClientRect was called for visible panel only
        // updateAllPositions should call the resize function which triggers getBoundingClientRect
        expect(
            referenceContainer.element.getBoundingClientRect
        ).toHaveBeenCalled();
        expect(parentContainer.getBoundingClientRect).toHaveBeenCalled();
    });
});
