import { IDockviewPanelProps } from 'dockview';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

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

        React.useEffect(() => {
            if (!innerRef.current) {
                return;
            }

            const disposable1 = props.api.onDidVisibilityChange((event) => {
                if (!innerRef.current) {
                    return;
                }

                toggleVisibility(innerRef.current, event.isVisible); // subsequent checks of visibility
            });

            const disposable2 = props.api.onDidDimensionsChange(() => {
                positionHoistedPanel();
            });

            positionHoistedPanel();

            return () => {
                disposable1.dispose(); // cleanup
                disposable2.dispose();
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
                            zIndex: 999,
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
