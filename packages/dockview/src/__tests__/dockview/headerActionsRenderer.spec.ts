import {
    DockviewGroupPanel,
    DockviewGroupPanelApi,
    DockviewGroupPanelModel,
} from 'dockview-core';
import { ReactHeaderActionsRendererPart } from '../../dockview/headerActionsRenderer';

describe('headerActionsRenderer', () => {
    test('#1', () => {
        const groupviewMock = jest.fn<Partial<DockviewGroupPanelModel>, []>(
            () => {
                return {
                    onDidAddPanel: jest.fn(),
                    onDidRemovePanel: jest.fn(),
                    onDidActivePanelChange: jest.fn(),
                };
            }
        );

        const groupview = new groupviewMock() as DockviewGroupPanelModel;

        const groupPanelMock = jest.fn<Partial<DockviewGroupPanel>, []>(() => {
            return {
                api: {} as DockviewGroupPanelApi as any,
                model: groupview,
            };
        });

        const groupPanel = new groupPanelMock() as DockviewGroupPanel;

        const cut = new ReactHeaderActionsRendererPart(
            jest.fn(),
            {
                addPortal: jest.fn(),
            },
            groupPanel
        );

        expect(cut.element.childNodes.length).toBe(0);
        expect(cut.element.className).toBe('dv-react-part');
        expect(cut.part).toBeUndefined();

        cut.init({
            containerApi: <any>jest.fn(),
            api: <any>{
                onDidActiveChange: jest.fn(),
                onDidLocationChange: jest.fn(),
                location: { type: 'grid' },
            },
        });

        const update = jest.fn();

        jest.spyOn(cut.part!, 'update').mockImplementation(update);

        cut.update({ params: { valueA: 'A' } });

        expect(update).toBeCalledWith({ valueA: 'A' });
    });
});
