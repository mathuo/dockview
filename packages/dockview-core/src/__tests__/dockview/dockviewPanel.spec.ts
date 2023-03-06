import { DockviewComponent } from '../../dockview/dockviewComponent';
import { DockviewApi } from '../../api/component.api';
import { DockviewPanel } from '../../dockview/dockviewPanel';
import { IDockviewPanelModel } from '../../dockview/dockviewPanelModel';
import { DockviewGroupPanel } from '../../groupview/dockviewGroupPanel';

describe('dockviewPanel', () => {
    test('update title', () => {
        const dockviewApiMock = jest.fn<DockviewApi, []>(() => {
            return {
                onDidActiveChange: jest.fn(),
            } as any;
        });
        const accessorMock = jest.fn<DockviewComponent, []>(() => {
            return {} as any;
        });
        const groupMock = jest.fn<DockviewGroupPanel, []>(() => {
            return {} as any;
        });
        const panelModelMock = jest.fn<Partial<IDockviewPanelModel>, []>(() => {
            return {
                update: jest.fn(),
                init: jest.fn(),
            };
        });

        const api = new dockviewApiMock();
        const accessor = new accessorMock();
        const group = new groupMock();
        const model = <IDockviewPanelModel>new panelModelMock();

        const cut = new DockviewPanel('fake-id', accessor, api, group, model);

        let latestTitle: string | undefined = undefined;

        const disposable = cut.api.onDidTitleChange((event) => {
            latestTitle = event.title;
        });

        expect(cut.title).toBe('');

        cut.init({ title: 'new title', params: {} });
        expect(latestTitle).toBe('new title');
        expect(cut.title).toBe('new title');

        cut.update({ params: { title: 'another title' } });
        expect(latestTitle).toBe('another title');
        expect(cut.title).toBe('another title');

        disposable.dispose();
    });

    test('dispose cleanup', () => {
        const dockviewApiMock = jest.fn<DockviewApi, []>(() => {
            return {} as any;
        });
        const accessorMock = jest.fn<DockviewComponent, []>(() => {
            return {} as any;
        });
        const groupMock = jest.fn<DockviewGroupPanel, []>(() => {
            return {} as any;
        });
        const panelModelMock = jest.fn<Partial<IDockviewPanelModel>, []>(() => {
            return {
                update: jest.fn(),
                init: jest.fn(),
                dispose: jest.fn(),
            };
        });

        const api = new dockviewApiMock();
        const accessor = new accessorMock();
        const group = new groupMock();
        const model = <IDockviewPanelModel>new panelModelMock();

        const cut = new DockviewPanel('fake-id', accessor, api, group, model);

        cut.init({ params: {}, title: 'title' });

        cut.dispose();

        expect(model.dispose).toHaveBeenCalled();
    });

    test('get params', () => {
        const dockviewApiMock = jest.fn<DockviewApi, []>(() => {
            return {} as any;
        });
        const accessorMock = jest.fn<DockviewComponent, []>(() => {
            return {} as any;
        });
        const groupMock = jest.fn<DockviewGroupPanel, []>(() => {
            return {} as any;
        });
        const panelModelMock = jest.fn<Partial<IDockviewPanelModel>, []>(() => {
            return {
                update: jest.fn(),
                init: jest.fn(),
                dispose: jest.fn(),
            };
        });

        const api = new dockviewApiMock();
        const accessor = new accessorMock();
        const group = new groupMock();
        const model = <IDockviewPanelModel>new panelModelMock();

        const cut = new DockviewPanel('fake-id', accessor, api, group, model);

        expect(cut.params).toEqual(undefined);

        cut.update({ params: { params: { variableA: 'A', variableB: 'B' } } });

        expect(cut.params).toEqual({ variableA: 'A', variableB: 'B' });
    });

    test('setSize propagates to underlying group', () => {
        const dockviewApiMock = jest.fn<DockviewApi, []>(() => {
            return {} as any;
        });
        const accessorMock = jest.fn<DockviewComponent, []>(() => {
            return {} as any;
        });
        const groupMock = jest.fn<DockviewGroupPanel, []>(() => {
            return {
                api: {
                    setSize: jest.fn(),
                },
            } as any;
        });
        const panelModelMock = jest.fn<Partial<IDockviewPanelModel>, []>(() => {
            return {
                update: jest.fn(),
                init: jest.fn(),
                dispose: jest.fn(),
            };
        });

        const api = new dockviewApiMock();
        const accessor = new accessorMock();
        const group = new groupMock();
        const model = <IDockviewPanelModel>new panelModelMock();

        const cut = new DockviewPanel('fake-id', accessor, api, group, model);

        cut.api.setSize({ height: 123, width: 456 });

        expect(group.api.setSize).toBeCalledWith({ height: 123, width: 456 });
        expect(group.api.setSize).toBeCalledTimes(1);
    });
});
