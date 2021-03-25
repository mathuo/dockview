import * as React from 'react';
import { render } from '@testing-library/react';
import { PaneviewApi } from '../../../api/component.api';
import {
    IPaneviewPanelProps,
    PaneviewReact,
    PaneviewReadyEvent,
} from '../../../react/paneview/paneview';
import { PanelCollection } from '../../../react/types';

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
});
