import * as React from 'react';
import { useActiveFramework } from '../frameworkSpecific';
import BrowserOnly from '@docusaurus/BrowserOnly';

const BASE_SANDBOX_URL =
    'https://codesandbox.io/s/github/mathuo/dockview/tree/master/packages/docs';

export const _CodeRunner = (props: {
    id: string;
    framework: string;
    height: number;
}) => {
    useActiveFramework();

    const sandboxUrl = `${BASE_SANDBOX_URL}/templates/${props.id}/${props.framework}`;
    const path = `/templates/${props.id}/${props.framework}/index.html`;
    return (
        <div>
            <iframe
                src={path}
                style={{ width: '100%', height: `${props.height ?? 300}px` }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <CodeSandbox url={sandboxUrl} />
                <a
                    target="#blank"
                    href={path}
                    className="material-symbols-outlined"
                >
                    open_in_new
                </a>
            </div>
        </div>
    );
};

export const CodeRunner = (props: { id: string; height: number }) => {
    const [framework] = useActiveFramework();

    return (
        <BrowserOnly>
            {() => (
                <_CodeRunner {...props} framework={framework.toLowerCase()} />
            )}
        </BrowserOnly>
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
