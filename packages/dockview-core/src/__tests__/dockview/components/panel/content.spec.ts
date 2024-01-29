import { fireEvent } from '@testing-library/dom';
import { Emitter, Event } from '../../../../events';
import { ContentContainer } from '../../../../dockview/components/panel/content';
import {
    GroupPanelContentPartInitParameters,
    IContentRenderer,
} from '../../../../dockview/types';
import { CompositeDisposable } from '../../../../lifecycle';
import { PanelUpdateEvent } from '../../../../panel/types';
import { IDockviewPanel } from '../../../../dockview/dockviewPanel';
import { IDockviewPanelModel } from '../../../../dockview/dockviewPanelModel';
import { DockviewComponent } from '../../../../dockview/dockviewComponent';
import { OverlayRenderContainer } from '../../../../overlayRenderContainer';
import { fromPartial } from '@total-typescript/shoehorn';
import { DockviewGroupPanelModel } from '../../../../dockview/dockviewGroupPanelModel';

class TestContentRenderer
    extends CompositeDisposable
    implements IContentRenderer
{
    readonly element: HTMLElement;

    readonly _onDidFocus = new Emitter<void>();
    readonly _onDidBlur = new Emitter<void>();
    readonly onDidFocus: Event<void> = this._onDidFocus.event;
    readonly onDidBlur: Event<void> = this._onDidBlur.event;

    constructor(public id: string) {
        super();
        this.element = document.createElement('div');
        this.element.id = id;
    }

    init(parameters: GroupPanelContentPartInitParameters): void {
        //
    }

    layout(width: number, height: number): void {
        //
    }
    update(event: PanelUpdateEvent): void {
        //
    }

    toJSON(): object {
        return {};
    }

    focus(): void {
        //
    }
}

describe('contentContainer', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    test('basic focus test', () => {
        let focus = 0;
        let blur = 0;

        const disposable = new CompositeDisposable();

        const dockviewComponent = jest.fn<DockviewComponent, []>(() => {
            return {
                renderer: 'onlyWhenVisibile',
                overlayRenderContainer: new OverlayRenderContainer(
                    document.createElement('div')
                ),
            } as DockviewComponent;
        });

        const cut = new ContentContainer(dockviewComponent(), jest.fn() as any);

        disposable.addDisposables(
            cut.onDidFocus(() => {
                focus++;
            }),
            cut.onDidBlur(() => {
                blur++;
            })
        );

        const contentRenderer = new TestContentRenderer('id-1');

        const panel = {
            view: {
                content: contentRenderer,
            } as Partial<IDockviewPanelModel>,
            api: { renderer: 'onlyWhenVisibile' },
        } as Partial<IDockviewPanel>;

        cut.openPanel(panel as IDockviewPanel);

        expect(focus).toBe(0);
        expect(blur).toBe(0);

        // container has focus within
        fireEvent.focus(contentRenderer.element);
        expect(focus).toBe(1);
        expect(blur).toBe(0);

        // container looses focus
        fireEvent.blur(contentRenderer.element);
        jest.runAllTimers();
        expect(focus).toBe(1);
        expect(blur).toBe(1);

        // renderer explicitly asks for focus
        contentRenderer._onDidFocus.fire();
        expect(focus).toBe(2);
        expect(blur).toBe(1);

        // renderer explicitly looses focus
        contentRenderer._onDidBlur.fire();
        expect(focus).toBe(2);
        expect(blur).toBe(2);

        const contentRenderer2 = new TestContentRenderer('id-2');

        const panel2 = {
            view: {
                content: contentRenderer2,
            } as Partial<IDockviewPanelModel>,
            api: { renderer: 'onlyWhenVisibile' },
        } as Partial<IDockviewPanel>;

        cut.openPanel(panel2 as IDockviewPanel);
        expect(focus).toBe(2);
        expect(blur).toBe(2);

        // previous renderer events should no longer be attached to container
        contentRenderer._onDidFocus.fire();
        contentRenderer._onDidBlur.fire();
        expect(focus).toBe(2);
        expect(blur).toBe(2);

        // new panel recieves focus
        fireEvent.focus(contentRenderer2.element);
        expect(focus).toBe(3);
        expect(blur).toBe(2);

        // new panel looses focus
        fireEvent.blur(contentRenderer2.element);
        jest.runAllTimers();
        expect(focus).toBe(3);
        expect(blur).toBe(3);

        disposable.dispose();
    });

    test("that panels renderered as 'onlyWhenVisibile' are removed when closed", () => {
        const cut = new ContentContainer(
            fromPartial<DockviewComponent>({
                overlayRenderContainer: {
                    detatch: jest.fn(),
                },
            }),
            fromPartial<DockviewGroupPanelModel>({})
        );

        const panel1 = fromPartial<IDockviewPanel>({
            api: {
                renderer: 'onlyWhenVisibile',
            },
            view: { content: new TestContentRenderer('panel_1') },
        });

        const panel2 = fromPartial<IDockviewPanel>({
            api: {
                renderer: 'onlyWhenVisibile',
            },
            view: { content: new TestContentRenderer('panel_2') },
        });

        cut.openPanel(panel1);

        expect(panel1.view.content.element.parentElement).toBe(cut.element);
        expect(cut.element.childNodes.length).toBe(1);

        cut.openPanel(panel2);

        expect(panel1.view.content.element.parentElement).toBeNull();
        expect(panel2.view.content.element.parentElement).toBe(cut.element);
        expect(cut.element.childNodes.length).toBe(1);
    });
});
