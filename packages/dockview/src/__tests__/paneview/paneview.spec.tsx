import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { IPaneviewPanel, PaneviewApi } from 'dockview-core';
import {
    IPaneviewPanelProps,
    PaneviewReact,
    PaneviewReadyEvent,
} from '../../paneview/paneview';
import { setMockRefElement } from '../__test_utils__/utils';

describe('gridview react', () => {
    let components: Record<
        string,
        React.FunctionComponent<IPaneviewPanelProps>
    >;

    beforeEach(() => {
        components = {
            default: (props: IPaneviewPanelProps) => {
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
        let api: PaneviewApi | undefined;

        const onReady = (event: PaneviewReadyEvent) => {
            api = event.api;
        };

        render(<PaneviewReact components={components} onReady={onReady} />);

        expect(api).toBeTruthy();
    });

    test('is sized to container', () => {
        setMockRefElement({
            clientHeight: 450,
            clientWidth: 650,
            appendChild: jest.fn(),
        });
        let api: PaneviewApi | undefined;

        const onReady = (event: PaneviewReadyEvent) => {
            api = event.api;
        };

        render(<PaneviewReact components={components} onReady={onReady} />);

        expect(api!.width).toBe(650);
        expect(api!.height).toBe(450);
    });

    test('that the component can update parameters', async () => {
        let api: PaneviewApi;

        const onReady = (event: PaneviewReadyEvent) => {
            api = event.api;
        };

        const wrapper = render(
            <PaneviewReact components={components} onReady={onReady} />
        );

        let panel: IPaneviewPanel;

        act(() => {
            panel = api!.addPanel({
                id: 'panel_1',
                component: 'default',
                title: 'Panel 1',
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
