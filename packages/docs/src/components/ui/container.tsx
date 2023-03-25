import * as React from 'react';
import { CodeSandboxButton } from './codeSandboxButton';

export const Container = (props: {
    children?: React.ReactNode;
    height?: number;
    injectVanillaJS?: (parent: HTMLElement) => void;
    sandboxId?: string;
}) => {
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!props.injectVanillaJS) {
            return;
        }

        props.injectVanillaJS(ref.current);
    }, [props.injectVanillaJS]);

    return (
        <>
            <div
                ref={ref}
                style={{
                    height: props.height ? `${props.height}px` : '300px',
                }}
            >
                {props.children}
            </div>
            <div
                style={{
                    padding: '2px 0px',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '14px',
                }}
            >
                <span style={{ flexGrow: 1 }} />
                {props.sandboxId && <CodeSandboxButton id={props.sandboxId} />}
            </div>
        </>
    );
};
