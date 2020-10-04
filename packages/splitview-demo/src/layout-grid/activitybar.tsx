import * as React from 'react';
import {
    ComponentGridview,
    CompositeDisposable,
    IGridviewPanelProps,
} from 'splitview';
import './activitybar.scss';
import { useLayoutRegistry } from './registry';

export const Activitybar = (props: IGridviewPanelProps) => {
    const registry = useLayoutRegistry();
    const [isActive, setActive] = React.useState<boolean>(false);

    const onOpenSidebar = () => {
        const api = registry.get<ComponentGridview>('gridview');

        const sidebarPanel = api.getGroup('sidebar');
        api.toggleVisibility(sidebarPanel);
    };

    React.useEffect(() => {
        const disposable = new CompositeDisposable(
            props.api.onDidActiveChange((event) => {
                setActive(event.isActive);
            })
        );

        return () => {
            disposable.dispose();
        };
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
