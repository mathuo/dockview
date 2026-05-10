import BrowserOnly from '@docusaurus/BrowserOnly';
import * as React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import useBaseUrl from '@docusaurus/useBaseUrl';
import './frameworkSpecific.css';

export interface FrameworkDescriptor {
    value: string;
    label: string;
    icon: string;
}

const frameworks: FrameworkDescriptor[] = [
    { value: 'JavaScript', label: 'JavaScript', icon: 'img/js-icon.svg' },
    { value: 'React', label: 'React', icon: 'img/react-icon.svg' },
    { value: 'Vue', label: 'Vue', icon: 'img/vue-icon.svg' },
    { value: 'Angular', label: 'Angular', icon: 'img/angular-icon.svg' },
];

const STORAGE_KEY = 'dv-docs-framework';
const FRAMEWORK_EVENT = 'dv-framework-change';

function readFramework(): string {
    return localStorage.getItem(STORAGE_KEY) ?? frameworks[0].value;
}

function subscribe(callback: () => void): () => void {
    window.addEventListener(FRAMEWORK_EVENT, callback);
    window.addEventListener('storage', callback);
    return () => {
        window.removeEventListener(FRAMEWORK_EVENT, callback);
        window.removeEventListener('storage', callback);
    };
}

export function useActiveFramework(): [
    FrameworkDescriptor,
    (value: string) => void
] {
    const value = React.useSyncExternalStore(
        subscribe,
        readFramework,
        () => frameworks[0].value
    );

    const setter = React.useCallback((newValue: string) => {
        localStorage.setItem(STORAGE_KEY, newValue);
        window.dispatchEvent(new CustomEvent(FRAMEWORK_EVENT));

        const url = new URL(window.location.href);
        url.searchParams.set('framework', newValue.toLowerCase());
        window.history.replaceState(null, '', url.toString());
    }, []);

    React.useEffect(() => {
        const urlParam = new URLSearchParams(window.location.search).get('framework');
        const fromUrl = urlParam
            ? frameworks.find((f) => f.value.toLowerCase() === urlParam.toLowerCase())
            : null;
        if (fromUrl) {
            setter(fromUrl.value);
        }
    }, []);

    const option = frameworks.find((f) => f.value === value) ?? frameworks[0];

    return [option, setter];
}



const ChevronDown = () => (
    <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.7, flexShrink: 0 }}
    >
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

const FrameworkSelector1 = () => {
    const [activeFramework, setActiveFramework] = useActiveFramework();

    return (
        <DropdownMenu.Root>
            <div className="framework-selector-wrapper">
                <span className="framework-selector-label">Framework</span>
                <DropdownMenu.Trigger asChild={true}>
                    <div className="framework-menu-item-select">
                        <img
                            width={16}
                            height={16}
                            src={useBaseUrl(activeFramework.icon)}
                        />
                        <span>{activeFramework.label}</span>
                        <ChevronDown />
                    </div>
                </DropdownMenu.Trigger>
            </div>
            <DropdownMenu.Content
                side="bottom"
                align="end"
                sideOffset={8}
                className="DropdownMenuContent"
            >
                {frameworks.map((framework) => {
                    return (
                        <DropdownMenu.Item
                            key={framework.value}
                            onClick={() => setActiveFramework(framework.value)}
                            className="DropdownMenuItem"
                        >
                            <div className="framework-menu-item">
                                <img
                                    width={16}
                                    height={16}
                                    src={useBaseUrl(framework.icon)}
                                />
                                <span>{framework.label}</span>
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
