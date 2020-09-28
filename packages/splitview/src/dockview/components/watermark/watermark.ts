import { PanelContentPart } from '../../../groupview/panel/parts';
import { IGroupAccessor } from '../../componentDockview';
import { IGroupview } from '../../../groupview/groupview';
import { ActionContainer } from '../../../groupview/actions/actionsContainer';
import { addDisposableListener } from '../../../events';
import { toggleClass } from '../../../dom';
import { CompositeDisposable } from '../../../lifecycle';

export class Watermark extends CompositeDisposable implements PanelContentPart {
    private _element: HTMLElement;
    private accessor: IGroupAccessor;

    get id() {
        return 'watermark';
    }

    constructor() {
        super();
        this._element = document.createElement('div');
        this._element.className = 'watermark';

        const title = document.createElement('div');
        title.className = 'watermark-title';

        const emptySpace = document.createElement('span');
        emptySpace.style.flexGrow = '1';

        const content = document.createElement('div');
        content.className = 'watermark-content';

        this._element.appendChild(title);
        this._element.appendChild(content);

        const actions = new ActionContainer();
        title.appendChild(emptySpace);
        title.appendChild(actions.element);

        const closeAnchor = document.createElement('a');
        closeAnchor.className = 'close-action';

        actions.add(closeAnchor);

        addDisposableListener(closeAnchor, 'click', (ev) => {
            ev.preventDefault();
            // this.accessor.removeGroup(this._group);
        });
    }

    layout(width: number, height: number) {
        // noop
    }

    public init(params) {
        this.accessor = params.accessor;

        this.addDisposables(
            this.accessor.onDidLayoutChange((event) => {
                this.render();
            })
        );

        this.render();
    }

    public setVisible(visible: boolean, isGroupVisible: boolean): void {
        this.render();
    }

    get element() {
        return this._element;
    }

    private render() {
        const isOneGroup = this.accessor.size <= 1;
        toggleClass(this.element, 'has-actions', isOneGroup);
    }

    public dispose() {
        super.dispose();
    }
}
