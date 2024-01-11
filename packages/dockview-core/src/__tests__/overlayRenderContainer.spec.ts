import { Droptarget } from '../dnd/droptarget';
import { IDockviewPanel } from '../dockview/dockviewPanel';
import { Emitter } from '../events';
import { IRenderable, OverlayRenderContainer } from '../overlayRenderContainer';
import { fromPartial } from '@total-typescript/shoehorn';
import { Writable, exhaustMicrotaskQueue } from './__test_utils__/utils';

describe('overlayRenderContainer', () => {
    let referenceContainer: IRenderable;
    let parentContainer: HTMLElement;
    let cut: OverlayRenderContainer;

    beforeEach(() => {
        parentContainer = document.createElement('div');

        referenceContainer = {
            element: document.createElement('div'),
            dropTarget: fromPartial<Droptarget>({}),
        };

        cut = new OverlayRenderContainer(parentContainer);
    });

    test('that attach(...) and detach(...) mutate the DOM as expected', () => {
        const panelContentEl = document.createElement('div');

        const onDidVisibilityChange = new Emitter<any>();
        const onDidDimensionsChange = new Emitter<any>();

        const panel = fromPartial<IDockviewPanel>({
            api: {
                id: 'test_panel_id',
                onDidVisibilityChange: onDidVisibilityChange.event,
                onDidDimensionsChange: onDidDimensionsChange.event,
                isVisible: true,
            },
            view: {
                content: {
                    element: panelContentEl,
                },
            },
            group: {
                api: {
                    location: 'grid',
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
        const panelContentEl = document.createElement('div');

        const onDidVisibilityChange = new Emitter<any>();
        const onDidDimensionsChange = new Emitter<any>();

        const panel = fromPartial<IDockviewPanel>({
            api: {
                id: 'test_panel_id',
                onDidVisibilityChange: onDidVisibilityChange.event,
                onDidDimensionsChange: onDidDimensionsChange.event,
                isVisible: true,
            },
            view: {
                content: {
                    element: panelContentEl,
                },
            },
            group: {
                api: {
                    location: 'grid',
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

        expect(container.style.left).toBe('50px');
        expect(container.style.top).toBe('100px');
        expect(container.style.width).toBe('100px');
        expect(container.style.height).toBe('200px');
        expect(
            referenceContainer.element.getBoundingClientRect
        ).toHaveBeenCalledTimes(3);
    });
});
