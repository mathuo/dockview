import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { IView, Emitter } from 'dockview';
import { IViewRootRef, ViewComponent, ViewRoot } from '../bridge/view';

import { IViewWithReactComponent } from '../splitview';

export class ReactRenderView implements IView {
    private ref: IViewRootRef;
    private disposable: { dispose: () => void };

    public readonly id: string;
    private readonly component: ViewComponent;
    public readonly props: {};

    public element: HTMLElement;
    public minimumSize: number;
    public maximumSize: number;
    public snapSize: number;
    public size: number;

    private readonly _onDidChange = new Emitter<number | undefined>();
    public readonly onDidChange = this._onDidChange.event;

    private _rendered = false;
    private _size: number;
    private _orthogonalSize: number;

    constructor(
        view: IViewWithReactComponent,
        private readonly addPortal: (
            portal: React.ReactPortal
        ) => { dispose: () => void }
    ) {
        this.layout = this.layout.bind(this);
        this.onDidChange = this.onDidChange.bind(this);
        this.setRef = this.setRef.bind(this);

        this.id = view.id;
        this.component = view.component;
        this.props = view.props;

        this.minimumSize = view.minimumSize;
        this.maximumSize = view.maximumSize;
        this.snapSize = view.snapSize;

        this.element = document.createElement('div');
        this.element.id = 'react-attachable-view';
    }

    public update(view: IView) {
        this.minimumSize = view.minimumSize;
        this.maximumSize = view.maximumSize;
        this.snapSize = view.snapSize;

        this.ref?.updateProps({
            minimumSize: this.minimumSize,
            maximumSize: this.maximumSize,
            snapSize: this.snapSize,
        });
    }

    public layout(size: number, orthogonalSize: number) {
        if (!this._rendered) {
            this.attachReactComponent();
            this._rendered = true;
        }

        this._size = size;
        this._orthogonalSize = orthogonalSize;
        this.ref?.layout(size, orthogonalSize);
    }

    private attachReactComponent() {
        const portal = this.createReactElement();
        if (this.disposable) {
            this.disposable.dispose();
            this.disposable = undefined;
        }
        this.disposable = this.addPortal(portal);
    }

    private createReactElement() {
        return ReactDOM.createPortal(
            <ViewRoot
                ref={this.setRef}
                component={this.component}
                props={{
                    minimumSize: this.minimumSize,
                    maximumSize: this.maximumSize,
                    snapSize: this.snapSize,
                    userprops: this.props,
                    id: this.id,
                }}
            />,
            this.element
        );
    }

    private setRef(ref: IViewRootRef) {
        this.ref = ref;
        this.ref?.layout(this._size, this._orthogonalSize);
    }

    public dispose() {
        this.disposable?.dispose();
    }
}
