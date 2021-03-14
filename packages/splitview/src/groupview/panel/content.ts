import {
    CompositeDisposable,
    IDisposable,
    MutableDisposable,
} from '../../lifecycle';
import { Emitter, Event } from '../../events';
import { trackFocus } from '../../dom';
import { HostedContainer } from '../../hostedContainer';
import { IDockviewPanelApi } from '../../api/groupPanelApi';
import { IGroupPanel } from '../groupPanel';

export interface IRenderable {
    id: string;
    element: HTMLElement;
    onDidFocus?: Event<void>;
    onDidBlur?: Event<void>;
}

export interface IContentContainer extends IDisposable {
    onDidFocus: Event<void>;
    onDidBlur: Event<void>;
    element: HTMLElement;
    layout(width: number, height: number): void;
    openPanel: (panel: IGroupPanel) => void;
    closePanel: () => void;
    show(): void;
    hide(): void;
}

export interface HostedPanelOptions {
    id: string;
    parent?: HTMLElement;
}

export class HostedPanel implements IRenderable, IDisposable {
    private readonly _element: HTMLElement;

    get element() {
        return this._element;
    }

    get id() {
        return this.panel.id;
    }

    constructor(
        private readonly panel: IGroupPanel,
        private readonly options: HostedPanelOptions
    ) {
        if (!options.parent) {
            options.parent = document.getElementById('app') as HTMLElement;
            options.parent.style.position = 'relative';
        }

        this._element = document.createElement('div');
        this._element.style.visibility = 'hidden';
        this._element.style.overflow = 'hidden';
        // this._element.style.pointerEvents = 'none';
        this._element.id = `webivew-${options.id}`;

        options.parent.appendChild(this._element);
    }

    hide() {
        this._element.style.visibility = 'hidden';
    }

    show() {
        this._element.style.visibility = 'visible';
    }

    layout(
        element: HTMLElement,
        dimension?: { width: number; height: number }
    ) {
        if (!this.element || !this.element.parentElement) {
            return;
        }
        const frameRect = element.getBoundingClientRect();
        const containerRect = this.element.parentElement.getBoundingClientRect();
        this.element.style.position = 'absolute';
        this.element.style.top = `${frameRect.top - containerRect.top}px`;
        this.element.style.left = `${frameRect.left - containerRect.left}px`;
        this.element.style.width = `${
            dimension ? dimension.width : frameRect.width
        }px`;
        this.element.style.height = `${
            dimension ? dimension.height : frameRect.height
        }px`;
    }

    dispose() {
        this._element.remove();
    }
}

export class ContentContainer
    extends CompositeDisposable
    implements IContentContainer {
    private _element: HTMLElement;
    private panel: IGroupPanel | undefined;
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

    public openPanel(panel: IGroupPanel) {
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

        // if (panel.onDidFocus) {
        //     disposable.addDisposables(
        //         panel.onDidFocus(() => this._onDidFocus.fire())
        //     );
        // }

        // if (panel.onDidBlur) {
        //     disposable.addDisposables(
        //         panel.onDidBlur(() => this._onDidBlur.fire())
        //     );
        // }

        if (this.panel.view) {
            let _onDidFocus: Event<void> = this.panel.view.content.onDidFocus!;
            let _onDidBlur: Event<void> = this.panel.view.content.onDidBlur!;

            if (!_onDidFocus || !_onDidBlur) {
                const { onDidFocus, onDidBlur } = trackFocus(this._element);
                if (!_onDidFocus) {
                    _onDidFocus = onDidFocus;
                }
                if (!_onDidBlur) {
                    _onDidBlur = onDidBlur;
                }
            }

            disposable.addDisposables(
                _onDidFocus(() => this._onDidFocus.fire()),
                _onDidBlur(() => this._onDidBlur.fire())
            );

            this._element.appendChild(this.panel.view.content.element);
        }

        this.disposable.value = disposable;
    }

    public layout(width: number, height: number): void {
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
