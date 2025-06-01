import {
    Event as DockviewEvent,
    Emitter,
    addDisposableListener,
} from './events';
import { IDisposable, CompositeDisposable } from './lifecycle';

export interface OverflowEvent {
    hasScrollX: boolean;
    hasScrollY: boolean;
}

export class OverflowObserver extends CompositeDisposable {
    private readonly _onDidChange = new Emitter<OverflowEvent>();
    readonly onDidChange = this._onDidChange.event;

    private _value: OverflowEvent | null = null;

    constructor(el: HTMLElement) {
        super();

        this.addDisposables(
            this._onDidChange,
            watchElementResize(el, (entry) => {
                const hasScrollX =
                    entry.target.scrollWidth > entry.target.clientWidth;

                const hasScrollY =
                    entry.target.scrollHeight > entry.target.clientHeight;

                this._value = { hasScrollX, hasScrollY };
                this._onDidChange.fire(this._value);
            })
        );
    }
}

export function watchElementResize(
    element: HTMLElement,
    cb: (entry: ResizeObserverEntry) => void
): IDisposable {
    const observer = new ResizeObserver((entires) => {
        /**
         * Fast browser window resize produces Error: ResizeObserver loop limit exceeded.
         * The error isn't visible in browser console, doesn't affect functionality, but degrades performance.
         * See https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded/58701523#58701523
         */
        requestAnimationFrame(() => {
            const firstEntry = entires[0];
            cb(firstEntry);
        });
    });

    observer.observe(element);

    return {
        dispose: () => {
            observer.unobserve(element);
            observer.disconnect();
        },
    };
}

export const removeClasses = (
    element: HTMLElement,
    ...classes: string[]
): void => {
    for (const classname of classes) {
        if (element.classList.contains(classname)) {
            element.classList.remove(classname);
        }
    }
};

