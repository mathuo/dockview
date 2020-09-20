import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Pane, IDisposable } from 'splitview';

import {
    PaneComponent,
    PaneRoot as PaneBodyRoot,
    IPaneRootRef,
    PaneHeaderComponent,
    PaneHeaderRoot,
    IPaneHeaderRootRef,
} from '../bridge/pane';
import { IViewWithReactComponent } from '../splitview';
import { IPaneWithReactComponent } from '../paneview';

export class PaneReact extends Pane {
    public readonly id: string;

    private bodyDisposable: IDisposable;
    private headerDisposable: IDisposable;
    private bodyRef: IPaneRootRef;
    private headerRef: IPaneHeaderRootRef;
    private disposable: IDisposable;

    constructor(
        private readonly view: IPaneWithReactComponent,
        private readonly bodyComponent: PaneComponent,
        private readonly options: {
            headerName: string;
            addPortal: (portal: React.ReactPortal) => IDisposable;
            headerComponent?: PaneHeaderComponent;
        }
    ) {
        super({ isExpanded: view.isExpanded });
        this.layout = this.layout.bind(this);
        this.onDidChange = this.onDidChange.bind(this);
        this.setRef = this.setRef.bind(this);
        this.setHeaderRef = this.setHeaderRef.bind(this);
        this.setExpanded = this.setExpanded.bind(this);

        this.id = view.id;

        this.minimumSize = view.minimumSize;
        this.maximumSize = view.maximumSize;

        this.render();
    }

    public renderBody(element: HTMLElement) {
        if (this.bodyDisposable) {
            this.bodyDisposable.dispose();
            this.bodyDisposable = undefined;
        }

        const bodyPortal = ReactDOM.createPortal(
            <PaneBodyRoot
                ref={this.setRef}
                component={this.bodyComponent}
                props={{
                    minimumSize: this.minimumSize,
                    maximumSize: this.maximumSize,
                    snapSize: this.view.snapSize,
                    userprops: this.view.componentProps,
                    id: this.id,
                }}
            />,
            element
        );
        this.bodyDisposable = this.options.addPortal(bodyPortal);
    }

    public renderHeader(element: HTMLElement) {
        if (this.headerDisposable) {
            this.headerDisposable.dispose();
            this.disposable?.dispose();
            this.headerDisposable = undefined;
        }

        if (this.options.headerComponent) {
            this.disposable = this.onDidChangeExpansionState((isExpanded) => {
                this.headerRef?.updateProps({ isExpanded });
            });

            const headerPortal = ReactDOM.createPortal(
                <PaneHeaderRoot
                    ref={this.setHeaderRef}
                    component={this.options.headerComponent}
                    props={{
                        minimumSize: this.minimumSize,
                        maximumSize: this.maximumSize,
                        snapSize: this.view.snapSize,
                        userprops: this.view.headerProps,
                        id: this.id,
                    }}
                />,
                element
            );
            this.headerDisposable = this.options.addPortal(headerPortal);
        } else {
            element.textContent = this.options.headerName;
            element.onclick = () => {
                this.setExpanded(!this.isExpanded());
            };
        }
    }

    public update(view: IViewWithReactComponent) {
        this.minimumSize = view.minimumSize;
        this.maximumSize = view.maximumSize;

        this.render();

        this.bodyRef?.updateProps({
            minimumSize: this.minimumSize,
            maximumSize: this.maximumSize,
        });
    }

    public layout(size: number, orthogonalSize: number) {
        super.layout(size, orthogonalSize);
        this.orthogonalSize = orthogonalSize;
        this.bodyRef?.layout(size, orthogonalSize);
        this.bodyRef?.updateProps({ size, orthogonalSize });
    }

    private setRef(ref: IPaneRootRef) {
        this.bodyRef = ref;
    }

    private setHeaderRef(ref: IPaneRootRef) {
        this.headerRef = ref;
        this.headerRef?.updateProps({
            isExpanded: this.isExpanded(),
            setExpanded: this.setExpanded,
        });
    }

    public dispose() {
        this.bodyDisposable?.dispose();
        this.headerDisposable?.dispose();
        this.disposable?.dispose();
    }
}
