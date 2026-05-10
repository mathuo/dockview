import React from 'react';
import Layout from '@theme/Layout';

function NewsletterEmbed() {
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://dockview.kit.com/35a816915c/index.js';
        script.async = true;
        script.setAttribute('data-uid', '35a816915c');
        containerRef.current?.appendChild(script);
        return () => {
            containerRef.current?.removeChild(script);
        };
    }, []);

    return <div ref={containerRef} />;
}

export default function Newsletter(): JSX.Element {
    return (
        <Layout
            title="Newsletter"
            description="Subscribe to the Dockview newsletter for updates, releases, and tips."
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
                    <h1>Newsletter</h1>
                    <p style={{ color: 'var(--ifm-color-content-secondary)' }}>
                        Sign up for updates related to the Dockview project.
                    </p>
                    <NewsletterEmbed />
                    <p style={{ fontSize: '0.8rem', color: 'var(--ifm-color-content-secondary)', marginTop: '1rem' }}>
                        We do not share or sell your email address.
                    </p>
                </div>
            </main>
        </Layout>
    );
}
