import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import './whats-new.scss';

interface Release {
    version: string;
    tag: string;
    badge?: string;
    summary: string;
    notes: string;
    migration?: string;
}

// Newest first. On a new major: prepend an entry and move `badge: 'Latest'` to it.
const RELEASES: Release[] = [
    {
        version: 'Dockview 8.0',
        tag: 'v8',
        badge: 'Latest',
        summary:
            'An additive release focused on the tab header and drag and drop — pinned and wrapping tabs, an aim-at-a-cell drop compass, floating-group snapping, layout history, auto-hide edge groups, and keyboard docking. Every capability is opt-in, so upgrading is safe by default.',
        notes: '/docs/releases/whats-new/whats-new-v8',
        migration: '/docs/releases/migrating/migrating-to-v8',
    },
    {
        version: 'Dockview 7.0',
        tag: 'v7',
        summary:
            'Realigns the package names so the ecosystem is consistent (dockview for JavaScript, dockview-<framework> for each framework) and ships a new accessibility pack.',
        notes: '/docs/releases/whats-new/whats-new-v7',
        migration: '/docs/releases/migrating/migrating-to-v7',
    },
    {
        version: 'Dockview 6.0',
        tag: 'v6',
        summary:
            'The largest release since 4.0 — tab groups, edge groups, an overhauled theme system with an interactive theme builder, and a richer event surface on DockviewApi.',
        notes: '/docs/releases/whats-new/whats-new-v6',
    },
];

function ReleaseEntry({ release }: { release: Release }) {
    return (
        <article className="release">
            <div className="release-header">
                <Link to={release.notes} className="release-version">
                    {release.version}
                </Link>
                {release.badge && (
                    <span className="release-badge">{release.badge}</span>
                )}
            </div>
            <p className="release-summary">{release.summary}</p>
            <div className="release-links">
                <Link to={release.notes} className="release-link">
                    Read the full notes →
                </Link>
                {release.migration && (
                    <Link
                        to={release.migration}
                        className="release-link release-link--muted"
                    >
                        Migration guide
                    </Link>
                )}
            </div>
        </article>
    );
}

export default function WhatsNew(): JSX.Element {
    return (
        <Layout
            title="What's new"
            description="Release highlights for Dockview — the newest version first, with links to the full release notes and migration guides."
        >
            <main className="whats-new-page">
                <div className="container">
                    <header className="whats-new-hero">
                        <h1>What's new</h1>
                        <p>Release highlights, newest first.</p>
                    </header>
                    <div className="releases-list">
                        {RELEASES.map((release) => (
                            <ReleaseEntry key={release.tag} release={release} />
                        ))}
                    </div>
                </div>
            </main>
        </Layout>
    );
}
