import React from 'react';

// Anonymous page feedback: a one-click thumbs up/down reaction plus an optional
// freeform message box. Both talk to the licensing worker's feedback API (the
// same worker that serves /enterprise), reusing the Turnstile bot-check pattern
// from the contact page for the message box. The thumbs vote is deliberately
// frictionless (no bot-check), deduped per browser by a random client id kept
// in localStorage.

// Public Turnstile site key (safe to expose, it's rendered into the page). The
// matching secret lives only in the licensing worker (TURNSTILE_SECRET_KEY).
const TURNSTILE_SITE_KEY = '0x4AAAAAADx1eYe1Ro1u3YUq';
// Cloudflare's visible "always passes" test key, used on localhost so local dev
// doesn't depend on the real widget's domain allowlist.
const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';
const TURNSTILE_SCRIPT =
    'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

const CLIENT_ID_KEY = 'dockview-feedback-client-id';

function isLocalhost(): boolean {
    return (
        typeof window !== 'undefined' &&
        window.location.hostname === 'localhost'
    );
}

function turnstileSiteKey(): string {
    return isLocalhost() ? TURNSTILE_TEST_SITE_KEY : TURNSTILE_SITE_KEY;
}

// The feedback API lives on the licensing worker under /enterprise, same origin
// as the docs site in production; in local dev the worker runs on :4000.
function feedbackApiUrl(path: string): string {
    const base = isLocalhost() ? 'http://localhost:4000/enterprise' : '/enterprise';
    return `${base}/api/feedback/${path}`;
}

// A stable per-browser id so a thumbs vote counts once per browser. Best-effort:
// if storage is unavailable (private mode) we fall back to a per-session id.
function getClientId(): string {
    try {
        const existing = window.localStorage.getItem(CLIENT_ID_KEY);
        if (existing) return existing;
        const id = window.crypto.randomUUID();
        window.localStorage.setItem(CLIENT_ID_KEY, id);
        return id;
    } catch {
        return window.crypto?.randomUUID?.() ?? `anon-${Date.now()}`;
    }
}

declare global {
    interface Window {
        turnstile?: {
            render: (
                el: HTMLElement,
                opts: {
                    sitekey: string;
                    callback: (token: string) => void;
                    'expired-callback'?: () => void;
                    'error-callback'?: () => void;
                }
            ) => string;
            reset: (id?: string) => void;
        };
    }
}

type Vote = 'up' | 'down';

function ThumbIcon({ down }: { down?: boolean }): JSX.Element {
    // A single thumbs-up path, flipped for the down variant.
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ transform: down ? 'rotate(180deg)' : undefined }}
        >
            <path d="M7 10v12" />
            <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
        </svg>
    );
}

