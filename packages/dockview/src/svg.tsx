import React from 'react';

export const CloseButton = () => (
    <svg
        height="11"
        width="11"
        viewBox="0 0 28 28"
        aria-hidden={'false'}
        focusable={false}
        className="dockview-svg"
    >
        <path d="M2.1 27.3L0 25.2L11.55 13.65L0 2.1L2.1 0L13.65 11.55L25.2 0L27.3 2.1L15.75 13.65L27.3 25.2L25.2 27.3L13.65 15.75L2.1 27.3Z"></path>
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
            className="dockview-svg"
        >
            <path d="M12 14.15L0 2.15L2.15 0L12 9.9L21.85 0.0499992L24 2.2L12 14.15Z" />
        </svg>
    );
};
