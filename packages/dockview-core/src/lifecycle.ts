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

    export function from(func: () => void): IDisposable {
        return {
            dispose: () => {
                func();
            },
        };
    }
}

export class CompositeDisposable {
    private readonly _disposables: IDisposable[];
    private _isDisposed = false;

    protected get isDisposed(): boolean {
        return this._isDisposed;
    }

    constructor(...args: IDisposable[]) {
        this._disposables = args;
    }

    public addDisposables(...args: IDisposable[]): void {
        args.forEach((arg) => this._disposables.push(arg));
    }

    public dispose(): void {
        this._disposables.forEach((arg) => arg.dispose());

        this._isDisposed = true;
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
