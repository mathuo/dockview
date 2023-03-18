import { PanelInitParameters } from '../panel/types';
import {
    GridviewComponent,
    IGridPanelComponentView,
} from './gridviewComponent';
import { FunctionOrValue } from '../types';
import {
    BasePanelView,
    BasePanelViewExported,
    BasePanelViewState,
} from './basePanelView';
import {
    GridviewPanelApi,
    GridviewPanelApiImpl,
} from '../api/gridviewPanelApi';
import { LayoutPriority } from '../splitview/splitview';
import { Emitter, Event } from '../events';
import { IViewSize } from './gridview';

export interface GridviewInitParameters extends PanelInitParameters {
    minimumWidth?: number;
    maximumWidth?: number;
    minimumHeight?: number;
    maximumHeight?: number;
    priority?: LayoutPriority;
    snap?: boolean;
    accessor: GridviewComponent;
    isVisible?: boolean;
}

export interface IGridviewPanel
    extends BasePanelViewExported<GridviewPanelApi> {
    readonly minimumWidth: number;
    readonly maximumWidth: number;
    readonly minimumHeight: number;
    readonly maximumHeight: number;
    readonly priority: LayoutPriority | undefined;
    readonly snap: boolean;
}

export abstract class GridviewPanel
    extends BasePanelView<GridviewPanelApiImpl>
    implements IGridPanelComponentView, IGridviewPanel
{
    private _evaluatedMinimumWidth = 0;
    private _evaluatedMaximumWidth = Number.MAX_SAFE_INTEGER;
    private _evaluatedMinimumHeight = 0;
    private _evaluatedMaximumHeight = Number.MAX_SAFE_INTEGER;

    private _minimumWidth: FunctionOrValue<number> = 100;
    private _minimumHeight: FunctionOrValue<number> = 100;
    private _maximumWidth: FunctionOrValue<number> = Number.MAX_SAFE_INTEGER;
    private _maximumHeight: FunctionOrValue<number> = Number.MAX_SAFE_INTEGER;
    private _priority?: LayoutPriority;
    private _snap = false;

    private readonly _onDidChange = new Emitter<IViewSize | undefined>();
    readonly onDidChange: Event<IViewSize | undefined> =
        this._onDidChange.event;

    get priority(): LayoutPriority | undefined {
        return this._priority;
    }

    get snap(): boolean {
        return this._snap;
    }

    get minimumWidth(): number {
        const width =
            typeof this._minimumWidth === 'function'
                ? this._minimumWidth()
                : this._minimumWidth;

        if (width !== this._evaluatedMinimumWidth) {
            this._evaluatedMinimumWidth = width;
            this.updateConstraints();
        }

        return width;
    }

    get minimumHeight(): number {
        const height =
            typeof this._minimumHeight === 'function'
                ? this._minimumHeight()
                : this._minimumHeight;

        if (height !== this._evaluatedMinimumHeight) {
            this._evaluatedMinimumHeight = height;
            this.updateConstraints();
        }

        return height;
    }

    get maximumHeight(): number {
        const height =
            typeof this._maximumHeight === 'function'
                ? this._maximumHeight()
                : this._maximumHeight;

        if (height !== this._evaluatedMaximumHeight) {
            this._evaluatedMaximumHeight = height;
            this.updateConstraints();
        }

        return height;
    }

    get maximumWidth(): number {
        const width =
            typeof this._maximumWidth === 'function'
                ? this._maximumWidth()
                : this._maximumWidth;

        if (width !== this._evaluatedMaximumWidth) {
            this._evaluatedMaximumWidth = width;
            this.updateConstraints();
        }

        return width;
    }

    get isActive(): boolean {
        return this.api.isActive;
    }

    constructor(id: string, component: string) {
        super(id, component, new GridviewPanelApiImpl(id));

        this.api.initialize(this); // TODO: required to by-pass 'super before this' requirement

        this.addDisposables(
            this._onDidChange,
            this.api.onVisibilityChange((event) => {
                const { isVisible } = event;
                const { accessor } = this._params as GridviewInitParameters;
                accessor.setVisible(this, isVisible);
            }),
            this.api.onActiveChange(() => {
                const { accessor } = this._params as GridviewInitParameters;
                accessor.setActive(this);
            }),
            this.api.onDidConstraintsChangeInternal((event) => {
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

    setVisible(isVisible: boolean): void {
        this.api._onDidVisibilityChange.fire({ isVisible });
    }

    setActive(isActive: boolean): void {
        this.api._onDidActiveChange.fire({ isActive });
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

        if (typeof parameters.isVisible === 'boolean') {
            this.setVisible(parameters.isVisible);
        }
    }

    private updateConstraints(): void {
        this.api._onDidConstraintsChange.fire({
            minimumWidth: this._evaluatedMinimumWidth,
            maximumWidth: this._evaluatedMaximumWidth,
            minimumHeight: this._evaluatedMinimumHeight,
            maximumHeight: this._evaluatedMaximumHeight,
        });
    }

    toJSON(): GridPanelViewState {
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
}

export interface GridPanelViewState extends BasePanelViewState {
    minimumHeight?: number;
    maximumHeight?: number;
    minimumWidth?: number;
    maximumWidth?: number;
    snap?: boolean;
    priority?: LayoutPriority;
}
