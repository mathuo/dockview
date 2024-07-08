import BrowserOnly from '@docusaurus/BrowserOnly';
import { DockviewEmitter } from 'dockview';
import * as React from 'react';
import './frameworkSpecific.css';

export interface FrameworkDescriptor {
    value: string;
    label: string;
    icon: string;
}

const frameworks: FrameworkDescriptor[] = [
    // { value: 'JavaScript', label: 'JavaScript', icon: 'img/js-icon.svg' },
    { value: 'React', label: 'React', icon: 'img/react-icon.svg' },
    { value: 'Vue', label: 'Vue', icon: 'img/vue-icon.svg' },
    // { value: 'Angular', label: 'Angular' },
];

const activeFrameworkGlobal = new DockviewEmitter<string>({ replay: true });

export function useActiveFramework(): [
    FrameworkDescriptor,
    (value: string) => void
] {
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

    const option = frameworks.find((_) => _.value === value);

    return [option, setter];
}

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import useBaseUrl from '@docusaurus/useBaseUrl';

const FrameworkSelector1 = () => {
    const [activeFramework, setActiveFramework] = useActiveFramework();

    const onChange = (event: React.ChangeEvent<HTMLSelectElement>) => [
        setActiveFramework(event.target.value),
    ];

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild={true}>
                <div className="framework-menu-item-select">
                    <span style={{ padding: '0px 8px' }}>
                        {activeFramework.label}
                    </span>
                    <img
                        width={20}
                        height={20}
                        src={useBaseUrl(activeFramework.icon)}
                        style={{ marginRight: '8px' }}
                    />
                </div>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
                side="bottom"
                align="end"
                sideOffset={10}
                className="DropdownMenuContent"
            >
                {frameworks.map((framework) => {
                    return (
                        <DropdownMenu.Item
                            onClick={() => setActiveFramework(framework.label)}
                            className="DropdownMenuItem"
                        >
                            <div className="framework-menu-item">
                                <span style={{ paddingRight: '8px' }}>
                                    {framework.label}
                                </span>
                                <img
                                    width={20}
                                    height={20}
                                    src={useBaseUrl(framework.icon)}
                                />
                            </div>
                        </DropdownMenu.Item>
                    );
                })}
            </DropdownMenu.Content>
        </DropdownMenu.Root>
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

    if (activeFramework.value === props.framework) {
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
