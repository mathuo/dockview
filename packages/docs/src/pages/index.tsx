import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './index.module.css';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import useBaseUrl from '@docusaurus/useBaseUrl';
import DockviewDemo from '@site/sandboxes/demo-dockview/src/app';
import DockviewDemo2 from '@site/sandboxes/dockview-app/src/app';
import { MultiFrameworkContainer } from '../components/ui/container';
import { BrowserHeader } from '../components/ui/browserHeader';
import './index.scss';
import { Introduction } from '../components/HomepageFeatures/introduction';

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
            <div className="container homepage">
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
                    <Link
                        className="button button--secondary button--lg"
                        to={'#live-demo'}
                    >
                        Live Demo
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
            title={`${siteConfig.tagline}`}
            description={`${siteConfig.description}`}
        >
            <HomepageHeader2 />
            <main className="container">
                <Introduction />
            </main>
        </Layout>
    );
}
