import { IDisposable } from 'splitview/dist/esm';
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
        options: PaneviewComponentOptions
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
