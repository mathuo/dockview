import { ISerializableView } from '../../splitview/options';
import { ReactLayout } from '../dockview/dockview';
import { ISplitviewPanelProps } from './splitview';
import { BaseReactComponentGridView } from '../baseReactComponentView';
import { PanelApi } from '../../api/panelApi';
import { PanelInitParameters } from '../../panel/types';

export class ReactComponentView
    extends BaseReactComponentGridView<PanelApi>
    implements ISerializableView {
    private _minimumSize: number = 200;
    private _maximumSize: number = Number.MAX_SAFE_INTEGER;
    private _snapSize: number;

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

    constructor(
        id: string,
        componentName: string,
        component: React.FunctionComponent<ISplitviewPanelProps>,
        parent: ReactLayout
    ) {
        super(id, componentName, component, parent, new PanelApi());
    }

    init(
        parameters: PanelInitParameters & {
            minimumSize?: number;
            maximumSize?: number;
            snapSize?: number;
        }
    ): void {
        super.init(parameters);

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
