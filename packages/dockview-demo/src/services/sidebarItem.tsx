import { ViewContainer } from './viewContainer';
import * as React from 'react';
import { toggleClass } from '../dom';

export const Container = (props: {
    container: ViewContainer;
    isActive: boolean;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, direction: 'top' | 'bottom') => void;
    onClick: (e: React.MouseEvent) => void;
}) => {
    const ref = React.useRef<HTMLDivElement>(null);
    const [selection, setSelection] = React.useState<
        'top' | 'bottom' | undefined
    >(undefined);
    const isDragging = React.useRef<boolean>(false);

    const [dragEntered, setDragEntered] = React.useState<boolean>(false);

    const onDragOver = (e: React.DragEvent) => {
        if (isDragging.current) {
            return;
        }

        setDragEntered(true);

        e.preventDefault();

        const target = e.target as HTMLDivElement;

        const width = target.clientWidth;
        const height = target.clientHeight;

        if (width === 0 || height === 0) {
            return; // avoid div!0
        }

        const x = e.nativeEvent.offsetX;
        const y = e.nativeEvent.offsetY;
        const xp = (100 * x) / width;
        const yp = (100 * y) / height;

        const isTop = yp < 50;
        const isBottom = yp >= 50;

        setSelection(isTop ? 'top' : 'bottom');

        props.onDragOver(e);
    };

    const onDragLeave = (e: React.DragEvent) => {
        if (isDragging.current) {
            return;
        }

        setDragEntered(false);

        setSelection(undefined);
    };

    const onDrop = (e: React.DragEvent) => {
        if (isDragging.current) {
            return;
        }

        setDragEntered(false);

        props.onDrop(e, selection);

        setSelection(undefined);
    };

    const onDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const onDragStart = (e: React.DragEvent) => {
        isDragging.current = true;

        e.dataTransfer.setData(
            'application/json',
            JSON.stringify({ container: props.container.id })
        );
    };

    const onDragEnd = (e: React.DragEvent) => {
        isDragging.current = false;

        setDragEntered(false);
    };

    return (
        <div
            ref={ref}
            draggable={true}
            onClick={props.onClick}
            onDragOver={onDragOver}
            onDragEnter={onDragEnter}
            onDragStart={onDragStart}
            onDragLeave={onDragLeave}
            onDragEnd={onDragEnd}
            onDrop={onDrop}
            style={{
                borderLeft: props.isActive
                    ? '1px solid white'
                    : '1px solid transparent',
            }}
            className="container-item"
        >
            {dragEntered && (
                <div
                    style={{
                        position: 'absolute',
                        top: '0px',
                        left: '0px',
                        height: '100%',
                        width: '100%',
                        backgroundColor: 'transparent',
                        boxSizing: 'border-box',
                        borderTop: selection === 'top' ? '2px solid white' : '',
                        borderBottom:
                            selection === 'bottom' ? '2px solid white' : '',
                        pointerEvents: 'none',
                    }}
                />
            )}
            <span
                style={{ fontSize: '30px' }}
                className="material-icons-outlined"
            >
                {props.container.icon}
            </span>
        </div>
    );
};
