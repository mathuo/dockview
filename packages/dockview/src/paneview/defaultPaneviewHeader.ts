import { addDisposableListener } from '../events';
import { PaneviewPanelApiImpl } from '../api/paneviewPanelApi';
import { CompositeDisposable, MutableDisposable } from '../lifecycle';
import { PanelUpdateEvent } from '../panel/types';
import { IPaneHeaderPart, PanePanelInitParameter } from './paneviewPanel';

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
        this.element.className = 'default-header';

        this._content = document.createElement('span');
        this._expander = document.createElement('a');

        this.element.appendChild(this._content);
        this.element.appendChild(this._expander);

        this.addDisposables(
            addDisposableListener(this._expander, 'click', () => {
                this.apiRef.api?.setExpanded(!this.apiRef.api.isExpanded);
            })
        );
    }

    init(params: PanePanelInitParameter & { api: PaneviewPanelApiImpl }) {
        this.apiRef.api = params.api;

        this._content.textContent = params.title;
        this._expander.textContent = params.api.isExpanded ? '<' : '>';

        this.disposable.value = params.api.onDidExpansionChange((e) => {
            this._expander.textContent = e.isExpanded ? '<' : '>';
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
