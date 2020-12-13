import { trackFocus } from '../dom';
import { CompositeDisposable } from '../lifecycle';
import {
    IFrameworkPart,
    PanelUpdateEvent,
    PanelInitParameters,
    IPanel,
} from '../panel/types';
import { BaseViewApi } from '../api/api';

export interface BasePanelViewState {
    id: string;
    component: string;
    params?: { [key: string]: any };
    state?: { [key: string]: any };
}

export interface BasePanelViewExported<T extends BaseViewApi> {
    readonly id: string;
    readonly api: T;
    readonly width: number;
    readonly height: number;
    focus(): void;
    toJSON(): object;
    update(params: PanelUpdateEvent): void;
}

export abstract class BasePanelView<T extends BaseViewApi>
    extends CompositeDisposable
    implements IPanel, BasePanelViewExported<T> {
    private _height = 0;
    private _width = 0;
    private _element: HTMLElement;
    protected part?: IFrameworkPart;
    protected params?: PanelInitParameters;

    /**
     * Provide an IFrameworkPart that will determine the rendered UI of this view piece.
     */
    protected abstract getComponent(): IFrameworkPart;

    get element() {
        return this._element;
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    constructor(
        public readonly id: string,
        protected readonly component: string,
        public readonly api: T
    ) {
        super();

        this._element = document.createElement('div');
        this._element.tabIndex = -1;
        this._element.style.outline = 'none';
        this._element.style.height = '100%';
        this._element.style.width = '100%';
        this._element.style.overflow = 'hidden';

        const { onDidFocus, onDidBlur } = trackFocus(this._element);

        this.addDisposables(
            this.api,
            onDidFocus(() => {
                this.api._onDidChangeFocus.fire({ isFocused: true });
            }),
            onDidBlur(() => {
                this.api._onDidChangeFocus.fire({ isFocused: false });
            })
        );
    }

    focus() {
        this.api._onFocusEvent.fire();
    }

    layout(width: number, height: number) {
        this._width = width;
        this._height = height;
        this.api._onDidPanelDimensionChange.fire({ width, height });

        this.part?.update(this.params.params);
    }

    init(parameters: PanelInitParameters): void {
        this.params = parameters;
        this.part = this.getComponent();
    }

    update(params: PanelUpdateEvent) {
        this.params = { ...this.params, params: params.params };
        this.part?.update(this.params.params);
    }

    toJSON(): BasePanelViewState {
        const state = this.api.getState();
        return {
            id: this.id,
            component: this.component,
            params: this.params?.params
                ? Object.keys(this.params.params).length > 0
                    ? this.params.params
                    : undefined
                : undefined,
            state: Object.keys(state).length === 0 ? undefined : state,
        };
    }

    dispose() {
        super.dispose();
        this.api.dispose();
    }
}
