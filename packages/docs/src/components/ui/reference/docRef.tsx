import * as React from 'react';
import CodeBlock from '@theme/CodeBlock';
import './docRef.scss';

export interface DocRefProps {
    declaration: string;
    methods?: string[];
}

import docsJson_ from '../../../generated/api.output.json';
import { ExportedTypeFile, TypeSystem, codify, firstLevel } from './types';
const docsJson = docsJson_ as any as DocsJson;

type DocsContent = { kind: string; text: string; tag?: string };
type DocsTag = { tag: string; content: DocsContent[] };
type DocsComment = {
    summary?: DocsContent[];
    blockTags?: DocsTag[];
};

type Piece = {
    kind: 'return' | 'paramter' | 'signature' | 'typearg' | 'typearg_default';
    value: string;
};

type Doc = {
    name: string;
    code: string;
    comment?: DocsComment;
    kind: 'accessor' | 'property' | 'method';
    pieces: Piece[];
};

type DocJson = {
    kind: string;
    metadata?: Doc;
    children: Doc[];
};

type DocsJson = {
    [index: string]: DocJson;
};

const newJson = docsJson_ as ExportedTypeFile;

// console.log('test', (newJson['DockviewApi'] as any).children);
console.log('test', firstLevel((newJson['DockviewApi'] as any).children[29]));

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

const ClassPiece = (props: { value: DocJson; name: string }) => {
    let code = `interface ${props.name} {\n`;

    code += props.value.children
        .map((child) => {
            switch (child.kind) {
                case 'accessor':
                    return `\t${child.name}: ${child.code};`;
                case 'method':
                    return `\t${child.name}${child.code};`;
                default:
                    return null;
            }
        })
        .filter(Boolean)
        .join('\n');

    code += `\n}`;

    return <CodeBlock language="tsx">{code}</CodeBlock>;
};

const InterfacePiece = (props: { value: DocJson; name: string }) => {
    let code = `interface ${props.name} {\n`;

    code += props.value.children
        .map((child) => {
            switch (child.kind) {
                case 'property':
                    return `\t${child.name}: ${child.code};`;
                default:
                    return null;
            }
        })
        .join('\n');

    code += `\n}`;

    return <CodeBlock language="tsx">{code}</CodeBlock>;
};

const Piece = (props: { piece: string }) => {
    const item = docsJson[props.piece];

    if (!item) {
        return null;
    }

    if (item.kind === 'class') {
        return <ClassPiece name={props.piece} value={item} />;
    }

    if (item.kind === 'interface') {
        return <InterfacePiece name={props.piece} value={item} />;
    }

    if (!item.metadata?.code) {
        return null;
    }

    return <CodeBlock language="tsx">{item.metadata.code}</CodeBlock>;
};

const Row = (props: { doc: TypeSystem.Type }) => {
    const comment =
        props.doc.kind === 'accessor'
            ? props.doc.value.comment
            : props.doc.comment;
    return (
        <tr>
            <th
                style={{
                    width: '40%',
                    display: 'flex',
                }}
            >
                <div
                    style={{
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
                        {props.doc.name}
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
            <th style={{ width: '60%' }}>
                {/* <div>{'-'}</div> */}
                <div>
                    <div>{comment && <Summary summary={comment} />}</div>
                    <CodeBlock language="tsx">{codify(props.doc)}</CodeBlock>
                </div>
            </th>
        </tr>
    );
};

export const DocRef = (props: DocRefProps) => {
    const docs = React.useMemo(
        () => newJson[props.declaration],
        [props.declaration]
    );

    const filteredDocs = React.useMemo(
        () =>
            docs.kind === 'class'
                ? docs.children.filter((child) => {
                      if (
                          props.methods &&
                          !props.methods.includes(child.name)
                      ) {
                          return false;
                      }
                      return true;
                  })
                : [],
        [docs]
    );

    if (!docs) {
        return <span>{`Failed to find docs for '${props.declaration}'`}</span>;
    }

    return (
        <table className="doc-ref-table">
            <tbody>
                {filteredDocs.map((doc, i) => {
                    return (
                        <>
                            <Row key={i} doc={doc} />
                            <div>
                                {firstLevel(doc).map((x) => (
                                    <span style={{ padding: '0px 2px' }}>
                                        {x}
                                    </span>
                                ))}
                            </div>
                            {/* {doc.pieces?.map((piece) => (
                                <tr>
                                    <th colSpan={2}>
                                        <Piece piece={piece} />
                                    </th>
                                </tr>
                            ))} */}
                        </>
                    );
                })}
            </tbody>
        </table>
    );
};
