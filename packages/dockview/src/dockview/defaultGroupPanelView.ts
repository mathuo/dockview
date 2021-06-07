import { DefaultTab, WrappedTab } from './components/tab/defaultTab';
import {
    GroupPanelPartInitParameters,
    IActionsRenderer,
    IContentRenderer,
    ITabRenderer,
} from '../groupview/types';
import { GroupviewPanel } from '../groupview/groupviewPanel';
import { IDisposable } from '../lifecycle';
import { GroupPanelUpdateEvent } from '../groupview/groupPanel';

export interface IGroupPanelView extends IDisposable {
    readonly content: IContentRenderer;
    readonly tab?: ITabRenderer;
    readonly actions?: IActionsRenderer;
    update(event: GroupPanelUpdateEvent): void;
    layout(width: number, height: number): void;
    init(params: GroupPanelPartInitParameters): void;
    updateParentGroup(group: GroupviewPanel, isPanelVisible: boolean): void;
    toJSON(): {};
}

export class DefaultGroupPanelView implements IGroupPanelView {
    private readonly _content: IContentRenderer;
    private readonly _tab: WrappedTab;
    private readonly _actions: IActionsRenderer | undefined;

    get content() {
        return this._content;
    }

    get tab() {
        return this._tab;
    }

    get actions() {
        return this._actions;
    }

    constructor(renderers: {
        content: IContentRenderer;
        tab?: ITabRenderer;
        actions?: IActionsRenderer;
    }) {
        this._content = renderers.content;
        this._tab = new WrappedTab(renderers.tab ?? new DefaultTab());
        this._actions =
            renderers.actions ||
            (this.content.actions
                ? {
                      element: this.content.actions,
                      dispose: () => {
                          //
                      },
                  }
                : undefined);
    }

    init(params: GroupPanelPartInitParameters): void {
        this.content.init({ ...params, tab: this.tab });
        this.tab.init(params);
    }

    updateParentGroup(group: GroupviewPanel, isPanelVisible: boolean): void {
        // TODO
    }

    layout(width: number, height: number): void {
        this.content.layout(width, height);
    }

    update(event: GroupPanelUpdateEvent): void {
        this.content.update(event);
        this.tab.update(event);
    }

    toJSON(): {} {
        return {
            content: this.content.toJSON(),
            tab:
                this.tab.innerRenderer instanceof DefaultTab
                    ? undefined
                    : this.tab.toJSON(),
        };
    }

    dispose(): void {
        this.content.dispose();
        this.tab.dispose();
        this.actions?.dispose();
    }
}
