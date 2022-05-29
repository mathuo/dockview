import { addDisposableListener } from '../events';
import { PaneviewPanelApiImpl } from '../api/paneviewPanelApi';
import { CompositeDisposable, MutableDisposable } from '../lifecycle';
import { PanelUpdateEvent } from '../panel/types';
import { IPaneHeaderPart, PanePanelInitParameter } from './paneviewPanel';
import { toggleClass } from '../dom';

export class DefaultHeader
    extends CompositeDisposable
    implements IPaneHeaderPart
{
    private readonly disposable = new MutableDisposable();
    private readonly _element: HTMLElement;
    private readonly _content: HTMLElement;
    private readonly _expander: HTMLElement;
    private apiRef: { api: PaneviewPanelApiImpl | null } = { api: null };

    get element() {
        return this._element;
    }

    constructor() {
        super();
        this._element = document.createElement('div');
        this.element.className = 'dockview-default-header';

        this._content = document.createElement('span');
        this._expander = document.createElement('a');

        this.element.appendChild(this._expander);
        this.element.appendChild(this._content);

        this.addDisposables(
            addDisposableListener(this._element, 'click', () => {
                this.apiRef.api?.setExpanded(!this.apiRef.api.isExpanded);
            })
        );
    }

    init(params: PanePanelInitParameter & { api: PaneviewPanelApiImpl }) {
        this.apiRef.api = params.api;

        this._content.textContent = params.title;
        this._expander.textContent = '▼';

        toggleClass(this._expander, 'collapsed', !params.api.isExpanded);

        this.disposable.value = params.api.onDidExpansionChange((e) => {
            toggleClass(this._expander, 'collapsed', !e.isExpanded);
        });
    }

    update(_params: PanelUpdateEvent) {
        //
    }

    dispose() {
        this.disposable.dispose();
        super.dispose();
    }
}
