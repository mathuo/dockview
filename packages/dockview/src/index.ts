import './footnote';

export * from './splitview/core/splitview';
export * from './splitview/splitviewComponent';
export * from './paneview/paneview';
export * from './paneview/paneviewComponent';
export * from './gridview/gridview';
export * from './groupview/groupview';
export * from './groupview/panel/content';
export * from './groupview/tab';
export * from './events';
export * from './lifecycle';
export * from './groupview/groupPanel';
export * from './api/groupPanelApi';
export * from './api/component.api';
export * from './groupview/types';
export * from './dockview/dockviewComponent';
export * from './dockview/options';
export * from './gridview/gridviewComponent';

export * from './react'; // TODO: should be conditional on whether user wants the React wrappers

export {
    StateObject,
    State,
    FocusEvent,
    PanelDimensionChangeEvent,
    VisibilityEvent,
    ActiveEvent,
} from './api/panelApi';
export {
    SizeEvent,
    GridviewPanelApi as IGridviewPanelApi,
    GridConstraintChangeEvent,
} from './api/gridviewPanelApi';
export {
    TitleEvent,
    DockviewPanelApi as IDockviewPanelApi,
} from './api/groupPanelApi';
export {
    PanelSizeEvent,
    PanelConstraintChangeEvent,
    SplitviewPanelApi as ISplitviewPanelApi,
} from './api/splitviewPanelApi';
export { ExpansionEvent, IPaneviewPanelApi } from './api/paneviewPanelApi';
