import {
    GroupPanelPartInitParameters,
    IContentRenderer,
} from '../../../groupview/types';
import { GroupviewPanel } from '../../../groupview/v2/groupviewPanel';
import { HostedContainer } from '../../../hostedContainer';
import { PanelUpdateEvent } from '../../../panel/types';
import { ReactPart, ReactPortalStore } from '../../react';
import { IDockviewPanelProps } from '../dockview';

export class ReactContentRenderer implements IContentRenderer {
    private _hostedContainer: HostedContainer;

    private _element: HTMLElement;
    private part?: ReactPart<IDockviewPanelProps>;
    private _group: GroupviewPanel | undefined;

    private parameters: GroupPanelPartInitParameters | undefined;

    get element(): HTMLElement {
        return this._element;
    }

    get onDidBlur() {
        return this._hostedContainer.onDidBlur;
    }

    get onDidFocus() {
        return this._hostedContainer.onDidFocus;
    }

    constructor(
        public readonly id: string,
        private readonly component: React.FunctionComponent<IDockviewPanelProps>,
        private readonly reactPortalStore: ReactPortalStore
    ) {
        this._hostedContainer = new HostedContainer({
            id,
            parent: document
                .getElementsByClassName('dockview')
                .item(0) as HTMLElement,
        });

        this._element = document.createElement('div');
        this._element.style.height = '100%';
        this._element.style.width = '100%';
    }

    focus() {
        // noop
    }

    public init(parameters: GroupPanelPartInitParameters): void {
        this.parameters = parameters;

        parameters.api.onDidVisibilityChange((event) => {
            if (event.isVisible) {
                this._hostedContainer.show();
                this._hostedContainer.layout(this.element);
            } else {
                this._hostedContainer.hide();
            }
        });

        this.part = new ReactPart(
            this._hostedContainer.element,
            this.reactPortalStore,
            this.component,
            {
                ...parameters.params,
                api: parameters.api,
                containerApi: parameters.containerApi,
                setActionsbar: () => null as any,
            }
        );
    }

    public toJSON() {
        return {
            id: this.id,
        };
    }

    public update(params: PanelUpdateEvent) {
        if (this.parameters) {
            this.parameters.params = params.params;
        }

        this.part?.update(params.params);
    }

    public updateParentGroup(
        group: GroupviewPanel,
        isPanelVisible: boolean
    ): void {
        this._group = group;
    }

    public layout(width: number, height: number): void {
        this._hostedContainer.layout(this.element);
    }

    public close(): Promise<boolean> {
        return Promise.resolve(true);
    }

    public dispose() {
        this.part?.dispose();
    }
}
