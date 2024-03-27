import React from 'react';

export type LogLine = {
    text: string;
    timestamp?: Date;
    backgroundColor?: string;
};

export const LogLines = (props: { lines: LogLine[] }) => {
    return props.lines.map((line, i) => {
        return (
            <div
                style={{
                    height: '30px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: line.backgroundColor,
                }}
                key={i}
            >
                <span
                    style={{
                        display: 'inline-block',
                        width: '20px',
                        color: 'gray',
                        borderRight: '1px solid gray',
                        marginRight: '4px',
                        paddingLeft: '2px',
                        height: '100%',
                    }}
                >
                    {props.lines.length - i}
                </span>
                <span>
                    {line.timestamp && (
                        <span
                            style={{
                                fontSize: '0.7em',
                                padding: '0px 2px',
                            }}
                        >
                            {line.timestamp.toISOString().substring(11, 23)}
                        </span>
                    )}
                    <span>{line.text}</span>
                </span>
            </div>
        );
    });
};
