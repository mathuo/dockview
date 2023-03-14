import {
    GroupPanelPartInitParameters,
    IContentRenderer,
    DockviewGroupPanel,
    HostedContainer,
    PanelUpdateEvent,
} from 'dockview-core';

export class WebviewContentRenderer implements IContentRenderer {
    private _hostedContainer: HostedContainer;
    private _element: HTMLElement;
    private parameters: GroupPanelPartInitParameters | undefined;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(public readonly id: string) {
        this._hostedContainer = new HostedContainer({ id });

        this._element = document.createElement('div');
        this._element.style.height = '100%';
        this._element.style.width = '100%';
    }

    focus(): void {
        // noop
    }

    public init(parameters: GroupPanelPartInitParameters): void {
        this.parameters = parameters;
    }

    public update(params: PanelUpdateEvent): void {
        if (this.parameters) {
            this.parameters.params = params.params;
        }
    }

    public layout(_width: number, _height: number): void {
        this._hostedContainer.layout(this._element);
    }

    public dispose(): void {
        //
    }
}
