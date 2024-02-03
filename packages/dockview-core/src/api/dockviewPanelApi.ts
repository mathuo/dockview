import { Emitter, Event } from '../events';
import { GridviewPanelApiImpl, GridviewPanelApi } from './gridviewPanelApi';
import { DockviewGroupPanel } from '../dockview/dockviewGroupPanel';
import { CompositeDisposable, MutableDisposable } from '../lifecycle';
import { DockviewPanel } from '../dockview/dockviewPanel';
import { DockviewComponent } from '../dockview/dockviewComponent';
import { Position } from '../dnd/droptarget';
import { DockviewPanelRenderer } from '../overlayRenderContainer';
import { DockviewGroupPanelFloatingChangeEvent } from './dockviewGroupPanelApi';
import { DockviewGroupLocation } from '../dockview/dockviewGroupPanelModel';

export interface TitleEvent {
    readonly title: string;
}

export interface RendererChangedEvent {
    renderer: DockviewPanelRenderer;
}

export interface DockviewPanelApi
    extends Omit<
        GridviewPanelApi,
        // omit properties that do not make sense here
        'setVisible' | 'onDidConstraintsChange' | 'setConstraints'
    > {
    readonly group: DockviewGroupPanel;
    readonly isGroupActive: boolean;
    readonly renderer: DockviewPanelRenderer;
    readonly title: string | undefined;
    readonly onDidActiveGroupChange: Event<void>;
    readonly onDidGroupChange: Event<void>;
    readonly onDidRendererChange: Event<RendererChangedEvent>;
    readonly location: DockviewGroupLocation;
    readonly onDidLocationChange: Event<DockviewGroupPanelFloatingChangeEvent>;
    close(): void;
    setTitle(title: string): void;
    setRenderer(renderer: DockviewPanelRenderer): void;
    moveTo(options: {
        group: DockviewGroupPanel;
        position?: Position;
        index?: number;
    }): void;
    maximize(): void;
    isMaximized(): boolean;
    exitMaximized(): void;
    /**
     * If you require the Window object
     */
    getWindow(): Window;
}

export class DockviewPanelApiImpl
    extends GridviewPanelApiImpl
    implements DockviewPanelApi
{
    private _group: DockviewGroupPanel;

    readonly _onDidTitleChange = new Emitter<TitleEvent>();
    readonly onDidTitleChange = this._onDidTitleChange.event;

    private readonly _onDidActiveGroupChange = new Emitter<void>();
    readonly onDidActiveGroupChange = this._onDidActiveGroupChange.event;

    private readonly _onDidGroupChange = new Emitter<void>();
    readonly onDidGroupChange = this._onDidGroupChange.event;

    readonly _onDidRendererChange = new Emitter<RendererChangedEvent>();
    readonly onDidRendererChange = this._onDidRendererChange.event;

    private readonly _onDidLocationChange =
        new Emitter<DockviewGroupPanelFloatingChangeEvent>();
    readonly onDidLocationChange: Event<DockviewGroupPanelFloatingChangeEvent> =
        this._onDidLocationChange.event;

    private readonly groupEventsDisposable = new MutableDisposable();

    get location(): DockviewGroupLocation {
        return this.group.api.location;
    }

    get title(): string | undefined {
        return this.panel.title;
    }

    get isGroupActive(): boolean {
        return this.group.isActive;
    }

    get renderer(): DockviewPanelRenderer {
        return this.panel.renderer;
    }

    set group(value: DockviewGroupPanel) {
        const isOldGroupActive = this.isGroupActive;

        this._group = value;

        this._onDidGroupChange.fire();

        if (this._group) {
            this.groupEventsDisposable.value = new CompositeDisposable(
                this.group.api.onDidLocationChange((event) => {
                    this._onDidLocationChange.fire(event);
                }),
                this.group.api.onDidActiveChange(() => {
                    this._onDidActiveGroupChange.fire();
                })
            );

            if (this.isGroupActive !== isOldGroupActive) {
                this._onDidActiveGroupChange.fire();
            }

            this._onDidLocationChange.fire({
                location: this.group.api.location,
            });
        }
    }

    get group(): DockviewGroupPanel {
        return this._group;
    }

    constructor(
        private panel: DockviewPanel,
        group: DockviewGroupPanel,
        private readonly accessor: DockviewComponent
    ) {
        super(panel.id);

        this.initialize(panel);

        this._group = group;



        this.addDisposables(
            this.groupEventsDisposable,
            this._onDidRendererChange,
            this._onDidTitleChange,
            this._onDidGroupChange,
            this._onDidActiveGroupChange,
            this._onDidLocationChange
        );
    }

    getWindow(): Window {
        return this.group.api.getWindow();
    }

    moveTo(options: {
        group: DockviewGroupPanel;
        position?: Position;
        index?: number;
    }): void {
        this.accessor.moveGroupOrPanel(
            options.group,
            this._group.id,
            this.panel.id,
            options.position ?? 'center',
            options.index
        );
    }

    setTitle(title: string): void {
        this.panel.setTitle(title);
    }

    setRenderer(renderer: DockviewPanelRenderer): void {
        this.panel.setRenderer(renderer);
    }

    close(): void {
        this.group.model.closePanel(this.panel);
    }

    maximize(): void {
        this.group.api.maximize();
    }

    isMaximized(): boolean {
        return this.group.api.isMaximized();
    }

    exitMaximized(): void {
        this.group.api.exitMaximized();
    }
}
