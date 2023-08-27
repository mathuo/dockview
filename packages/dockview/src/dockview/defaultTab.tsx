import { IDockviewPanelHeaderProps } from './dockview';
import * as React from 'react';
import { CloseButton } from '../svg';

export type IDockviewDefaultTabProps = IDockviewPanelHeaderProps &
    React.DOMAttributes<HTMLDivElement> & { hideClose?: boolean };

export const DockviewDefaultTab: React.FunctionComponent<
    IDockviewDefaultTabProps
> = ({
    api,
    containerApi: _containerApi,
    params: _params,
    hideClose,
    ...rest
}) => {
    const onClose = React.useCallback(
        (event: React.MouseEvent<HTMLSpanElement>) => {
            event.stopPropagation();
            api.close();
        },
        [api]
    );

    const onClick = React.useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
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
                <div className="dv-react-tab-close-btn" onClick={onClose}>
                    <CloseButton />
                </div>
            )}
        </div>
    );
};
