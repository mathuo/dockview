import { CompositeDisposable, MutableDisposable } from '../../../lifecycle';
import {
    ITabRenderer,
    GroupPanelPartInitParameters,
} from '../../../groupview/types';
import { addDisposableListener } from '../../../events';
import { toggleClass } from '../../../dom';
import { PanelUpdateEvent } from '../../../panel/types';
import { GroupviewPanel } from '../../../groupview/v2/groupviewPanel';

export class WrappedTab implements ITabRenderer {
    private readonly _element: HTMLElement;

    constructor(private readonly renderer: ITabRenderer) {
        this._element = document.createElement('element');
        this.show();
    }

    get innerRenderer() {
        return this.renderer;
    }

    get element() {
        return this._element;
    }

    get id() {
        return this.renderer.id;
    }

    show() {
        if (!this.renderer.element.parentElement) {
            this._element.appendChild(this.renderer.element);
        }
    }

    hide() {
        if (this.renderer.element.parentElement) {
            this.renderer.element.remove();
        }
    }

    layout(width: number, height: number): void {
        this.renderer.layout(width, height);
    }

    update(event: PanelUpdateEvent): void {
        this.renderer.update(event);
    }

    toJSON(): object {
        return this.renderer.toJSON();
    }

    focus(): void {
        this.renderer.focus();
    }

    init(parameters: GroupPanelPartInitParameters): void {
        this.renderer.init(parameters);
    }

    updateParentGroup(group: GroupviewPanel, isPanelVisible: boolean): void {
        this.renderer.updateParentGroup(group, isPanelVisible);
    }

    dispose() {
        this.renderer.dispose();
    }
}

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
    //
    private isDirtyDisposable = new MutableDisposable();

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

        this.isDirtyDisposable.value = this.params.api.onDidDirtyChange(
            (event) => {
                const isDirty = event;
                toggleClass(this.action, 'dirty', isDirty);
            }
        );

        if (!this.params.suppressClosable) {
            addDisposableListener(this.action, 'click', (ev) => {
                ev.preventDefault(); //
                this.params.api.close();
            });
        } else {
            this.action.classList.add('disable-close');
        }
    }

    public updateParentGroup(group: GroupviewPanel, isPanelVisible: boolean) {
        this._isPanelVisible = isPanelVisible;
        this._isGroupActive = group.isActive;

        this.render();
    }

    public layout(width: number, height: number) {
        // noop
    }

    private render() {
        this._content.textContent = this.params.title;
    }
}
