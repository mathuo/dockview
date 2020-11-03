import { ISerializableView, PanelViewInitParameters } from './core/options';
import { BasePanelView } from '../gridview/basePanelView';
import { PanelApi } from '../api/panelApi';
import { LayoutPriority } from './core/splitview';
import { FunctionOrValue } from '../types';
import { Emitter, Event } from '../events';

export interface ISplitviewPanel
    extends Readonly<
        Pick<
            ISerializableView,
            | 'maximumSize'
            | 'minimumSize'
            | 'snap'
            | 'priority'
            | 'id'
            | 'toJSON'
            | 'update'
            | 'onDidChange'
        >
    > {}

export abstract class SplitviewPanel
    extends BasePanelView<PanelApi>
    implements ISerializableView, ISplitviewPanel {
    private _evaluatedMinimumSize: number;
    private _evaluatedMaximumSize: number;

    private _minimumSize: FunctionOrValue<number> = 0;
    private _maximumSize: FunctionOrValue<number> = Number.POSITIVE_INFINITY;
    private _priority?: LayoutPriority;
    private _snap = false;

    private readonly _onDidChange = new Emitter<number | undefined>();
    readonly onDidChange: Event<number | undefined> = this._onDidChange.event;

    get priority() {
        return this._priority;
    }

    get minimumSize() {
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

    get maximumSize() {
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

    get snap() {
        return this._snap;
    }

    constructor(id: string, componentName: string) {
        super(id, componentName, new PanelApi());

        this.addDisposables(
            this.api.onVisibilityChange((event) => {
                const { isVisible } = event;
                const { containerApi } = this.params as PanelViewInitParameters;
                containerApi.setVisible(this, isVisible);
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
                this._onDidChange.fire(event.size);
            })
        );
    }

    private updateConstraints() {
        this.api._onDidConstraintsChange.fire({
            maximumSize: this._evaluatedMaximumSize,
            minimumSize: this._evaluatedMinimumSize,
        });
    }

    setActive(isActive: boolean, skipFocus?: boolean) {
        super.setActive(isActive);
        if (!skipFocus) {
            this.focus();
        }
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

    dispose() {
        super.dispose();
    }
}
