import {
    GroupPanelPartInitParameters,
    IWatermarkRenderer,
} from '../../../groupview/types';
import { ActionContainer } from '../../../actionbar/actionsContainer';
import { addDisposableListener } from '../../../events';
import { toggleClass } from '../../../dom';
import { CompositeDisposable } from '../../../lifecycle';
import { GroupPanel } from '../../../groupview/groupviewPanel';
import { PanelUpdateEvent } from '../../../panel/types';

export class Watermark
    extends CompositeDisposable
    implements IWatermarkRenderer
{
    private _element: HTMLElement;
    private group: GroupPanel | undefined;
    private params: GroupPanelPartInitParameters | undefined;

    get id() {
        return 'watermark';
    }

    constructor() {
        super();
        this._element = document.createElement('div');
        this._element.className = 'dockview-watermark';

        const title = document.createElement('div');
        title.className = 'dockview-watermark-title';

        const emptySpace = document.createElement('span');
        emptySpace.style.flexGrow = '1';

        const content = document.createElement('div');
        content.className = 'dockview-watermark-content';

        this._element.appendChild(title);
        this._element.appendChild(content);

        const actions = new ActionContainer();
        title.appendChild(emptySpace);
        title.appendChild(actions.element);

        const closeAnchor = document.createElement('a');
        closeAnchor.className = 'close-action';

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

    toJSON() {
        return {};
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

    updateParentGroup(group: GroupPanel, _visible: boolean): void {
        this.group = group;
        this.render();
    }

    get element() {
        return this._element;
    }

    private render() {
        const isOneGroup = !!(
            this.params && this.params.containerApi.size <= 1
        );
        toggleClass(this.element, 'dockview-watermark-has-actions', isOneGroup);
    }

    dispose() {
        super.dispose();
    }
}
