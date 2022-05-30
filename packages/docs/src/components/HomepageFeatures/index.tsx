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
        Svg: require('@site/static/img/dockview_grid_2.svg').default,
        description: (
            <>
                <div className="feature-banner">
                    <h3 className="feature-banner-header">
                        Serialziable layouts
                    </h3>
                    <p className="feature-banner-content">
                        Add and remove panels using the provided api or use our
                        serialization method to persist layouts
                    </p>
                </div>
                <div className="feature-banner">
                    <h3 className="feature-banner-header">
                        Customizable Theme
                    </h3>
                    <p className="feature-banner-content">
                        Overide a number of provided CSS Properties for a simple
                        change or target specific classes for a more customized
                        approach
                    </p>
                </div>
                <div className="feature-banner">
                    <h3 className="feature-banner-header">
                        Variety of Controls
                    </h3>
                    <p className="feature-banner-content">
                        Whether you want a simple splitview or a complete
                        docking solution dockview has you covered
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
                    <h3 className="feature-banner-header">Drag and Drop</h3>
                    <p className="feature-banner-content">
                        Supports a variety of drag and drop functionailties as
                        well as providing the developer with an ability to
                        interact with drag events
                    </p>
                </div>
                <div className="feature-banner">
                    <h3 className="feature-banner-header">Zero Dependencies</h3>
                    <p className="feature-banner-content">
                        Zero dependencies, that's all
                    </p>
                </div>
                <div className="feature-banner">
                    <h3 className="feature-banner-header">
                        Code Quality and Transparency
                    </h3>
                    <p className="feature-banner-content">
                        All our code is run through Sonarcloud Code Analyis
                        which along with our source code and high test coverage
                        can be viewed from our Github page
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
            <div style={{ maxWidth: '400px', paddingLeft: '20px' }}>
                <h3>{title}</h3>
                <p>{description}</p>
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
