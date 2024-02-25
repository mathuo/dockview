import * as React from 'react';
import { CodeSandboxButton } from './codeSandboxButton';
import BrowserOnly from '@docusaurus/BrowserOnly';

const ExampleFrame = (props: {
    framework: string;
    theme?: string;
    id: string;
    height?: string;
}) => {
    const Component = React.useMemo(
        () =>
            React.lazy(
                () =>
                    import(
                        `../../../sandboxes/${props.framework}/${props.id}/src/app`
                    )
            ),
        [props.framework, props.id]
    );

    return (
        <BrowserOnly>
            {() => (
                <React.Suspense>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            flexGrow: 1,
                        }}
                    >
                        <div
                            style={{
                                height: props.height ?? '500px',
                                flexGrow: 1,
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <Component theme={props.theme} />
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                            }}
                        >
                            <span style={{ width: '220px' }}>
                                <CodeSandboxButton
                                    id={`${props.framework}/${props.id}`}
                                    hideThemePicker={true}
                                />
                            </span>
                        </div>
                    </div>
                </React.Suspense>
            )}
        </BrowserOnly>
    );
};

export default ExampleFrame;
