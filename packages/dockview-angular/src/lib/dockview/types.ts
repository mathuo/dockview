import { Type } from '@angular/core';
import {
    DockviewOptions,
    DockviewApi,
    DockviewReadyEvent,
    DockviewDidDropEvent,
    DockviewWillDropEvent,
    IDockviewPanelProps,
    IDockviewPanelHeaderProps,
    IWatermarkPanelProps,
    IDockviewHeaderActionsProps
} from 'dockview-core';

export interface IDockviewAngularPanelProps extends IDockviewPanelProps {
    // Angular-specific panel properties can be added here
}

export interface IDockviewAngularPanelHeaderProps extends IDockviewPanelHeaderProps {
    // Angular-specific header properties can be added here
}

export interface IDockviewAngularWatermarkProps extends IWatermarkPanelProps {
    // Angular-specific watermark properties can be added here
}

export interface IDockviewAngularHeaderActionsProps extends IDockviewHeaderActionsProps {
    // Angular-specific header actions properties can be added here
}

export interface DockviewAngularOptions extends DockviewOptions {
    components: Record<string, Type<any>>;
    tabComponents?: Record<string, Type<any>>;
    watermarkComponent?: Type<any>;
    defaultTabComponent?: Type<any>;
    leftHeaderActionsComponent?: Type<any>;
    rightHeaderActionsComponent?: Type<any>;
    prefixHeaderActionsComponent?: Type<any>;
}

// Alias for backward compatibility
export interface DockviewAngularComponentOptions extends DockviewAngularOptions {}

export interface DockviewAngularEvents {
    ready: DockviewReadyEvent;
    didDrop: DockviewDidDropEvent;
    willDrop: DockviewWillDropEvent;
}

// Re-export commonly used types from dockview-core
export {
    DockviewApi,
    DockviewReadyEvent,
    DockviewDidDropEvent,
    DockviewWillDropEvent,
    DockviewOptions
} from 'dockview-core';