import React from 'react';

export const CloseButton = () => (
    <svg
        height="11"
        width="11"
        viewBox="0 0 28 28"
        aria-hidden={'false'}
        focusable={false}
        className="dv-svg"
    >
        <path d="M2.1 27.3L0 25.2L11.55 13.65L0 2.1L2.1 0L13.65 11.55L25.2 0L27.3 2.1L15.75 13.65L27.3 25.2L25.2 27.3L13.65 15.75L2.1 27.3Z"></path>
    </svg>
);

export const PinButton = () => (
    <svg
        height="11"
        width="11"
        viewBox="0 0 24 24"
        aria-hidden={'false'}
        focusable={false}
        className="dv-svg"
    >
        <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H6c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"></path>
    </svg>
);

export const ExpandMore = () => {
    return (
        <svg
            width="11"
            height="11"
            viewBox="0 0 24 15"
            aria-hidden={'false'}
            focusable={false}
            className="dv-svg"
        >
            <path d="M12 14.15L0 2.15L2.15 0L12 9.9L21.85 0.0499992L24 2.2L12 14.15Z" />
        </svg>
    );
};
