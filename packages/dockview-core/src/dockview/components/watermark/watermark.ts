import {
    IWatermarkRenderer,
    WatermarkRendererInitParameters,
} from '../../types';
import { addDisposableListener } from '../../../events';
import { toggleClass } from '../../../dom';
import { CompositeDisposable } from '../../../lifecycle';
import { DockviewGroupPanel } from '../../dockviewGroupPanel';
import { PanelUpdateEvent } from '../../../panel/types';
import { createCloseButton } from '../../../svg';
import { DockviewApi } from '../../../api/component.api';

export class Watermark
    extends CompositeDisposable
    implements IWatermarkRenderer
{
    private _element: HTMLElement;
    private _group: DockviewGroupPanel | undefined;
    private _api: DockviewApi | undefined;

    get element(): HTMLElement {
        return this._element;
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

        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'actions-container';

        const closeAnchor = document.createElement('div');
        closeAnchor.className = 'close-action';
        closeAnchor.appendChild(createCloseButton());

        actionsContainer.appendChild(closeAnchor);

        title.appendChild(emptySpace);
        title.appendChild(actionsContainer);

        this.addDisposables(
            addDisposableListener(closeAnchor, 'click', (ev) => {
                ev.preventDefault();
                if (this._group) {
                    this._api?.removeGroup(this._group);
                }
            })
        );
    }

    update(_event: PanelUpdateEvent): void {
        // noop
    }

    focus(): void {
        // noop
    }

    layout(_width: number, _height: number): void {
        // noop
    }

    init(_params: WatermarkRendererInitParameters): void {
        this._api = _params.containerApi;
        this.render();
    }

    updateParentGroup(group: DockviewGroupPanel, _visible: boolean): void {
        this._group = group;
        this.render();
    }

    dispose(): void {
        super.dispose();
    }

    private render(): void {
        const isOneGroup = !!(this._api && this._api.size <= 1);
        toggleClass(this.element, 'has-actions', isOneGroup);
    }
}
