import { DefaultTab } from './components/tab/defaultTab';
import {
    GroupPanelPartInitParameters,
    IContentRenderer,
    ITabRenderer,
} from './types';
import { DockviewGroupPanel } from './dockviewGroupPanel';
import { IDisposable } from '../lifecycle';
import { IDockviewComponent } from './dockviewComponent';
import { PanelUpdateEvent } from '../panel/types';

export interface IDockviewPanelModel extends IDisposable {
    readonly contentComponent: string;
    readonly tabComponent?: string;
    readonly content: IContentRenderer;
    readonly tab: ITabRenderer;
    update(event: PanelUpdateEvent): void;
    layout(width: number, height: number): void;
    init(params: GroupPanelPartInitParameters): void;
    updateParentGroup(group: DockviewGroupPanel, isPanelVisible: boolean): void;
}

export class DockviewPanelModel implements IDockviewPanelModel {
    private readonly _content: IContentRenderer;
    private readonly _tab: ITabRenderer;

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
        this._tab = this.createTabComponent(this.id, tabComponent);
    }

    init(params: GroupPanelPartInitParameters): void {
        this.content.init(params);
        this.tab.init(params);
    }

    updateParentGroup(
        _group: DockviewGroupPanel,
        _isPanelVisible: boolean
    ): void {
        // noop
    }

    layout(width: number, height: number): void {
        this.content.layout?.(width, height);
    }

    update(event: PanelUpdateEvent): void {
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
        return this.accessor.options.createComponent({
            id,
            name: componentName,
        });
    }

    private createTabComponent(
        id: string,
        componentName?: string
    ): ITabRenderer {
        const name = componentName ?? this.accessor.options.defaultTabComponent;

        if (name) {
            if (this.accessor.options.createTabComponent) {
                const component = this.accessor.options.createTabComponent({
                    id,
                    name,
                });

                if (component) {
                    return component;
                } else {
                    return new DefaultTab();
                }
            }

            console.warn(
                `dockview: tabComponent '${componentName}' was not found. falling back to the default tab.`
            );
        }

        return new DefaultTab();
    }
}
