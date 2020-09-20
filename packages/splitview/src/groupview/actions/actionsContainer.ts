export class ActionContainer {
    private _element: HTMLElement;
    private _list: HTMLElement;

    get element() {
        return this._element;
    }

    constructor() {
        this._element = document.createElement('div');
        this._element.className = 'actions-bar';

        this._list = document.createElement('ul');
        this._list.className = 'actions-container';

        this._element.appendChild(this._list);
    }

    public add(element: HTMLElement) {
        this._list.appendChild(element);
    }
}
