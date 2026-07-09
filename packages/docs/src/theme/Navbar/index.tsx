import React from 'react';
import Navbar from '@theme-original/Navbar';
import { useLocation } from '@docusaurus/router';

// The /demo page is a full-bleed application shell with its own header, so the
// site navbar must not render there. Deciding this at render time (rather than
// hiding it with CSS) keeps the two entry points consistent: a direct load and
// a client-side navigation from the landing page both unmount the navbar,
// instead of it flashing in on SPA navigation while an injected style catches
// up.
const isDemoRoute = (pathname: string): boolean => {
    const normalised = pathname.replace(/\/+$/, '');
    return normalised.endsWith('/demo');
};

export default function NavbarWrapper(
    props: React.ComponentProps<typeof Navbar>
): React.ReactElement | null {
    const { pathname } = useLocation();

    if (isDemoRoute(pathname)) {
        return null;
    }

    return <Navbar {...props} />;
}
