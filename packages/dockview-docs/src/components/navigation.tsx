import * as React from 'react';
import { Page } from '../references/pages';
import Link from 'next/link';

const LinkHeader = (props: { url: string; title: string }) => {
    return (
        <Link href={props.url}>
            <a>{props.title}</a>
        </Link>
    );
};

export const CollapsibleNode = (props: {
    page: Page;
    children: React.ReactNode;
    depth: number;
}) => {
    const [expanded, setExpaned] = React.useState<boolean>(false);

    const onClick = () => {
        setExpaned(!expanded);
    };

    const cn = React.useMemo(() => {
        return ['node', expanded ? 'expanded' : 'collapsed'].join(' ');
    }, [expanded]);

    return (
        <>
            <div className={cn} onClick={onClick}>
                {props.page.url ? (
                    <LinkHeader url={props.page.url} title={props.page.title} />
                ) : (
                    props.page.title
                )}
            </div>
            <div
                className="node"
                style={{
                    display: expanded ? '' : 'none',
                    overflow: 'hidden',
                    marginLeft: `${props.depth * 8}px`,
                }}
            >
                {props.children}
            </div>
        </>
    );
};

export const Node = (props: { page: Page; depth: number }) => {
    if (props.page.routes) {
        return (
            <CollapsibleNode page={props.page} depth={props.depth + 1}>
                {props.page.routes.map((page) => (
                    <Node
                        key={page.title}
                        page={page}
                        depth={props.depth + 1}
                    />
                ))}
            </CollapsibleNode>
        );
    }

    return (
        <div className="node">
            {props.page.url ? (
                <LinkHeader url={props.page.url} title={props.page.title} />
            ) : (
                props.page.title
            )}
        </div>
    );
};

export const Navigation = (props: { pages: Page[] }) => {
    return (
        <div
            className="navigation"
            style={{ position: 'sticky', top: '20px', left: '20px' }}
        >
            {props.pages.map((page) => (
                <Node key={page.title} page={page} depth={0} />
            ))}
        </div>
    );
};
