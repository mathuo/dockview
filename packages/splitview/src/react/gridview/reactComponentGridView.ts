import { ReactLayout } from '../dockview/dockview';
import { ISplitviewPanelProps } from '../splitview/splitview';
import { InitParameters, IPanel } from '../../api/types';
import { IGridPanelComponentView } from '../../gridview/componentGridview';
import { FunctionOrValue } from '../../types';
import { BaseReactComponentGridView } from '../baseReactComponentView';

export interface GridviewInitParameters extends InitParameters {
    minimumWidth?: number;
    maximumWidth?: number;
    minimumHeight?: number;
    maximumHeight?: number;
}

export class ReactComponentGridView
    extends BaseReactComponentGridView
    implements IGridPanelComponentView, IPanel {
    private _minimumWidth: FunctionOrValue<number> = 200;
    private _minimumHeight: FunctionOrValue<number> = 200;
    private _maximumWidth: FunctionOrValue<number> = Number.MAX_SAFE_INTEGER;
    private _maximumHeight: FunctionOrValue<number> = Number.MAX_SAFE_INTEGER;

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

    constructor(
        id: string,
        componentName: string,
        component: React.FunctionComponent<ISplitviewPanelProps>,
        parent: ReactLayout
    ) {
        super(id, componentName, component, parent);

        this.addDisposables(
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

        super.init(parameters);
    }

    setActive(isActive: boolean) {
        // noop
    }

    get isActive() {
        return false;
    }

    dispose() {
        super.dispose();
    }
}
