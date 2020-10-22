import { PanelInitParameters } from '../panel/types';
import { IGridPanelComponentView } from './componentGridview';
import { FunctionOrValue } from '../types';
import { BasePanelView } from './basePanelView';
import { GridPanelApi } from '../api/gridPanelApi';
import { LayoutPriority } from '../splitview/core/splitview';
import { Emitter, Event } from '../events';
import { IViewSize } from './gridview';
import { GridviewApi } from '../api/component.api';

export interface GridviewInitParameters extends PanelInitParameters {
    minimumWidth?: number;
    maximumWidth?: number;
    minimumHeight?: number;
    maximumHeight?: number;
    priority?: LayoutPriority;
    snap?: boolean;
    containerApi: GridviewApi;
}

export abstract class GridviewPanel
    extends BasePanelView<GridPanelApi>
    implements IGridPanelComponentView {
    private _minimumWidth: FunctionOrValue<number> = 200;
    private _minimumHeight: FunctionOrValue<number> = 200;
    private _maximumWidth: FunctionOrValue<number> = Number.MAX_SAFE_INTEGER;
    private _maximumHeight: FunctionOrValue<number> = Number.MAX_SAFE_INTEGER;
    private _priority?: LayoutPriority;
    private _snap = false;

    private readonly _onDidChange = new Emitter<IViewSize | undefined>();
    readonly onDidChange: Event<IViewSize | undefined> = this._onDidChange
        .event;

    get priority() {
        return this._priority;
    }

    get snap() {
        return this._snap;
    }

    get minimumWidth() {
        return typeof this._minimumWidth === 'function'
            ? this._minimumWidth()
            : this._minimumWidth;
    }
    get minimumHeight() {
        return typeof this._minimumHeight === 'function'
            ? this._minimumHeight()
            : this._minimumHeight;
    }
    get maximumHeight() {
        return typeof this._maximumHeight === 'function'
            ? this._maximumHeight()
            : this._maximumHeight;
    }
    get maximumWidth() {
        return typeof this._maximumWidth === 'function'
            ? this._maximumWidth()
            : this._maximumWidth;
    }

    constructor(id: string, component: string) {
        super(id, component, new GridPanelApi());

        this.addDisposables(
            this.api.onVisibilityChange((event) => {
                const { isVisible } = event;
                const { containerApi } = this.params as GridviewInitParameters;
                containerApi.setVisible(this, isVisible);
            }),
            this.api.onDidConstraintsChange((event) => {
                if (
                    typeof event.minimumWidth === 'number' ||
                    typeof event.minimumWidth === 'function'
                ) {
                    this._minimumWidth = event.minimumWidth;
                }
                if (
                    typeof event.minimumHeight === 'number' ||
                    typeof event.minimumHeight === 'function'
                ) {
                    this._minimumHeight = event.minimumHeight;
                }
                if (
                    typeof event.maximumWidth === 'number' ||
                    typeof event.maximumWidth === 'function'
                ) {
                    this._maximumWidth = event.maximumWidth;
                }
                if (
                    typeof event.maximumHeight === 'number' ||
                    typeof event.maximumHeight === 'function'
                ) {
                    this._maximumHeight = event.maximumHeight;
                }
            }),
            this.api.onDidSizeChange((event) => {
                this._onDidChange.fire({
                    height: event.height,
                    width: event.width,
                });
            })
        );
    }

    init(parameters: GridviewInitParameters): void {
        if (parameters.maximumHeight) {
            this._maximumHeight = parameters.maximumHeight;
        }
        if (parameters.minimumHeight) {
            this._minimumHeight = parameters.minimumHeight;
        }
        if (parameters.maximumWidth) {
            this._maximumWidth = parameters.maximumWidth;
        }
        if (parameters.minimumWidth) {
            this._minimumWidth = parameters.minimumWidth;
        }

        this._priority = parameters.priority;
        this._snap = !!parameters.snap;

        super.init(parameters);
    }

    get isActive() {
        return false;
    }

    toJSON(): object {
        const state = super.toJSON();
        const maximum = (value: number) =>
            value === Number.MAX_SAFE_INTEGER ? undefined : value;
        const minimum = (value: number) => (value <= 0 ? undefined : value);

        return {
            ...state,
            minimumHeight: minimum(this.minimumHeight),
            maximumHeight: maximum(this.maximumHeight),
            minimumWidth: minimum(this.minimumWidth),
            maximumWidth: maximum(this.maximumWidth),
            snap: this.snap,
            priority: this.priority,
        };
    }

    dispose() {
        super.dispose();
    }
}
