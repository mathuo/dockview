import * as React from 'react';
import { render } from '@testing-library/react';
import { DockviewApi } from '../../../api/component.api';
import {
    IDockviewPanelProps,
    DockviewReact,
    DockviewReadyEvent,
} from '../../../react/dockview/dockview';
import { PanelCollection } from '../../../react/types';
import { setMockRefElement } from '../../__test_utils__/utils';

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
        setMockRefElement({
            clientHeight: 450,
            clientWidth: 650,
            appendChild: jest.fn(),
        });
        let api: DockviewApi | undefined;

        const onReady = (event: DockviewReadyEvent) => {
            api = event.api;
        };

        render(<DockviewReact components={components} onReady={onReady} />);

        expect(api.width).toBe(650);
        expect(api.height).toBe(450);
    });
});
