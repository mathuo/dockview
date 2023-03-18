import useBaseUrl from '@docusaurus/useBaseUrl';
import * as React from 'react';
import './container.scss';

const createSvgElementFromPath = (params: {
    height: string;
    width: string;
    viewbox: string;
    path: string;
}) => {
    return (
        <svg
            height={params.height}
            width={params.width}
            viewBox={params.viewbox}
            focusable={false}
            className={'dockview-svg'}
        >
            <path d={params.path} />
        </svg>
    );
};

export const CreateCloseButton = () =>
    createSvgElementFromPath({
        width: '16',
        height: '16',
        viewbox: '0 0 50 58',
        path: 'M22.5581 50.9938V30.1717L4.65116 19.869V31.7386L12.8536 36.4939V45.4198L22.5581 50.9938ZM27.2093 51.1162L37.0931 45.4226V36.2851L45.3488 31.501V19.7801L27.2093 30.2529V51.1162ZM42.9633 15.7867L33.4288 10.2615L25.0571 15.1193L16.6219 10.2567L7.00237 15.8557L24.9542 26.1842L42.9633 15.7867ZM0 43.4008V14.5498L24.9974 0L50 14.4887V43.3552L24.9969 57.7584L0 43.4008Z',
    });

export const Container = (props: {
    children: React.ReactNode;
    height?: number;
}) => {
    return (
        <>
            <div
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

                <span
                    className="codesandbox-button"
                    style={{ display: 'flex', alignItems: 'center' }}
                >
                    <span className="codesandbox-button-pretext">{`Open in `}</span>
                    <a
                        href="https://www.google.com"
                        target={'_blank'}
                        className="codesandbox-button-content"
                    >
                        <span
                            style={{ fontWeight: 'bold', paddingRight: '4px' }}
                        >
                            CodeSandbox
                        </span>
                        <CreateCloseButton />
                    </a>
                </span>
                {/* <span
                    style={{ fontSize: '16px' }}
                    className="material-symbols-outlined"
                >
                    open_in_new
                </span> */}
            </div>
        </>
    );
};
