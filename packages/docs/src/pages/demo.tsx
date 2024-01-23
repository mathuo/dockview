import React from 'react';
import Layout from '@theme/Layout';
import DemoApp from '@site/sandboxes/demo-dockview/src/app';

export default function Popout() {
    return (
        <Layout>
            <div
                style={{
                    height: '1000px',
                    flexGrow: 1,
                    overflow: 'hidden',
                    padding: '20px',
                }}
            >
                <DemoApp />
            </div>
        </Layout>
    );
}
