import { DefaultTab } from './components/tab/defaultTab';
import {
    GroupPanelPartInitParameters,
    IContentRenderer,
    ITabRenderer,
    GroupPanelUpdateEvent,
} from '../groupview/types';
import { GroupPanel } from '../groupview/groupviewPanel';
import { IDisposable } from '../lifecycle';
import { createComponent } from '../panel/componentFactory';
import { IDockviewComponent } from './dockviewComponent';

export interface SerializedGroupPanelView {
    tab?: { id: string };
    content: { id: string };
}

export interface IGroupPanelView extends IDisposable {
    readonly contentComponent: string;
    readonly tabComponent?: string;
    readonly content: IContentRenderer;
    readonly tab?: ITabRenderer;
    update(event: GroupPanelUpdateEvent): void;
    layout(width: number, height: number): void;
    init(params: GroupPanelPartInitParameters): void;
    updateParentGroup(group: GroupPanel, isPanelVisible: boolean): void;
}

export class DefaultGroupPanelView implements IGroupPanelView {
    private readonly _content: IContentRenderer;
    private readonly _tab: ITabRenderer;

    private _group: GroupPanel | null = null;
    private _isPanelVisible: boolean | null = null;

    get content(): IContentRenderer {
        return this._content;
    }

    get tab(): ITabRenderer {
        return this._tab;
    }

    constructor(
        private readonly accessor: IDockviewComponent,
        private readonly id: string,
        readonly contentComponent: string,
        readonly tabComponent?: string
    ) {
        this._content = this.createContentComponent(this.id, contentComponent);
        this._tab =
            this.createTabComponent(this.id, tabComponent) ?? new DefaultTab();
    }

    init(params: GroupPanelPartInitParameters): void {
        this.content.init({ ...params, tab: this.tab });
        this.tab.init(params);
    }

    updateParentGroup(group: GroupPanel, isPanelVisible: boolean): void {
        if (group !== this._group) {
            this._group = group;
            if (this._content.onGroupChange) {
                this._content.onGroupChange(group);
            }
            if (this._tab.onGroupChange) {
                this._tab.onGroupChange(group);
            }
        }

        if (isPanelVisible !== this._isPanelVisible) {
            this._isPanelVisible = isPanelVisible;
            if (this._content.onPanelVisibleChange) {
                this._content.onPanelVisibleChange(isPanelVisible);
            }
            if (this._tab.onPanelVisibleChange) {
                this._tab.onPanelVisibleChange(isPanelVisible);
            }
        }
    }

    layout(width: number, height: number): void {
        this.content.layout?.(width, height);
    }

    update(event: GroupPanelUpdateEvent): void {
        this.content.update?.(event);
        this.tab.update?.(event);
    }

    dispose(): void {
        this.content.dispose?.();
        this.tab.dispose?.();
    }

    private createContentComponent(
        id: string,
        componentName: string
    ): IContentRenderer {
        return createComponent(
            id,
            componentName,
            this.accessor.options.components || {},
            this.accessor.options.frameworkComponents,
            this.accessor.options.frameworkComponentFactory?.content
        );
    }

    private createTabComponent(
        id: string,
        componentName?: string
    ): ITabRenderer {
        return createComponent(
            id,
            componentName,
            this.accessor.options.tabComponents || {},
            this.accessor.options.frameworkTabComponents,
            this.accessor.options.frameworkComponentFactory?.tab,
            () => new DefaultTab()
        );
    }
}
