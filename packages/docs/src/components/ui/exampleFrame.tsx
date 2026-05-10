import * as React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { DockviewTheme } from 'dockview-react';

const ExampleFrame = (props: {
    framework: string;
    theme?: DockviewTheme;
    id: string;
    height?: string;
    extraProps?: Record<string, unknown>;
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
                            height: props.height ?? '500px',
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <Component
                            theme={props.theme}
                            {...props.extraProps}
                        />
                    </div>
                </React.Suspense>
            )}
        </BrowserOnly>
    );
};

export default ExampleFrame;
