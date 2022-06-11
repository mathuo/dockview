import { DefaultTab } from './components/tab/defaultTab';
import {
    GroupPanelPartInitParameters,
    IContentRenderer,
    ITabRenderer,
} from '../groupview/types';
import { GroupPanel } from '../groupview/groupviewPanel';
import { IDisposable } from '../lifecycle';
import { GroupPanelUpdateEvent } from '../groupview/groupPanel';

export interface IGroupPanelView extends IDisposable {
    readonly content: IContentRenderer;
    readonly tab?: ITabRenderer;
    update(event: GroupPanelUpdateEvent): void;
    layout(width: number, height: number): void;
    init(params: GroupPanelPartInitParameters): void;
    updateParentGroup(group: GroupPanel, isPanelVisible: boolean): void;
    toJSON(): {};
}

export class DefaultGroupPanelView implements IGroupPanelView {
    private readonly _content: IContentRenderer;
    private readonly _tab: ITabRenderer;

    get content(): IContentRenderer {
        return this._content;
    }

    get tab(): ITabRenderer {
        return this._tab;
    }

    constructor(renderers: { content: IContentRenderer; tab?: ITabRenderer }) {
        this._content = renderers.content;
        this._tab = renderers.tab ?? new DefaultTab();
    }

    init(params: GroupPanelPartInitParameters): void {
        this.content.init({ ...params, tab: this.tab });
        this.tab.init(params);
    }

    updateParentGroup(group: GroupPanel, isPanelVisible: boolean): void {
        this._content.updateParentGroup(group, isPanelVisible);
        this._tab?.updateParentGroup(group, isPanelVisible);
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
            tab: this.tab instanceof DefaultTab ? undefined : this.tab.toJSON(),
        };
    }

    dispose(): void {
        this.content.dispose();
        this.tab.dispose();
    }
}
