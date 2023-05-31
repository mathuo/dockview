import { ReactPart } from '../../react';
import * as React from 'react';
import { render, screen, act } from '@testing-library/react';

interface TestInterface {
    valueA: string;
    valueB: number;
}

describe('react', () => {
    describe('ReactPart', () => {
        test('update underlying component via ReactPart class', () => {
            let api: ReactPart<TestInterface>;

            const onReady = (_api: ReactPart<TestInterface>) => {
                api = _api;
            };

            render(<TestWrapper onReady={onReady} component={Component} />);

            expect(api!).toBeTruthy();

            expect(screen.getByTestId('valueA').textContent).toBe('stringA');
            expect(screen.getByTestId('valueB').textContent).toBe('42');

            act(() => {
                api.update({ valueB: '32' });
            });

            expect(screen.getByTestId('valueA').textContent).toBe('stringA');
            expect(screen.getByTestId('valueB').textContent).toBe('32');

            act(() => {
                api.update({ valueA: 'anotherStringA', valueB: '22' });
            });

            expect(screen.getByTestId('valueA').textContent).toBe(
                'anotherStringA'
            );
            expect(screen.getByTestId('valueB').textContent).toBe('22');
        });
    });
});

const Component = (props: TestInterface) => {
    return (
        <div>
            <div data-testid="valueA">{props.valueA}</div>
            <div data-testid="valueB">{props.valueB}</div>
        </div>
    );
};

const TestWrapper = (props: {
    component: React.FunctionComponent<TestInterface>;
    onReady: (api: ReactPart<TestInterface>) => void;
}) => {
    const [portal, setPortal] = React.useState<React.ReactPortal[]>([]);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const cut = new ReactPart<TestInterface>(
            ref.current!,
            {
                addPortal: (portal: React.ReactPortal) => {
                    setPortal((_) => [..._, portal]);

                    return {
                        dispose: () => {
                            setPortal((_) => _.filter((_) => _ !== portal));
                        },
                    };
                },
            },
            props.component,
            {
                valueA: 'stringA',
                valueB: 42,
            }
        );

        props.onReady(cut);

        return () => {
            cut.dispose();
        };
    }, []);

    return <div ref={ref}>{portal}</div>;
};
