import React from 'react';
import Layout from '@theme/Layout';

export default function ContactUs(): JSX.Element {
    return (
        <Layout
            title="Contact us"
            description="Get in touch with the Dockview team."
        >
            <main>
                <div
                    style={{
                        maxWidth: 600,
                        margin: '80px auto',
                        padding: '0 24px',
                        minHeight: '60vh',
                    }}
                >
                    <h1>Contact us</h1>
                    <p style={{ color: 'var(--ifm-color-content-secondary)' }}>
                        For enquiries, please email us at{' '}
                        <a href="mailto:contact@dockview.dev">
                            contact@dockview.dev
                        </a>
                        .
                    </p>
                </div>
            </main>
        </Layout>
    );
}
