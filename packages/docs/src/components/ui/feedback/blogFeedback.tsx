import React from 'react';

// Anonymous page feedback: a one-click thumbs up/down reaction plus an optional
// freeform message box. Both talk to the licensing worker's feedback API (the
// same worker that serves /enterprise). Both are gated by Cloudflare Turnstile
// using interaction-only widgets that stay invisible and mint a token in the
// background, only surfacing if a visitor actually has to be challenged. So a
// vote stays one click and the message box has no visible bot-check. Each action
// keeps its own widget (tokens are single-use, so one can't cover both). One
// vote per browser is kept client-side in localStorage.

// Public Turnstile site key (safe to expose, it's rendered into the page). The
// matching secret lives only in the licensing worker (TURNSTILE_SECRET_KEY).
const TURNSTILE_SITE_KEY = '0x4AAAAAADx1eYe1Ro1u3YUq';
// Cloudflare's visible "always passes" test key, used on localhost so local dev
// doesn't depend on the real widget's domain allowlist.
const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';
const TURNSTILE_SCRIPT =
    'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

const VOTED_KEY_PREFIX = 'dockview-feedback-voted:';

type Vote = 'up' | 'down';

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

// Remember whether this browser already reacted to a given feedback id, so the
// counter locks to one vote per browser. Honour-based: the tallies live in a
// single shared counter server-side with no per-voter record, so this is the
// only dedup. Best-effort (a no-op if storage is unavailable, e.g. private mode).
function getVoted(id: string): Vote | null {
    try {
        const v = window.localStorage.getItem(VOTED_KEY_PREFIX + id);
        return v === 'up' || v === 'down' ? v : null;
    } catch {
        return null;
    }
}

function setVoted(id: string, vote: Vote): void {
    try {
        window.localStorage.setItem(VOTED_KEY_PREFIX + id, vote);
    } catch {
        /* ignore */
    }
}

declare global {
    interface Window {
        turnstile?: {
            render: (
                el: HTMLElement,
                opts: {
                    sitekey: string;
                    appearance?: 'always' | 'execute' | 'interaction-only';
                    callback: (token: string) => void;
                    'expired-callback'?: () => void;
                    'error-callback'?: () => void;
                }
            ) => string;
            reset: (id?: string) => void;
        };
    }
}

// Load the Turnstile script once and render a widget, exposing its token. The
// managed widget is mostly automatic: with appearance 'interaction-only' it
// stays invisible and issues a token in the background unless a real challenge
// is needed. Tokens are single-use, so `reset` fetches a fresh one after a token
// is spent. Multiple widgets can coexist on a page; each tracks its own id.
function useTurnstileToken(appearance?: 'interaction-only'): {
    token: string;
    widgetRef: React.RefObject<HTMLDivElement>;
    reset: () => void;
} {
    const [token, setToken] = React.useState('');
    const widgetRef = React.useRef<HTMLDivElement>(null);
    const widgetIdRef = React.useRef<string | null>(null);
    const renderedRef = React.useRef(false);

    React.useEffect(() => {
        function render() {
            if (renderedRef.current || !widgetRef.current || !window.turnstile)
                return;
            renderedRef.current = true;
            widgetIdRef.current = window.turnstile.render(widgetRef.current, {
                sitekey: turnstileSiteKey(),
                appearance,
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
    }, [appearance]);

    const reset = React.useCallback(() => {
        try {
            window.turnstile?.reset(widgetIdRef.current ?? undefined);
        } catch {
            /* ignore */
        }
        setToken('');
    }, []);

    return { token, widgetRef, reset };
}

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

function Votes({ id }: { id: string }): JSX.Element {
    const [counts, setCounts] = React.useState<{ up: number; down: number } | null>(
        null
    );
    const [mine, setMine] = React.useState<Vote | null>(null);
    const [busy, setBusy] = React.useState(false);
    // A vote clicked before Turnstile has issued a token, held until it lands.
    const [pending, setPending] = React.useState<Vote | null>(null);
    // Invisible unless a challenge is needed, so a vote stays one click.
    const { token, widgetRef, reset } = useTurnstileToken('interaction-only');

    React.useEffect(() => {
        // This browser's prior choice (if any) comes from localStorage; the
        // tallies come from the shared counter.
        setMine(getVoted(id));
        let cancelled = false;
        fetch(feedbackApiUrl(`vote?id=${encodeURIComponent(id)}`))
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (cancelled || !data) return;
                setCounts({ up: data.up ?? 0, down: data.down ?? 0 });
            })
            .catch(() => {
                /* counts stay hidden on failure */
            });
        return () => {
            cancelled = true;
        };
    }, [id]);

    // Send the vote once a Turnstile token is in hand. The token is single-use,
    // so we drop it afterwards; the browser is now locked, so no fresh one is
    // needed.
    const send = React.useCallback(
        async (vote: Vote) => {
            try {
                const res = await fetch(feedbackApiUrl('vote'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, vote, turnstileToken: token }),
                });
                if (res.ok) {
                    const data = await res.json();
                    setCounts({ up: data.up ?? 0, down: data.down ?? 0 });
                    setMine(vote);
                    setVoted(id, vote);
                }
            } catch {
                /* swallow — the buttons unlock and the visitor can retry */
            } finally {
                reset();
                setBusy(false);
            }
        },
        [id, token, reset]
    );

    // A click made before the token arrived fires the moment it does.
    React.useEffect(() => {
        if (pending && token) {
            const vote = pending;
            setPending(null);
            void send(vote);
        }
    }, [pending, token, send]);

    // One-click counter: click a thumb to add to its tally. One vote per browser
    // (remembered in localStorage), so once you've reacted the buttons lock in.
    function cast(vote: Vote) {
        if (busy || mine) return;
        setBusy(true);
        if (token) void send(vote);
        else setPending(vote);
    }

    const voted = mine !== null;

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
        cursor: busy || voted ? 'default' : 'pointer',
        opacity: voted && !active ? 0.6 : 1,
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                    disabled={busy || voted}
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
                    disabled={busy || voted}
                    aria-pressed={mine === 'down'}
                    aria-label="No, this was not helpful"
                    style={btn(mine === 'down')}
                >
                    <ThumbIcon down />
                    {counts && <span>{counts.down}</span>}
                </button>
                {voted && (
                    <span
                        style={{
                            fontSize: '0.85rem',
                            color: 'var(--ifm-color-content-secondary)',
                        }}
                    >
                        Thanks!
                    </span>
                )}
            </div>
            {/* Invisible unless Turnstile needs to challenge the visitor. */}
            <div ref={widgetRef} />
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

