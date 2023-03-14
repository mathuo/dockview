import {
    GroupPanelPartInitParameters,
    IContentRenderer,
    DockviewGroupPanel,
    HostedContainer,
    PanelUpdateEvent,
    DockviewEvent,
} from 'dockview-core';
import { ReactPart, ReactPortalStore } from '../../react';
import { IDockviewPanelProps } from '../dockview';

export class ReactContentRenderer implements IContentRenderer {
    private _hostedContainer: HostedContainer;
    private _element: HTMLElement;
    private part?: ReactPart<IDockviewPanelProps>;
    private parameters: GroupPanelPartInitParameters | undefined;

    get element(): HTMLElement {
        return this._element;
    }

    get onDidBlur(): DockviewEvent<void> {
        return this._hostedContainer.onDidBlur;
    }

    get onDidFocus(): DockviewEvent<void> {
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

    focus(): void {
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
                params: parameters.params,
                api: parameters.api,
                containerApi: parameters.containerApi,
            }
        );
    }

    public update(params: PanelUpdateEvent): void {
        if (this.parameters) {
            this.parameters.params = params.params;
        }

        this.part?.update(params.params);
    }

    public layout(_width: number, _height: number): void {
        this._hostedContainer.layout(this.element);
    }

    public dispose(): void {
        this.part?.dispose();
    }
}
