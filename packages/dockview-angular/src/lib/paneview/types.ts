import { Type } from '@angular/core';
import {
    PaneviewOptions,
    PaneviewApi,
    PaneviewDropEvent
} from 'dockview-core';

export interface PaneviewAngularReadyEvent {
    api: PaneviewApi;
}

export interface PaneviewAngularOptions extends PaneviewOptions {
    components: Record<string, Type<any>>;
    headerComponents?: Record<string, Type<any>>;
}

export interface PaneviewAngularEvents {
    ready: PaneviewAngularReadyEvent;
    drop: PaneviewDropEvent;
}

// Re-export commonly used types from dockview-core
export {
    PaneviewApi,
    PaneviewDropEvent,
    PaneviewOptions
} from 'dockview-core';