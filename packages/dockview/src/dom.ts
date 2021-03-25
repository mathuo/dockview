import {
    Event,
    Emitter,
    addDisposableListener,
    addDisposableWindowListener,
} from './events';
import { IDisposable, CompositeDisposable } from './lifecycle';

export function watchElementResize(
    element: HTMLElement,
    cb: (entry: ResizeObserverEntry) => void
): IDisposable {
    const observer = new ResizeObserver((entires) => {
        const firstEntry = entires[0];
        cb(firstEntry);
    });

    observer.observe(element);

    return {
        dispose: () => {
            observer.unobserve(element);
            observer.disconnect();
        },
    };
}

export function isHTMLElement(o: any): o is HTMLElement {
    if (typeof HTMLElement === 'object') {
        return o instanceof HTMLElement;
    }
    return (
        o &&
        typeof o === 'object' &&
        o.nodeType === 1 &&
        typeof o.nodeName === 'string'
    );
}

export const isInTree = (element: HTMLElement, className: string) => {
    let _element: HTMLElement | null = element;

    while (_element) {
        if (_element.classList.contains(className)) {
            return true;
        }
        _element = _element.parentElement;
    }

    return false;
};

export const removeClasses = (element: HTMLElement, ...classes: string[]) => {
    for (const classname of classes) {
        if (element.classList.contains(classname)) {
            element.classList.remove(classname);
        }
    }
};

export const addClasses = (element: HTMLElement, ...classes: string[]) => {
    for (const classname of classes) {
        if (!element.classList.contains(classname)) {
            element.classList.add(classname);
        }
    }
};

export const toggleClass = (
    element: HTMLElement,
    className: string,
    isToggled: boolean
) => {
    const hasClass = element.classList.contains(className);
    if (isToggled && !hasClass) {
        element.classList.add(className);
    }
    if (!isToggled && hasClass) {
        element.classList.remove(className);
    }
};

export function isAncestor(
    testChild: Node | null,
    testAncestor: Node | null
): boolean {
    while (testChild) {
        if (testChild === testAncestor) {
            return true;
        }
        testChild = testChild.parentNode;
    }

    return false;
}

export function getElementsByTagName(tag: string): HTMLElement[] {
    return Array.prototype.slice.call(document.getElementsByTagName(tag), 0);
}

export interface IFocusTracker extends IDisposable {
    onDidFocus: Event<void>;
    onDidBlur: Event<void>;
    refreshState?(): void;
}

export function trackFocus(element: HTMLElement | Window): IFocusTracker {
    return new FocusTracker(element);
}

/**
 * Track focus on an element. Ensure tabIndex is set when an HTMLElement is not focusable by default
 */
class FocusTracker extends CompositeDisposable implements IFocusTracker {
    private readonly _onDidFocus = new Emitter<void>();
    public readonly onDidFocus: Event<void> = this._onDidFocus.event;

    private readonly _onDidBlur = new Emitter<void>();
    public readonly onDidBlur: Event<void> = this._onDidBlur.event;

    private _refreshStateHandler: () => void;

    constructor(element: HTMLElement | Window) {
        super();

        let hasFocus = isAncestor(document.activeElement, <HTMLElement>element);
        let loosingFocus = false;

        const onFocus = () => {
            loosingFocus = false;
            if (!hasFocus) {
                hasFocus = true;
                this._onDidFocus.fire();
            }
        };

        const onBlur = () => {
            if (hasFocus) {
                loosingFocus = true;
                window.setTimeout(() => {
                    if (loosingFocus) {
                        loosingFocus = false;
                        hasFocus = false;
                        this._onDidBlur.fire();
                    }
                }, 0);
            }
        };

        this._refreshStateHandler = () => {
            const currentNodeHasFocus = isAncestor(
                document.activeElement,
                <HTMLElement>element
            );
            if (currentNodeHasFocus !== hasFocus) {
                if (hasFocus) {
                    onBlur();
                } else {
                    onFocus();
                }
            }
        };

        if (element instanceof HTMLElement) {
            this.addDisposables(
                addDisposableListener(element, 'focus', onFocus, true)
            );
            this.addDisposables(
                addDisposableListener(element, 'blur', onBlur, true)
            );
        } else {
            this.addDisposables(
                addDisposableWindowListener(element, 'focus', onFocus, true)
            );
            this.addDisposables(
                addDisposableWindowListener(element, 'blur', onBlur, true)
            );
        }
    }

    refreshState() {
        this._refreshStateHandler();
    }

    public dispose() {
        super.dispose();

        this._onDidBlur.dispose();
        this._onDidFocus.dispose();
    }
}
