import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import './index.scss';

// ─── Animated framework name ──────────────────────────────────────────────────

const FRAMEWORKS: { label: string; color: string }[] = [
    { label: 'React', color: '#61dafb' },
    { label: 'Vue', color: '#42b883' },
    { label: 'Angular', color: '#dd0031' },
    { label: 'JavaScript', color: '#f7df1e' },
];

const FRAMEWORK_LINKS: { label: string; icon: string; param: string }[] = [
    { label: 'React', icon: 'img/react-icon.svg', param: 'react' },
    { label: 'Vue', icon: 'img/vue-icon.svg', param: 'vue' },
    { label: 'Angular', icon: 'img/angular-icon.svg', param: 'angular' },
    { label: 'JavaScript', icon: 'img/js-icon.svg', param: 'javascript' },
];

// ─── Social proof stats ───────────────────────────────────────────────────────

const STATS: { value: string; label: string; href?: string }[] = [
    {
        value: '3.3k+',
        label: 'GitHub stars',
        href: 'https://github.com/mathuo/dockview',
    },
    {
        value: '540k+',
        label: 'monthly downloads',
        href: 'https://www.npmjs.com/package/dockview-core',
    },
    { value: '0', label: 'dependencies' },
    { value: '4', label: 'frameworks' },
];

