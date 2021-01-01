import { DefaultTab } from '../../../dockview/components/tab/defaultTab';
import {
    GroupPanelPartInitParameters,
    IActionsRenderer,
    IContentRenderer,
    ITabRenderer,
} from '../../../groupview/types';
import { GroupviewPanel } from '../../../groupview/v2/groupviewPanel';
import { CompositeDisposable, IDisposable } from '../../../lifecycle';
import { Event, Emitter } from '../../../events';
import { PanelUpdateEvent } from '../../../panel/types';

export interface IGroupPanelView extends IDisposable {
    readonly content: IContentRenderer;
    readonly tab?: ITabRenderer;
    readonly actions?: IActionsRenderer;
    update(event: PanelUpdateEvent): void;
    layout(width: number, height: number): void;
    init(params: GroupPanelPartInitParameters): void;
    updateParentGroup(group: GroupviewPanel, isPanelVisible: boolean): void;
    toJSON(): {};
}

class Context implements IDisposable {
    private emitters = new Map<string, Emitter<any>>();

    fire<T>(key: string, object: T) {
        if (!this.emitters.has(key)) {
            this.emitters.set(key, new Emitter<T>());
        }
        const emitter = this.emitters.get(key)! as Emitter<T>;
        emitter.fire(object);
    }

    toEvent<T>(key: string): Event<T> {
        const emitter = this.emitters.get(key) as Emitter<T>;
        return emitter.event;
    }

    dispose() {
        this.emitters.forEach((value, key) => {
            value.dispose();
        });
        this.emitters.clear();
    }
}

export class DefaultGroupPanelView implements IGroupPanelView {
    private readonly context = new Context();
    private readonly _content: IContentRenderer;
    private readonly _tab: ITabRenderer;
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
        this._tab = renderers.tab ?? new DefaultTab();
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
        this.content.init(params);
        this.tab.init(params);
    }

    updateParentGroup(group: GroupviewPanel, isPanelVisible: boolean): void {
        //
    }

    layout(width: number, height: number): void {
        this.content.layout(width, height);
    }

    update(event: PanelUpdateEvent): void {
        this.content.update(event);
        this.tab.update(event);
    }

    toJSON() {
        return {
            content: this.content.toJSON(),
            tab: this.tab instanceof DefaultTab ? undefined : this.tab.toJSON(),
        };
    }

    dispose(): void {
        this.content.dispose();
        this.tab.dispose();
        this.actions?.dispose();
    }
}
