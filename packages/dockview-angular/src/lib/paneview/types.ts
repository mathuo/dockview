import { TemplateRef, Type } from '@angular/core';
import { PaneviewOptions, PaneviewApi, PaneviewDropEvent } from 'dockview';

export interface PaneviewAngularReadyEvent {
    api: PaneviewApi;
}

export interface PaneviewAngularOptions extends PaneviewOptions {
    components: Record<string, Type<any> | TemplateRef<any>>;
    headerComponents?: Record<string, Type<any> | TemplateRef<any>>;
}

export interface PaneviewAngularEvents {
    ready: PaneviewAngularReadyEvent;
    drop: PaneviewDropEvent;
}

// Re-export commonly used types from dockview-core
export { PaneviewApi, PaneviewDropEvent, PaneviewOptions } from 'dockview';
