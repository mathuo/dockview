import { trackFocus } from '../dom';
import { CompositeDisposable } from '../lifecycle';
import {
    IFrameworkPart,
    PanelUpdateEvent,
    PanelInitParameters,
    IPanel,
} from '../panel/types';
import { BaseViewApi } from '../api/api';

export abstract class BasePanelView<T extends BaseViewApi>
    extends CompositeDisposable
    implements IPanel {
    private _height: number;
    private _width: number;
    private _element: HTMLElement;
    private _isVisible: boolean;
    private part: IFrameworkPart;
    protected params: PanelInitParameters;

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
        private readonly component: string,
        public readonly api: T
    ) {
        super();

        this._element = document.createElement('div');
        this._element.tabIndex = -1;
        this._element.style.outline = 'none';

        const { onDidFocus, onDidBlur } = trackFocus(this._element);

        this.addDisposables(
            onDidFocus(() => {
                this.api._onDidChangeFocus.fire({ isFocused: true });
            }),
            onDidBlur(() => {
                this.api._onDidChangeFocus.fire({ isFocused: false });
            })
        );
    }

    layout(width: number, height: number) {
        this._width = width;
        this._height = height;
        this.api._onDidPanelDimensionChange.fire({ width, height });
    }

    init(parameters: PanelInitParameters): void {
        this.params = parameters;
        this.part = this.getComponent();
    }

    setVisible(isVisible: boolean) {
        this._isVisible = isVisible;
    }

    update(params: PanelUpdateEvent) {
        this.params = { ...this.params, params: params.params };
        this.part.update(params);
    }

    toJSON(): object {
        const state = this.api.getState();
        return {
            id: this.id,
            component: this.component,
            props: this.params.params,
            state: Object.keys(state).length === 0 ? undefined : state,
            visible: this._isVisible,
        };
    }

    dispose() {
        super.dispose();
        this.api.dispose();
    }
}
