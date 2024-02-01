import * as React from 'react';

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
            <div style={{ height: props.height ?? '500px' }}>
                <Component />
            </div>
        </React.Suspense>
    );
};

export default ExampleFrame;
