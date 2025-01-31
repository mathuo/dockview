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
    const title = useTitle(api);

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

    const onPointerDown = React.useCallback((e: React.MouseEvent) => {
        e.preventDefault();
    }, []);

    return (
        <div
            data-testid="dockview-dv-default-tab"
            {...rest}
            className="dv-default-tab"
        >
            <span className="dv-default-tab-content">{title}</span>
            {!hideClose && (
                <div
                    className="dv-default-tab-action"
                    onPointerDown={onPointerDown}
                    onClick={onClose}
                >
                    <CloseButton />
                </div>
            )}
        </div>
    );
};
