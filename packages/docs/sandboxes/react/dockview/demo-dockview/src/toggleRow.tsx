import * as React from 'react';

export const ToggleRow = (props: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (v: string) => void;
}) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 16px',
            minHeight: 30,
        }}
    >
        <span style={{ flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
            {props.label}
        </span>
        <div
            style={{
                display: 'flex',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 4,
                border: '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden',
            }}
        >
            {props.options.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => props.onChange(opt.value)}
                    style={{
                        padding: '3px 8px',
                        fontSize: 11,
                        border: 'none',
                        cursor: 'pointer',
                        background:
                            props.value === opt.value
                                ? 'rgba(255,255,255,0.15)'
                                : 'transparent',
                        color:
                            props.value === opt.value
                                ? 'white'
                                : 'rgba(255,255,255,0.5)',
                    }}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    </div>
);
