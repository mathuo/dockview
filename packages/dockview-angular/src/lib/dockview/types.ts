import { TemplateRef, Type } from '@angular/core';
import {
    DockviewOptions,
    DockviewReadyEvent,
    DockviewDidDropEvent,
    DockviewWillDropEvent,
    IDockviewPanelProps,
    IDockviewPanelHeaderProps,
    IWatermarkPanelProps,
    IDockviewHeaderActionsProps,
} from 'dockview';

export interface IDockviewAngularPanelProps extends IDockviewPanelProps {
    // Angular-specific panel properties can be added here
}

export interface IDockviewAngularPanelHeaderProps
    extends IDockviewPanelHeaderProps {
    // Angular-specific header properties can be added here
}

export interface IDockviewAngularWatermarkProps extends IWatermarkPanelProps {
    // Angular-specific watermark properties can be added here
}

export interface IDockviewAngularHeaderActionsProps
    extends IDockviewHeaderActionsProps {
    // Angular-specific header actions properties can be added here
}

export interface DockviewAngularOptions extends DockviewOptions {
    components: Record<string, Type<any> | TemplateRef<any>>;
    tabComponents?: Record<string, Type<any> | TemplateRef<any>>;
    watermarkComponent?: Type<any> | TemplateRef<any>;
    defaultTabComponent?: Type<any> | TemplateRef<any>;
    leftHeaderActionsComponent?: Type<any> | TemplateRef<any>;
    rightHeaderActionsComponent?: Type<any> | TemplateRef<any>;
    prefixHeaderActionsComponent?: Type<any> | TemplateRef<any>;
}

export interface DockviewAngularEvents {
    ready: DockviewReadyEvent;
    didDrop: DockviewDidDropEvent;
    willDrop: DockviewWillDropEvent;
}

// Re-export commonly used types from dockview
export {
    DockviewApi,
    DockviewReadyEvent,
    DockviewDidDropEvent,
    DockviewWillDropEvent,
    DockviewOptions,
} from 'dockview';