function MessageBox({ id }: { id: string }): JSX.Element {
    const [message, setMessage] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [company, setCompany] = React.useState('');
    const [error, setError] = React.useState('');
    const [status, setStatus] = React.useState<MessageStatus>('idle');
    // A submit made before Turnstile has issued its token, held until it lands.
    const [pendingSubmit, setPendingSubmit] = React.useState(false);
    // Interaction-only, so nothing shows unless a challenge is actually needed.
    const { token, widgetRef, reset } = useTurnstileToken('interaction-only');

    const doSubmit = React.useCallback(
        async (turnstileToken: string) => {
            setStatus('submitting');
            setError('');
            try {
                const res = await fetch(feedbackApiUrl('message'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id,
                        message: message.trim(),
                        email: email.trim().toLowerCase() || undefined,
                        company: company.trim() || undefined,
                        turnstileToken,
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
                reset();
            }
        },
        [id, message, email, company, reset]
    );

    // A submit queued before the token arrived fires the moment it does.
    React.useEffect(() => {
        if (pendingSubmit && token) {
            setPendingSubmit(false);
            void doSubmit(token);
        }
    }, [pendingSubmit, token, doSubmit]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!message.trim()) {
            setError('Please enter a message.');
            return;
        }
        if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError('Please enter a valid email address, or leave it blank.');
            return;
        }
        setError('');
        // The token is minted in the background. Send now if it's ready, else
        // show the sending state and fire the moment it lands.
        if (token) {
            void doSubmit(token);
        } else {
            setStatus('submitting');
            setPendingSubmit(true);
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

// The `id` prop keys the feedback (votes are deduped, messages tagged) so one
// widget can serve several pages, e.g. id="v8-feedback". Defaults to the current
// path when omitted.
export function BlogFeedback({ id }: { id?: string }): JSX.Element {
    const [resolvedId, setResolvedId] = React.useState(id ?? '');

    React.useEffect(() => {
        if (!id && typeof window !== 'undefined') {
            setResolvedId(window.location.pathname);
        }
    }, [id]);

    // Wait for a key before hitting the API (avoids a spurious call with an
    // empty key during the first client render when no prop is given).
    const key = id ?? resolvedId;

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
            {key && <Votes id={key} />}
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
                {key && <MessageBox id={key} />}
            </div>
        </section>
    );
}

export default BlogFeedback;
