import { GroupPanel, GroupviewPanelApi, Groupview } from 'dockview-core';
import { ReactGroupControlsRendererPart } from '../../../dockview/groupControlsRenderer';

describe('groupControlsRenderer', () => {
    test('#1', () => {
        const groupviewMock = jest.fn<Partial<Groupview>, []>(() => {
            return {
                onDidAddPanel: jest.fn(),
                onDidRemovePanel: jest.fn(),
                onDidActivePanelChange: jest.fn(),
            };
        });

        const groupview = new groupviewMock() as Groupview;

        const groupPanelMock = jest.fn<Partial<GroupPanel>, []>(() => {
            return {
                api: {} as GroupviewPanelApi as any,
                model: groupview,
            };
        });

        const groupPanel = new groupPanelMock() as GroupPanel;

        const cut = new ReactGroupControlsRendererPart(
            jest.fn(),
            {
                addPortal: jest.fn(),
            },
            groupPanel
        );

        expect(cut.element.childNodes.length).toBe(0);
        expect(cut.element.className).toBe('dockview-react-part');
        expect(cut.part).toBeUndefined();

        cut.init({
            containerApi: <any>jest.fn(),
            api: <any>{
                onDidActiveChange: jest.fn(),
            },
        });

        const update = jest.fn();

        jest.spyOn(cut.part!, 'update').mockImplementation(update);

        cut.update({ params: { valueA: 'A' } });

        expect(update).toBeCalledWith({ valueA: 'A' });
    });
});
