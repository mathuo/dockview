import { IDisposable } from 'splitview/dist/esm';
import { createContentComponent } from '../layout/componentFactory';
import { Orientation } from '../splitview/splitview';
import { PaneviewComponentOptions } from './options';
import { PaneView } from './paneview';

export interface IComponentPaneView extends IDisposable {
    layout(size: number, orthogonalSize: number): void;
}

export class ComponentPaneView implements IComponentPaneView {
    private paneview: PaneView;

    constructor(
        private element: HTMLElement,
        private readonly options: PaneviewComponentOptions
    ) {
        this.paneview = new PaneView(this.element, {
            orientation: Orientation.VERTICAL,
        });
    }

    get minimumSize() {
        return this.paneview.minimumSize;
    }

    get maximumSize() {
        return this.paneview.maximumSize;
    }

    addFromComponent(options: {
        id: string;
        component: string;
        params?: {
            [index: string]: any;
        };
    }): IDisposable {
        const view = createContentComponent(
            options.id,
            options.component,
            this.options.components,
            this.options.frameworkComponents,
            this.options.frameworkWrapper.createComponent
        );

        this.registerView(view);

        this.paneview.addPane(view, { type: 'distribute' });
        view.init({ params: options.params });

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

    public dispose() {
        this.paneview.dispose();
    }
}
