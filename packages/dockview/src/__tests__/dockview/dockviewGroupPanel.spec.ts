import { DockviewComponent } from '../..';
import { DockviewApi } from '../../api/component.api';
import { IGroupPanelView } from '../../dockview/defaultGroupPanelView';
import { DockviewGroupPanel } from '../../dockview/dockviewGroupPanel';

describe('dockviewGroupPanel', () => {
    test('update title', () => {
        const dockviewApiMock = jest.fn<DockviewApi, []>(() => {
            return {} as any;
        });
        const accessorMock = jest.fn<DockviewComponent, []>(() => {
            return {} as any;
        });
        const api = new dockviewApiMock();
        const accessor = new accessorMock();
        const cut = new DockviewGroupPanel('fake-id', accessor, api);

        let latestTitle: string | undefined = undefined;

        const disposable = cut.api.titleChanged((event) => {
            latestTitle = event.title;
        });

        expect(cut.title).toBe('');

        cut.init({ title: 'new title', params: {}, view: null });
        expect(latestTitle).toBe('new title');
        expect(cut.title).toBe('new title');

        cut.update({ params: { title: 'another title' } });
        expect(latestTitle).toBe('another title');
        expect(cut.title).toBe('another title');

        disposable.dispose();
    });

    test('update suppress closable', () => {
        const dockviewApiMock = jest.fn<DockviewApi, []>(() => {
            return {} as any;
        });
        const accessorMock = jest.fn<DockviewComponent, []>(() => {
            return {} as any;
        });
        const api = new dockviewApiMock();
        const accessor = new accessorMock();

        const cut = new DockviewGroupPanel('fake-id', accessor, api);

        let latestSuppressClosable: boolean | undefined = undefined;

        const disposable = cut.api.suppressClosableChanged((event) => {
            latestSuppressClosable = event.suppressClosable;
        });

        expect(latestSuppressClosable).toBeFalsy();

        cut.init({
            title: 'new title',
            suppressClosable: true,
            params: {},
            view: null,
        });
        expect(latestSuppressClosable).toBeTruthy();
        expect(cut.suppressClosable).toBeTruthy();

        cut.update({ params: { suppressClosable: false } });
        expect(latestSuppressClosable).toBeFalsy();
        expect(cut.suppressClosable).toBeFalsy();

        disposable.dispose();
    });

    test('dispose cleanup', () => {
        const dockviewApiMock = jest.fn<DockviewApi, []>(() => {
            return {} as any;
        });
        const accessorMock = jest.fn<DockviewComponent, []>(() => {
            return {} as any;
        });
        const api = new dockviewApiMock();
        const accessor = new accessorMock();

        const cut = new DockviewGroupPanel('fake-id', accessor, api);

        const viewMock = jest.fn<IGroupPanelView, []>(() => {
            return {
                init: jest.fn(),
                dispose: jest.fn(),
            } as any;
        });
        const view = new viewMock();

        cut.init({ params: {}, view, title: 'title' });

        cut.dispose();

        expect(view.dispose).toHaveBeenCalled();
    });
});
