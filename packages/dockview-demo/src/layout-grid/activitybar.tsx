import * as React from 'react';
import {
    CompositeDisposable,
    GridviewApi,
    IGridviewPanelProps,
    DockviewDropTarget,
} from 'dockview';
import './activitybar.scss';
import { useLayoutRegistry } from './registry';

const ActivitybarImage = (props: { url: string }) => (
    <a
        style={{
            WebkitMaskImage: `url(${props.url})`,
            maskImage: `url(${props.url})`,
        }}
        className="activity-bar-item-image"
    />
);

export const Activitybar = (props: IGridviewPanelProps) => {
    const registry = useLayoutRegistry();
    const [isActive, setActive] = React.useState<boolean>();

    const onOpenSidebar = (event: React.MouseEvent<HTMLDivElement>) => {
        const api = registry.get<GridviewApi>('gridview');

        const sidebarPanel = api.getPanel('sidebar');
        if (sidebarPanel.api.isVisible) {
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
        <div className="activity-bar" onClick={onOpenSidebar}>
            <div className="activity-bar-item">
                <ActivitybarImage
                    url={
                        'https://fonts.gstatic.com/s/i/materialicons/search/v7/24px.svg'
                    }
                />
            </div>
            <div className="activity-bar-item">
                <ActivitybarImage
                    url={
                        'https://fonts.gstatic.com/s/i/materialicons/search/v7/24px.svg'
                    }
                />
            </div>
            <div className="activity-bar-item">
                <ActivitybarImage
                    url={
                        'https://fonts.gstatic.com/s/i/materialicons/search/v7/24px.svg'
                    }
                />
            </div>
        </div>
    );
};