export const addClasses = (
    element: HTMLElement,
    ...classes: string[]
): void => {
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
): void => {
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

export function getElementsByTagName(
    tag: string,
    document: ParentNode
): HTMLElement[] {
    return Array.prototype.slice.call(document.querySelectorAll(tag), 0);
}

export interface IFocusTracker extends IDisposable {
    readonly onDidFocus: DockviewEvent<void>;
    readonly onDidBlur: DockviewEvent<void>;
    refreshState?(): void;
}

export function trackFocus(element: HTMLElement): IFocusTracker {
    return new FocusTracker(element);
}

/**
 * Track focus on an element. Ensure tabIndex is set when an HTMLElement is not focusable by default
 */
class FocusTracker extends CompositeDisposable implements IFocusTracker {
    private readonly _onDidFocus = new Emitter<void>();
    public readonly onDidFocus: DockviewEvent<void> = this._onDidFocus.event;

    private readonly _onDidBlur = new Emitter<void>();
    public readonly onDidBlur: DockviewEvent<void> = this._onDidBlur.event;

    private readonly _refreshStateHandler: () => void;

    constructor(element: HTMLElement) {
        super();

        this.addDisposables(this._onDidFocus, this._onDidBlur);

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

        this.addDisposables(
            addDisposableListener(element, 'focus', onFocus, true)
        );
        this.addDisposables(
            addDisposableListener(element, 'blur', onBlur, true)
        );
    }

    refreshState(): void {
        this._refreshStateHandler();
    }
}

// quasi: apparently, but not really; seemingly
const QUASI_PREVENT_DEFAULT_KEY = 'dv-quasiPreventDefault';

// mark an event directly for other listeners to check
export function quasiPreventDefault(event: Event): void {
    (event as any)[QUASI_PREVENT_DEFAULT_KEY] = true;
}

// check if this event has been marked
export function quasiDefaultPrevented(event: Event): boolean {
    return (event as any)[QUASI_PREVENT_DEFAULT_KEY];
}

export function addStyles(document: Document, styleSheetList: StyleSheetList) {
    const styleSheets = Array.from(styleSheetList);

    for (const styleSheet of styleSheets) {
        if (styleSheet.href) {
            const link = document.createElement('link');
            link.href = styleSheet.href;
            link.type = styleSheet.type;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }

        let cssTexts: string[] = [];

        try {
            if (styleSheet.cssRules) {
                cssTexts = Array.from(styleSheet.cssRules).map(
                    (rule) => rule.cssText
                );
            }
        } catch (err) {
            // security errors (lack of permissions), ignore
        }

        for (const rule of cssTexts) {
            const style = document.createElement('style');
            style.appendChild(document.createTextNode(rule));
            document.head.appendChild(style);
        }
    }
}

export function getDomNodePagePosition(domNode: Element): {
    left: number;
    top: number;
    width: number;
    height: number;
} {
    const { left, top, width, height } = domNode.getBoundingClientRect();
    return {
        left: left + window.scrollX,
        top: top + window.scrollY,
        width: width,
        height: height,
    };
}

/**
 * Check whether an element is in the DOM (including the Shadow DOM)
 * @see https://terodox.tech/how-to-tell-if-an-element-is-in-the-dom-including-the-shadow-dom/
 */
export function isInDocument(element: Element): boolean {
    let currentElement: Element | ParentNode = element;

    while (currentElement?.parentNode) {
        if (currentElement.parentNode === document) {
            return true;
        } else if (currentElement.parentNode instanceof DocumentFragment) {
            // handle shadow DOMs
            currentElement = (currentElement.parentNode as ShadowRoot).host;
        } else {
            currentElement = currentElement.parentNode;
        }
    }

    return false;
}

export function addTestId(element: HTMLElement, id: string): void {
    element.setAttribute('data-testid', id);
}

/**
 * Should be more efficient than element.querySelectorAll("*") since there
 * is no need to store every element in-memory using this approach
 */
function allTagsNamesInclusiveOfShadowDoms(tagNames: string[]) {
    const iframes: HTMLElement[] = [];

    function findIframesInNode(node: Element) {
        if (node.nodeType === Node.ELEMENT_NODE) {
            if (tagNames.includes(node.tagName)) {
                iframes.push(node as HTMLElement);
            }

            if (node.shadowRoot) {
                findIframesInNode(<any>node.shadowRoot);
            }

            for (const child of node.children) {
                findIframesInNode(child);
            }
        }
    }

    findIframesInNode(document.documentElement);

    return iframes;
}

export function disableIframePointEvents(rootNode: ParentNode = document) {
    const iframes = allTagsNamesInclusiveOfShadowDoms(['IFRAME', 'WEBVIEW']);

    const original = new WeakMap<HTMLElement, string>(); // don't hold onto HTMLElement references longer than required

    for (const iframe of iframes) {
        original.set(iframe, iframe.style.pointerEvents);
        iframe.style.pointerEvents = 'none';
    }

    return {
        release: () => {
            for (const iframe of iframes) {
                iframe.style.pointerEvents = original.get(iframe) ?? 'auto';
            }
            iframes.splice(0, iframes.length); // don't hold onto HTMLElement references longer than required
        },
    };
}

export function getDockviewTheme(element: HTMLElement): string | undefined {
    function toClassList(element: HTMLElement) {
        const list: string[] = [];

        for (let i = 0; i < element.classList.length; i++) {
            list.push(element.classList.item(i)!);
        }

        return list;
    }

    let theme: string | undefined = undefined;
    let parent: HTMLElement | null = element;

    while (parent !== null) {
        theme = toClassList(parent).find((cls) =>
            cls.startsWith('dockview-theme-')
        );
        if (typeof theme === 'string') {
            break;
        }
        parent = parent.parentElement;
    }

    return theme;
}

export class Classnames {
    private _classNames: string[] = [];

    constructor(private readonly element: HTMLElement) {}

    setClassNames(classNames: string) {
        for (const className of this._classNames) {
            toggleClass(this.element, className, false);
        }

        this._classNames = classNames
            .split(' ')
            .filter((v) => v.trim().length > 0);

        for (const className of this._classNames) {
            toggleClass(this.element, className, true);
        }
    }
}

const DEBOUCE_DELAY = 100;

export function isChildEntirelyVisibleWithinParent(
    child: HTMLElement,
    parent: HTMLElement
): boolean {
    const childPosition = getDomNodePagePosition(child);
    const parentPosition = getDomNodePagePosition(parent);

    // Check horizontal visibility
    if (childPosition.left < parentPosition.left) {
        return false;
    }

    if (
        childPosition.left + childPosition.width >
        parentPosition.left + parentPosition.width
    ) {
        return false;
    }

    // Check vertical visibility
    if (childPosition.top < parentPosition.top) {
        return false;
    }

    if (
        childPosition.top + childPosition.height >
        parentPosition.top + parentPosition.height
    ) {
        return false;
    }

    return true;
}

export function onDidWindowMoveEnd(window: Window): Emitter<void> {
    const emitter = new Emitter<void>();

    let previousScreenX = window.screenX;
    let previousScreenY = window.screenY;

    let timeout: any;

    const checkMovement = () => {
        if (window.closed) {
            return;
        }

        const currentScreenX = window.screenX;
        const currentScreenY = window.screenY;

        if (
            currentScreenX !== previousScreenX ||
            currentScreenY !== previousScreenY
        ) {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                emitter.fire();
            }, DEBOUCE_DELAY);

            previousScreenX = currentScreenX;
            previousScreenY = currentScreenY;
        }

        requestAnimationFrame(checkMovement);
    };

    checkMovement();

    return emitter;
}

export function onDidWindowResizeEnd(element: Window, cb: () => void) {
    let resizeTimeout: any;

    const disposable = new CompositeDisposable(
        addDisposableListener(element, 'resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                cb();
            }, DEBOUCE_DELAY);
        })
    );

    return disposable;
}

export function shiftAbsoluteElementIntoView(
    element: HTMLElement,
    root: HTMLElement,
    options: { buffer: number } = { buffer: 10 }
) {
    const buffer = options.buffer;
    const rect = element.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();

    let translateX = 0;
    let translateY = 0;

    const left = rect.left - rootRect.left;
    const top = rect.top - rootRect.top;
    const bottom = rect.bottom - rootRect.bottom;
    const right = rect.right - rootRect.right;

    // Check horizontal overflow
    if (left < buffer) {
        translateX = buffer - left;
    } else if (right > buffer) {
        translateX = -buffer - right;
    }

    // Check vertical overflow
    if (top < buffer) {
        translateY = buffer - top;
    } else if (bottom > buffer) {
        translateY = -bottom - buffer;
    }

    // Apply the translation if needed
    if (translateX !== 0 || translateY !== 0) {
        element.style.transform = `translate(${translateX}px, ${translateY}px)`;
    }
}

export function findRelativeZIndexParent(el: HTMLElement): HTMLElement | null {
    let tmp: HTMLElement | null = el;

    while (tmp && (tmp.style.zIndex === 'auto' || tmp.style.zIndex === '')) {
        tmp = tmp.parentElement;
    }

    return tmp;
}
