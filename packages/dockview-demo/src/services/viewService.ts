import {
    CompositeDisposable,
    Emitter,
    Event,
    IDisposable,
    IView,
} from 'dockview';
import { DefaultView, View } from './view';
import {
    PaneviewContainer,
    ViewContainer,
    SerializedViewContainer,
} from './viewContainer';
import { IViewRegistry } from './viewRegistry';

export interface SerializedViewService {
    containers: SerializedViewContainer[];
    activeContainer?: string;
}

export interface IViewService extends IDisposable {
    readonly containers: ViewContainer[];
    readonly onDidActiveContainerChange: Event<void>;
    readonly onDidRemoveContainer: Event<void>;
    readonly onDidAddContainer: Event<void>;
    readonly onDidContainersChange: Event<void>;
    readonly activeContainer: ViewContainer | undefined;
    addContainer(container: ViewContainer): void;
    setActiveViewContainer(id: string): void;
    getView(id: string): View | undefined;
    moveViewToLocation(
        view: View,
        targetViewContainer: ViewContainer,
        targetLocation: number
    ): void;
    insertContainerAfter(source: ViewContainer, target: ViewContainer): void;
    addViews(view: View, viewContainer: ViewContainer, location?: number): void;
    removeViews(removeViews: View[], viewContainer: ViewContainer): void;
    getViewContainer(id: string): ViewContainer | undefined;
    getViewContainer2(view: View): ViewContainer | undefined;
    toJSON(): SerializedViewService;
    load(layout: SerializedViewService): void;
}

export class ViewService implements IViewService {
    private _viewContainers: ViewContainer[] = [];
    private readonly _onDidActiveContainerChange = new Emitter<void>();
    readonly onDidActiveContainerChange = this._onDidActiveContainerChange
        .event;
    private readonly _onDidRemoveContainer = new Emitter<void>();
    readonly onDidRemoveContainer = this._onDidRemoveContainer.event;
    private readonly _onDidAddContainer = new Emitter<void>();
    readonly onDidAddContainer = this._onDidAddContainer.event;
    private readonly _onDidContainersChange = new Emitter<void>();
    readonly onDidContainersChange = this._onDidContainersChange.event;
    private _activeViewContainerId: string;

    get containers(): ViewContainer[] {
        return this._viewContainers;
    }

    get activeContainer(): ViewContainer | undefined {
        return this._viewContainers.find(
            (c) => c.id === this._activeViewContainerId
        );
    }

    constructor(private readonly viewRegistry: IViewRegistry) {
        //
    }

    load(layout: SerializedViewService): void {
        const { containers, activeContainer } = layout;

        for (const container of containers) {
            const { id, views } = container;
            const viewContainer = new PaneviewContainer(
                id,
                this.viewRegistry,
                views
            );

            this.addContainer(viewContainer);
        }

        this.setActiveViewContainer(activeContainer);
    }

    insertContainerAfter(source: ViewContainer, target: ViewContainer): void {
        const sourceIndex = this._viewContainers.findIndex(
            (c) => c.id === source.id
        );

        const view = this._viewContainers.splice(sourceIndex, 1)[0];

        const targetIndex = this._viewContainers.findIndex(
            (c) => c.id === target.id
        );

        this._viewContainers.splice(targetIndex + 1, 0, view);
        this._viewContainers = [...this._viewContainers];

        this._onDidContainersChange.fire();
    }

    addContainer(container: ViewContainer): void {
        this._viewContainers = [...this._viewContainers, container];
        this._activeViewContainerId = container.id;
        this._onDidAddContainer.fire();
    }

    removeContainer(container: ViewContainer): void {
        this._viewContainers = this._viewContainers.filter(
            (c) => c.id !== container.id
        );

        if (this._activeViewContainerId === container.id) {
            this._activeViewContainerId =
                this._viewContainers.length > 0
                    ? this._viewContainers[0].id
                    : undefined;
        }

        this._onDidRemoveContainer.fire();
    }

    setActiveViewContainer(id: string): void {
        if (!this._viewContainers.find((c) => c.id === id)) {
            throw new Error(`invalid container ${id}`);
        }
        this._activeViewContainerId = id;
        this._onDidActiveContainerChange.fire();
    }

    getView(id: string): View | undefined {
        for (const container of Array.from(this._viewContainers.values())) {
            const view = container.views.find((v) => v.id === id);
            if (view) {
                return view;
            }
        }
        return undefined;
    }

    moveViewToLocation(
        view: View,
        targetViewContainer: ViewContainer,
        targetLocation: number
    ): void {
        const sourceViewContainer = this.getViewContainer2(view);
        this.removeViews([view], sourceViewContainer);
        this.addViews(view, targetViewContainer, targetLocation);
    }

    addViews(
        view: View,
        viewContainer: ViewContainer,
        location?: number
    ): void {
        viewContainer.addView(view, location);
    }

    removeViews(removeViews: View[], viewContainer: ViewContainer): void {
        for (const view of removeViews) {
            viewContainer.removeView(view);

            if (viewContainer.views.length === 0) {
                viewContainer.clear();
                this.removeContainer(viewContainer);
            }
        }
    }

    getViewContainer(id: string): ViewContainer | undefined {
        return this._viewContainers.find((c) => c.id === id);
    }

    getViewContainer2(view: View): ViewContainer | undefined {
        for (const container of Array.from(this._viewContainers.values())) {
            const v = container.views.find((v) => v.id === view.id);
            if (v) {
                return container;
            }
        }
        return undefined;
    }

    toJSON(): SerializedViewService {
        return {
            containers: this.containers.map((c) => c.toJSON()),
            activeContainer: this.activeContainer.id,
        };
    }

    dispose(): void {
        this._onDidActiveContainerChange.dispose();
        this._onDidAddContainer.dispose();
        this._onDidRemoveContainer.dispose();
    }
}
