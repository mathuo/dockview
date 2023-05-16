import { trackFocus } from '../dom';
import { CompositeDisposable } from '../lifecycle';
import {
    IFrameworkPart,
    PanelUpdateEvent,
    PanelInitParameters,
    IPanel,
} from '../panel/types';
import { PanelApi, PanelApiImpl } from '../api/panelApi';

export interface BasePanelViewState {
    readonly id: string;
    readonly component: string;
    readonly params?: Record<string, any>;
}

export interface BasePanelViewExported<T extends PanelApi> {
    readonly id: string;
    readonly api: T;
    readonly width: number;
    readonly height: number;
    readonly params: Record<string, any> | undefined;
    focus(): void;
    toJSON(): object;
    update(event: PanelUpdateEvent): void;
}

export abstract class BasePanelView<T extends PanelApiImpl>
    extends CompositeDisposable
    implements IPanel, BasePanelViewExported<T>
{
    private _height = 0;
    private _width = 0;
    private _element: HTMLElement;
    protected part?: IFrameworkPart;
    protected _params?: PanelInitParameters;

    // provide an IFrameworkPart that will determine the rendered UI of this view piece.
    protected abstract getComponent(): IFrameworkPart;

    get element(): HTMLElement {
        return this._element;
    }

    get width(): number {
        return this._width;
    }

    get height(): number {
        return this._height;
    }

    get params(): Record<string, any> | undefined {
        return this._params?.params;
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

        const focusTracker = trackFocus(this._element);

        this.addDisposables(
            this.api,
            focusTracker.onDidFocus(() => {
                this.api._onDidChangeFocus.fire({ isFocused: true });
            }),
            focusTracker.onDidBlur(() => {
                this.api._onDidChangeFocus.fire({ isFocused: false });
            }),
            focusTracker
        );
    }

    focus(): void {
        this.api._onFocusEvent.fire();
    }

    layout(width: number, height: number): void {
        this._width = width;
        this._height = height;
        this.api._onDidDimensionChange.fire({ width, height });

        if (this.part) {
            if (this._params) {
                this.part.update(this._params.params);
            }
        }
    }

    init(parameters: PanelInitParameters): void {
        this._params = parameters;
        this.part = this.getComponent();
    }

    update(event: PanelUpdateEvent): void {
        this._params = {
            ...this._params,
            params: {
                ...this._params?.params,
                ...event.params,
            },
        };
        this.part?.update({ params: this._params.params });
    }

    toJSON(): BasePanelViewState {
        const params = this._params?.params ?? {};

        return {
            id: this.id,
            component: this.component,
            params: Object.keys(params).length > 0 ? params : undefined,
        };
    }

    dispose(): void {
        this.api.dispose();
        this.part?.dispose();

        super.dispose();
    }
}
