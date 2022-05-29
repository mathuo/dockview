import { IDockviewPanelHeaderProps } from './dockview';
import * as React from 'react';

export const DefaultTab = (
    props: IDockviewPanelHeaderProps & React.DOMAttributes<HTMLDivElement>
) => {
    const onClose = React.useCallback(
        (event: React.MouseEvent<HTMLSpanElement>) => {
            event.stopPropagation();
            props.api.close();
        },
        [props.api]
    );

    const onClick = React.useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            props.api.setActive();

            if (props.onClick) {
                props.onClick(event);
            }
        },
        [props.api, props.onClick]
    );

    const iconClassname = React.useMemo(() => {
        const cn = ['dockview-react-tab-action'];
        return cn.join(',');
    }, [props.api.suppressClosable]);

    return (
        <div {...props} onClick={onClick} className="dockview-react-tab">
            <span className="dockview-react-tab-title">{props.api.title}</span>
            <span onClick={onClose} className={iconClassname}>
                {'✕'}
            </span>
        </div>
    );
};
