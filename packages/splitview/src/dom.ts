import { Event, Emitter, addDisposableListener } from "./events";
import { IDisposable, CompositeDisposable } from "./lifecycle";

export function getDomNodePagePosition(domNode: HTMLElement) {
  const bb = domNode.getBoundingClientRect();
  return {
    left: bb.left + window.scrollX,
    top: bb.top + window.scrollY,
    width: bb.width,
    height: bb.height,
  };
}

/**
 * Fix the element to the top or bottom of the container depending on whether
 * the element is above or below the containers view portal.
 */
export const scrollIntoView = (
  element: HTMLElement,
  container: HTMLElement
) => {
  const { inView, breachPoint } = isElementInView(element, container, true);
  if (!inView) {
    const adder = -container.offsetTop;
    const isUp = breachPoint === "top";
    container.scrollTo({
      top: isUp
        ? adder + element.offsetTop
        : adder +
          element.offsetTop -
          container.clientHeight +
          element.clientHeight,
    });
  }
};

export const isElementInView = (
  element: HTMLElement,
  container: HTMLElement,
  fullyInView: boolean
): { inView: boolean; breachPoint?: "top" | "bottom" } => {
  const containerOfftsetTop = container.offsetTop;
  const containerTop = containerOfftsetTop + container.scrollTop;
  const containerBottom =
    containerTop + container.getBoundingClientRect().height;
  const elementTop = element.offsetTop;
  const elementBottom = elementTop + element.getBoundingClientRect().height;

  const isAbove = fullyInView
    ? containerTop >= elementTop
    : elementTop > containerBottom;
  const isBelow = fullyInView
    ? containerBottom <= elementBottom
    : elementBottom < containerTop;

  if (isAbove) {
    return { inView: false, breachPoint: "top" };
  }

  if (isBelow) {
    return { inView: false, breachPoint: "bottom" };
  }

  return { inView: true };
};

export function isHTMLElement(o: any): o is HTMLElement {
  if (typeof HTMLElement === "object") {
    return o instanceof HTMLElement;
  }
  return (
    o &&
    typeof o === "object" &&
    o.nodeType === 1 &&
    typeof o.nodeName === "string"
  );
}

export const isInTree = (element: HTMLElement, className: string) => {
  let _element = element;

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

export function firstIndex<T>(
  array: T[] | ReadonlyArray<T>,
  fn: (item: T) => boolean
): number {
  for (let i = 0; i < array.length; i++) {
    const element = array[i];

    if (fn(element)) {
      return i;
    }
  }

  return -1;
}

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
      let currentNodeHasFocus = isAncestor(
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

    this.addDisposables(addDisposableListener(element, "focus", onFocus, true));
    this.addDisposables(addDisposableListener(element, "blur", onBlur, true));
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
