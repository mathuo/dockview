import * as React from 'react';
import { render } from '@testing-library/react';
import { SplitviewApi } from '../../../api/component.api';
import {
    ISplitviewPanelProps,
    SplitviewReact,
    SplitviewReadyEvent,
} from '../../../react/splitview/splitview';
import { PanelCollection } from '../../../react/types';
import { Orientation } from '../../../splitview/core/splitview';

describe('splitview react', () => {
    let components: PanelCollection<ISplitviewPanelProps>;

    beforeEach(() => {
        components = {
            default: (props: ISplitviewPanelProps) => {
                return <div>hello world</div>;
            },
        };
    });

    test('default', () => {
        let api: SplitviewApi | undefined;

        const onReady = (event: SplitviewReadyEvent) => {
            api = event.api;
        };

        render(
            <SplitviewReact
                orientation={Orientation.VERTICAL}
                components={components}
                onReady={onReady}
            />
        );

        expect(api).toBeTruthy();
    });
});
