import { BaseViewApi, StateObject } from '../../api/api';

describe('api', () => {
    let api: BaseViewApi;

    beforeEach(() => {
        api = new BaseViewApi('dummy_id');
    });

    it('sets api state', () => {
        let state: StateObject;

        const stream = api.onDidStateChange(() => {
            state = api.getState();
        });

        expect(state).toBeUndefined();
        expect(api.getState()).toEqual({});

        api.setState('key1', 'value1');
        expect(state).toEqual({ key1: 'value1' });
        expect(api.getStateKey('key1')).toBe('value1');

        api.setState('key2', 'value2');
        expect(state).toEqual({ key1: 'value1', key2: 'value2' });
        expect(api.getStateKey('key2')).toBe('value2');

        api.setState('key1', 'value1_1');
        expect(state).toEqual({ key2: 'value2', key1: 'value1_1' });
        expect(api.getStateKey('key1')).toBe('value1_1');

        api.setState({ key3: 'value3' });
        expect(state).toEqual({ key3: 'value3' });

        stream.dispose();
        api.dispose();
    });

    it('shpuld update isFcoused getter', () => {
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
