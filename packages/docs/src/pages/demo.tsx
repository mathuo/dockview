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

// `variant` is locked at mount so rotating mid-session doesn't yank the
// layout out from under the visitor. `?variant=mobile|desktop` forces.
const resolveVariant = (): 'mobile' | 'desktop' => {
    const params = new URLSearchParams(window.location.search);
    const override = params.get('variant');
    if (override === 'mobile' || override === 'desktop') {
        return override;
    }
    return window.matchMedia('(max-width: 600px)').matches
        ? 'mobile'
        : 'desktop';
};

const DemoPage: React.FC = () => {
    const [theme, setTheme] = React.useState<DockviewTheme>(themeAbyss);
    const [showSidebar, setShowSidebar] = React.useState(false);
    const variant = React.useMemo(resolveVariant, []);

    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const themeName = urlParams.get('theme');
        const newTheme =
            themeConfig.find((c) => c.id.name === themeName)?.id ?? themeAbyss;
        setTheme(newTheme);
        updateTheme(newTheme);
    }, []);

    if (variant === 'mobile') {
        return (
            <MobileDemo
                theme={theme}
                onChangeTheme={(t) => {
                    setTheme(t);
                    updateTheme(t);
                }}
            />
        );
    }

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
                <button
                    type="button"
                    className={styles.iconButton}
                    title="View mobile demo"
                    aria-label="View mobile demo"
                    onClick={switchToMobileVariant}
                >
                    <svg
                        height="16"
                        width="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect x="7" y="2" width="10" height="20" rx="2" />
                        <path d="M11 18h2" />
                    </svg>
                </button>
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
                    className={`${styles.toggleButton} ${
                        showSidebar ? styles.toggleButtonActive : ''
                    }`}
                    title={showSidebar ? 'Close sidebar' : 'Open sidebar'}
                    aria-pressed={showSidebar}
                    onClick={() => setShowSidebar((v) => !v)}
                >
                    Controls & Theme
                </button>
            </div>
            <ExampleFrame
                theme={theme}
                framework="react"
                height="100%"
                id="dockview/demo-dockview"
                extraProps={{
                    showSidebar,
                    onCloseSidebar: () => setShowSidebar(false),
                    onChangeTheme: (t: DockviewTheme) => {
                        setTheme(t);
                        updateTheme(t);
                    },
                }}
            />
        </>
    );
};

const MobileDemo: React.FC<{
    theme: DockviewTheme;
    onChangeTheme: (theme: DockviewTheme) => void;
}> = ({ theme, onChangeTheme }) => {
    const [sheetOpen, setSheetOpen] = React.useState(false);

    return (
        <>
            <div className={styles.mobileHeader}>
                <a
                    href="/"
                    className={styles.mobileButton}
                    aria-label="Back to dockview.dev"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M19 12H5M12 5l-7 7 7 7" />
                    </svg>
                </a>
                <div className={styles.mobileTip}>
                    Long-press a tab, then drag
                </div>
                <button
                    type="button"
                    className={styles.mobileButton}
                    onClick={switchToDesktopVariant}
                    aria-label="View desktop demo"
                    title="View desktop demo"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <rect x="2" y="4" width="20" height="13" rx="2" />
                        <path d="M8 21h8M12 17v4" />
                    </svg>
                </button>
                <button
                    type="button"
                    className={styles.mobileButton}
                    onClick={() => setSheetOpen(true)}
                    aria-label="Change theme"
                    title="Change theme"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 3a9 9 0 0 0 0 18 6 6 0 1 1 0-12 3 3 0 1 1 0-6z" />
                    </svg>
                </button>
            </div>
            <ExampleFrame
                theme={theme}
                framework="react"
                height="100%"
                id="dockview/demo-dockview-mobile"
            />
            {sheetOpen && (
                <ThemeBottomSheet
                    activeTheme={theme}
                    onSelect={(t) => {
                        onChangeTheme(t);
                        setSheetOpen(false);
                    }}
                    onClose={() => setSheetOpen(false)}
                />
            )}
        </>
    );
};

const switchToDesktopVariant = () => {
    // Preserve the current theme so the visitor sees the same look in the
    // desktop variant they chose on mobile. Reload because `variant` is
    // locked at mount.
    const params = new URLSearchParams(window.location.search);
    params.set('variant', 'desktop');
    window.location.search = params.toString();
};

const switchToMobileVariant = () => {
    const params = new URLSearchParams(window.location.search);
    params.set('variant', 'mobile');
    window.location.search = params.toString();
};

const ThemeBottomSheet: React.FC<{
    activeTheme: DockviewTheme;
    onSelect: (theme: DockviewTheme) => void;
    onClose: () => void;
}> = ({ activeTheme, onSelect, onClose }) => {
    // Close on escape so non-touch testers can dismiss without tapping
    // the backdrop.
    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <>
            <div
                className={styles.sheetBackdrop}
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                className={styles.sheet}
                role="dialog"
                aria-label="Choose theme"
            >
                <div className={styles.sheetGrabber} />
                <div className={styles.sheetTitle}>Theme</div>
                {themeConfig.map((t) => {
                    const active = t.id.name === activeTheme.name;
                    return (
                        <button
                            key={t.id.name}
                            type="button"
                            className={`${styles.sheetItem} ${
                                active ? styles.sheetItemActive : ''
                            }`}
                            onClick={() => onSelect(t.id)}
                        >
                            <span>{t.label}</span>
                            {active && <span>✓</span>}
                        </button>
                    );
                })}
            </div>
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
