import * as React from 'react';
import CodeBlock from '@theme/CodeBlock';
import './docRef.scss';

export interface DocRefProps {
    declaration: string;
}

import docsJson from '../../../generated/api.output.json';

type DocsContent = { kind: string; text: string; tag?: string };
type DocsTag = { tag: string; content: DocsContent[] };
type DocsComment = {
    summary?: DocsContent[];
    blockTags?: DocsTag[];
};
type DocsJson = {
    [index: string]: Array<{
        name: string;
        code: string;
        comment?: DocsComment;
        kind: 'accessor' | 'property' | 'method';
    }>;
};

export const Text = (props: { content: DocsContent[] }) => {
    return (
        <div className="doc-text">
            {props.content.map((piece, i) => {
                switch (piece.kind) {
                    case 'text': {
                        return <span key={i}>{piece.text}</span>;
                    }
                    case 'code':
                        return (
                            <code key={i}>
                                {piece.text.substring(1, piece.text.length - 1)}
                            </code>
                        );
                    default:
                        throw new Error(`unhandled piece ${piece.kind}`);
                }
            })}
        </div>
    );
};

export const Tags = (props: { tags: DocsTag[] }) => {
    return (
        <div>
            {props.tags.map((tag, i) => {
                return (
                    <div key={i}>
                        <div>{tag.tag}</div>
                        <Text content={tag.content} />
                    </div>
                );
            })}
        </div>
    );
};

export const Summary = (props: { summary: DocsComment }) => {
    return (
        <div>
            <Text content={props.summary.summary ?? []} />
            {/* <Tags tags={props.summary.blockTags ?? []} /> */}
        </div>
    );
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
                                        <div>
                                            {doc.comment && (
                                                <Summary
                                                    summary={doc.comment}
                                                />
                                            )}
                                        </div>
                                        <CodeBlock language="tsx">
                                            {doc.code}
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
