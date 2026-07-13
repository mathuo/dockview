/**
 * Swizzled from @docusaurus/theme-classic Footer/LinkItem (v3.10.1).
 *
 * Only change from the original: `pathname://` hrefs are treated as internal so
 * they do not get the external-link icon. Our footer uses `pathname://` for the
 * Sitemap (a static file) and the Privacy policy (served by the separate
 * /enterprise worker) so they trigger a full page load and skip the broken-link
 * checker, but they are same-site links, not external ones. Genuinely external
 * links (https://) still get the icon.
 */
import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import isInternalUrl from '@docusaurus/isInternalUrl';
import IconExternalLink from '@theme/Icon/ExternalLink';

export default function FooterLinkItem({ item }) {
    const { to, href, label, prependBaseUrlToHref, className, ...props } = item;
    const toUrl = useBaseUrl(to);
    const normalizedHref = useBaseUrl(href, { forcePrependBaseUrl: true });
    const isExternal =
        href && !isInternalUrl(href) && !href.startsWith('pathname://');
    return (
        <Link
            className={clsx('footer__link-item', className)}
            {...(href
                ? {
                      href: prependBaseUrlToHref ? normalizedHref : href,
                  }
                : {
                      to: toUrl,
                  })}
            {...props}
        >
            {label}
            {isExternal && <IconExternalLink />}
        </Link>
    );
}
