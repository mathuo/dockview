import { IDockviewPanelProps } from 'dockview';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

// watch an element for resize
function watchElementResize(
    element: HTMLElement,
    cb: (entry: ResizeObserverEntry) => void
): { dispose: () => void } {
    const observer = new ResizeObserver((entires) => {
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

// get absolute position of element allowing for scroll position
function getDomNodePagePosition(domNode: HTMLElement): {
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

function toggleVisibility(element: HTMLElement, isVisible: boolean) {
    element.style.visibility = isVisible ? 'visible' : 'hidden';
}

export const HoistedDockviewPanel = <T extends object>(
    DockviewPanelComponent: React.FC<IDockviewPanelProps<T>>
) => {
    return (props: IDockviewPanelProps<T>) => {
        const ref = React.useRef<HTMLDivElement>(null);
        const innerRef = React.useRef<HTMLDivElement>(null);

        React.useEffect(() => {
            if (!ref.current || !innerRef.current) {
                return;
            }

            const positionHoistedPanel = () => {
                if (!ref.current || !innerRef.current) {
                    return;
                }

                const { left, top, height, width } = getDomNodePagePosition(
                    ref.current.parentElement! // use the parent element to determine our size
                );

                innerRef.current.style.left = `${left}px`;
                innerRef.current.style.top = `${top}px`;
                innerRef.current.style.height = `${height}px`;
                innerRef.current.style.width = `${width}px`;
            };

            const observer = watchElementResize(ref.current, (callback) => {
                if (!ref.current || !innerRef.current) {
                    return;
                }

                positionHoistedPanel(); // since the dockview-panel has changed we must re-position the hoisted element
            });

            positionHoistedPanel(); // initial-paint because a resize may not yet have occured

            return () => {
                observer.dispose(); // cleanup
            };
        }, []);

        React.useEffect(() => {
            if (!innerRef.current) {
                return;
            }

            const disposable = props.api.onDidVisibilityChange((event) => {
                if (!innerRef.current) {
                    return;
                }

                toggleVisibility(innerRef.current, event.isVisible); // subsequent checks of visibility
            });

            toggleVisibility(innerRef.current, props.api.isVisible); // initial check of visibility

            return () => {
                disposable.dispose(); // cleanup
            };
        }, [props.api]);

        return (
            <div ref={ref}>
                {ReactDOM.createPortal(
                    <div
                        /** you may want to mark these elements with some kind of attribute id */
                        ref={innerRef}
                        style={{
                            position: 'absolute',
                            overflow: 'hidden',
                            pointerEvents: 'none', // prevent this wrapper contain stealing events
                        }}
                    >
                        <DockviewPanelComponent {...props} />
                    </div>,
                    document.body // <-- you may choose to mount these 'global' elements to anywhere you see suitable
                )}
            </div>
        );
    };
};
