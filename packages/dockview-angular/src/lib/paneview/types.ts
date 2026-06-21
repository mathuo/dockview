import { TemplateRef, Type } from '@angular/core';
import { PaneviewOptions, PaneviewApi, PaneviewDidDropEvent } from 'dockview';

export interface PaneviewAngularReadyEvent {
    api: PaneviewApi;
}

export interface PaneviewAngularOptions extends PaneviewOptions {
    components: Record<string, Type<any> | TemplateRef<any>>;
    headerComponents?: Record<string, Type<any> | TemplateRef<any>>;
}

export interface PaneviewAngularEvents {
    ready: PaneviewAngularReadyEvent;
    drop: PaneviewDidDropEvent;
}

// Re-export commonly used types from dockview
export { PaneviewApi, PaneviewDidDropEvent, PaneviewOptions } from 'dockview';
