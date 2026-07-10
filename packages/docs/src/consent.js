// Cookie-consent banner and analytics gate for the docs site.
//
// This mirrors the enterprise licensing app (src/components/consent-manager.tsx
// in the dockview-licencing repo) so both apps share one consent decision
// across dockview.dev. The consent cookie name (dv_cc), domain (dockview.dev),
// categories and revision must stay identical on both sides; otherwise a
// visitor would be asked once per app instead of once per domain.
//
// Google Analytics is hard-gated: gtag.js is not loaded until the visitor
// accepts the analytics category, matching the shared privacy policy at
// /enterprise/privacy. Active in production builds only, which replaces the
// old fire-on-load gtag plugin that ran unconditionally in CI.

import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import 'vanilla-cookieconsent/dist/cookieconsent.css';

const GA_MEASUREMENT_ID = 'G-KXGC1C9ZHC';

let gaLoaded = false;

// Inject gtag.js and initialise the GA4 property. Idempotent, so repeated
// consent callbacks are harmless.
function loadGoogleAnalytics() {
    if (gaLoaded) return;
    gaLoaded = true;

    window.dataLayer = window.dataLayer || [];
    const gtag = (...args) => {
        window.dataLayer.push(args);
    };
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID);

    const script = document.createElement('script');
    script.async = true;
    script.src =
        'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    document.head.appendChild(script);
}

let started = false;

function initConsent() {
    import('vanilla-cookieconsent').then((CookieConsent) => {
        const host = window.location.hostname;
        // Share the decision across dockview.dev and its subdomains in prod;
        // fall back to a host-only cookie on localhost or preview hosts.
        const cookieDomain =
            host === 'dockview.dev' || host.endsWith('.dockview.dev')
                ? 'dockview.dev'
                : host;

        const syncAnalytics = () => {
            if (CookieConsent.acceptedCategory('analytics')) {
                loadGoogleAnalytics();
            }
        };

        // Docusaurus (react-helmet) rewrites the <html> class on render and
        // strips cookieconsent's show--consent / show--preferences classes, so
        // the modal never becomes visible. Mirror those classes onto <body>,
        // which Docusaurus leaves alone. cookieconsent's own CSS keys off any
        // ancestor of #cc-main, so this restores visibility without any style
        // duplication.
        const showClassFor = (modalName) =>
            modalName === 'preferencesModal'
                ? 'show--preferences'
                : 'show--consent';
        const mirrorShow = ({ modalName }) =>
            document.body.classList.add(showClassFor(modalName));
        const mirrorHide = ({ modalName }) =>
            document.body.classList.remove(showClassFor(modalName));

        return CookieConsent.run({
            guiOptions: {
                consentModal: { layout: 'box', position: 'bottom left' },
                preferencesModal: { layout: 'box' },
            },
            cookie: {
                name: 'dv_cc',
                domain: cookieDomain,
                expiresAfterDays: 182,
            },
            categories: {
                necessary: {
                    enabled: true,
                    readOnly: true,
                },
                analytics: {
                    enabled: false,
                    autoClear: {
                        cookies: [
                            { name: /^_ga/ }, // _ga and _ga_<container>
                            { name: '_gid' },
                            { name: '_gat' },
                        ],
                    },
                },
            },
            // Runs on first consent and on every load where analytics was
            // already accepted, then loads GA. Withdrawing fires onChange.
            onConsent: syncAnalytics,
            onChange: syncAnalytics,
            onModalShow: mirrorShow,
            onModalHide: mirrorHide,
            language: {
                default: 'en',
                translations: {
                    en: {
                        consentModal: {
                            title: 'We value your privacy',
                            description:
                                'We use strictly necessary cookies to run the site and to remember this choice. With your consent, we also use Google Analytics to measure how the site is used. See our <a href="/enterprise/privacy">privacy policy</a>.',
                            acceptAllBtn: 'Accept all',
                            acceptNecessaryBtn: 'Reject non-essential',
                            showPreferencesBtn: 'Manage preferences',
                        },
                        preferencesModal: {
                            title: 'Cookie preferences',
                            acceptAllBtn: 'Accept all',
                            acceptNecessaryBtn: 'Reject non-essential',
                            savePreferencesBtn: 'Save preferences',
                            closeIconLabel: 'Close',
                            sections: [
                                {
                                    title: 'Strictly necessary',
                                    description:
                                        'Required for the site to work, for example to remember your cookie choice. These cannot be switched off.',
                                    linkedCategory: 'necessary',
                                },
                                {
                                    title: 'Analytics',
                                    description:
                                        'Google Analytics helps us understand how visitors use the site so we can improve it. It is not loaded until you accept.',
                                    linkedCategory: 'analytics',
                                },
                                {
                                    title: 'More information',
                                    description:
                                        'For details on how we handle your data, see our <a href="/enterprise/privacy">privacy policy</a>.',
                                },
                            ],
                        },
                    },
                },
            },
        });
    }).catch((e) => {
        console.error('[consent] cookieconsent failed to run', e);
    });
}

if (
    ExecutionEnvironment.canUseDOM &&
    process.env.NODE_ENV === 'production' &&
    !started
) {
    started = true;
    // Defer until after the page has loaded and Docusaurus has hydrated, so the
    // banner is initialised against a settled DOM rather than mid-render.
    const start = () =>
        requestAnimationFrame(() => requestAnimationFrame(initConsent));
    if (document.readyState === 'complete') {
        start();
    } else {
        window.addEventListener('load', start, { once: true });
    }
}
