import React from 'react';
import Highlight, { defaultProps, Language } from 'prism-react-renderer';
import theme from 'prism-react-renderer/themes/palenight';

interface CodeBlockProps {
    children: string;
    className?: string;
    live?: boolean | string;
    render?: boolean | string;
    url: string;
    code?: boolean | string;
    center?: boolean | string;
    edit?: boolean | string;
}

export const CodeBlock = ({
    children,
    className = '',
    live,
    render,
    url,
    code = true,
    center = true,
    edit = false,
}: CodeBlockProps) => {
    if (!className) {
        return (
            <code
                style={{
                    backgroundColor: 'rgba(27, 31, 35, 0.05)',
                    fontSize: '85%',
                    padding: '0.2em 0.4em',
                    margin: '0px',
                    borderRadius: '5px',
                }}
            >
                {children}
            </code>
        );
    }

    const language = className.replace(/language-/, '');

    return (
        <Highlight
            {...defaultProps}
            theme={theme}
            code={children.trim()}
            language={language as Language}
        >
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <pre
                    className={className}
                    style={{ ...style, padding: '20px' }}
                >
                    {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line, key: i })}>
                            {line.map((token, key) => (
                                <span
                                    key={key}
                                    {...getTokenProps({ token, key })}
                                />
                            ))}
                        </div>
                    ))}
                </pre>
            )}
        </Highlight>
    );
};
