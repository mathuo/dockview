import * as React from 'react';
import { ComponentGridview, IGridviewPanelProps } from 'splitview';
import './activitybar.scss';
import { useLayoutRegistry } from './registry';

export const Activitybar = (props: IGridviewPanelProps) => {
    const registry = useLayoutRegistry();

    const onOpenSidebar = () => {
        const api = registry.get<ComponentGridview>('gridview');

        const sidebarPanel = api.getGroup('sidebar');
        api.toggleVisibility(sidebarPanel);
    };

    React.useEffect(() => {
        // props.api.onDidActiveChange((event) => {});
    }, []);

    return (
        <div
            onClick={onOpenSidebar}
            style={{
                height: '100%',
                width: '48px',
                backgroundColor: 'rgb(51,51,51)',
            }}
        >
            <div className="activity-bar-item">T</div>
        </div>
    );
};