function Votes({ page }: { page: string }): JSX.Element {
    const [counts, setCounts] = React.useState<{ up: number; down: number } | null>(
        null
    );
    const [mine, setMine] = React.useState<Vote | null>(null);
    const [busy, setBusy] = React.useState(false);
    const clientIdRef = React.useRef<string>('');

    React.useEffect(() => {
        clientIdRef.current = getClientId();
        let cancelled = false;
        fetch(
            feedbackApiUrl(
                `vote?page=${encodeURIComponent(page)}&clientId=${encodeURIComponent(
                    clientIdRef.current
                )}`
            )
        )
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (cancelled || !data) return;
                setCounts({ up: data.up ?? 0, down: data.down ?? 0 });
                setMine(data.vote ?? null);
            })
            .catch(() => {
                /* counts stay hidden on failure */
            });
        return () => {
            cancelled = true;
        };
    }, [page]);

    async function cast(vote: Vote) {
        if (busy) return;
        // Clicking the already-selected thumb clears the vote.
        const next = mine === vote ? null : vote;
        setBusy(true);
        // Optimistic update so the click feels instant.
        setMine(next);
        try {
            const res = await fetch(feedbackApiUrl('vote'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    page,
                    clientId: clientIdRef.current,
                    vote: next,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setCounts({ up: data.up ?? 0, down: data.down ?? 0 });
                setMine(data.vote ?? null);
            }
        } catch {
            /* leave the optimistic state; a later load will reconcile */
        } finally {
            setBusy(false);
        }
    }

    const btn = (active: boolean): React.CSSProperties => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        borderRadius: 8,
        border: `1px solid ${
            active ? 'var(--ifm-color-primary)' : 'var(--ifm-color-emphasis-300)'
        }`,
        background: active
            ? 'var(--ifm-color-primary)'
            : 'var(--ifm-background-color)',
        color: active ? '#fff' : 'var(--ifm-font-color-base)',
        font: 'inherit',
        fontSize: '0.9rem',
        cursor: busy ? 'default' : 'pointer',
    });

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
            }}
        >
            <span style={{ fontWeight: 600 }}>Was this helpful?</span>
            <button
                type="button"
                onClick={() => cast('up')}
                disabled={busy}
                aria-pressed={mine === 'up'}
                aria-label="Yes, this was helpful"
                style={btn(mine === 'up')}
            >
                <ThumbIcon />
                {counts && <span>{counts.up}</span>}
            </button>
            <button
                type="button"
                onClick={() => cast('down')}
                disabled={busy}
                aria-pressed={mine === 'down'}
                aria-label="No, this was not helpful"
                style={btn(mine === 'down')}
            >
                <ThumbIcon down />
                {counts && <span>{counts.down}</span>}
            </button>
        </div>
    );
}

type MessageStatus = 'idle' | 'submitting' | 'done' | 'error';

function inputStyle(hasError: boolean): React.CSSProperties {
    return {
        width: '100%',
        padding: '10px 12px',
        borderRadius: 8,
        border: `1px solid ${
            hasError
                ? 'var(--ifm-color-danger)'
                : 'var(--ifm-color-emphasis-300)'
        }`,
        background: 'var(--ifm-background-color)',
        color: 'var(--ifm-font-color-base)',
        fontSize: '0.95rem',
        fontFamily: 'inherit',
    };
}

function labelStyle(): React.CSSProperties {
    return {
        display: 'block',
        fontSize: '0.85rem',
        fontWeight: 600,
        marginBottom: 6,
        color: 'var(--ifm-heading-color)',
    };
}

function optional(): JSX.Element {
    return (
        <span
            style={{
                color: 'var(--ifm-color-content-secondary)',
                fontWeight: 400,
            }}
        >
            {' '}
            (optional)
        </span>
    );
}

