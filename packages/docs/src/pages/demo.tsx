import React from 'react';
import Layout from '@theme/Layout';
import DemoApp from '@site/sandboxes/demo-dockview/src/app';
import { themeConfig } from '../config/theme.config';

export default function Popout() {
    const [theme, setTheme] = React.useState<string>(
        new URLSearchParams(location.search).get('theme') ?? themeConfig[0].id
    );

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
                <div
                    style={{
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <select
                        onChange={(event) => {
                            const url = new URL(window.location.href);
                            url.searchParams.set('theme', event.target.value);
                            window.location.href = url.toString();
                        }}
                        value={theme}
                    >
                        {themeConfig.map((theme) => {
                            return <option>{theme.id}</option>;
                        })}
                    </select>
                </div>
                <div
                    style={{
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <DemoApp theme={theme} />
                </div>
            </div>
        </Layout>
    );
}
