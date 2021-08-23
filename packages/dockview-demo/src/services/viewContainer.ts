import {
    CompositeDisposable,
    Emitter,
    Event,
    SerializedPaneview,
} from 'dockview';
import { DefaultView, View } from './view';

export interface ViewContainer<T = any> {
    readonly id: string;
    readonly canDelete: boolean;
    readonly views: View[];
    readonly schema: T | undefined;
    readonly onDidAddView: Event<View>;
    readonly onDidRemoveView: Event<View>;
    addView(view: View, location?: number): void;
    layout(schema: T): void;
    removeView(view: View): void;
    clear(): void;
    toJSON(): object;
}

export class PaneviewContainer implements ViewContainer<SerializedPaneview> {
    private readonly _id: string;
    private readonly _canDelete: boolean;
    private readonly _views: View[];

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

    get canDelete() {
        return this._canDelete;
    }

    get schema(): SerializedPaneview | undefined {
        if (!this._schema) {
            this._schema = JSON.parse(
                localStorage.getItem(`viewcontainer_${this.id}`)
            );
        }
        return this._schema;
    }

    constructor(id: string, canDelete: boolean) {
        this._id = id;
        this._canDelete = canDelete;

        const schema = this.schema;

        if (this.schema) {
            this._views = this.schema.views.map((v) => {
                return new DefaultView(v.data.id, v.data.title, v.expanded);
            });
        } else {
            this._views = [];
        }
        // super();

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

    toJSON() {
        return { id: this.id, views: this.views.map((v) => ({ id: v.id })) };
    }
}
