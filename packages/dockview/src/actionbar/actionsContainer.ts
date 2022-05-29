export class ActionContainer {
    private _element: HTMLElement;
    private _list: HTMLElement;

    get element() {
        return this._element;
    }

    constructor() {
        this._element = document.createElement('div');
        this._element.className = 'dockview-actions-bar';

        this._list = document.createElement('ul');
        this._list.className = 'dockview-actions-container';

        this._element.appendChild(this._list);
    }

    public add(element: HTMLElement) {
        const listItem = document.createElement('li');
        listItem.className = 'action-item';
        this._list.appendChild(element);
    }
}
