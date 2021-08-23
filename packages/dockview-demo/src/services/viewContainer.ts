import {
    CompositeDisposable,
    Emitter,
    Event,
    SerializedPaneview,
} from 'dockview';
import { DefaultView, View, SerializedView } from './view';
import { IViewRegistry } from './viewRegistry';

export interface SerializedViewContainer {
    readonly id: string;
    readonly views: SerializedView[];
}

export interface ViewContainer<T = any> {
    readonly id: string;
    readonly views: View[];
    readonly schema: T | any;
    readonly icon: string;
    readonly onDidAddView: Event<View>;
    readonly onDidRemoveView: Event<View>;
    addView(view: View, location?: number): void;
    layout(schema: T): void;
    removeView(view: View): void;
    clear(): void;
    toJSON(): SerializedViewContainer;
}

export class PaneviewContainer implements ViewContainer<SerializedPaneview> {
    private readonly _id: string;
    private readonly _views: View[] = [];

    private readonly _onDidAddView = new Emitter<View>();
    readonly onDidAddView = this._onDidAddView.event;
    private readonly _onDidRemoveView = new Emitter<View>();
    readonly onDidRemoveView = this._onDidRemoveView.event;

    private _schema: SerializedPaneview | undefined;

    get id() {
        return this._id;
    }

    get views() {
        return this._views;
    }

    get schema(): SerializedPaneview | undefined {
        if (!this._schema) {
            this._schema = JSON.parse(
                localStorage.getItem(`viewcontainer_${this.id}`)
            );
        }
        return this._schema;
    }

    get icon(): string {
        const defaultIcon = 'search';
        if (this.views.length > 0) {
            return this.views.find((v) => !!v.icon)?.icon || defaultIcon;
        }
        return defaultIcon;
    }

    constructor(
        id: string,
        viewRegistry: IViewRegistry,
        views?: SerializedView[]
    ) {
        this._id = id;

        if (views) {
            for (const view of views) {
                const registeredView = viewRegistry.getRegisteredView(view.id);
                this.addView(
                    new DefaultView({
                        id: view.id,
                        title: registeredView.title,
                        isExpanded: view.isExpanded,
                        isLocationEditable: registeredView.isLocationEditable,
                        icon: registeredView.icon,
                    })
                );
            }
        }
        // this.addDisposables(this._onDidAddView, this._onDidRemoveView);
    }

    layout(schema: SerializedPaneview): void {
        this._schema = schema;
        localStorage.setItem(
            `viewcontainer_${this.id}`,
            JSON.stringify(schema)
        );
    }

    addView(view: View, location = 0): void {
        this._views.splice(location, 0, view);
        this._onDidAddView.fire(view);
    }

    removeView(view: View): void {
        const index = this._views.indexOf(view);
        if (index < 0) {
            throw new Error('invalid');
        }
        this._views.splice(index, 1);

        if (this._schema) {
            this._schema = { ...this._schema };
            this._schema.views = this._schema.views.filter(
                (v) => v.data.id !== view.id
            );
            this.layout(this._schema);
        }

        this._onDidRemoveView.fire(view);
    }

    clear() {
        localStorage.removeItem(`viewcontainer_${this.id}`);
    }

    toJSON(): SerializedViewContainer {
        return { id: this.id, views: this.views.map((v) => v.toJSON()) };
    }
}
