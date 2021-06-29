import * as React from 'react';
import {
    CanDisplayOverlay,
    Droptarget,
    DropTargetDirections,
} from '../dnd/droptarget';

export interface IDragTragetProps {
    canDisplayOverlay: CanDisplayOverlay;
    validOverlays: DropTargetDirections;
    children: React.ReactNode;
}

export const DockviewDropTarget = React.forwardRef(
    (props: IDragTragetProps, ref: React.ForwardedRef<HTMLDivElement>) => {
        const domRef = React.useRef<HTMLDivElement>(null);
        const dropTargetRef = React.useRef<Droptarget>();

        React.useImperativeHandle(ref, () => domRef.current!, []);

        React.useEffect(() => {
            dropTargetRef.current = new Droptarget(domRef.current!, {
                canDisplayOverlay: props.canDisplayOverlay,
                validOverlays: props.validOverlays,
            });

            return () => {
                dropTargetRef.current?.dispose();
            };
        }, []);

        React.useEffect(() => {
            dropTargetRef.current!.validOverlays = props.validOverlays;
        }, [props.validOverlays]);

        React.useEffect(() => {
            dropTargetRef.current!.canDisplayOverlay = props.canDisplayOverlay;
        }, [props.canDisplayOverlay]);

        return <div ref={domRef}>{props.children}</div>;
    }
);

DockviewDropTarget.displayName = 'DockviewDropTarget';
