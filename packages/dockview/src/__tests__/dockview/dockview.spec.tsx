import * as React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import {
    DockviewApi,
    DockviewReadyEvent,
    IDockviewPanel,
    IDockviewPanelProps,
} from 'dockview-core';
import { DockviewReact } from '../../dockview/dockview';
import { setMockRefElement } from '../__test_utils__/utils';

describe('gridview react', () => {
    let components: Record<
        string,
        React.FunctionComponent<IDockviewPanelProps>
    >;

    beforeEach(() => {
        components = {
            default: (props: IDockviewPanelProps) => {
                return (
                    <div>
                        {Object.keys(props.params).map((key) => {
                            return (
                                <div
                                    key={key}
                                >{`key=${key},value=${props.params[key]}`}</div>
                            );
                        })}
                    </div>
                );
            },
        };
    });

    test('default', () => {
        let api: DockviewApi | undefined;

        const onReady = (event: DockviewReadyEvent) => {
            api = event.api;
        };

        render(<DockviewReact components={components} onReady={onReady} />);

        expect(api).toBeTruthy();
    });

    test('is sized to container', () => {
        const el = document.createElement('div');

        jest.spyOn(el, 'clientHeight', 'get').mockReturnValue(450);
        jest.spyOn(el, 'clientWidth', 'get').mockReturnValue(650);

        setMockRefElement(el);

        let api: DockviewApi | undefined;

        const onReady = (event: DockviewReadyEvent) => {
            api = event.api;
        };

        render(<DockviewReact components={components} onReady={onReady} />);

        expect(api!.width).toBe(650);
        expect(api!.height).toBe(450);
    });

    test('that the component can update parameters', async () => {
        let api: DockviewApi;

        const onReady = (event: DockviewReadyEvent) => {
            api = event.api;
        };

        const wrapper = render(
            <DockviewReact components={components} onReady={onReady} />
        );

        let panel: IDockviewPanel;

        act(() => {
            panel = api!.addPanel({
                id: 'panel_1',
                component: 'default',
                params: {
                    keyA: 'valueA',
                    keyB: 'valueB',
                },
            });
        });

        await waitFor(() => {
            expect(
                wrapper.queryByText(/key=keyA,value=valueA/i)
            ).toBeInTheDocument();
            expect(
                wrapper.queryByText(/key=keyB,value=valueB/i)
            ).toBeInTheDocument();
        });

        act(() => {
            panel.api.updateParameters({ keyA: 'valueAA', keyC: 'valueC' });
        });

        await waitFor(() => {
            expect(
                wrapper.queryByText(/key=keyA,value=valueAA/i)
            ).toBeInTheDocument();
            expect(
                wrapper.queryByText(/key=keyB,value=valueB/i)
            ).toBeInTheDocument();
            expect(
                wrapper.queryByText(/key=keyC,value=valueC/i)
            ).toBeInTheDocument();
        });

        act(() => {
            panel.api.updateParameters({ keyC: null });
        });

        await waitFor(() => {
            expect(
                wrapper.queryByText(/key=keyA,value=valueAA/i)
            ).toBeInTheDocument();
            expect(
                wrapper.queryByText(/key=keyB,value=valueB/i)
            ).toBeInTheDocument();
            expect(
                wrapper.queryByText(/key=keyC,value=null/i)
            ).toBeInTheDocument();
        });

        act(() => {
            panel.api.updateParameters({ keyA: undefined });
        });

        await waitFor(() => {
            expect(wrapper.queryByText(/key=keyA/i)).not.toBeInTheDocument();
            expect(
                wrapper.queryByText(/key=keyB,value=valueB/i)
            ).toBeInTheDocument();
            expect(
                wrapper.queryByText(/key=keyC,value=null/i)
            ).toBeInTheDocument();
        });
    });
});
