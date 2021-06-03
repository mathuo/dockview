import * as React from 'react';
import './splitview.css';

const min = 100;
const max = 300;

interface IDebugResize {
    leftmin: number;
    leftmax: number;
    rightmin: number;
    rightmax: number;
    min: number;
    max: number;
}

const resize = (
    index: number,
    delta: number,
    sizes: number[],
    mode: number
) => {
    const nextSizes = [...sizes];

    const left = nextSizes.filter((_, i) => i <= index);
    const right = nextSizes.filter((_, i) => i > index);

    let result: IDebugResize = {
        leftmin: undefined,
        leftmax: undefined,
        rightmin: undefined,
        rightmax: undefined,
        max: undefined,
        min: undefined,
    };

    // step 3
    if (mode > 2) {
        const leftMinimumsDelta = left
            .map((x) => min - x)
            .reduce((x, y) => x + y, 0);
        const leftMaximumsDelta = left
            .map((x) => max - x)
            .reduce((x, y) => x + y, 0);
        const rightMinimumsDelta = right
            .map((x) => x - min)
            .reduce((x, y) => x + y, 0);
        const rightMaximumsDelta = right
            .map((x) => x - max)
            .reduce((x, y) => x + y, 0);
        const _min = Math.max(leftMinimumsDelta, rightMaximumsDelta);
        const _max = Math.min(leftMaximumsDelta, rightMinimumsDelta);
        const clamp = Math.max(_min, Math.min(_max, delta));

        result = {
            leftmin: leftMinimumsDelta,
            leftmax: leftMaximumsDelta,
            rightmin: rightMinimumsDelta,
            rightmax: rightMaximumsDelta,
            max: _max,
            min: _min,
        };
        delta = clamp;
    }

    let usedDelta = 0;
    let remainingDelta = delta;

    // Step 1
    for (let i = left.length - 1; i > -1; i--) {
        const x = Math.max(min, Math.min(max, left[i] + remainingDelta));
        const viewDelta = x - left[i];
        usedDelta += viewDelta;
        remainingDelta -= viewDelta;
        left[i] = x;
    }

    // Step 2
    if (mode > 1) {
        for (let i = 0; i < right.length; i++) {
            const x = Math.max(min, Math.min(max, right[i] - usedDelta));
            const viewDelta = x - right[i];
            usedDelta += viewDelta;
            right[i] = x;
        }
    }

    return { ...result, sizes: [...left, ...right] };
};

interface ILayoutState {
    sashes: number[];
    views: number[];
    deltas: number[];
    left: number;
    right: number;
    debug: IDebugResize;
    drag: number;
}

