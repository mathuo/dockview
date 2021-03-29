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
import { setMockRefElement } from '../../__test_utils__/utils';

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

    test('is sized to container', () => {
        setMockRefElement({
            clientHeight: 450,
            clientWidth: 650,
            appendChild: jest.fn(),
        });
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

        expect(api.width).toBe(650);
        expect(api.height).toBe(450);
    });
});
