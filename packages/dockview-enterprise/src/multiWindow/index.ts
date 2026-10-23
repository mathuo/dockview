export { MULTI_WINDOW_DRAG_TYPE } from './crossWindowDnd';
export type { MultiWindow, MultiWindowOptions } from './multiWindow';
export { installMultiWindow } from './multiWindow';
export type { MemoryOrchestratorOptions } from './orchestrator/memoryOrchestrator';
export { MemoryOrchestrator } from './orchestrator/memoryOrchestrator';
export type {
    WindowGeometry,
    WindowRecord,
    WorkspaceState,
} from './orchestrator/workspaceRegistry';
export type {
    DragPayload,
    HistoryInfo,
    HistoryRequest,
    HistoryStepInfo,
    MoveEvent,
    MoveRole,
    MultiWindowTransport,
    ReleaseEvent,
} from './transport';
export { DRAG_END_GRACE_MS } from './transport';
