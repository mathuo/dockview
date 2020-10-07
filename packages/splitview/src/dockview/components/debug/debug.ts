import { CompositeDisposable } from '../../../lifecycle';
import { ComponentDockview } from '../../componentDockview';
import { GroupChangeKind } from '../../../groupview/groupview';

export class DebugWidget extends CompositeDisposable {
    private _element: HTMLElement;

    constructor(private layout: ComponentDockview) {
        super();

        let container = document.getElementById('layout-debug-container');

        if (!container) {
            container = document.createElement('div');
            container.id = 'layout-debug-container';
            container.className = 'layout-debug-container';
            document.body.appendChild(container);
        }

        this._element = document.createElement('div');
        this._element.innerHTML =
            `<div class='layout-debug-widget'>` +
            `<div class='layout-debug-widget-row'><span>Groups:</span><span id='group-count'>0</span></div>` +
            `<div class='layout-debug-widget-row'><span>Panels:</span><span id='panel-count'>0</span></div>` +
            `</div>`;

        container.appendChild(this._element);

        const gc = this._element.querySelector('#group-count');
        const pc = this._element.querySelector('#panel-count');

        const events = [
            GroupChangeKind.PANEL_CREATED,
            GroupChangeKind.PANEL_DESTROYED,
            GroupChangeKind.ADD_GROUP,
            GroupChangeKind.REMOVE_GROUP,
        ];

        this.addDisposables(
            this.layout.onDidLayoutChange((event) => {
                if (events.includes(event.kind)) {
                    if (gc) {
                        gc.textContent = this.layout.size.toString();
                    }
                    if (pc) {
                        pc.textContent = this.layout.totalPanels.toString();
                    }
                }
            })
        );
    }

    public dispose() {
        super.dispose();

        this._element.remove();

        const container = document.getElementById('layout-debug-container');
        if (container && container.children.length === 0) {
            container.remove();
        }
    }
}
