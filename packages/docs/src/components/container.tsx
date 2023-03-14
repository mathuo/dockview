import * as React from 'react';

export const Container = (props: { children: React.ReactNode }) => {
    return (
        <div
            style={{
                height: '300px',
                margin: '20px 0px',
            }}
        >
            {props.children}
        </div>
    );
};
