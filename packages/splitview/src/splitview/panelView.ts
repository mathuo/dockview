import { ISerializableView, PanelViewInitParameters } from './core/options';
import { BasePanelView } from '../gridview/basePanelView';
import { PanelApi } from '../api/panelApi';
import { LayoutPriority } from './core/splitview';

export abstract class PanelView
    extends BasePanelView<PanelApi>
    implements ISerializableView {
    private _minimumSize: number = 200;
    private _maximumSize: number = Number.MAX_SAFE_INTEGER;
    private _snapSize: number;
    private _priority: LayoutPriority;

    get priority() {
        return this._priority;
    }

    get minimumSize() {
        return this._minimumSize;
    }
    set minimumSize(value: number) {
        this._minimumSize = value;
    }

    get snapSize() {
        return this._snapSize;
    }
    set snapSize(value: number) {
        this._snapSize = value;
    }

    get maximumSize() {
        return this._maximumSize;
    }
    set maximumSize(value: number) {
        this._maximumSize = value;
    }

    constructor(id: string, componentName: string) {
        super(id, componentName, new PanelApi());
    }

    init(parameters: PanelViewInitParameters): void {
        super.init(parameters);

        this._priority = parameters.priority;

        if (parameters.minimumSize) {
            this.minimumSize = parameters.minimumSize;
        }
        if (parameters.maximumSize) {
            this.maximumSize = parameters.maximumSize;
        }
        if (parameters.snapSize) {
            this.snapSize = parameters.snapSize;
        }
    }

    dispose() {
        super.dispose();
    }
}
