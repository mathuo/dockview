import { Emitter, Event } from '../events';
import { GridviewPanelApiImpl, GridviewPanelApi } from './gridviewPanelApi';
import { GroupPanel } from '../groupview/groupviewPanel';
import { MutableDisposable } from '../lifecycle';
import { IDockviewPanel } from '../dockview/dockviewPanel';

export interface TitleEvent {
    readonly title: string;
}

/*
 * omit visibility modifiers since the visibility of a single group doesn't make sense
 * because it belongs to a groupview
 */
export interface DockviewPanelApi extends Omit<GridviewPanelApi, 'setVisible'> {
    readonly group: GroupPanel;
    readonly isGroupActive: boolean;
    readonly title: string;
    readonly onDidActiveGroupChange: Event<void>;
    readonly onDidGroupChange: Event<void>;
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

    private readonly _onDidActiveGroupChange = new Emitter<void>();
    readonly onDidActiveGroupChange = this._onDidActiveGroupChange.event;

    private readonly _onDidGroupChange = new Emitter<void>();
    readonly onDidGroupChange = this._onDidGroupChange.event;

    private readonly disposable = new MutableDisposable();

    get title(): string {
        return this.panel.title;
    }

    get isGroupActive(): boolean {
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

        this.initialize(panel);

        this._group = group;

        this.addDisposables(
            this.disposable,
            this._onDidTitleChange,
            this._onDidGroupChange,
            this._onDidActiveGroupChange
        );
    }

    public setTitle(title: string): void {
        this.panel.update({ params: { title } });
    }

    public close(): void {
        this.group.model.closePanel(this.panel);
    }
}
