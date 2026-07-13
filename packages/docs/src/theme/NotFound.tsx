import React from 'react';
import { translate } from '@docusaurus/Translate';
import { PageMetadata } from '@docusaurus/theme-common';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import './NotFound.scss';

function NotFoundContent() {
    return (
        <main className="nf-main">
            <p className="nf-code">404</p>
            <h1 className="nf-title">Page not found</h1>
            <p className="nf-subtitle">
                The page you're looking for doesn't exist or has moved.
            </p>
            <div className="nf-actions">
                <Link to="/" className="button button--primary">
                    Back to home
                </Link>
                <Link
                    to="/docs/overview/introduction"
                    className="button button--secondary"
                >
                    Read the docs
                </Link>
            </div>
        </main>
    );
}

export default function NotFound(): JSX.Element {
    const title = translate({
        id: 'theme.NotFound.title',
        message: 'Page not found',
    });
    return (
        <>
            <PageMetadata title={title} />
            <Layout>
                <NotFoundContent />
            </Layout>
        </>
    );
}
