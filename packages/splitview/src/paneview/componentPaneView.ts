import { Emitter, Event } from '../events';
import { CompositeDisposable, IDisposable } from '../lifecycle';
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
    title: string;
}

export interface IComponentPaneView extends IDisposable {
    readonly minimumSize: number;
    readonly maximumSize: number;
    addFromComponent(options: AddPaneviewCompponentOptions): IDisposable;
    layout(width: number, height: number): void;
    onDidLayoutChange: Event<void>;
    toJSON(): object;
    fromJSON(data: any): void;
    resizeToFit(): void;
}

export class ComponentPaneView
    extends CompositeDisposable
    implements IComponentPaneView {
    private paneview: PaneView;

    private readonly _onDidLayoutChange = new Emitter<void>();
    readonly onDidLayoutChange: Event<void> = this._onDidLayoutChange.event;

    get minimumSize() {
        return this.paneview.minimumSize;
    }

    get maximumSize() {
        return this.paneview.maximumSize;
    }

    constructor(
        private element: HTMLElement,
        private readonly options: PaneviewComponentOptions
    ) {
        super();

        this.paneview = new PaneView(this.element, {
            // only allow paneview in the vertical orientation for now
            orientation: Orientation.VERTICAL,
        });

        this.addDisposables(
            this.paneview.onDidChange(() => {
                this._onDidLayoutChange.fire(undefined);
            }),
            this.paneview
        );
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
            title: options.title,
        });

        return {
            dispose: () => {
                //
            },
        };
    }

    layout(width: number, height: number): void {
        const [size, orthogonalSize] =
            this.paneview.orientation === Orientation.HORIZONTAL
                ? [width, height]
                : [height, width];
        this.paneview.layout(size, orthogonalSize);
    }

    /**
     * Resize the layout to fit the parent container
     */
    resizeToFit(): void {
        const {
            width,
            height,
        } = this.element.parentElement.getBoundingClientRect();
        this.layout(width, height);
    }

    toJSON(): object {
        // TODO paneview#toJSON
        return {};
    }

    fromJSON(data: any): void {
        // TODO paneview#fromJSON
    }
}
