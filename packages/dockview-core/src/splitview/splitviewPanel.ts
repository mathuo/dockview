import { PanelViewInitParameters } from './options';
import {
    BasePanelView,
    BasePanelViewExported,
} from '../gridview/basePanelView';
import { SplitviewPanelApiImpl } from '../api/splitviewPanelApi';
import { LayoutPriority, Orientation } from './splitview';
import { FunctionOrValue } from '../types';
import { Emitter, Event } from '../events';

export interface ISplitviewPanel
    extends BasePanelViewExported<SplitviewPanelApiImpl> {
    readonly priority: LayoutPriority | undefined;
    readonly minimumSize: number;
    readonly maximumSize: number;
    readonly snap: boolean;
    readonly orientation: Orientation;
}

export abstract class SplitviewPanel
    extends BasePanelView<SplitviewPanelApiImpl>
    implements ISplitviewPanel
{
    private _evaluatedMinimumSize = 0;
    private _evaluatedMaximumSize = Number.POSITIVE_INFINITY;

    private _minimumSize: FunctionOrValue<number> = 0;
    private _maximumSize: FunctionOrValue<number> = Number.POSITIVE_INFINITY;
    private _priority?: LayoutPriority;
    private _snap = false;

    private _orientation?: Orientation;

    private readonly _onDidChange = new Emitter<{
        size?: number;
        orthogonalSize?: number;
    }>();
    readonly onDidChange: Event<{ size?: number; orthogonalSize?: number }> =
        this._onDidChange.event;

    get priority(): LayoutPriority | undefined {
        return this._priority;
    }

    set orientation(value: Orientation) {
        this._orientation = value;
    }

    get orientation(): Orientation {
        return this._orientation!;
    }

    get minimumSize(): number {
        const size =
            typeof this._minimumSize === 'function'
                ? this._minimumSize()
                : this._minimumSize;

        if (size !== this._evaluatedMinimumSize) {
            this._evaluatedMinimumSize = size;
            this.updateConstraints();
        }

        return size;
    }

    get maximumSize(): number {
        const size =
            typeof this._maximumSize === 'function'
                ? this._maximumSize()
                : this._maximumSize;

        if (size !== this._evaluatedMaximumSize) {
            this._evaluatedMaximumSize = size;
            this.updateConstraints();
        }

        return size;
    }

    get snap(): boolean {
        return this._snap;
    }

    constructor(id: string, componentName: string) {
        super(id, componentName, new SplitviewPanelApiImpl(id, componentName));

        this.api.initialize(this);

        this.addDisposables(
            this._onDidChange,
            this.api.onWillVisibilityChange((event) => {
                const { isVisible } = event;
                const { accessor } = this._params as PanelViewInitParameters;
                accessor.setVisible(this, isVisible);
            }),
            this.api.onActiveChange(() => {
                const { accessor } = this._params as PanelViewInitParameters;
                accessor.setActive(this);
            }),
            this.api.onDidConstraintsChangeInternal((event) => {
                if (
                    typeof event.minimumSize === 'number' ||
                    typeof event.minimumSize === 'function'
                ) {
                    this._minimumSize = event.minimumSize;
                }
                if (
                    typeof event.maximumSize === 'number' ||
                    typeof event.maximumSize === 'function'
                ) {
                    this._maximumSize = event.maximumSize;
                }
                this.updateConstraints();
            }),
            this.api.onDidSizeChange((event) => {
                this._onDidChange.fire({ size: event.size });
            })
        );
    }

    setVisible(isVisible: boolean): void {
        this.api._onDidVisibilityChange.fire({ isVisible });
    }

    setActive(isActive: boolean): void {
        this.api._onDidActiveChange.fire({ isActive });
    }

    layout(size: number, orthogonalSize: number): void {
        const [width, height] =
            this.orientation === Orientation.HORIZONTAL
                ? [size, orthogonalSize]
                : [orthogonalSize, size];
        super.layout(width, height);
    }

    init(parameters: PanelViewInitParameters): void {
        super.init(parameters);

        this._priority = parameters.priority;

        if (parameters.minimumSize) {
            this._minimumSize = parameters.minimumSize;
        }
        if (parameters.maximumSize) {
            this._maximumSize = parameters.maximumSize;
        }
        if (parameters.snap) {
            this._snap = parameters.snap;
        }
    }

    toJSON() {
        const maximum = (value: number) =>
            value === Number.MAX_SAFE_INTEGER ||
            value === Number.POSITIVE_INFINITY
                ? undefined
                : value;
        const minimum = (value: number) => (value <= 0 ? undefined : value);

        return {
            ...super.toJSON(),
            minimumSize: minimum(this.minimumSize),
            maximumSize: maximum(this.maximumSize),
        };
    }

    private updateConstraints(): void {
        this.api._onDidConstraintsChange.fire({
            maximumSize: this._evaluatedMaximumSize,
            minimumSize: this._evaluatedMinimumSize,
        });
    }
}
