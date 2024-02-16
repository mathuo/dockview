import * as React from 'react';
import { CodeSandboxButton } from './codeSandboxButton';

const ExampleFrame = (props: {
    framework: string;
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
        <React.Suspense>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: props.height ?? '500px' }}>
                    <Component />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ width: '220px' }}>
                        <CodeSandboxButton
                            id={`${props.framework}/${props.id}`}
                            hideThemePicker={true}
                        />
                    </span>
                </div>
            </div>
        </React.Suspense>
    );
};

export default ExampleFrame;