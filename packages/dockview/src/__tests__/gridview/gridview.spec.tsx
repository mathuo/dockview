import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { GridviewApi, IGridviewPanel, Orientation } from 'dockview-core';
import {
    IGridviewPanelProps,
    GridviewReact,
    GridviewReadyEvent,
} from '../../gridview/gridview';
import { PanelCollection } from '../../types';
import { setMockRefElement } from '../__test_utils__/utils';

describe('gridview react', () => {
    let components: PanelCollection<IGridviewPanelProps>;

    beforeEach(() => {
        components = {
            default: (props: IGridviewPanelProps) => {
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
        let api: GridviewApi | undefined;

        const onReady = (event: GridviewReadyEvent) => {
            api = event.api;
        };

        render(
            <GridviewReact
                orientation={Orientation.VERTICAL}
                components={components}
                onReady={onReady}
            />
        );

        expect(api).toBeTruthy();
    });

    test('is sized to container', () => {
        const el = document.createElement('div') as any;

        jest.spyOn(el, 'clientHeight', 'get').mockReturnValue(450);
        jest.spyOn(el, 'clientWidth', 'get').mockReturnValue(650);

        setMockRefElement(el);
        let api: GridviewApi | undefined;

        const onReady = (event: GridviewReadyEvent) => {
            api = event.api;
        };

        render(
            <GridviewReact
                orientation={Orientation.VERTICAL}
                components={components}
                onReady={onReady}
            />
        );

        expect(api!.width).toBe(650);
        expect(api!.height).toBe(450);
    });

    test('that the component can update parameters', async () => {
        let api: GridviewApi;

        const onReady = (event: GridviewReadyEvent) => {
            api = event.api;
        };

        const wrapper = render(
            <GridviewReact
                orientation={Orientation.VERTICAL}
                components={components}
                onReady={onReady}
            />
        );

        let panel: IGridviewPanel;

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
