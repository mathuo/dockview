import { CompositeDisposable } from '../../../lifecycle';
import { ITabRenderer, GroupPanelPartInitParameters } from '../../types';
import { addDisposableListener } from '../../../events';
import { PanelUpdateEvent } from '../../../panel/types';
import { DockviewGroupPanel } from '../../dockviewGroupPanel';
import { createCloseButton } from '../../../svg';

export class DefaultTab extends CompositeDisposable implements ITabRenderer {
    private _element: HTMLElement;
    private _content: HTMLElement;
    private _actionContainer: HTMLElement;
    private _list: HTMLElement;
    private action: HTMLElement;
    //
    private params: GroupPanelPartInitParameters = {} as any;

    get element(): HTMLElement {
        return this._element;
    }

    constructor() {
        super();

        this._element = document.createElement('div');
        this._element.className = 'default-tab';
        //
        this._content = document.createElement('div');
        this._content.className = 'tab-content';
        //
        this._actionContainer = document.createElement('div');
        this._actionContainer.className = 'action-container';
        //
        this._list = document.createElement('ul');
        this._list.className = 'tab-list';
        //
        this.action = document.createElement('div');
        this.action.className = 'tab-action';
        this.action.appendChild(createCloseButton());

        //
        this._element.appendChild(this._content);
        this._element.appendChild(this._actionContainer);
        this._actionContainer.appendChild(this._list);
        this._list.appendChild(this.action);
        //
        this.addDisposables(
            addDisposableListener(this._actionContainer, 'mousedown', (ev) => {
                ev.preventDefault();
            })
        );

        this.render();
    }

    public update(event: PanelUpdateEvent): void {
        this.params = { ...this.params, ...event.params };
        this.render();
    }

    focus(): void {
        //noop
    }

    public init(params: GroupPanelPartInitParameters): void {
        this.params = params;
        this._content.textContent = params.title;

        addDisposableListener(this.action, 'click', (ev) => {
            ev.preventDefault(); //
            this.params.api.close();
        });
    }

    onGroupChange(_group: DockviewGroupPanel): void {
        this.render();
    }

    onPanelVisibleChange(_isPanelVisible: boolean): void {
        this.render();
    }

    public layout(_width: number, _height: number): void {
        // noop
    }

    private render(): void {
        if (this._content.textContent !== this.params.title) {
            this._content.textContent = this.params.title;
        }
    }
}
