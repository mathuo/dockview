import React from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import { themeConfig } from '../config/theme.config';
import ExampleFrame from '../components/ui/exampleFrame';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { DockviewTheme, themeAbyss } from 'dockview-react';
import styles from './demo.module.css';

const CODESANDBOX_URL =
    'https://codesandbox.io/s/github/mathuo/dockview/tree/master/packages/docs/sandboxes/react/dockview/demo-dockview';

const updateTheme = (theme: DockviewTheme) => {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('theme', theme.name);
    const newUrl = window.location.pathname + '?' + urlParams.toString();
    window.history.pushState({ path: newUrl }, '', newUrl);
};

const DemoPage: React.FC = () => {
    const [theme, setTheme] = React.useState<DockviewTheme>(themeAbyss);
    const [showSettings, setShowSettings] = React.useState(false);
    const [showThemeBuilder, setShowThemeBuilder] = React.useState(false);

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
            <div className={styles.header}>
                <a href="/" className={styles.backLink}>
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M19 12H5M12 5l-7 7 7 7" />
                    </svg>
                    dockview.dev
                </a>
                <div className={styles.spacer} />
                <div className={styles.tip}>
                    <span className={styles.kbd}>Shift</span>
                    <span>+ click a tab to float it</span>
                </div>
                <div className={styles.spacer} />
                <a
                    href={CODESANDBOX_URL}
                    target="_blank"
                    rel="noopener"
                    className={styles.iconButton}
                    title="Open in CodeSandbox"
                >
                    <svg
                        height="16"
                        width="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path d="M2 6l10-6 10 6v12l-10 6L2 18V6zm2 1.5v9l8 4.8 8-4.8v-9L12 3.2 4 7.5z" />
                    </svg>
                </a>
                <div className={styles.divider} />
                <ThemeSelector
                    value={theme.name}
                    options={themeConfig.map((t) => ({
                        value: t.id.name,
                        label: t.label,
                    }))}
                    onChanged={(value) => {
                        const newTheme =
                            themeConfig.find((theme) => theme.id.name === value)
                                ?.id ?? themeAbyss;
                        setTheme(newTheme);
                        updateTheme(newTheme);
                    }}
                />
                <div className={styles.divider} />
                <button
                    className={styles.iconButton}
                    title="Theme Builder"
                    onClick={() => setShowThemeBuilder(true)}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle
                            cx="13.5"
                            cy="6.5"
                            r=".5"
                            fill="currentColor"
                            stroke="none"
                        />
                        <circle
                            cx="17.5"
                            cy="10.5"
                            r=".5"
                            fill="currentColor"
                            stroke="none"
                        />
                        <circle
                            cx="8.5"
                            cy="7.5"
                            r=".5"
                            fill="currentColor"
                            stroke="none"
                        />
                        <circle
                            cx="6.5"
                            cy="12.5"
                            r=".5"
                            fill="currentColor"
                            stroke="none"
                        />
                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                    </svg>
                </button>
                <button
                    className={styles.iconButton}
                    title="Controls"
                    onClick={() => setShowSettings(true)}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="4" y1="6" x2="20" y2="6" />
                        <line x1="4" y1="12" x2="20" y2="12" />
                        <line x1="4" y1="18" x2="20" y2="18" />
                        <circle
                            cx="9"
                            cy="6"
                            r="2"
                            fill="currentColor"
                            stroke="none"
                        />
                        <circle
                            cx="15"
                            cy="12"
                            r="2"
                            fill="currentColor"
                            stroke="none"
                        />
                        <circle
                            cx="9"
                            cy="18"
                            r="2"
                            fill="currentColor"
                            stroke="none"
                        />
                    </svg>
                </button>
            </div>
            <ExampleFrame
                theme={theme}
                framework="react"
                height="100%"
                id="dockview/demo-dockview"
                extraProps={{
                    showSettings,
                    onCloseSettings: () => setShowSettings(false),
                    showThemeBuilder,
                    onCloseThemeBuilder: () => setShowThemeBuilder(false),
                    onChangeTheme: (t: DockviewTheme) => {
                        setTheme(t);
                        updateTheme(t);
                    },
                }}
            />
        </>
    );
};

export default function Demo() {
    return (
        <Layout noFooter={true}>
            <Head>
                <style>{'.navbar { display: none !important; }'}</style>
            </Head>
            <div
                style={{
                    height: '100vh',
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <BrowserOnly>{() => <DemoPage />}</BrowserOnly>
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
    options: { value: string; label: string }[];
    value: string;
    onChanged: (value: string) => void;
}) => {
    const ref = React.useRef<HTMLDivElement>(null);
    const selectedLabel =
        props.options.find((o) => o.value === props.value)?.label ??
        props.value;

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
                        {selectedLabel}
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
                                data-dropdown-menu-value={option.value}
                                onClick={() => props.onChanged(option.value)}
                                className="DropdownMenuItem"
                            >
                                <div className="framework-menu-item">
                                    <span>{option.label}</span>
                                    <span>
                                        {option.value === props.value
                                            ? '✓'
                                            : ''}
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
