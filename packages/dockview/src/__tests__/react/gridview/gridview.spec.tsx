import * as React from 'react';
import { render } from '@testing-library/react';
import { GridviewApi, Orientation } from 'dockview-core';
import {
    IGridviewPanelProps,
    GridviewReact,
    GridviewReadyEvent,
} from '../../../gridview/gridview';
import { PanelCollection } from '../../../types';
import { setMockRefElement } from '../../__test_utils__/utils';

describe('gridview react', () => {
    let components: PanelCollection<IGridviewPanelProps>;

    beforeEach(() => {
        components = {
            default: (props: IGridviewPanelProps) => {
                return <div>hello world</div>;
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
        setMockRefElement({
            clientHeight: 450,
            clientWidth: 650,
            appendChild: jest.fn(),
        });
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
});
