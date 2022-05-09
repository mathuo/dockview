import { CompositeDisposable } from '../../../lifecycle';
import {
    ITabRenderer,
    GroupPanelPartInitParameters,
} from '../../../groupview/types';
import { addDisposableListener } from '../../../events';
import { PanelUpdateEvent } from '../../../panel/types';
import { GroupPanel } from '../../../groupview/groupviewPanel';

export class DefaultTab extends CompositeDisposable implements ITabRenderer {
    private _element: HTMLElement;

    private _isPanelVisible = false;
    private _isGroupActive = false;
    private _content: HTMLElement;
    private _actionContainer: HTMLElement;
    private _list: HTMLElement;
    private action: HTMLElement;
    //
    private params: GroupPanelPartInitParameters = {} as any;

    get element() {
        return this._element;
    }

    get id() {
        return '__DEFAULT_TAB__';
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
        this.action = document.createElement('a');
        this.action.className = 'tab-action';
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

    public update(event: PanelUpdateEvent) {
        this.params = { ...this.params, ...event.params };
        this.render();
    }

    public toJSON() {
        return { id: this.id };
    }

    focus() {
        //noop
    }

    public init(params: GroupPanelPartInitParameters) {
        this.params = params;
        this._content.textContent = params.title;

        if (!this.params.suppressClosable) {
            addDisposableListener(this.action, 'click', (ev) => {
                ev.preventDefault(); //
                this.params.api.close();
            });
        } else {
            this.action.classList.add('disable-close');
        }
    }

    public updateParentGroup(group: GroupPanel, isPanelVisible: boolean) {
        const changed =
            this._isPanelVisible !== isPanelVisible ||
            this._isGroupActive !== group.isActive;

        this._isPanelVisible = isPanelVisible;
        this._isGroupActive = group.isActive;

        if (changed) {
            this.render();
        }
    }

    public layout(_width: number, _height: number) {
        // noop
    }

    private render() {
        this._content.textContent = this.params.title;
    }
}
