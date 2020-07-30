export interface IDisposable {
  dispose: () => void;
}

export class CompositeDisposable {
  private disposables: IDisposable[];

  public static from(...args: IDisposable[]) {
    return new CompositeDisposable(...args);
  }

  constructor(...args: IDisposable[]) {
    this.disposables = args;
  }

  public addDisposables(...args: IDisposable[]) {
    args?.forEach((arg) => this.disposables.push(arg));
  }

  public dispose() {
    this.disposables.forEach((arg) => arg.dispose());
  }
}

export class MutableDisposable implements IDisposable {
  private _disposable: IDisposable;

  constructor() {}

  set value(disposable: IDisposable) {
    if (this._disposable) {
      this._disposable.dispose();
    }
    this._disposable = disposable;
  }

  public dispose() {
    if (this._disposable) {
      this._disposable.dispose();
    }
  }
}
