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

console.log(newJson);

export const DocumentRef = (props: { value: TypeSystem.Type }) => {
    if (!props.value) {
        return null;
    }

    switch (props.value.kind) {
        case 'typealias':
            return codify(props.value);
        case 'interface':
            return codify(props.value);
        case 'class':
            return codify(props.value);
        case 'function':
            return codify(props.value);
        default:
            return <div>{'error'}</div>;
    }
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
                                        <DocumentRef value={newJson[x]} />
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
