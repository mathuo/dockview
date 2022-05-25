import * as React from 'react';
import './console.scss';

const formatTime = (now: Date) => {
    const pad = (x: number) => (x < 10 ? `0${x}` : `${x}`);

    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
        now.getSeconds()
    )}.${now.getMilliseconds()}`;
};

export interface Line {
    timestamp: Date;
    text: string;
    css?: React.CSSProperties;
}

export interface IConsoleProps {
    lines: Line[];
}

export const Console = (props: IConsoleProps) => {
    const ref = React.useRef<HTMLDivElement>();

    React.useLayoutEffect(() => {
        if (!ref.current) {
            return;
        }

        ref.current.scrollTop = Math.max(
            0,
            ref.current.scrollHeight - ref.current.clientHeight
        );
    }, [props.lines]);

    return (
        <div ref={ref} className="console-container">
            {props.lines.map((line, i) => {
                return (
                    <div key={i} className="console-line">
                        <span className="console-line-timestamp">
                            {formatTime(line.timestamp)}
                        </span>
                        <span className="console-line-text" style={line.css}>
                            {line.text}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};
