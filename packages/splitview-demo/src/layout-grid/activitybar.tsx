import * as React from 'react';
import {
    CompositeDisposable,
    GridviewApi,
    IGridviewPanelProps,
} from 'splitview';
import './activitybar.scss';
import { useLayoutRegistry } from './registry';

export const Activitybar = (props: IGridviewPanelProps) => {
    const registry = useLayoutRegistry();
    const [isActive, setActive] = React.useState<boolean>(false);

    const onOpenSidebar = (event: React.MouseEvent<HTMLDivElement>) => {
        const api = registry.get<GridviewApi>('gridview');

        const sidebarPanel = api.getGroup('sidebar');
        if (api.isVisible(sidebarPanel)) {
            api.setVisible(sidebarPanel, false);
        } else {
            event.preventDefault(); // prevent focus
            api.setVisible(sidebarPanel, true);
            sidebarPanel.focus();
        }
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
            <div className="activity-bar-item">
                <a
                    style={{
                        WebkitMask: `url(https://fonts.gstatic.com/s/i/materialicons/search/v7/24px.svg) 50% 50% / 65% 65% no-repeat`,
                        height: '100%',
                        width: '100%',
                        display: 'block',
                        backgroundColor: 'gray',
                    }}
                />
            </div>
        </div>
    );
};
