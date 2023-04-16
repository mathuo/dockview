import * as React from 'react';
import { render } from '@testing-library/react';
import { DockviewApi } from 'dockview-core';
import {
    IDockviewPanelProps,
    DockviewReact,
    DockviewReadyEvent,
} from '../../dockview/dockview';
import { PanelCollection } from '../../types';
import { setMockRefElement } from '../__test_utils__/utils';

describe('gridview react', () => {
    let components: PanelCollection<IDockviewPanelProps>;

    beforeEach(() => {
        components = {
            default: (props: IDockviewPanelProps) => {
                return <div>hello world</div>;
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
});
