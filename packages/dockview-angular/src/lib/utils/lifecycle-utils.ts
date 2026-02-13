import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DockviewIDisposable } from 'dockview-core';

export class AngularDisposable implements DockviewIDisposable {
    private _isDisposed = false;
    private disposeCallbacks: (() => void)[] = [];

    get isDisposed(): boolean {
        return this._isDisposed;
    }

    addDisposeCallback(callback: () => void): void {
        if (this._isDisposed) {
            callback();
            return;
        }
        this.disposeCallbacks.push(callback);
    }

    dispose(): void {
        if (this._isDisposed) {
            return;
        }

        this._isDisposed = true;
        this.disposeCallbacks.forEach((callback) => {
            try {
                callback();
            } catch (error) {
                console.error('Error in dispose callback:', error);
            }
        });
        this.disposeCallbacks = [];
    }
}

export class AngularLifecycleManager {
    private destroySubject = new Subject<void>();
    private disposables: DockviewIDisposable[] = [];

    get destroy$(): Observable<void> {
        return this.destroySubject.asObservable();
    }

    addDisposable(disposable: DockviewIDisposable): void {
        this.disposables.push(disposable);
    }

    takeUntilDestroy<T>(): (source: Observable<T>) => Observable<T> {
        return takeUntil(this.destroySubject);
    }

    destroy(): void {
        this.destroySubject.next();
        this.destroySubject.complete();

        this.disposables.forEach((disposable) => {
            try {
                disposable.dispose();
            } catch (error) {
                console.error('Error disposing resource:', error);
            }
        });
        this.disposables = [];
    }
}

export function createAngularDisposable(
    disposeCallback?: () => void
): AngularDisposable {
    const disposable = new AngularDisposable();
    if (disposeCallback) {
        disposable.addDisposeCallback(disposeCallback);
    }
    return disposable;
}
