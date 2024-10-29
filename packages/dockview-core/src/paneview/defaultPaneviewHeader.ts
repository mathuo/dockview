import { addDisposableListener } from '../events';
import { PaneviewPanelApiImpl } from '../api/paneviewPanelApi';
import { CompositeDisposable, MutableDisposable } from '../lifecycle';
import { PanelUpdateEvent } from '../panel/types';
import { IPaneHeaderPart, PanePanelInitParameter } from './paneviewPanel';
import { toggleClass } from '../dom';
import { createChevronRightButton, createExpandMoreButton } from '../svg';

export class DefaultHeader
    extends CompositeDisposable
    implements IPaneHeaderPart
{
    private readonly _expandedIcon = createExpandMoreButton();
    private readonly _collapsedIcon = createChevronRightButton();
    private readonly disposable = new MutableDisposable();
    private readonly _element: HTMLElement;
    private readonly _content: HTMLElement;
    private readonly _expander: HTMLElement;
    private readonly apiRef: { api: PaneviewPanelApiImpl | null } = {
        api: null,
    };

    get element(): HTMLElement {
        return this._element;
    }

    constructor() {
        super();

        this._element = document.createElement('div');
        this.element.className = 'dv-default-header';

        this._content = document.createElement('span');
        this._expander = document.createElement('div');
        this._expander.className = 'dv-pane-header-icon';

        this.element.appendChild(this._expander);
        this.element.appendChild(this._content);

        this.addDisposables(
            addDisposableListener(this._element, 'click', () => {
                this.apiRef.api?.setExpanded(!this.apiRef.api.isExpanded);
            })
        );
    }

    init(params: PanePanelInitParameter & { api: PaneviewPanelApiImpl }): void {
        this.apiRef.api = params.api;

        this._content.textContent = params.title;

        this.updateIcon();

        this.disposable.value = params.api.onDidExpansionChange(() => {
            this.updateIcon();
        });
    }

    private updateIcon(): void {
        const isExpanded = !!this.apiRef.api?.isExpanded;
        toggleClass(this._expander, 'collapsed', !isExpanded);

        if (isExpanded) {
            if (this._expander.contains(this._collapsedIcon)) {
                this._collapsedIcon.remove();
            }
            if (!this._expander.contains(this._expandedIcon)) {
                this._expander.appendChild(this._expandedIcon);
            }
        } else {
            if (this._expander.contains(this._expandedIcon)) {
                this._expandedIcon.remove();
            }
            if (!this._expander.contains(this._collapsedIcon)) {
                this._expander.appendChild(this._collapsedIcon);
            }
        }
    }

    update(_params: PanelUpdateEvent): void {
        //
    }

    dispose(): void {
        this.disposable.dispose();
        super.dispose();
    }
}
