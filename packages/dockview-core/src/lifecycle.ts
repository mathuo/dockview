export interface IDisposable {
    dispose: () => void;
}

export interface IValueDisposable<T> {
    readonly value: T;
    readonly disposable: IDisposable;
}

export namespace Disposable {
    export const NONE: IDisposable = {
        dispose: () => {
            // noop
        },
    };
}

export class CompositeDisposable {
    private readonly disposables: IDisposable[];

    public static from(...args: IDisposable[]): CompositeDisposable {
        return new CompositeDisposable(...args);
    }

    constructor(...args: IDisposable[]) {
        this.disposables = args;
    }

    public addDisposables(...args: IDisposable[]): void {
        args.forEach((arg) => this.disposables.push(arg));
    }

    public dispose(): void {
        this.disposables.forEach((arg) => arg.dispose());
    }
}

export class MutableDisposable implements IDisposable {
    private _disposable = Disposable.NONE;

    set value(disposable: IDisposable) {
        if (this._disposable) {
            this._disposable.dispose();
        }
        this._disposable = disposable;
    }

    public dispose(): void {
        if (this._disposable) {
            this._disposable.dispose();
            this._disposable = Disposable.NONE;
        }
    }
}
