import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

type FeatureItem = {
    title: string;
    Svg: React.ComponentType<React.ComponentProps<'svg'>>;
    description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
    {
        title: '',
        Svg: require('@site/static/img/dockview_grid_3.svg').default,
        description: (
            <>
                <div className="feature-banner">
                    <h3 className="feature-banner-header">
                        Serializable Layouts
                    </h3>
                    <p className="feature-banner-content">
                        Add and remove panels using the provided api or use the
                        serialziation methods to persist layouts.
                    </p>
                </div>
                <div className="feature-banner">
                    <h3 className="feature-banner-header">
                        Customizable Theme
                    </h3>
                    <p className="feature-banner-content">
                        Adjust a number of provided CSS Properties for a simple
                        change or target specific classes for a more customized
                        approach.
                    </p>
                </div>
                <div className="feature-banner">
                    <h3 className="feature-banner-header">
                        Choose Your Control
                    </h3>
                    <p className="feature-banner-content">
                        Choose from a simple splitview, gridview, collapsable
                        panes or a full docking solution. Combine multiple for
                        complex layouts.
                    </p>
                </div>
            </>
        ),
    },
    {
        title: '',
        Svg: require('@site/static/img/dockview_grid_4.svg').default,
        description: (
            <>
                <div className="feature-banner">
                    <h3 className="feature-banner-header">
                        Rich Feature Control
                    </h3>
                    <p className="feature-banner-content">
                        Customize header features to add additional icons and
                        more as well as custom tab rendering.
                    </p>
                </div>
                <div className="feature-banner">
                    <h3 className="feature-banner-header">
                        Floating Group Support
                    </h3>
                    <p className="feature-banner-content">
                        Built-in support for floating groups with a supporting
                        api for progmatic control.
                    </p>
                </div>
                <div className="feature-banner">
                    <h3 className="feature-banner-header">Drag And Drop</h3>
                    <p className="feature-banner-content">
                        Drag and Drop tab to position your layout as well as
                        interacting with external drag events.
                    </p>
                </div>
            </>
        ),
    },
    {
        title: '',
        Svg: require('@site/static/img/dockview_splash_2.svg').default,
        description: (
            <>
                <div className="feature-banner">
                    <h3 className="feature-banner-header">Zero Dependencies</h3>
                    <p className="feature-banner-content">
                        Zero dependencies, that's all.
                    </p>
                </div>
                <div className="feature-banner">
                    <h3 className="feature-banner-header">
                        Code Quality and Transparency
                    </h3>
                    <p className="feature-banner-content">
                        All of the code is run through Sonarcloud Code Analysis,
                        which along with the source code and high test coverage
                        can be viewed from the Github page.
                    </p>
                </div>
                <div className="feature-banner">
                    <h3 className="feature-banner-header">
                        React or Vanilla TypeScript
                    </h3>
                    <p className="feature-banner-content">
                        Exposes native support for both ReactJS components and
                        Vanilla TypeScript.
                    </p>
                </div>
            </>
        ),
    },
];

function Feature({ title, Svg, description }: FeatureItem) {
    return (
        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                margin: 'auto',
                justifyContent: 'center',
            }}
            className="dockview-feature"
        >
            <Svg className={styles.featureSvg} role="img" />
            <div style={{ maxWidth: '400px', padding: '0px 20px' }}>
                <h3>{title}</h3>
                {description}
            </div>
        </div>
    );
}

export default function HomepageFeatures(): JSX.Element {
    return (
        <section className={styles.features}>
            <div className="container">
                <div className="row">
                    {FeatureList.map((props, idx) => (
                        <Feature key={idx} {...props} />
                    ))}
                </div>
            </div>
        </section>
    );
}
