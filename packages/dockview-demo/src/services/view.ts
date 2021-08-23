export interface SerializedView {
    id: string;
    isExpanded: boolean;
}

export type ViewOptions = {
    id: string;
    title: string;
    isExpanded: boolean;
    isLocationEditable: boolean;
    icon: string;
};

export interface View {
    readonly id: string;
    readonly isExpanded: boolean;
    readonly title: string;
    readonly isLocationEditable: boolean;
    readonly icon: string;
    toJSON(): SerializedView;
}

export class DefaultView implements View {
    private readonly _id: string;
    private readonly _title: string;
    private readonly _isExpanded: boolean;
    private readonly _isLocationEditable: boolean;
    private readonly _icon: string;

    get id(): string {
        return this._id;
    }

    get title(): string {
        return this._title;
    }

    get isExpanded(): boolean {
        return this._isExpanded;
    }

    get isLocationEditable(): boolean {
        return this._isLocationEditable;
    }

    get icon(): string {
        return this._icon;
    }

    constructor(options: ViewOptions) {
        this._id = options.id;
        this._title = options.title;
        this._isExpanded = options.isExpanded;
        this._isLocationEditable = options.isLocationEditable;
        this._icon = options.icon;
    }

    toJSON(): SerializedView {
        return {
            id: this.id,
            isExpanded: this.isExpanded,
        };
    }
}
