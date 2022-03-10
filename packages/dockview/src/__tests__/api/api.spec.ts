import { PanelApiImpl } from '../../api/panelApi';

describe('api', () => {
    let api: PanelApiImpl;

    beforeEach(() => {
        api = new PanelApiImpl('dummy_id');
    });

    it('should update isFcoused getter', () => {
        expect(api.isFocused).toBeFalsy();

        api._onDidChangeFocus.fire({ isFocused: true });
        expect(api.isFocused).toBeTruthy();

        api._onDidChangeFocus.fire({ isFocused: false });
        expect(api.isFocused).toBeFalsy();
    });

    it('should update isActive getter', () => {
        expect(api.isFocused).toBeFalsy();

        api._onDidActiveChange.fire({ isActive: true });
        expect(api.isActive).toBeTruthy();

        api._onDidActiveChange.fire({ isActive: false });
        expect(api.isActive).toBeFalsy();
    });

    it('should update isActive getter', () => {
        expect(api.isVisible).toBeTruthy();

        api._onDidVisibilityChange.fire({ isVisible: false });
        expect(api.isVisible).toBeFalsy();

        api._onDidVisibilityChange.fire({ isVisible: true });
        expect(api.isVisible).toBeTruthy();
    });

    it('should update width and height getter', () => {
        expect(api.height).toBe(0);
        expect(api.width).toBe(0);

        api._onDidPanelDimensionChange.fire({ height: 10, width: 20 });
        expect(api.height).toBe(10);
        expect(api.width).toBe(20);

        api._onDidPanelDimensionChange.fire({ height: 20, width: 10 });
        expect(api.height).toBe(20);
        expect(api.width).toBe(10);
    });
});
