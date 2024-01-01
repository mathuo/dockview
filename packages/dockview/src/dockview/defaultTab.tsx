import { IDockviewPanelHeaderProps } from './dockview';
import * as React from 'react';
import { CloseButton } from '../svg';

export type IDockviewDefaultTabProps = IDockviewPanelHeaderProps &
    React.DOMAttributes<HTMLDivElement> & {
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
    ...rest
}) => {
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

    const onMouseDown = React.useCallback((e: React.MouseEvent) => {
        e.preventDefault();
    }, []);

    const onClick = React.useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            if (event.defaultPrevented) {
                return;
            }

            api.setActive();

            if (rest.onClick) {
                rest.onClick(event);
            }
        },
        [api, rest.onClick]
    );

    return (
        <div
            data-testid="dockview-default-tab"
            {...rest}
            onClick={onClick}
            className="dockview-react-tab"
        >
            <span className="dockview-react-tab-title">{api.title}</span>
            {!hideClose && (
                <div
                    className="dv-react-tab-close-btn"
                    onMouseDown={onMouseDown}
                    onClick={onClose}
                >
                    <CloseButton />
                </div>
            )}
        </div>
    );
};
