import { IDisposable } from '../lifecycle';
import { PaneReact } from '../react/paneview/view';
import { createComponent } from '../splitview/core/options';
import { Orientation } from '../splitview/core/splitview';
import { PaneviewComponentOptions } from './options';
import { PaneView } from './paneview';

export interface AddPaneviewCompponentOptions {
    id: string;
    component: string;
    tabComponentName: string;
    params: {
        [key: string]: any;
    };
    minimumBodySize?: number;
    maximumBodySize?: number;
    isExpanded?: boolean;
}

export interface IComponentPaneView extends IDisposable {
    readonly minimumSize: number;
    readonly maximumSize: number;
    layout(size: number, orthogonalSize: number): void;
    addFromComponent(options: AddPaneviewCompponentOptions): IDisposable;
    resizeToFit(): void;
}

export class ComponentPaneView implements IComponentPaneView {
    private paneview: PaneView;

    constructor(
        private element: HTMLElement,
        private readonly options: PaneviewComponentOptions
    ) {
        this.paneview = new PaneView(this.element, {
            // only allow paneview in the vertical orientation for now
            orientation: Orientation.VERTICAL,
        });
    }

    get minimumSize() {
        return this.paneview.minimumSize;
    }

    get maximumSize() {
        return this.paneview.maximumSize;
    }

    addFromComponent(options: AddPaneviewCompponentOptions): IDisposable {
        const view = createComponent(
            options.id,
            options.component,
            this.options.components,
            this.options.frameworkComponents,
            this.options.frameworkWrapper.createComponent
        );

        this.paneview.addPane(view);
        view.init({
            params: options.params,
            minimumBodySize: options.minimumBodySize,
            maximumBodySize: options.maximumBodySize,
            isExpanded: options.isExpanded,
        });

        return {
            dispose: () => {
                //
            },
        };
    }

    public layout(width: number, height: number): void {
        const [size, orthogonalSize] =
            this.paneview.orientation === Orientation.HORIZONTAL
                ? [width, height]
                : [height, width];
        this.paneview.layout(size, orthogonalSize);
    }

    /**
     * Resize the layout to fit the parent container
     */
    public resizeToFit(): void {
        const {
            width,
            height,
        } = this.element.parentElement.getBoundingClientRect();
        this.layout(width, height);
    }

    public dispose() {
        this.paneview.dispose();
    }
}
