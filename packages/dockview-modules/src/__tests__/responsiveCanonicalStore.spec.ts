import { SerializedDockview } from 'dockview-core';
import { CanonicalStore } from '../responsiveCanonicalStore';

const layout = (width: number): SerializedDockview =>
    ({
        grid: {
            root: { type: 'leaf', data: { views: [], id: '1' } },
            width,
            height: 500,
            orientation: 'HORIZONTAL',
        },
        panels: {},
    }) as unknown as SerializedDockview;

describe('CanonicalStore', () => {
    test('starts empty', () => {
        const store = new CanonicalStore();
        expect(store.has()).toBe(false);
    });

    test('get throws before a value is set', () => {
        const store = new CanonicalStore();
        expect(() => store.get()).toThrow(/canonical layout has not been set/);
    });

    test('set / get / has round-trip', () => {
        const store = new CanonicalStore();
        const l = layout(1000);
        store.set(l);
        expect(store.has()).toBe(true);
        expect(store.get()).toBe(l);
    });

    test('set replaces the previous value', () => {
        const store = new CanonicalStore();
        store.set(layout(1000));
        store.set(layout(600));
        expect(store.get().grid.width).toBe(600);
    });

    test('clear empties the store', () => {
        const store = new CanonicalStore();
        store.set(layout(1000));
        store.clear();
        expect(store.has()).toBe(false);
        expect(() => store.get()).toThrow();
    });
});
