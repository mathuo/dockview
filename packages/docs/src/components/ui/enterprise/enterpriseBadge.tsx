import React from 'react';

/**
 * Small diamond glyph used to mark Enterprise (`dockview-enterprise`) content.
 * Icon-only with a native tooltip; rendered next to page titles and on
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
            title="Enterprise feature — part of the dockview-enterprise package"
            aria-label="Enterprise feature"
            role="img"
        >
            <svg
                viewBox="0 0 16 16"
                width="1em"
                height="1em"
                aria-hidden="true"
                focusable="false"
            >
                <path d="M8 1.1 14.9 8 8 14.9 1.1 8z" />
            </svg>
        </span>
    );
}

export default EnterpriseBadge;
