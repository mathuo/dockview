import React from 'react';
import Layout from '@theme/Layout';
import { themeConfig } from '../config/theme.config';
import ExampleFrame from '../components/ui/exampleFrame';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { DockviewTheme, themeAbyss } from 'dockview';

const updateTheme = (theme: DockviewTheme) => {
    const urlParams = new URLSearchParams(window.location.search);

    urlParams.set('theme', theme.name);

    const newUrl = window.location.pathname + '?' + urlParams.toString();

    window.history.pushState({ path: newUrl }, '', newUrl);
};

const ThemeToggle: React.FC = () => {
    const [theme, setTheme] = React.useState<DockviewTheme>(themeAbyss);

    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const themeName = urlParams.get('theme');
        const newTheme =
            themeConfig.find((c) => c.id.name === themeName)?.id ?? themeAbyss;
        setTheme(newTheme);
        updateTheme(newTheme);
    }, []);

    return (
        <>
            <div
                style={{
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0px 15px',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                        style={{
                            paddingRight: 8,
                            color: 'var(--ifm-color-primary)',
                            fontSize: '0.9em',
                        }}
                    >
                        {'Theme: '}
                    </div>
                    <ThemeSelector
                        value={theme.name}
                        options={themeConfig.map((theme) => theme.id.name)}
                        onChanged={(value) => {
                            const theme =
                                themeConfig.find(
                                    (theme) => theme.id.name === value
                                )?.id ?? themeAbyss;
                            setTheme(theme);
                            updateTheme(theme);
                        }}
                    />
                </div>
                {/* <select
                    onChange={(event) => {
                        const theme = themeConfig.find(
                            (theme) => theme.id.name === event.target.value
                        ).id;
                        setTheme(theme);
                        updateTheme(theme);
                    }}
                    value={theme.name}
                >
                    {themeConfig.map((theme) => {
                        return (
                            <option key={theme.id.name}>{theme.id.name}</option>
                        );
                    })}
                </select> */}
            </div>
            <ExampleFrame
                theme={theme}
                framework="react"
                height="100%"
                id="dockview/demo-dockview"
            />
        </>
    );
};

export default function Popout() {
    return (
        <Layout noFooter={true}>
            <div
                style={{
                    height: 'calc(100% - var(--ifm-navbar-height))',
                    flexGrow: 1,
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <BrowserOnly>{() => <ThemeToggle />}</BrowserOnly>
            </div>
        </Layout>
    );
}

import {
    DropdownMenu,
    DropdownMenuItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';

const ThemeSelector = (props: {
    options: string[];
    value: string;
    onChanged: (value: string) => void;
}) => {
    const ref = React.useRef<HTMLDivElement>(null);

    return (
        <div ref={ref}>
            <DropdownMenu
                onOpenChange={(open) => {
                    if (!open) {
                        return;
                    }

                    if (!ref.current) {
                        return;
                    }

                    requestAnimationFrame(() => {
                        const el = ref.current!.querySelector(
                            `[data-dropdown-menu-value="${props.value}"]`
                        );
                        if (el) {
                            (el as HTMLElement).focus();
                        }
                    });
                }}
            >
                <DropdownMenuTrigger asChild={true}>
                    <div className="framework-menu-item-select">
                        {props.value}
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    side="bottom"
                    align="end"
                    sideOffset={10}
                    className="DropdownMenuContent"
                >
                    {props.options.map((option) => {
                        return (
                            <DropdownMenuItem
                                data-dropdown-menu-value={option}
                                onClick={() => props.onChanged(option)}
                                className="DropdownMenuItem"
                            >
                                <div className="framework-menu-item">
                                    <span>{option}</span>
                                    <span>
                                        {option === props.value ? '✓' : ''}
                                    </span>
                                </div>
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};
