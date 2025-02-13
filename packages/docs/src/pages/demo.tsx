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
                }}
            >
                <select
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
                </select>
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