function HeroStats() {
    return (
        <ul className="hero-stats">
            {STATS.map((stat) => {
                const inner = (
                    <>
                        <span className="hero-stat-value">{stat.value}</span>
                        <span className="hero-stat-label">{stat.label}</span>
                    </>
                );
                return (
                    <li key={stat.label} className="hero-stat">
                        {stat.href ? (
                            <a
                                href={stat.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hero-stat-link"
                            >
                                {inner}
                            </a>
                        ) : (
                            inner
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

function AnimatedFramework() {
    const [index, setIndex] = React.useState(0);

    React.useEffect(() => {
        const id = setInterval(
            () => setIndex((i) => (i + 1) % FRAMEWORKS.length),
            2200
        );
        return () => clearInterval(id);
    }, []);

    const { label, color } = FRAMEWORKS[index];

    return (
        <span key={index} className="hero-framework" style={{ color }}>
            {label}
        </span>
    );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconDnd = () => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="5 9 2 12 5 15" />
        <polyline points="9 5 12 2 15 5" />
        <polyline points="15 19 12 22 9 19" />
        <polyline points="19 9 22 12 19 15" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="12" y1="2" x2="12" y2="22" />
    </svg>
);

const IconFloat = () => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="16" />
        <line x1="10" y1="14" x2="14" y2="14" />
    </svg>
);

const IconPopout = () => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);

const IconSerialize = () => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
    </svg>
);

const IconZeroDeps = () => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M12 2l9 4.9V17L12 22l-9-4.9V7z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
);

const IconTheme = () => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
);

const IconTabGroups = () => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="3" y="6" width="6" height="3" rx="1" />
        <rect x="10" y="6" width="6" height="3" rx="1" />
        <rect x="3" y="12" width="13" height="8" rx="1" />
        <line x1="18" y1="6" x2="21" y2="6" />
        <line x1="18" y1="9" x2="21" y2="9" />
    </svg>
);

const IconEdgeGroups = () => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="8" x2="21" y2="8" />
        <line x1="8" y1="8" x2="8" y2="21" />
        <line x1="16" y1="8" x2="16" y2="21" />
    </svg>
);

const IconTouch = () => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M9 11V6a2 2 0 014 0v5" />
        <path d="M9 11V8a2 2 0 00-4 0v6a7 7 0 0014 0v-3a2 2 0 00-4 0" />
        <path d="M13 11V7a2 2 0 014 0v4" />
    </svg>
);

// ─── Feature cards ────────────────────────────────────────────────────────────

const FEATURES = [
    {
        icon: <IconDnd />,
        title: 'Drag & Drop',
        description:
            'Rearrange tabs and groups with built-in drag and drop. Dock panels to any edge, merge into existing groups, or snap to the layout border.',
    },
    {
        icon: <IconFloat />,
        title: 'Floating Panels',
        description:
            'Detach any group from the grid into a freely positioned floating overlay. Multiple floating groups are supported simultaneously.',
    },
    {
        icon: <IconPopout />,
        title: 'Popout Windows',
        description:
            'Move any group into a separate browser window. The group stays connected to the layout and can be moved back at any time.',
    },
    {
        icon: <IconSerialize />,
        title: 'Serialization',
        description:
            'Save and restore the full layout state with api.toJSON() and api.fromJSON(). Persist to local storage, a database, or anywhere else.',
    },
    {
        icon: <IconZeroDeps />,
        title: 'Zero Dependencies',
        description:
            'The core library has no external runtime dependencies. Add just what you need for your framework — nothing more.',
    },
    {
        icon: <IconTheme />,
        title: 'Theming',
        description:
            'Built-in themes with full CSS variable customization. Override individual properties or build your own theme from scratch.',
    },
    {
        icon: <IconTabGroups />,
        title: 'Tab Groups',
        description:
            'Cluster related tabs into named, color-coded groups within a tab strip. Collapse, drag, and reorder groups; bring your own chip renderer.',
    },
    {
        icon: <IconEdgeGroups />,
        title: 'Edge Groups',
        description:
            'IDE-style collapsible side panels docked to any edge of the layout. Toggle via the API, persist their state, and host any panel content.',
    },
    {
        icon: <IconTouch />,
        title: 'Touch & Mobile',
        description:
            'First-class touch and pen support. A pointer-events backend powers drag and drop on mobile with a long-press gesture that preserves native taps and scroll.',
    },
];

function FeatureCard({ icon, title, description }: (typeof FEATURES)[number]) {
    return (
        <div className="feature-card">
            <div className="feature-card-icon">{icon}</div>
            <h3 className="feature-card-title">{title}</h3>
            <p className="feature-card-description">{description}</p>
        </div>
    );
}

// ─── Framework logos ──────────────────────────────────────────────────────────

function Frameworks() {
    const frameworks = [
        { name: 'React', pkg: 'dockview-react', logo: '/img/react-icon.svg' },
        { name: 'Vue', pkg: 'dockview-vue', logo: '/img/vue-icon.svg' },
        {
            name: 'Angular',
            pkg: 'dockview-angular',
            logo: '/img/angular-icon.svg',
        },
        {
            name: 'TypeScript',
            pkg: 'dockview',
            logo: '/img/js-icon.svg',
        },
    ];

    return (
        <section className="frameworks-section">
            <div className="container">
                <p className="section-label">Framework support</p>
                <div className="frameworks-grid">
                    {frameworks.map((fw) => (
                        <div key={fw.name} className="framework-item">
                            <img
                                src={useBaseUrl(fw.logo)}
                                alt={fw.name}
                                className="framework-logo"
                            />
                            <span className="framework-name">{fw.name}</span>
                            <code className="framework-pkg">{fw.pkg}</code>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Page sections ────────────────────────────────────────────────────────────

function Hero() {
    return (
        <section className="hero-section">
            <div className="container">
                <div className="hero-text">
                    <h1 className="hero-headline">
                        The docking layout manager for <AnimatedFramework />
                    </h1>
                    <p className="hero-subtitle">
                        Build IDE-like interfaces with tabs, groups, drag &
                        drop, floating panels, and popout windows. Touch and
                        mobile ready. Zero dependencies.
                    </p>
                    <div className="hero-actions">
                        <div className="hero-fw-btns">
                            {FRAMEWORK_LINKS.map((fw) => (
                                <Link
                                    key={fw.label}
                                    to={`/docs/overview/quickstart?framework=${fw.param}`}
                                    className="hero-fw-btn"
                                >
                                    <img
                                        src={useBaseUrl(fw.icon)}
                                        width={16}
                                        height={16}
                                        alt=""
                                    />
                                    {fw.label}
                                </Link>
                            ))}
                        </div>
                        <Link
                            to="/demo"
                            className="button button--primary button--lg"
                        >
                            Live Demo →
                        </Link>
                    </div>
                    <HeroStats />
                </div>
                <Link
                    to="/demo"
                    className="hero-preview"
                    aria-label="Open the live demo"
                >
                    <img
                        src={useBaseUrl('/img/splashscreenv2.png')}
                        alt="Dockview layout demo"
                        className="hero-gif"
                    />
                    <span className="hero-preview-badge">
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path d="M8 5v14l11-7z" />
                        </svg>
                        Try the live demo
                    </span>
                </Link>
            </div>
        </section>
    );
}

function CallToAction() {
    return (
        <section className="cta-section">
            <div className="container cta-inner">
                <p className="section-label">Get started</p>
                <h2 className="cta-title">Drop dockview into your app</h2>
                <p className="cta-subtitle">
                    Install the package for your framework and render your first
                    layout in minutes.
                </p>
                <div className="cta-install">
                    <code>npm install dockview</code>
                </div>
                <div className="cta-actions">
                    <Link
                        to="/docs/overview/introduction"
                        className="button button--primary button--lg"
                    >
                        Read the docs →
                    </Link>
                    <Link
                        to="/demo"
                        className="button button--secondary button--lg"
                    >
                        Live demo
                    </Link>
                    <Link
                        to="/trial"
                        className="button button--secondary button--lg"
                    >
                        Start free trial
                    </Link>
                </div>
            </div>
        </section>
    );
}

function Features() {
    return (
        <section className="features-section">
            <div className="container">
                <p className="section-label">What you get</p>
                <div className="features-grid">
                    {FEATURES.map((f) => (
                        <FeatureCard key={f.title} {...f} />
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home(): JSX.Element {
    return (
        <Layout
            title="Docking Layout Manager"
            description="Dockview is a zero dependency docking layout manager for building IDE-like interfaces with tabs, groups, grids, splitviews, drag and drop, floating panels, and popout windows. Touch and mobile ready. Supports React, Vue, Angular, and vanilla TypeScript."
        >
            <main>
                <Hero />
                <Features />
                <Frameworks />
                <CallToAction />
            </main>
        </Layout>
    );
}
