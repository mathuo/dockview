import React from 'react';

/**
 * "Enterprise" pill used to mark Enterprise (`dockview-enterprise`) content.
 * A labelled badge with a native tooltip; rendered next to page titles and on
 * Enterprise sidebar items. Driven by page frontmatter (`enterprise: true` /
 * `sidebar_custom_props.enterprise`), never placed inline in MDX.
 */
export function EnterpriseBadge({
    variant,
}: {
    variant?: 'title' | 'sidebar';
}): JSX.Element {
    const className = variant
        ? `enterprise-badge enterprise-badge--${variant}`
        : 'enterprise-badge';
    return (
        <span
            className={className}
            title="Enterprise feature, part of the dockview-enterprise package"
            aria-label="Enterprise feature"
            role="img"
        >
            <span className="enterprise-badge__label">Enterprise</span>
        </span>
    );
}

export default EnterpriseBadge;
