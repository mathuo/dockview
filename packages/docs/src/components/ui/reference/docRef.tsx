import * as React from 'react';
import CodeBlock from '@theme/CodeBlock';
import './docRef.scss';

export interface DocRefProps {
    declaration: string;
}

import docsJson from '../../../generated/api.output.json';

type DocsContent = { kind: string; text: string; tag?: string };
type DocsJson = {
    [index: string]: Array<{
        name: string;
        signature: string;
        comment?: {
            summary?: DocsContent[];
            blockTags?: Array<{ tag: string; content: DocsContent }>;
        };
        type: string;
    }>;
};

export const Markdown = (props: { children: string }) => {
    return <span>{props.children}</span>;
};

export const DocRef = (props: DocRefProps) => {
    const docs = React.useMemo(
        () => (docsJson as DocsJson)[props.declaration],
        [props.declaration]
    );

    if (!docs) {
        return null;
    }

    return (
        <div>
            <table className="doc-ref-table">
                <tbody>
                    {docs.map((doc) => {
                        return (
                            <tr>
                                <th
                                    style={{
                                        width: '30%',
                                        display: 'flex',
                                    }}
                                >
                                    <div
                                        style={{
                                            // width: '30%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'start',
                                        }}
                                    >
                                        <h6
                                            style={{
                                                fontFamily: 'monospace',
                                                fontSize: '1.2em',
                                            }}
                                        >
                                            {doc.name}
                                        </h6>
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'start',
                                            }}
                                        >
                                            {/* <span
                                                style={{
                                                    fontSize: '0.75em',
                                                    color: 'var(--ifm-color-content-secondary)',
                                                }}
                                            >
                                                {'Type'}
                                            </span>
                                            <span
                                                style={{
                                                    color: 'var(--ifm-color-primary)',
                                                }}
                                            >
                                                {doc.type}
                                            </span> */}
                                        </div>
                                    </div>
                                </th>
                                <th
                                // style={{ width: '70%' }}
                                >
                                    {/* <div>{'-'}</div> */}
                                    <div>
                                        <CodeBlock language="tsx">
                                            {doc.signature}
                                        </CodeBlock>
                                    </div>
                                </th>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
