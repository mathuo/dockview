import BrowserOnly from '@docusaurus/BrowserOnly';
import { DockviewEmitter } from 'dockview';
import * as React from 'react';
import { IS_PROD } from '../flags';

const frameworks = [
    { value: 'JavaScript', label: 'JavaScript' },
    { value: 'React', label: 'React' },
    { value: 'Angular', label: 'Angular' },
];

const activeFrameworkGlobal = new DockviewEmitter<string>({ replay: true });

export function useActiveFramework(): [string, (value: string) => void] {
    const [value, setValue] = React.useState<string>(
        localStorage.getItem('dv-docs-framework') ?? frameworks[0].value
    );

    React.useEffect(() => {
        const disposable = activeFrameworkGlobal.event((value) => [
            setValue(value),
        ]);

        activeFrameworkGlobal.fire(
            localStorage.getItem('dv-docs-framework') ?? frameworks[0].value
        );

        return () => {
            disposable.dispose();
        };
    }, []);

    const setter = React.useCallback((value: string) => {
        localStorage.setItem('dv-docs-framework', value);
        setValue(value);
        activeFrameworkGlobal.fire(value);
    }, []);

    return [IS_PROD ? frameworks[1].value : value, setter];
}

const FrameworkSelector1 = () => {
    const [activeFramework, setActiveFramework] = useActiveFramework();

    const onChange = (event: React.ChangeEvent<HTMLSelectElement>) => [
        setActiveFramework(event.target.value),
    ];

    if (IS_PROD) {
        return null;
    }

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

export const FrameworkSelector = () => {
    return <BrowserOnly>{() => <FrameworkSelector1 />}</BrowserOnly>;
};

const FrameworkSpecific1 = (props: {
    framework: string;
    children: React.ReactNode;
}) => {
    const [activeFramework] = useActiveFramework();

    if (activeFramework === props.framework) {
        return props.children;
    }

    return null;
};

export const FrameworkSpecific = (props: {
    framework: string;
    children: React.ReactNode;
}) => {
    return <BrowserOnly>{() => <FrameworkSpecific1 {...props} />}</BrowserOnly>;
};
