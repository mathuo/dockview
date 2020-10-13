import { ISerializableView, PanelViewInitParameters } from './core/options';
import { BasePanelView } from '../gridview/basePanelView';
import { PanelApi } from '../api/panelApi';
import { LayoutPriority } from './core/splitview';
import { FunctionOrValue } from '../types';
import { Emitter, Event } from '../events';

export abstract class SplitviewPanel
    extends BasePanelView<PanelApi>
    implements ISerializableView {
    private _minimumSize: FunctionOrValue<number> = 200;
    private _maximumSize: FunctionOrValue<number> = Number.MAX_SAFE_INTEGER;
    private _priority?: LayoutPriority;
    private _snap = false;

    private readonly _onDidChange = new Emitter<number | undefined>();
    readonly onDidChange: Event<number | undefined> = this._onDidChange.event;

    get priority() {
        return this._priority;
    }

    get minimumSize() {
        return typeof this._minimumSize === 'function'
            ? this._minimumSize()
            : this._minimumSize;
    }

    get maximumSize() {
        return typeof this._maximumSize === 'function'
            ? this._maximumSize()
            : this._maximumSize;
    }

    get snap() {
        return this._snap;
    }

    constructor(id: string, componentName: string) {
        super(id, componentName, new PanelApi());

        this.addDisposables(
            this.api.onDidConstraintsChange((event) => {
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
            }),
            this.api.onDidSizeChange((event) => {
                this._onDidChange.fire(event.size);
            })
        );
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
