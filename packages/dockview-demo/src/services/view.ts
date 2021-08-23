export interface View {
    readonly id: string;
    readonly isExpanded: boolean;
    readonly title: string;
    toJSON(): object;
}

export class DefaultView implements View {
    private readonly _id: string;
    private readonly _title: string;
    private readonly _isExpanded: boolean;

    get id() {
        return this._id;
    }

    get title() {
        return this._title;
    }

    get isExpanded() {
        return this._isExpanded;
    }

    constructor(id: string, title: string, isExpanded: boolean) {
        this._id = id;
        this._title = title;
        this._isExpanded = isExpanded;
    }

    toJSON() {
        return { id: this.id, title: this.title, isExpanded: this.isExpanded };
    }
}
