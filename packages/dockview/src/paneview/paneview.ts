import {
    Splitview,
    Orientation,
    ISplitViewDescriptor,
    Sizing,
} from '../splitview/core/splitview';
import { CompositeDisposable, IDisposable } from '../lifecycle';
import { Emitter, Event } from '../events';
import { addClasses, removeClasses } from '../dom';
import { PaneviewPanel } from './paneviewPanel';

interface PaneItem {
    pane: PaneviewPanel;
    disposable: IDisposable;
}

export class Paneview extends CompositeDisposable implements IDisposable {
    private element: HTMLElement;
    private splitview: Splitview;
    private paneItems: PaneItem[] = [];
    private _orientation: Orientation;
    private animationTimer: any | undefined;
    private skipAnimation = false;

    private readonly _onDidChange = new Emitter<void>();
    readonly onDidChange: Event<void> = this._onDidChange.event;

    get onDidAddView() {
        return <Event<PaneviewPanel>>this.splitview.onDidAddView;
    }
    get onDidRemoveView() {
        return <Event<PaneviewPanel>>this.splitview.onDidRemoveView;
    }

    get minimumSize() {
        return this.splitview.minimumSize;
    }

    get maximumSize() {
        return this.splitview.maximumSize;
    }

    get orientation() {
        return this.splitview.orientation;
    }

    get size() {
        return this.splitview.size;
    }

    get orthogonalSize() {
        return this.splitview.orthogonalSize;
    }

    constructor(
        container: HTMLElement,
        options: { orientation: Orientation; descriptor?: ISplitViewDescriptor }
    ) {
        super();

        this._orientation = options.orientation ?? Orientation.VERTICAL;

        this.element = document.createElement('div');
        this.element.className = 'dockview-pane-container';

        container.appendChild(this.element);

        this.splitview = new Splitview(this.element, {
            orientation: this._orientation,
            proportionalLayout: false,
            descriptor: options.descriptor,
        });

        // if we've added views from the descriptor we need to
        // add the panes to our Pane array and setup animation
        this.getPanes().forEach((pane) => {
            const disposable = new CompositeDisposable(
                pane.onDidChangeExpansionState(() => {
                    this.setupAnimation();
                    this._onDidChange.fire(undefined);
                })
            );

            const paneItem: PaneItem = {
                pane,
                disposable: {
                    dispose: () => {
                        disposable.dispose();
                    },
                },
            };

            this.paneItems.push(paneItem);
            pane.orthogonalSize = this.splitview.orthogonalSize;
        });

        this.addDisposables(
            this._onDidChange,
            this.splitview.onDidSashEnd(() => {
                this._onDidChange.fire(undefined);
            }),
            this.splitview.onDidAddView(() => {
                this._onDidChange.fire();
            }),
            this.splitview.onDidRemoveView(() => {
                this._onDidChange.fire();
            })
        );
    }

    public addPane(
        pane: PaneviewPanel,
        size?: number | Sizing,
        index = this.splitview.length,
        skipLayout = false
    ) {
        const disposable = pane.onDidChangeExpansionState(() => {
            this.setupAnimation();
            this._onDidChange.fire(undefined);
        });

        const paneItem: PaneItem = {
            pane,
            disposable: {
                dispose: () => {
                    disposable.dispose();
                },
            },
        };

        this.paneItems.splice(index, 0, paneItem);

        pane.orthogonalSize = this.splitview.orthogonalSize;
        this.splitview.addView(pane, size, index, skipLayout);
    }

    getViewSize(index: number) {
        return this.splitview.getViewSize(index);
    }

    public getPanes(): PaneviewPanel[] {
        return this.splitview.getViews();
    }

    public removePane(
        index: number,
        options: { skipDispose: boolean } = { skipDispose: false }
    ) {
        const paneItem = this.paneItems.splice(index, 1)[0];
        this.splitview.removeView(index);

        if (!options.skipDispose) {
            paneItem.disposable.dispose();
            paneItem.pane.dispose();
        }

        return paneItem;
    }

    public moveView(from: number, to: number) {
        if (from === to) {
            return;
        }

        const view = this.removePane(from, { skipDispose: true });

        this.skipAnimation = true;
        try {
            this.addPane(view.pane, view.pane.size, to, false);
        } finally {
            this.skipAnimation = false;
        }
    }

    public layout(size: number, orthogonalSize: number): void {
        this.splitview.layout(size, orthogonalSize);
    }

    private setupAnimation() {
        if (this.skipAnimation) {
            return;
        }

        if (this.animationTimer) {
            clearTimeout(this.animationTimer);
            this.animationTimer = undefined;
        }

        addClasses(this.element, 'dockview-animated');

        this.animationTimer = setTimeout(() => {
            this.animationTimer = undefined;
            removeClasses(this.element, 'dockview-animated');
        }, 200);
    }

    public dispose() {
        super.dispose();

        if (this.animationTimer) {
            clearTimeout(this.animationTimer);
            this.animationTimer = undefined;
        }

        this.paneItems.forEach((paneItem) => {
            paneItem.disposable.dispose();
            paneItem.pane.dispose();
        });
        this.paneItems = [];

        this.splitview.dispose();
        this.element.remove();
    }
}
