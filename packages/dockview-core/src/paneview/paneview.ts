import {
    Splitview,
    Orientation,
    ISplitViewDescriptor,
    Sizing,
} from '../splitview/splitview';
import { CompositeDisposable, IDisposable } from '../lifecycle';
import { Emitter, Event } from '../events';
import { addClasses, removeClasses, toggleClass } from '../dom';
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
    private animationTimer: any;
    private skipAnimation = false;

    private readonly _onDidChange = new Emitter<void>();
    readonly onDidChange: Event<void> = this._onDidChange.event;

    get onDidAddView(): Event<PaneviewPanel> {
        return <Event<PaneviewPanel>>this.splitview.onDidAddView;
    }
    get onDidRemoveView(): Event<PaneviewPanel> {
        return <Event<PaneviewPanel>>this.splitview.onDidRemoveView;
    }

    get minimumSize(): number {
        return this.splitview.minimumSize;
    }

    get maximumSize(): number {
        return this.splitview.maximumSize;
    }

    get orientation(): Orientation {
        return this.splitview.orientation;
    }

    get size(): number {
        return this.splitview.size;
    }

    get orthogonalSize(): number {
        return this.splitview.orthogonalSize;
    }

    constructor(
        container: HTMLElement,
        options: { orientation: Orientation; isRtl?: boolean; descriptor?: ISplitViewDescriptor }
    ) {
        super();

        this._orientation = options.orientation ?? Orientation.VERTICAL;

        this.element = document.createElement('div');
        this.element.className = 'pane-container';

        toggleClass(this.element, 'dv-rtl', options.isRtl === true);
        toggleClass(this.element, 'dv-ltr', options.isRtl === false);

        container.appendChild(this.element);

        this.splitview = new Splitview(this.element, {
            orientation: this._orientation,
            proportionalLayout: false,
            descriptor: options.descriptor,
            isRtl: options.isRtl,
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
    ): void {
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

    getViewSize(index: number): number {
        return this.splitview.getViewSize(index);
    }

    public getPanes(): PaneviewPanel[] {
        return this.splitview.getViews();
    }

    public removePane(
        index: number,
        options: { skipDispose: boolean } = { skipDispose: false }
    ): PaneItem {
        const paneItem = this.paneItems.splice(index, 1)[0];
        this.splitview.removeView(index);

        if (!options.skipDispose) {
            paneItem.disposable.dispose();
            paneItem.pane.dispose();
        }

        return paneItem;
    }

    public moveView(from: number, to: number): void {
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

    private setupAnimation(): void {
        if (this.skipAnimation) {
            return;
        }

        if (this.animationTimer) {
            clearTimeout(this.animationTimer);
            this.animationTimer = undefined;
        }

        addClasses(this.element, 'animated');

        this.animationTimer = setTimeout(() => {
            this.animationTimer = undefined;
            removeClasses(this.element, 'animated');
        }, 200);
    }

    public dispose(): void {
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