export const Splitview = (props: { mode: number; debug: boolean }) => {
    // keep the sashes and views in one state to prevent weird out-of-sync-ness
    const [layout, setLayout] = React.useState<ILayoutState>({
        sashes: [200, 400, 600],
        views: [200, 200, 200, 200],
        deltas: [0, 0, 0, 0],
        left: 0,
        right: 0,
        debug: undefined,
        drag: -1,
    });

    const ref = React.useRef<HTMLDivElement>();

    const onMouseDown = (index: number) => (ev: React.MouseEvent) => {
        const start = ev.clientX;
        const sizes = [...layout.views];

        const mousemove = (ev: MouseEvent) => {
            const current = ev.clientX;
            const delta = current - start;
            const {
                sizes: nextLayout,
                rightmin,
                rightmax,
                leftmin,
                leftmax,
                max,
                min,
            } = resize(index, delta, sizes, props.mode);
            const sashes = nextLayout.reduce(
                (x, y) => [...x, y + (x.length === 0 ? 0 : x[x.length - 1])],
                []
            );
            sashes.splice(sashes.length - 1, 1);
            const deltas = sizes.map((x, i) => nextLayout[i] - x);

            const offset = start - ref.current?.getBoundingClientRect().left;

            setLayout({
                views: nextLayout,
                sashes,
                deltas,
                left: deltas
                    .filter((_, i) => i <= index)
                    .reduce((x, y) => x + y, 0),
                right: deltas
                    .filter((_, i) => i > index)
                    .reduce((x, y) => x + y, 0),
                debug: {
                    leftmax: leftmax + offset,
                    leftmin: leftmin + offset,
                    rightmax: rightmax + offset,
                    rightmin: rightmin + offset,
                    min: min + offset,
                    max: max + offset,
                },
                drag: index,
            });
        };

        const end = (ev: MouseEvent) => {
            document.removeEventListener('mousemove', mousemove);
            document.removeEventListener('mouseup', end);
            setLayout((_) => ({
                ..._,
                deltas: _.deltas.map((_) => 0),
                left: 0,
                right: 0,
                drag: -1,
            }));
        };

        document.addEventListener('mousemove', mousemove);
        document.addEventListener('mouseup', end);
    };

    const extras = React.useMemo(() => {
        if (!props.debug || !layout.debug || props.mode < 3) {
            return null;
        }
        return (
            <>
                <div
                    style={{
                        left: `${layout.debug.leftmax - 40}px`,
                        top: '-30px',
                    }}
                    className="debug-sash-text"
                >
                    left-max
                </div>
                <div
                    style={{
                        left: `${layout.debug.leftmin - 40}px`,
                        top: '-30px',
                    }}
                    className="debug-sash-text"
                >
                    left-min
                </div>
                <div
                    style={{
                        left: `${layout.debug.rightmax - 40}px`,
                        bottom: '-30px',
                    }}
                    className="debug-sash-text"
                >
                    right-max
                </div>
                <div
                    style={{
                        left: `${layout.debug.rightmin - 40}px`,
                        bottom: '-30px',
                    }}
                    className="debug-sash-text"
                >
                    right-min
                </div>
                <div
                    className="debug-sash-max"
                    style={{
                        left: `${layout.debug.leftmax - 1}px`,
                        border: '2px solid purple',
                    }}
                />
                <div
                    className="debug-sash-max"
                    style={{
                        left: `${layout.debug.leftmin - 1}px`,
                        border: '2px solid green',
                    }}
                />
                <div
                    className="debug-sash-min"
                    style={{
                        left: `${layout.debug.rightmax - 1}px`,
                        border: '2px solid cyan',
                    }}
                />
                <div
                    className="debug-sash-min"
                    style={{
                        left: `${layout.debug.rightmin - 1}px`,
                        border: '2px solid pink',
                    }}
                />
            </>
        );
    }, [layout.debug]);

    return (
        <div
            style={{
                marginBottom: '40px',
                marginTop: '30px',
                backgroundColor: 'gray',
            }}
        >
            {props.debug && (
                <div style={{ marginBottom: extras ? '25px' : '0px' }}>
                    <span>{`Change to left ${layout?.left}`}</span>
                    <span
                        style={{
                            marginLeft: '10px',
                            backgroundColor:
                                -layout?.right !== layout?.left ? 'red' : '',
                        }}
                    >{`Change to right ${layout?.right}`}</span>
                    <span
                        style={{ marginLeft: '10px' }}
                    >{`Total size ${layout?.views.reduce(
                        (x, y) => x + y,
                        0
                    )}`}</span>
                </div>
            )}
            <div
                ref={ref}
                style={{
                    height: '100px',
                    width: '100%',
                    position: 'relative',
                    backgroundColor: 'dimgray',
                }}
            >
                <div className="sash-container">
                    {layout.sashes.map((x, i) => {
                        const className =
                            layout.drag === i ? 'sash drag-sash' : 'sash';
                        return (
                            <div
                                key={i}
                                onMouseDown={onMouseDown(i)}
                                style={{
                                    left: `${x - 2}px`,
                                }}
                                className={className}
                            ></div>
                        );
                    })}
                    {extras}
                </div>
                <div className="view-container">
                    {layout.views.map((x, i) => {
                        const isMax = x >= max;
                        const isMin = x <= min;

                        return (
                            <div
                                key={i}
                                style={{
                                    left: `${
                                        i === 0 ? 0 : layout.sashes[i - 1]
                                    }px`,
                                    width: `${x}px`,
                                }}
                                className="view"
                            >
                                {props.debug && (
                                    <>
                                        <div>
                                            {`${layout.views[i]} (${
                                                layout.deltas[i] > -1 ? '+' : ''
                                            }${layout.deltas[i]})`}
                                        </div>
                                        <div
                                            style={{ fontSize: '12px' }}
                                        >{`isMin = ${isMin}`}</div>
                                        <div
                                            style={{ fontSize: '12px' }}
                                        >{`isMax = ${isMax}`}</div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
