import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { Introduction } from '../components/HomepageFeatures/introduction';
import styles from './index.module.css';
import './index.scss';

import Splashscreen from '@site/static/img/splashscreen.svg';

function HomepageHeader2() {
    const { siteConfig } = useDocusaurusContext();
    return (
        <header className={clsx('hero hero--primary', styles.heroBanner)}>
            <div className="container homepage">
                <img src={useBaseUrl('/img/dockview_logo.svg')} />
                <h1 className="hero__title">{siteConfig.title}</h1>

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
        <Layout title={`${siteConfig.tagline}`}>
            <div
                style={{
                    paddingTop: '100px',
                    paddingBottom: '50px',
                    display: 'flex',
                    justifyContent: 'center',
                }}
            >
                <div className="intro-container">
                    <div>
                        <h1>Fully Featured Docking Layout Manager</h1>
                        <h3>
                            Zero dependency layout managment and docking
                            controls
                        </h3>
                    </div>
                    <img
                        // style={{ maxWidth: '800px' }}
                        src={useBaseUrl('/img/Animation.gif')}
                    />
                </div>
            </div>

            {/* <HomepageHeader2 /> */}

            <main className="container">
                <Introduction />
            </main>
        </Layout>
    );
}

const featureList = [
    'Popout Windows',
    'Floating Windows',
    'Custom Header Actions',
    'Serialization',
    'Themable',
    'Drag And Drop',
];
