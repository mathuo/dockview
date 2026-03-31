import React from 'react';
import Layout from '@theme/Layout';
import { FeatureTable } from '@site/src/components/ui/FeatureTable';
import Head from '@docusaurus/Head';

export default function FeaturesPage(): JSX.Element {
  return (
    <Layout
      title="Features"
      description="A comprehensive list of features provided by Dockview including tab management, drag and drop, serialization, and multi-framework support."
      noFooter
    >
      <Head>
        <title>Features | Dockview</title>
      </Head>
      <main className="container margin-vert--lg">
        <div className="row">
          <div className="col col--10 col--offset-1">
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Features</h1>
            <p style={{ fontSize: '1.5rem', color: 'var(--dv-docs-markdown-text-color)', marginBottom: '2rem' }}>
              Dockview is a zero-dependency, feature-rich layout manager for building complex, IDE-like interfaces in the browser.
            </p>
            <FeatureTable />
          </div>
        </div>
      </main>
    </Layout>
  );
}
