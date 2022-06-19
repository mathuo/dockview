import { Emitter, Event } from '../events';
import { GridviewPanelApiImpl, GridviewPanelApi } from './gridviewPanelApi';
import { IDockviewPanel } from '../groupview/groupPanel';
import { GroupPanel } from '../groupview/groupviewPanel';
import { MutableDisposable } from '../lifecycle';

export interface TitleEvent {
    readonly title: string;
}

export interface SuppressClosableEvent {
    readonly suppressClosable: boolean;
}

/*
 * omit visibility modifiers since the visibility of a single group doesn't make sense
 * because it belongs to a groupview
 */
export interface DockviewPanelApi extends Omit<GridviewPanelApi, 'setVisible'> {
    readonly group: GroupPanel;
    readonly isGroupActive: boolean;
    readonly title: string;
    readonly suppressClosable: boolean;
    readonly onDidActiveGroupChange: Event<void>;
    readonly onDidGroupChange: Event<void>;
    readonly onDidSuppressClosableChange: Event<SuppressClosableEvent>;
    close(): void;
    setTitle(title: string): void;
}

export class DockviewPanelApiImpl
    extends GridviewPanelApiImpl
    implements DockviewPanelApi
{
    private _group: GroupPanel;

    readonly _onDidTitleChange = new Emitter<TitleEvent>();
    readonly onDidTitleChange = this._onDidTitleChange.event;

    readonly _onDidSuppressClosableChange =
        new Emitter<SuppressClosableEvent>();
    readonly onDidSuppressClosableChange =
        this._onDidSuppressClosableChange.event;

    private readonly _onDidActiveGroupChange = new Emitter<void>();
    readonly onDidActiveGroupChange = this._onDidActiveGroupChange.event;

    private readonly _onDidGroupChange = new Emitter<void>();
    readonly onDidGroupChange = this._onDidGroupChange.event;

    private disposable = new MutableDisposable();

    get title() {
        return this.panel.title;
    }

    get suppressClosable() {
        return !!this.panel.suppressClosable;
    }

    get isGroupActive() {
        return !!this.group?.isActive;
    }

    set group(value: GroupPanel) {
        const isOldGroupActive = this.isGroupActive;

        this._group = value;

        this._onDidGroupChange.fire();

        if (this._group) {
            this.disposable.value = this._group.api.onDidActiveChange(() => {
                this._onDidActiveGroupChange.fire();
            });

            if (this.isGroupActive !== isOldGroupActive) {
                this._onDidActiveGroupChange.fire();
            }
        }
    }

    get group(): GroupPanel {
        return this._group;
    }

    constructor(private panel: IDockviewPanel, group: GroupPanel) {
        super(panel.id);
        this._group = group;

        this.addDisposables(
            this.disposable,
            this._onDidTitleChange,
            this._onDidSuppressClosableChange,
            this._onDidGroupChange,
            this._onDidActiveGroupChange
        );
    }

    public setTitle(title: string) {
        this._onDidTitleChange.fire({ title });
    }

    public close(): void {
        if (!this.group) {
            throw new Error(`panel ${this.id} has no group`);
        }
        return this.group.model.closePanel(this.panel);
    }
}
