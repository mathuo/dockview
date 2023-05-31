import * as React from 'react';
import { CodeSandboxButton } from './codeSandboxButton';
import useBaseUrl from '@docusaurus/useBaseUrl';
import './container.scss';
import { Spinner } from './spinner';

export const Container = (props: {
    children?: React.ReactNode;
    height?: number;
    injectVanillaJS?: (parent: HTMLElement) => void;
    sandboxId?: string;
}) => {
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!props.injectVanillaJS) {
            return;
        }

        props.injectVanillaJS(ref.current);
    }, [props.injectVanillaJS]);

    return (
        <>
            <div
                ref={ref}
                style={{
                    height: props.height ? `${props.height}px` : '300px',
                }}
            >
                {props.children}
            </div>
            <div
                style={{
                    padding: '2px 0px',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '14px',
                }}
            >
                <span style={{ flexGrow: 1 }} />
                {props.sandboxId && <CodeSandboxButton id={props.sandboxId} />}
            </div>
        </>
    );
};

const ReactIcon = (props: { height: number; width: number }) => {
    return (
        <img
            // className="dockview-svg"
            style={{ marginRight: '0px 4px' }}
            height={props.height}
            width={props.width}
            src={useBaseUrl('img/react-icon.svg')}
        />
    );
};

const JavascriptIcon = (props: { height: number; width: number }) => {
    return (
        <img
            // className="dockview-svg "
            style={{ marginRight: '0px 4px' }}
            height={props.height}
            width={props.width}
            src={useBaseUrl('img/js-icon.svg')}
        />
    );
};

const themes = [
    'dockview-theme-dark',
    'dockview-theme-light',
    'dockview-theme-vs',
    'dockview-theme-dracula',
    'dockview-theme-replit',
];

export const ThemePicker = () => {
    const [theme, setTheme] = React.useState<string>(
        localStorage.getItem('dv-theme-class-name') || themes[0]
    );

    React.useEffect(() => {
        localStorage.setItem('dv-theme-class-name', theme);
        window.dispatchEvent(new StorageEvent('storage'));
    }, [theme]);

    return (
        <div
            style={{
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                padding: '0px 0px 0px 4px',
            }}
        >
            <span style={{ paddingRight: '4px' }}>{'Theme: '}</span>
            <select
                style={{ backgroundColor: 'inherit', color: 'inherit' }}
                onChange={(e) => setTheme(e.target.value)}
                value={theme}
            >
                {themes.map((theme) => (
                    <option key={theme} value={theme}>
                        {theme}
                    </option>
                ))}
            </select>
        </div>
    );
};

export const MultiFrameworkContainer = (props: {
    react: React.FC;
    typescript: (parent: HTMLElement) => { dispose: () => void };
    sandboxId: string;
    height?: number;
}) => {
    const ref = React.useRef<HTMLDivElement>(null);

    const [framework, setFramework] = React.useState<string>('React');

    const [animation, setAnimation] = React.useState<boolean>(false);

    React.useEffect(() => {
        setAnimation(true);

        setTimeout(() => {
            setAnimation(false);
        }, 500);
    }, [framework]);

    React.useEffect(() => {
        if (!ref.current) {
            return;
        }

        if (framework === 'Javascript') {
            const disposable = props.typescript(ref.current);

            return () => {
                disposable.dispose();
            };
        }

        return;
    }, [props.typescript, framework]);

    const sandboxId = React.useMemo(() => {
        if (framework === 'Javascript') {
            return `javascript/${props.sandboxId}`;
        }
        return props.sandboxId;
    }, [props.sandboxId, framework]);

    return (
        <>
            <div
                ref={ref}
                style={{
                    position: 'relative',
                    height: props.height ? `${props.height}px` : '300px',
                }}
            >
                {animation && (
                    <div
                        style={{
                            background: 'rgba(30,30,30)',
                            position: 'absolute',
                            zIndex: 9999,
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Spinner />
                    </div>
                )}
                {framework === 'React' && <props.react />}
            </div>
            <div
                style={{
                    margin: '2px 0px',
                    padding: '2px 0px',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '14px',
                    height: '24px',
                }}
            >
                <div
                    className="framework-button"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                    }}
                >
                    {framework === 'React' ? (
                        <ReactIcon height={16} width={16} />
                    ) : (
                        <JavascriptIcon height={16} width={16} />
                    )}
                    <select
                        style={{
                            border: 'none',
                            fontWeight: 'bold',
                            backgroundColor: 'inherit',
                            cursor: 'inherit',
                            color: 'inherit',
                            height: '24px',
                        }}
                        onChange={(e) => {
                            const target = e.target as HTMLSelectElement;
                            setFramework(target.value);
                        }}
                    >
                        <option value="React">{'React'}</option>
                        <option value="Javascript">{'Javascript'}</option>
                    </select>
                </div>
                <span style={{ flexGrow: 1 }} />
                <ThemePicker />
                <CodeSandboxButton id={sandboxId} />
            </div>
        </>
    );
};
