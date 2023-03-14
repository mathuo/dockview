import {
    DockviewComponent,
    GroupPanelContentPartInitParameters,
    IContentRenderer,
    ITabRenderer,
} from 'dockview-core';
import * as React from 'react';

class CustomPanel implements IContentRenderer {
    element = document.createElement('div');

    init(parameters: GroupPanelContentPartInitParameters): void {
        //
    }
}

class CustomTab implements ITabRenderer {
    element = document.createElement('div');

    init(parameters: GroupPanelContentPartInitParameters): void {
        this.element.textContent = `Custom (${parameters.api.title})`;
    }
}

export const DockviewVanilla = () => {
    const ref = React.useRef<HTMLDivElement>();

    React.useEffect(() => {
        if (!ref.current) {
            return;
        }

        const container = document.createElement('div');
        ref.current.appendChild(container);

        const dockviewComponent = new DockviewComponent(container, {
            components: {
                myCustomPanel: CustomPanel,
            },
            tabComponents: {
                myCustomTab: CustomTab,
            },
        });

        const observer = new ResizeObserver((entires) => {
            const firstEntry = entires[0];
            const { width, height } = firstEntry.contentRect;
            dockviewComponent.layout(width, height);
        });

        observer.observe(ref.current);

        dockviewComponent.addPanel({
            component: 'myCustomPanel',
            tabComponent: 'myCustomTab',
            id: '1',
            title: 'Panel 1',
        });
        dockviewComponent.addPanel({
            component: 'myCustomPanel',
            id: '2',
            title: 'Panel 2',
        });

        return () => {
            dockviewComponent.dispose();
        };
    }, []);

    return (
        <div
            className="dockview-theme-abyss"
            ref={ref}
            style={{
                height: '500px',
                backgroundColor: 'red',
            }}
        ></div>
    );
};
