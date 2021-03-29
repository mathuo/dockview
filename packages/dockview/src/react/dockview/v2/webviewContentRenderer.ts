import {
    GroupPanelPartInitParameters,
    IContentRenderer,
} from '../../../groupview/types';
import { GroupviewPanel } from '../../../groupview/groupviewPanel';
import { HostedContainer } from '../../../hostedContainer';
import { PanelUpdateEvent } from '../../../panel/types';

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

    focus() {
        // noop
    }

    public init(parameters: GroupPanelPartInitParameters): void {
        this.parameters = parameters;
    }

    public toJSON() {
        return {};
    }

    public update(params: PanelUpdateEvent) {
        if (this.parameters) {
            this.parameters.params = params.params;
        }
    }

    public updateParentGroup(
        group: GroupviewPanel,
        isPanelVisible: boolean
    ): void {
        //
    }

    public layout(width: number, height: number): void {
        this._hostedContainer.layout(this._element);
    }

    public dispose() {
        //
    }
}
