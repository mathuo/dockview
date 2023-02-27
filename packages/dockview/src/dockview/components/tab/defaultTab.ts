import { CompositeDisposable } from '../../../lifecycle';
import {
    ITabRenderer,
    GroupPanelPartInitParameters,
} from '../../../groupview/types';
import { addDisposableListener } from '../../../events';
import { PanelUpdateEvent } from '../../../panel/types';
import { GroupPanel } from '../../../groupview/groupviewPanel';
import { createCloseButton } from '../../../svg';

export const DEFAULT_TAB_IDENTIFIER = '__default__tab__';

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
        return DEFAULT_TAB_IDENTIFIER;
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
        this._content.textContent =
            typeof params.title === 'string' ? params.title : this.id;

        addDisposableListener(this.action, 'click', (ev) => {
            ev.preventDefault(); //
            this.params.api.close();
        });
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
        if (this._content.textContent !== this.params.title) {
            this._content.textContent =
                typeof this.params.title === 'string'
                    ? this.params.title
                    : this.id;
        }
    }
}
