import { TemplateRef, Type } from '@angular/core';
import { GridviewOptions, GridviewApi } from 'dockview';

export interface GridviewAngularReadyEvent {
    api: GridviewApi;
}

export interface GridviewAngularOptions extends GridviewOptions {
    components: Record<string, Type<any> | TemplateRef<any>>;
}

export interface GridviewAngularEvents {
    ready: GridviewAngularReadyEvent;
}

// Re-export commonly used types from dockview-core
export { GridviewApi, GridviewOptions } from 'dockview';
