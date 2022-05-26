import * as React from 'react';
import { render } from '@testing-library/react';
import { PaneviewApi } from '../../../api/component.api';
import {
    IPaneviewPanelProps,
    PaneviewReact,
    PaneviewReadyEvent,
} from '../../../react/paneview/paneview';
import { PanelCollection } from '../../../react/types';
import { setMockRefElement } from '../../__test_utils__/utils';

describe('gridview react', () => {
    let components: PanelCollection<IPaneviewPanelProps>;

    beforeEach(() => {
        components = {
            default: (props: IPaneviewPanelProps) => {
                return <div>hello world</div>;
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

        expect(api.width).toBe(650);
        expect(api.height).toBe(450);
    });
});
