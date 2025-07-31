import React from 'react';
import { CloseButton } from '../svg';
import { DockviewPanelApi, IDockviewPanelHeaderProps } from 'dockview-core';

function useTitle(api: DockviewPanelApi): string | undefined {
    const [title, setTitle] = React.useState<string | undefined>(api.title);

    React.useEffect(() => {
        const disposable = api.onDidTitleChange((event) => {
            setTitle(event.title);
        });

        return () => {
            disposable.dispose();
        };
    }, [api]);

    return title;
}

export type IDockviewDefaultTabProps = IDockviewPanelHeaderProps &
    React.HtmlHTMLAttributes<HTMLDivElement> & {
        hideClose?: boolean;
        closeActionOverride?: () => void;
    };

export const DockviewDefaultTab: React.FunctionComponent<
    IDockviewDefaultTabProps
> = ({
    api,
    containerApi: _containerApi,
    params: _params,
    hideClose,
    closeActionOverride,
    onPointerDown,
    onPointerUp,
    onPointerLeave,
    tabLocation,
    ...rest
}) => {
    const title = useTitle(api);

    const isMiddleMouseButton = React.useRef<boolean>(false);

    const onClose = React.useCallback(
        (event: React.MouseEvent<HTMLSpanElement>) => {
            event.preventDefault();

            if (closeActionOverride) {
                closeActionOverride();
            } else {
                api.close();
            }
        },
        [api, closeActionOverride]
    );

    const onBtnPointerDown = React.useCallback((event: React.MouseEvent) => {
        event.preventDefault();
    }, []);

    const _onPointerDown = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            isMiddleMouseButton.current = event.button === 1;
            onPointerDown?.(event);
        },
        [onPointerDown]
    );

    const _onPointerUp = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (isMiddleMouseButton && event.button === 1 && !hideClose) {
                isMiddleMouseButton.current = false;
                onClose(event);
            }

            onPointerUp?.(event);
        },
        [onPointerUp, onClose, hideClose]
    );

    const _onPointerLeave = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            isMiddleMouseButton.current = false;
            onPointerLeave?.(event);
        },
        [onPointerLeave]
    );

    return (
        <div
            data-testid="dockview-dv-default-tab"
            {...rest}
            onPointerDown={_onPointerDown}
            onPointerUp={_onPointerUp}
            onPointerLeave={_onPointerLeave}
            className="dv-default-tab"
        >
            <span className="dv-default-tab-content">{title}</span>
            {!hideClose && (
                <div
                    className="dv-default-tab-action"
                    onPointerDown={onBtnPointerDown}
                    onClick={onClose}
                >
                    <CloseButton />
                </div>
            )}
        </div>
    );
};
