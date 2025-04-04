import { CompositeDisposable } from '../../../lifecycle';
import { ITabRenderer, GroupPanelPartInitParameters } from '../../types';
import { addDisposableListener } from '../../../events';
import { createCloseButton } from '../../../svg';

export class DefaultTab extends CompositeDisposable implements ITabRenderer {
    private readonly _element: HTMLElement;
    private readonly _content: HTMLElement;
    private readonly action: HTMLButtonElement;
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

        this.action = document.createElement('button');
        this.action.type = 'button';
        this.action.className = 'dv-default-tab-action';
        // originally hide this, so only when it is focused is it read out.
        // so the SR when focused on the tab, doesn't read "<Tab Content> Close Button"
        this.action.ariaHidden = 'true';

        this.action.appendChild(createCloseButton());

        this._element.appendChild(this._content);
        this._element.appendChild(this.action);

        this.addDisposables(
            addDisposableListener(this.action, 'focus', (event) => {
                this.action.ariaHidden = 'false';
            }),
            addDisposableListener(this.action, 'blur', (event) => {
                this.action.ariaHidden = 'true';
            })
        );

        this.render();
    }

    init(params: GroupPanelPartInitParameters): void {
        this._title = params.title;
        this.action.ariaLabel = `Close "${this._title}" tab`;
        
        this.addDisposables(
            params.api.onDidTitleChange((event) => {
                this._title = event.title;
                this.action.ariaLabel = `Close "${event.title}" tab`;
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
            }),
            addDisposableListener(this.action, 'keydown', (ev) => {
                if (ev.defaultPrevented) {
                    return;
                }

                switch (ev.key) {
                    case 'Enter':
                    case 'Space':
                        params.api.close();
                        break;
                }
            })
        );

        this.render();
    }

    private render(): void {
        if (this._content.textContent !== this._title) {
            this._content.textContent = this._title ?? '';
        }
    }
}
