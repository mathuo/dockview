import { Emitter } from 'dockview-core/dist/cjs/events';
import * as React from 'react';

const frameworks = [
    { value: 'JavaScript', label: 'JavaScript' },
    { value: 'React', label: 'React' },
    { value: 'Angular', label: 'Angular' },
];

const activeFrameworkGlobal = new Emitter<string>({ replay: true });

activeFrameworkGlobal.fire(
    localStorage.getItem('dv-docs-framework') ?? frameworks[0].value
);

function useActiveFramework(): [string, (value: string) => void] {
    const [value, setValue] = React.useState<string>(
        localStorage.getItem('dv-docs-framework') ?? frameworks[0].value
    );

    React.useEffect(() => {
        const disposable = activeFrameworkGlobal.event((value) => [
            setValue(value),
        ]);

        return () => {
            disposable.dispose();
        };
    }, []);

    const setter = React.useCallback((value: string) => {
        localStorage.setItem('dv-docs-framework', value);
        setValue(value);
        activeFrameworkGlobal.fire(value);
    }, []);

    return [value, setter];
}

export const Header = (props: { title: string }) => {
    return (
        <header>
            <h1>{props.title}</h1>
            <FrameworkSelector />
        </header>
    );
};

export const FrameworkSelector = () => {
    const [activeFramework, setActiveFramework] = useActiveFramework();

    const onChange = (event: React.ChangeEvent<HTMLSelectElement>) => [
        setActiveFramework(event.target.value),
    ];

    return (
        <select onChange={onChange} value={activeFramework}>
            {frameworks.map((framework) => {
                return (
                    <option value={framework.value}>{framework.label}</option>
                );
            })}
        </select>
    );
};

export const FrameworkSpecific = (props: {
    framework: string;
    children: React.ReactNode;
}) => {
    const [activeFramework] = useActiveFramework();

    if (activeFramework === props.framework) {
        return props.children;
    }

    return null;
};
