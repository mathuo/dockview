import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './index.module.css';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import { DockviewDemo } from '../components/dockview/demo';
import useBaseUrl from '@docusaurus/useBaseUrl';
import './index.scss';
import { DockviewDemo2 } from '../components/dockview/demo2';

function HomepageHeader() {
    const { siteConfig } = useDocusaurusContext();
    return (
        <header className={clsx('hero hero--primary', styles.heroBanner)}>
            <div className="container">
                <h1 className="hero__title">{siteConfig.title}</h1>
                <p className="hero__subtitle">{siteConfig.tagline}</p>
                <div className={styles.buttons}>
                    <Link
                        className="button button--secondary button--lg"
                        to={useBaseUrl('docs/')}
                    >
                        Get Started
                    </Link>
                </div>
            </div>
        </header>
    );
}

function HomepageHeader2() {
    const { siteConfig } = useDocusaurusContext();
    return (
        <header className={clsx('hero hero--primary', styles.heroBanner)}>
            <div className="container">
                <img src={useBaseUrl('/img/dockview_logo.svg')} />
                <h1 className="hero__title">{siteConfig.title}</h1>
                {/* <div className="badge-container">
                            <img src="https://badge.fury.io/js/dockview.svg" />
                            <img src="https://github.com/mathuo/dockview/workflows/CI/badge.svg" />
                            <img src="https://sonarcloud.io/api/project_badges/measure?project=mathuo_dockview&metric=coverage" />
                            <img src="https://sonarcloud.io/api/project_badges/measure?project=mathuo_dockview&metric=alert_status" />
                        </div> */}
                <p className="hero__subtitle">{siteConfig.tagline}</p>
                <div className={styles.buttons}>
                    <Link
                        className="button button--secondary button--lg"
                        to={useBaseUrl('docs/')}
                    >
                        Get Started
                    </Link>
                </div>
            </div>
        </header>
    );
}

export default function Home(): JSX.Element {
    const { siteConfig } = useDocusaurusContext();
    return (
        <Layout
            title={`${siteConfig.title}`}
            description="A zero dependency layout mananger for React."
        >
            <HomepageHeader2 />
            <main className="container">
                <HomepageFeatures />
                <DockviewDemo />
                <DockviewDemo2 />
            </main>
        </Layout>
    );
}
