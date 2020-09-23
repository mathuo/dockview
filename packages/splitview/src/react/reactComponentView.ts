import { IView } from '../splitview/splitview';
import { ReactLayout } from './dockview';
import { ISplitviewPanelProps } from './splitview';
import { IPanel } from '../panel/types';
import { BaseReactComponentGridView } from './baseReactComponentView';

/**
 * A no-thrills implementation of IView that renders a React component
 */
export class ReactComponentView
    extends BaseReactComponentGridView
    implements IView, IPanel {
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
        super(id, componentName, component, parent);
    }

    dispose() {
        super.dispose();
    }
}
