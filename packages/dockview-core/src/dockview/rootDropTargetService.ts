import { IDisposable } from '../lifecycle';
import {
    DroptargetOverlayModel,
    DropTargetTargetModel,
    IDropTarget,
    Position,
} from '../dnd/droptarget';
import { html5Backend, pointerBackend } from '../dnd/backend';
import { getPanelData } from '../dnd/dataTransfer';
import { DockviewComponentOptions } from './options';
import { defineModule } from './modules';

const DEFAULT_ROOT_OVERLAY_MODEL: DroptargetOverlayModel = {
    activationSize: { type: 'pixels', value: 10 },
    size: { type: 'pixels', value: 20 },
};

export interface IRootDropTargetHost {
    readonly id: string;
    readonly element: HTMLElement;
    readonly options: DockviewComponentOptions;
    isGridEmpty(): boolean;
    rootDropTargetOverrideTarget(): DropTargetTargetModel | undefined;
    /**
     * Build, fire, and return the verdict for an unhandled-drag-over event.
     * Implemented on the component side so the service stays free of
     * circular imports with the event class declared in dockviewComponent.
     */
    dispatchUnhandledDragOver(
        nativeEvent: DragEvent | PointerEvent,
        position: Position
    ): boolean;
}

export interface IRootDropTargetService extends IDisposable {
    readonly html5Target: IDropTarget;
    readonly pointerTarget: IDropTarget;
    /** Apply changed options (dndEdges, rootOverlayModel). */
    setOptions(options: Partial<DockviewComponentOptions>): void;
}

export class RootDropTargetService implements IRootDropTargetService {
    readonly html5Target: IDropTarget;
    readonly pointerTarget: IDropTarget;

    constructor(host: IRootDropTargetHost) {
        const canDisplayOverlay = (
            event: DragEvent | PointerEvent,
            position: Position
        ): boolean => {
            const data = getPanelData();

            if (data) {
                if (data.viewId !== host.id) {
                    return false;
                }
                if (position === 'center') {
                    // center drop target only allowed if no panels in primary
                    // grid; floating panels are allowed
                    return host.isGridEmpty();
                }
                return true;
            }

            if (position === 'center' && !host.isGridEmpty()) {
                // for external events only show the four-corner drag overlays,
                // disable center so external drag events can fall through to
                // the group and panel drop target handlers
                return false;
            }

            return host.dispatchUnhandledDragOver(event, position);
        };

        const overlayModel =
            host.options.rootOverlayModel ?? DEFAULT_ROOT_OVERLAY_MODEL;

        this.html5Target = html5Backend.createDropTarget(host.element, {
            className: 'dv-drop-target-edge',
            canDisplayOverlay,
            acceptedTargetZones: ['top', 'bottom', 'left', 'right', 'center'],
            overlayModel,
            getOverrideTarget: () => host.rootDropTargetOverrideTarget(),
        });

        this.pointerTarget = pointerBackend.createDropTarget(host.element, {
            className: 'dv-drop-target-edge',
            canDisplayOverlay,
            acceptedTargetZones: ['top', 'bottom', 'left', 'right', 'center'],
            overlayModel,
            getOverrideTarget: () => host.rootDropTargetOverrideTarget(),
        });
    }

    setOptions(options: Partial<DockviewComponentOptions>): void {
        if ('dndEdges' in options) {
            const disabled =
                typeof options.dndEdges === 'boolean' &&
                options.dndEdges === false;
            this.html5Target.disabled = disabled;
            this.pointerTarget.disabled = disabled;

            if (
                typeof options.dndEdges === 'object' &&
                options.dndEdges !== null
            ) {
                this.html5Target.setOverlayModel(options.dndEdges);
                this.pointerTarget.setOverlayModel(options.dndEdges);
            } else {
                this.html5Target.setOverlayModel(DEFAULT_ROOT_OVERLAY_MODEL);
                this.pointerTarget.setOverlayModel(DEFAULT_ROOT_OVERLAY_MODEL);
            }
        }

        if ('rootOverlayModel' in options) {
            this.setOptions({ dndEdges: options.dndEdges });
        }
    }

    dispose(): void {
        this.html5Target.dispose();
        this.pointerTarget.dispose();
    }
}

export const RootDropTargetModule = defineModule<
    'rootDropTargetService',
    IRootDropTargetHost
>({
    name: 'RootDropTarget',
    serviceKey: 'rootDropTargetService',
    create: (host) => new RootDropTargetService(host),
});
