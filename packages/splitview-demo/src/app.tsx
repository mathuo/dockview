import * as React from 'react';
// import { LoadFromConfig } from "./loadFromConfig";
// import { FromApi } from "./fromApi";
// import { PaneDemo } from "./pane";
import { TestGrid } from './layout-grid/reactgrid';
import { Application } from './layout-grid/application';

const options = [
    // { id: "config", component: LoadFromConfig },
    // { id: "api", component: FromApi },
    // { id: "pane", component: PaneDemo },
    { id: 'grid', component: Application },
];

export const App = () => {
    const [value, setValue] = React.useState<string>(options[0].id);

    const onChange = (event: React.ChangeEvent<HTMLSelectElement>) =>
        setValue(event.target.value);

    const Component = React.useMemo(
        () => options.find((o) => o.id === value)?.component,
        [value]
    );

    return (
        <div
            style={{
                height: '100vh',
                width: '100vw',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <div style={{ height: '20px', flexShrink: 0 }}>
                <select onChange={onChange} value={value}>
                    {options.map((option, i) => (
                        <option key={i} value={option.id}>
                            {option.id}{' '}
                        </option>
                    ))}
                </select>
            </div>

            {Component && (
                <div style={{ width: '100%', flexGrow: 1 }}>
                    <Component />
                </div>
            )}
        </div>
    );
};
