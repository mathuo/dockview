import * as React from 'react';
import clsx from 'clsx';
import { Highlight } from 'prism-react-renderer';
import { usePrismTheme } from '@docusaurus/theme-common';
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

// The set of declaration names that have their own entry in the generated docs
// and can therefore be linked/expanded when they appear inside a type.
const LINKABLE_TYPES = new Set(Object.keys(newJson));

// Guard against runaway nesting when a type transitively references itself.
const MAX_EXPANSION_DEPTH = 6;

const humanKind: Record<string, string> = {
    interface: 'interface',
    class: 'class',
    typeAlias: 'type',
    enum: 'enum',
    function: 'function',
};

/**
 * Render a codified type signature with syntax highlighting, turning any
 * reference to another documented dockview type into a clickable token. Clicking
 * a token expands that type's definition inline so the underlying representation
 * can be inspected (and drilled into) without leaving the page.
 */
const TypeCode = (props: { code: string; depth?: number }) => {
    const depth = props.depth ?? 0;
    const prismTheme = usePrismTheme();
    const [expanded, setExpanded] = React.useState<string[]>([]);

    const toggle = React.useCallback((name: string) => {
        setExpanded((prev) =>
            prev.includes(name)
                ? prev.filter((n) => n !== name)
                : [...prev, name]
        );
    }, []);

    return (
        <div className="doc-code-block">
            <Highlight
                theme={prismTheme}
                code={props.code}
                language="tsx"
            >
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                    <pre className={clsx(className, 'doc-code')} style={style}>
                        {tokens.map((line, i) => (
                            <div {...getLineProps({ line })} key={i}>
                                {line.map((token, key) => {
                                    const tokenProps = getTokenProps({ token });
                                    const name = token.content.trim();
                                    const isLinkable =
                                        depth < MAX_EXPANSION_DEPTH &&
                                        LINKABLE_TYPES.has(name) &&
                                        !token.types.includes('string') &&
                                        !token.types.includes('comment');

                                    if (!isLinkable) {
                                        return <span {...tokenProps} key={key} />;
                                    }

                                    return (
                                        <span
                                            {...tokenProps}
                                            key={key}
                                            className={clsx(
                                                tokenProps.className,
                                                'doc-type-link',
                                                expanded.includes(name) &&
                                                    'doc-type-link--active'
                                            )}
                                            role="button"
                                            tabIndex={0}
                                            title={`Show ${name}`}
                                            onClick={() => toggle(name)}
                                            onKeyDown={(e) => {
                                                if (
                                                    e.key === 'Enter' ||
                                                    e.key === ' '
                                                ) {
                                                    e.preventDefault();
                                                    toggle(name);
                                                }
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </pre>
                )}
            </Highlight>
            {expanded.map((name) => {
                const target = newJson[name];
                const targetCode = target ? codify(target) : null;
                return (
                    <div className="doc-type-expansion" key={name}>
                        <div className="doc-type-expansion__header">
                            <span className="doc-type-expansion__title">
                                {humanKind[target?.kind] ?? 'type'} {name}
                            </span>
                            <button
                                type="button"
                                className="doc-type-expansion__close"
                                onClick={() => toggle(name)}
                                aria-label={`Hide ${name}`}
                            >
                                ×
                            </button>
                        </div>
                        {targetCode ? (
                            <TypeCode code={targetCode} depth={depth + 1} />
                        ) : (
                            <span>{`No definition available for '${name}'`}</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export const DocumentRef = (props: { value: TypeSystem.Type }) => {
    const code = React.useMemo(() => {
        if (!props.value) {
            return null;
        }

        switch (props.value.kind) {
            case 'typeAlias':
                return codify(props.value);
            case 'interface':
                return codify(props.value);
            case 'class':
                return codify(props.value);
            case 'function':
                return codify(props.value);
            default:
                return null;
        }
    }, [props.value]);

    if (!code) {
        return null;
    }

    return <TypeCode code={code} />;
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
                    case 'inline-tag':
                        // e.g. `{@link SomeType}` — render the referenced symbol
                        // name as inline code.
                        return <code key={i}>{piece.text}</code>;
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
            <Tags tags={props.summary.blockTags ?? []} />
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
                    <TypeCode code={codify(props.doc) ?? ''} />
                </div>
            </th>
        </tr>
    );
};

function filter(docs: TypeSystem.Type, methods: string[]) {
    if (docs.kind === 'typeAlias') {
        if (docs.type.type === 'intersection') {
            return docs.type.values
                .map((value) => newJson[(value as any).value])
                .map((v) => filter(v, methods))
                .flat();
        }

        return [docs];
    }

    if (docs.kind === 'class' || docs.kind === 'interface') {
        const extended = docs.extends.flatMap((name) =>
            filter(newJson[name], methods)
        );

        return extended.concat(
            docs.children.filter((child) => {
                if (methods && !methods.includes(child.name)) {
                    return false;
                }
                return true;
            })
        );
    }

    return [];
}

export const DocRef = (props: DocRefProps) => {
    const docs = React.useMemo(
        () => newJson[props.declaration],
        [props.declaration]
    );

    const filteredDocs = React.useMemo(() => {
        if (!docs) {
            return [];
        }
        // A type can surface the same member more than once. TypeDoc sometimes
        // inlines inherited members into an interface that also records an
        // `extends`, so a member appears via both paths. Collapse by name,
        // letting the most-derived declaration win.
        const byName = new Map<string, TypeSystem.Type>();
        for (const row of filter(docs, props.methods)) {
            byName.set((row as any).name, row);
        }
        return Array.from(byName.values());
    }, [docs]);

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
                            {/* <th colSpan={2}>
                                {firstLevel(doc).map((x) => (
                                    <span style={{ padding: '0px 2px' }}>
                                        <DocumentRef value={newJson[x]} />
                                    </span>
                                ))}
                            </th> */}
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
