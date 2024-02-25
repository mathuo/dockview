import {
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
    IDockviewPanelHeaderProps,
} from 'dockview';
import * as React from 'react';
import './app.scss';

import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-balham.css';

const data = new Array(1000).fill(0).map((_, i) => {
    return {
        index: i,
        a: Math.random() * 100,
        b: Math.random() * 100,
        c: Math.random() * 100,
        d: Math.random() * 100,
    };
});

const columnDefs: ColDef[] = [
    {
        field: 'a',
    },
    {
        field: 'b',
    },
    {
        field: 'c',
    },
    {
        field: 'd',
    },
];

const components = {
    default: (props: IDockviewPanelProps<{ title: string; x?: number }>) => {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    height: '100%',
                }}
            >
                <span>{`${props.params.title}`}</span>
                {props.params.x && <span>{`  ${props.params.x}`}</span>}
            </div>
        );
    },
    grid: () => {
        return (
            <div className="ag-theme-balham-dark" style={{ height: '100%' }}>
                <AgGridReact rowData={data} columnDefs={columnDefs} />
            </div>
        );
    },
};

const DockviewComponent = (props: { theme?: string }) => {
    const onReady = (event: DockviewReadyEvent) => {
        const panel1 = event.api.addPanel({
            id: 'panel_1',
            component: 'default',
        });

        event.api.addPanel({
            id: 'panel_2',
            component: 'grid',
            renderer: 'always',
        });
    };

    return (
        <DockviewReact
            onReady={onReady}
            components={components}
            className={`${props.theme || 'dockview-theme-abyss'}`}
        />
    );
};

export default DockviewComponent;
