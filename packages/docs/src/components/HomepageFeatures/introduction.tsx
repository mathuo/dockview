import useBaseUrl from '@docusaurus/useBaseUrl';
import HomepageFeatures from '.';
import { BrowserHeader } from '../ui/browserHeader';
import { MultiFrameworkContainer } from '../ui/container';
import * as React from 'react';
import DockviewDemo2 from '@site/sandboxes/dockview-app/src/app';

export const Introduction = () => {
    return (
        <>
            <HomepageFeatures />
            <div
                id="live-demo"
                style={{
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '1.5em',
                    fontWeight: 'bold',
                }}
            >
                <img src={useBaseUrl('/img/dockview_logo.svg')} height={30} />
                <span style={{ paddingLeft: '8px' }}>Dockview Live Demos</span>
            </div>
            <div style={{ padding: '20px' }}>
                <BrowserHeader />
            </div>
            <div style={{ padding: '20px' }}>
                <BrowserHeader />
                <MultiFrameworkContainer
                    height={500}
                    react={DockviewDemo2}
                    sandboxId="dockview-app"
                />
            </div>
        </>
    );
};
