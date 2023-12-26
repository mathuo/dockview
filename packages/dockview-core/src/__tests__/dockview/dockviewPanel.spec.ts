import { DockviewComponent } from '../../dockview/dockviewComponent';
import { DockviewApi } from '../../api/component.api';
import { DockviewPanel } from '../../dockview/dockviewPanel';
import { IDockviewPanelModel } from '../../dockview/dockviewPanelModel';
import { DockviewGroupPanel } from '../../dockview/dockviewGroupPanel';

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

        const cut = new DockviewPanel('fake-id', accessor, api, group, model, {
            renderer: 'onlyWhenVisibile',
        });

        let latestTitle: string | undefined = undefined;

        const disposable = cut.api.onDidTitleChange((event) => {
            latestTitle = event.title;
        });

        expect(cut.title).toBeUndefined();

        cut.init({ title: 'new title', params: {} });
        expect(latestTitle).toBe('new title');
        expect(cut.title).toBe('new title');

        cut.setTitle('another title');
        expect(latestTitle).toBe('another title');
        expect(cut.title).toBe('another title');

        disposable.dispose();
    });

    test('that .setTitle updates the title', () => {
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

        const cut = new DockviewPanel('fake-id', accessor, api, group, model, {
            renderer: 'onlyWhenVisibile',
        });

        cut.init({ title: 'myTitle', params: {} });
        expect(cut.title).toBe('myTitle');

        cut.setTitle('newTitle');
        expect(cut.title).toBe('newTitle');

        cut.api.setTitle('new title 2');
        expect(cut.title).toBe('new title 2');
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

        const cut = new DockviewPanel('fake-id', accessor, api, group, model, {
            renderer: 'onlyWhenVisibile',
        });

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

        const cut = new DockviewPanel('fake-id', accessor, api, group, model, {
            renderer: 'onlyWhenVisibile',
        });

        expect(cut.params).toEqual(undefined);

        cut.update({ params: { variableA: 'A', variableB: 'B' } });

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

        const cut = new DockviewPanel('fake-id', accessor, api, group, model, {
            renderer: 'onlyWhenVisibile',
        });

        cut.api.setSize({ height: 123, width: 456 });

        expect(group.api.setSize).toBeCalledWith({ height: 123, width: 456 });
        expect(group.api.setSize).toBeCalledTimes(1);
    });

    test('updateParameter', () => {
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

        const cut = new DockviewPanel('fake-id', accessor, api, group, model, {
            renderer: 'onlyWhenVisibile',
        });

        cut.init({ params: { a: '1', b: '2' }, title: 'A title' });
        expect(cut.params).toEqual({ a: '1', b: '2' });

        // update 'a' and add 'c'
        cut.update({ params: { a: '-1', c: '3' } });
        expect(cut.params).toEqual({ a: '-1', b: '2', c: '3' });

        cut.update({ params: { d: '4', e: '5', f: '6' } });
        expect(cut.params).toEqual({
            a: '-1',
            b: '2',
            c: '3',
            d: '4',
            e: '5',
            f: '6',
        });

        cut.update({
            params: {
                d: '',
                e: null,
                f: undefined,
                g: '',
                h: null,
                i: undefined,
            },
        });
        expect(cut.params).toEqual({
            a: '-1',
            b: '2',
            c: '3',
            d: '',
            e: null,
            g: '',
            h: null,
        });
    });
});
