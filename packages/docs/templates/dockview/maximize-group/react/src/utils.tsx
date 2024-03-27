import React from 'react';

export const Icon = (props: {
    icon: string;
    title?: string;
    onClick?: (event: React.MouseEvent) => void;
}) => {
    return (
        <div
            title={props.title}
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '30px',
                height: '100%',

                fontSize: '18px',
            }}
            onClick={props.onClick}
        >
            <span
                style={{ fontSize: 'inherit', cursor: 'pointer' }}
                className="material-symbols-outlined"
            >
                {props.icon}
            </span>
        </div>
    );
};
