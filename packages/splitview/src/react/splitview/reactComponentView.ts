import { IView } from '../../splitview/splitview';
import { ReactLayout } from '../dockview/dockview';
import { ISplitviewPanelProps } from './splitview';
import { BaseReactComponentGridView } from '../baseReactComponentView';
import { PanelApi } from '../../api/panelApi';

export class ReactComponentView
    extends BaseReactComponentGridView<PanelApi>
    implements IView {
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

    dispose() {
        super.dispose();
    }
}
