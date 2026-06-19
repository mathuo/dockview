import { TemplateRef, Type } from '@angular/core';
import { SplitviewOptions, SplitviewApi } from 'dockview';

export interface SplitviewAngularReadyEvent {
    api: SplitviewApi;
}

export interface SplitviewAngularOptions extends SplitviewOptions {
    components: Record<string, Type<any> | TemplateRef<any>>;
}

export interface SplitviewAngularEvents {
    ready: SplitviewAngularReadyEvent;
}

// Re-export commonly used types from dockview
export { SplitviewApi, SplitviewOptions } from 'dockview';
