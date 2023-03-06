import { GroupPanelPartInitParameters, IWatermarkRenderer } from '../../types';
import { ActionContainer } from '../../../actionbar/actionsContainer';
import { addDisposableListener } from '../../../events';
import { toggleClass } from '../../../dom';
import { CompositeDisposable } from '../../../lifecycle';
import { DockviewGroupPanel } from '../../dockviewGroupPanel';
import { PanelUpdateEvent } from '../../../panel/types';
import { createCloseButton } from '../../../svg';

export class Watermark
    extends CompositeDisposable
    implements IWatermarkRenderer
{
    private _element: HTMLElement;
    private group: DockviewGroupPanel | undefined;
    private params: GroupPanelPartInitParameters | undefined;

    get element() {
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

        const actions = new ActionContainer();
        title.appendChild(emptySpace);
        title.appendChild(actions.element);

        const closeAnchor = document.createElement('div');
        closeAnchor.className = 'close-action';
        closeAnchor.appendChild(createCloseButton());

        actions.add(closeAnchor);

        this.addDisposables(
            addDisposableListener(closeAnchor, 'click', (ev) => {
                ev.preventDefault();
                if (this.group) {
                    this.params?.containerApi.removeGroup(this.group);
                }
            })
        );
    }

    update(_event: PanelUpdateEvent) {
        // noop
    }

    focus() {
        // noop
    }

    layout(_width: number, _height: number) {
        // noop
    }

    init(params: GroupPanelPartInitParameters) {
        this.params = params;

        this.addDisposables(
            this.params.containerApi.onDidLayoutChange(() => {
                this.render();
            })
        );

        this.render();
    }

    updateParentGroup(group: DockviewGroupPanel, _visible: boolean): void {
        this.group = group;
        this.render();
    }

    dispose() {
        super.dispose();
    }

    private render() {
        const isOneGroup = !!(
            this.params && this.params.containerApi.size <= 1
        );
        toggleClass(this.element, 'has-actions', isOneGroup);
    }
}
