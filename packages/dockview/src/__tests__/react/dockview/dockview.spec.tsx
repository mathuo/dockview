import * as React from 'react';
import { render } from '@testing-library/react';
import { DockviewApi } from '../../../api/component.api';
import {
    IDockviewPanelProps,
    DockviewReact,
    DockviewReadyEvent,
} from '../../../react/dockview/dockview';
import { PanelCollection } from '../../../react/types';
import { Orientation } from '../../../splitview/core/splitview';

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
});
