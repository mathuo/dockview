import * as React from 'react';
import { useActiveFramework } from '../frameworkSpecific';
import BrowserOnly from '@docusaurus/BrowserOnly';

const BASE_SANDBOX_URL =
    'https://codesandbox.io/s/github/mathuo/dockview/tree/gh-pages';

export const _CodeRunner = (props: { id: string; height?: number }) => {
    const [framework] = useActiveFramework();

    let frameworkName = framework.label.toLowerCase();

    if (frameworkName === 'javascript') {
        frameworkName = 'typescript';
    }

    const sandboxUrl = `${BASE_SANDBOX_URL}/templates/${
        props.id
    }/${framework.label.toLowerCase()}`;
    const path = `/templates/${props.id}/${frameworkName}/index.html`;
    return (
        <iframe
            src={path}
            style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
            }}
        />
    );
};

export const CodeRunner = (props: { id: string; height?: number }) => {
    // Reserve the height on this server-rendered container so the page doesn't
    // reflow when the client-only iframe mounts — `BrowserOnly` renders nothing
    // until hydration, so without a fixed-height box the content below jumps
    // down once the example appears. The iframe fills this box.
    return (
        <div
            style={{
                height: `${props.height ?? 500}px`,
                border: '1px solid var(--ifm-toc-border-color)',
                borderRadius: '8px',
                background: 'var(--ifm-background-surface-color)',
                overflow: 'hidden',
            }}
        >
            <BrowserOnly>{() => <_CodeRunner {...props} />}</BrowserOnly>
        </div>
    );
};

const CodeSandbox = (props: { url: string }) => {
    return (
        <span
            className="codesandbox-button"
            style={{ display: 'flex', alignItems: 'center' }}
        >
            <span className="codesandbox-button-pretext">{`Open in `}</span>
            <a
                href={props.url}
                target={'_blank'}
                rel="noopener"
                className="codesandbox-button-content"
            >
                <span
                    style={{
                        fontWeight: 'bold',
                        paddingRight: '4px',
                    }}
                >
                    CodeSandbox
                </span>
            </a>
        </span>
    );
};
