import {
    CompositeDisposable,
    IDisposable,
    MutableDisposable,
} from '../../lifecycle';
import { Emitter, Event } from '../../events';
import { trackFocus } from '../../dom';
import { IDockviewPanel } from '../../dockview/dockviewPanel';

export interface IContentContainer extends IDisposable {
    onDidFocus: Event<void>;
    onDidBlur: Event<void>;
    element: HTMLElement;
    layout(width: number, height: number): void;
    openPanel: (panel: IDockviewPanel) => void;
    closePanel: () => void;
    show(): void;
    hide(): void;
}

export class ContentContainer
    extends CompositeDisposable
    implements IContentContainer
{
    private _element: HTMLElement;
    private panel: IDockviewPanel | undefined;
    private disposable = new MutableDisposable();

    private readonly _onDidFocus = new Emitter<void>();
    readonly onDidFocus: Event<void> = this._onDidFocus.event;

    private readonly _onDidBlur = new Emitter<void>();
    readonly onDidBlur: Event<void> = this._onDidBlur.event;

    get element() {
        return this._element;
    }

    constructor() {
        super();
        this._element = document.createElement('div');
        this._element.className = 'content-container';
        this._element.tabIndex = -1;

        this.addDisposables(this._onDidFocus, this._onDidBlur);

        // for hosted containers
        // 1) register a drop target on the host
        // 2) register window dragStart events to disable pointer events
        // 3) register dragEnd events
        // 4) register mouseMove events (if no buttons are present we take this as a dragEnd event)
    }

    show() {
        this.element.style.display = '';
    }

    hide() {
        this.element.style.display = 'none';
    }

    public openPanel(panel: IDockviewPanel) {
        if (this.panel === panel) {
            return;
        }
        if (this.panel) {
            if (this.panel.view?.content) {
                this._element.removeChild(this.panel.view.content.element);
            }
            this.panel = undefined;
        }
        this.panel = panel;

        const disposable = new CompositeDisposable();

        if (this.panel.view) {
            const _onDidFocus: Event<void> =
                this.panel.view.content.onDidFocus!;
            const _onDidBlur: Event<void> = this.panel.view.content.onDidBlur!;

            const { onDidFocus, onDidBlur } = trackFocus(this._element);

            disposable.addDisposables(
                onDidFocus(() => this._onDidFocus.fire()),
                onDidBlur(() => this._onDidBlur.fire())
            );

            if (_onDidFocus) {
                disposable.addDisposables(
                    _onDidFocus(() => this._onDidFocus.fire())
                );
            }
            if (_onDidBlur) {
                disposable.addDisposables(
                    _onDidBlur(() => this._onDidBlur.fire())
                );
            }

            this._element.appendChild(this.panel.view.content.element);
        }

        this.disposable.value = disposable;
    }

    public layout(_width: number, _height: number): void {
        // noop
    }

    public closePanel() {
        if (this.panel?.view?.content?.element) {
            this._element.removeChild(this.panel.view.content.element);
            this.panel = undefined;
        }
    }

    public dispose() {
        this.disposable.dispose();
        super.dispose();
    }
}