function MessageBox({ page }: { page: string }): JSX.Element {
    const [message, setMessage] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [company, setCompany] = React.useState('');
    const [error, setError] = React.useState('');
    const [status, setStatus] = React.useState<MessageStatus>('idle');
    const [token, setToken] = React.useState('');
    const widgetRef = React.useRef<HTMLDivElement>(null);
    const renderedRef = React.useRef(false);

    // Load the Turnstile script once and render the widget explicitly.
    React.useEffect(() => {
        function render() {
            if (renderedRef.current || !widgetRef.current || !window.turnstile)
                return;
            renderedRef.current = true;
            window.turnstile.render(widgetRef.current, {
                sitekey: turnstileSiteKey(),
                callback: setToken,
                'expired-callback': () => setToken(''),
                'error-callback': () => setToken(''),
            });
        }

        if (window.turnstile) {
            render();
            return;
        }
        const existing = document.querySelector<HTMLScriptElement>(
            `script[src="${TURNSTILE_SCRIPT}"]`
        );
        const script = existing ?? document.createElement('script');
        script.src = TURNSTILE_SCRIPT;
        script.async = true;
        script.defer = true;
        script.addEventListener('load', render);
        if (!existing) document.head.appendChild(script);
        return () => script.removeEventListener('load', render);
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!message.trim()) {
            setError('Please enter a message.');
            return;
        }
        if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError('Please enter a valid email address, or leave it blank.');
            return;
        }
        if (!token) {
            setStatus('error');
            setError('Please complete the bot check and try again.');
            return;
        }

        setStatus('submitting');
        setError('');
        try {
            const res = await fetch(feedbackApiUrl('message'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    page,
                    message: message.trim(),
                    email: email.trim().toLowerCase() || undefined,
                    company: company.trim() || undefined,
                    turnstileToken: token,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(
                    data.error ?? 'Something went wrong. Please try again.'
                );
            }
            setStatus('done');
        } catch (err) {
            setStatus('error');
            setError(
                err instanceof Error
                    ? err.message
                    : 'Something went wrong. Please try again.'
            );
            window.turnstile?.reset();
            setToken('');
        }
    }

    if (status === 'done') {
        return (
            <p
                style={{
                    margin: 0,
                    color: 'var(--ifm-color-content-secondary)',
                }}
            >
                Thanks for the feedback. We read every message.
            </p>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
            <label style={{ display: 'block' }}>
                <span style={labelStyle()}>Leave a message</span>
                <textarea
                    value={message}
                    rows={4}
                    placeholder="What did you think? What would you like to see next?"
                    onChange={(e) => {
                        setMessage(e.target.value);
                        setError('');
                    }}
                    style={{ ...inputStyle(false), resize: 'vertical' }}
                />
            </label>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 16,
                }}
            >
                <label style={{ display: 'block' }}>
                    <span style={labelStyle()}>Email{optional()}</span>
                    <input
                        type="email"
                        value={email}
                        placeholder="jane@acme.com"
                        onChange={(e) => setEmail(e.target.value)}
                        style={inputStyle(false)}
                    />
                </label>
                <label style={{ display: 'block' }}>
                    <span style={labelStyle()}>Company{optional()}</span>
                    <input
                        type="text"
                        value={company}
                        placeholder="Acme Corp"
                        onChange={(e) => setCompany(e.target.value)}
                        style={inputStyle(false)}
                    />
                </label>
            </div>

            <div ref={widgetRef} />

            {error && (
                <div
                    style={{
                        color: 'var(--ifm-color-danger)',
                        fontSize: '0.9rem',
                    }}
                >
                    {error}
                </div>
            )}

            <div>
                <button
                    type="submit"
                    className="button button--primary"
                    disabled={status === 'submitting'}
                >
                    {status === 'submitting' ? 'Sending…' : 'Send feedback'}
                </button>
            </div>
            <p
                style={{
                    fontSize: '0.8rem',
                    color: 'var(--ifm-color-content-secondary)',
                    margin: 0,
                }}
            >
                Leave your email only if you'd like a reply. By submitting you
                agree to our <a href="/enterprise/privacy">privacy policy</a>.
            </p>
        </form>
    );
}

// The `page` prop keys the feedback (votes are deduped, messages tagged) so one
// widget can serve several posts. Defaults to the current path.
export function BlogFeedback({ page }: { page?: string }): JSX.Element {
    const [resolvedPage, setResolvedPage] = React.useState(page ?? '');

    React.useEffect(() => {
        if (!page && typeof window !== 'undefined') {
            setResolvedPage(window.location.pathname);
        }
    }, [page]);

    // Wait for a page key before hitting the API (avoids a spurious call with an
    // empty key during the first client render when no prop is given).
    const key = page ?? resolvedPage;

    return (
        <section
            style={{
                marginTop: 48,
                border: '1px solid var(--ifm-color-emphasis-200)',
                borderRadius: 12,
                padding: '28px',
                background: 'var(--ifm-card-background-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
            }}
        >
            {key && <Votes page={key} />}
            <hr
                style={{
                    margin: 0,
                    border: 0,
                    borderTop: '1px solid var(--ifm-color-emphasis-200)',
                }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h3 style={{ margin: '0 0 4px' }}>Send us feedback</h3>
                <p
                    style={{
                        margin: '0 0 12px',
                        color: 'var(--ifm-color-content-secondary)',
                    }}
                >
                    Have a question, a use case, or a feature you want? Tell us.
                </p>
                {key && <MessageBox page={key} />}
            </div>
        </section>
    );
}

export default BlogFeedback;
