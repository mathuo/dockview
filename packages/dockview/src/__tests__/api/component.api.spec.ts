import { DockviewComponent } from '../..';
import {
    SplitviewApi,
    PaneviewApi,
    GridviewApi,
    DockviewApi,
} from '../../api/component.api';
import { GridviewComponent } from '../../gridview/gridviewComponent';
import { PaneviewComponent } from '../../paneview/paneviewComponent';
import { SplitviewComponent } from '../../splitview/splitviewComponent';

describe('component.api', () => {
    describe('splitview', () => {
        test('splitviewapi', () => {
            const list: (keyof SplitviewComponent)[] = [
                'minimumSize',
                'maximumSize',
                'height',
                'width',
                'length',
                'orientation',
                'onDidLayoutChange',
                'onDidAddView',
                'onDidRemoveView',
                'getPanels',
                'focus',
                'resizeToFit',
                'toJSON',
            ];

            for (const _ of list) {
                const f = jest.fn();

                const component: Partial<SplitviewComponent> = {
                    [_]: f(),
                };

                const cut = new SplitviewApi(<SplitviewComponent>component);

                (cut as any)[_];

                expect(f).toBeCalledTimes(1);
            }
        });
    });

    describe('paneview', () => {
        test('panviewapi', () => {
            const list: (keyof PaneviewComponent)[] = [
                'minimumSize',
                'maximumSize',
                'height',
                'width',
                'onDidLayoutChange',
                'onDidAddView',
                'onDidRemoveView',
                'getPanels',
                'focus',
                'resizeToFit',
                'toJSON',
            ];

            for (const _ of list) {
                const f = jest.fn();

                const component: Partial<PaneviewComponent> = {
                    [_]: f(),
                };

                const cut = new PaneviewApi(<PaneviewComponent>component);

                (cut as any)[_];

                expect(f).toBeCalledTimes(1);
            }
        });
    });

    describe('gridview', () => {
        test('gridviewapi', () => {
            const list: (keyof GridviewComponent)[] = [
                'minimumHeight',
                'maximumHeight',
                'minimumWidth',
                'maximumWidth',
                'width',
                'height',
                'onGridEvent',
                'onDidLayoutChange',
                'orientation',
                'focus',
                'resizeToFit',
                'toJSON',
            ];

            for (const _ of list) {
                const f = jest.fn();

                const component: Partial<GridviewComponent> = {
                    [_]: f(),
                };

                const cut = new GridviewApi(<GridviewComponent>component);

                (cut as any)[_];

                expect(f).toBeCalledTimes(1);
            }
        });
    });

    describe('dockview', () => {
        test('dockviewapi', () => {
            const list: (keyof DockviewComponent)[] = [
                'minimumHeight',
                'maximumHeight',
                'minimumWidth',
                'maximumWidth',
                'width',
                'height',
                'size',
                'totalPanels',
                'onGridEvent',
                'onDidLayoutChange',
                'panels',
                'groups',
                'activeGroup',
                'activePanel',
                'focus',
                'closeAllGroups',
                'resizeToFit',
                'toJSON',
            ];

            for (const _ of list) {
                const f = jest.fn();

                const component: Partial<DockviewComponent> = {
                    [_]: f(),
                };

                const cut = new DockviewApi(<DockviewComponent>component);

                (cut as any)[_];

                expect(f).toBeCalledTimes(1);
            }
        });
    });
});
