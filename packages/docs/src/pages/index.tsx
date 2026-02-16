import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { Introduction } from '../components/HomepageFeatures/introduction';
import styles from './index.module.css';
import './index.scss';

export default function Home(): JSX.Element {
    const { siteConfig } = useDocusaurusContext();
    return (
        <Layout
            title={`${siteConfig.tagline}`}
            description="Dockview is a zero dependency docking layout manager for building IDE-like interfaces with tabs, groups, grids, splitviews, drag and drop, floating panels, and popout windows. Supports React, Vue, Angular, and vanilla TypeScript."
        >
            <div className="home-page">
                <main>
                    <div className="container">
                        <div className="splashscreen">
                            <div className="splashscreen-title">
                                <h1>Fully Featured Docking Layout Manager</h1>
                                <h2>
                                    Zero dependency layout management and docking
                                    controls
                                </h2>
                            </div>
                            <div className="splashscreen-video">
                                <img src={useBaseUrl('/img/Animation.gif')} />
                                <Link to="/demo">
                                    <button>Go To Live Demo</button>
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div
                        style={{
                            backgroundColor: '#020c18',
                            padding: '20px 0px',
                        }}
                    >
                        <div className="container"></div>
                    </div>
                    <div className="container">
                        <Introduction />
                    </div>
                </main>
            </div>
        </Layout>
    );
}
