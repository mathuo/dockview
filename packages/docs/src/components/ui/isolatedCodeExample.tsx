import * as React from 'react';

export const IsolatedCodeExample = (props: {
    id: string;
    framework: string;
    height: number;
}) => {
    const path = `/templates/${props.id}/${props.framework}/index.html`;
    return (
        <iframe
            src={path}
            style={{ width: '100%', height: `${props.height ?? 300}px` }}
        />
        
    );
};
