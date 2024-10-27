import {
    IWatermarkRenderer,
    WatermarkRendererInitParameters,
} from '../../types';
import { addDisposableListener } from '../../../events';
import { toggleClass } from '../../../dom';
import { CompositeDisposable } from '../../../lifecycle';
import { IDockviewGroupPanel } from '../../dockviewGroupPanel';
import { createCloseButton } from '../../../svg';
import { DockviewApi } from '../../../api/component.api';

export class Watermark
    extends CompositeDisposable
    implements IWatermarkRenderer
{
    private readonly _element: HTMLElement;
    private _group: IDockviewGroupPanel | undefined;
    private _api: DockviewApi | undefined;

    get element(): HTMLElement {
        return this._element;
    }

    constructor() {
        super();
        this._element = document.createElement('div');
        this._element.className = 'dv-watermark';

        const title = document.createElement('div');
        title.className = 'dv-watermark-title';

        const emptySpace = document.createElement('span');
        emptySpace.style.flexGrow = '1';

        const content = document.createElement('div');
        content.className = 'dv-watermark-content';

        this._element.appendChild(title);
        this._element.appendChild(content);

        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'dv-actions-container';

        const closeAnchor = document.createElement('div');
        closeAnchor.className = 'dv-close-action';
        closeAnchor.appendChild(createCloseButton());

        actionsContainer.appendChild(closeAnchor);

        title.appendChild(emptySpace);
        title.appendChild(actionsContainer);

        this.addDisposables(
            addDisposableListener(closeAnchor, 'click', (event: MouseEvent) => {
                event.preventDefault();

                if (this._group) {
                    this._api?.removeGroup(this._group);
                }
            })
        );
    }

    init(_params: WatermarkRendererInitParameters): void {
        this._api = _params.containerApi;
        this._group = _params.group;
        this.render();
    }

    private render(): void {
        const isOneGroup = !!(this._api && this._api.size <= 1);
        toggleClass(this.element, 'dv-has-actions', isOneGroup);
    }
}
