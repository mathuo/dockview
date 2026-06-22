import { CompositeDisposable } from '../../../lifecycle';
import { ITabRenderer, GroupPanelPartInitParameters } from '../../types';
import { addDisposableListener } from '../../../events';
import { createCloseButton } from '../../../svg';

export class DefaultTab extends CompositeDisposable implements ITabRenderer {
    private readonly _element: HTMLElement;
    private readonly _content: HTMLElement;
    private readonly action: HTMLElement;
    private _title: string | undefined;

    get element(): HTMLElement {
        return this._element;
    }

    constructor() {
        super();

        this._element = document.createElement('div');
        this._element.className = 'dv-default-tab';

        this._content = document.createElement('div');
        this._content.className = 'dv-default-tab-content';

        this.action = document.createElement('div');
        this.action.className = 'dv-default-tab-action';
        // Expose the close affordance to assistive technology: a named button
        // role so screen readers announce it, with the decorative glyph hidden.
        // Keyboard users close the focused tab via the tab strip's Delete
        // binding; this element is operated by pointer / AT.
        this.action.setAttribute('role', 'button');
        this.action.setAttribute('aria-label', 'Close');
        const closeIcon = createCloseButton();
        closeIcon.setAttribute('aria-hidden', 'true');
        this.action.appendChild(closeIcon);

        this._element.appendChild(this._content);
        this._element.appendChild(this.action);

        this.render();
    }

    init(params: GroupPanelPartInitParameters): void {
        this._title = params.title;

        this.addDisposables(
            params.api.onDidTitleChange((event) => {
                this._title = event.title;
                this.render();
            }),
            addDisposableListener(this.action, 'pointerdown', (ev) => {
                ev.preventDefault();
            }),
            addDisposableListener(this.action, 'click', (ev) => {
                if (ev.defaultPrevented) {
                    return;
                }

                ev.preventDefault();
                params.api.close();
            })
        );

        this.render();
    }

    private render(): void {
        if (this._content.textContent !== this._title) {
            this._content.textContent = this._title ?? '';
        }
        // Qualify the close button with the panel title when available so the
        // announced name disambiguates it from sibling tabs' close buttons.
        this.action.setAttribute(
            'aria-label',
            this._title ? `Close ${this._title}` : 'Close'
        );
    }
}
