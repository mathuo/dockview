import { resolveDndCapabilities } from '../../dockview/dndCapabilities';
import { PROPERTY_KEYS_DOCKVIEW } from '../../dockview/options';

describe('resolveDndCapabilities', () => {
    test("'auto' (default): both backends active, pointer is touch-only", () => {
        expect(resolveDndCapabilities({ dndStrategy: 'auto' })).toEqual({
            html5: true,
            pointer: true,
            pointerHandlesMouse: false,
        });
    });

    test('undefined strategy resolves the same as auto', () => {
        expect(resolveDndCapabilities({})).toEqual(
            resolveDndCapabilities({ dndStrategy: 'auto' })
        );
    });

    test("'pointer': pointer handles every input type; HTML5 off", () => {
        expect(resolveDndCapabilities({ dndStrategy: 'pointer' })).toEqual({
            html5: false,
            pointer: true,
            pointerHandlesMouse: true,
        });
    });

    test("'html5': HTML5 only; pointer off", () => {
        expect(resolveDndCapabilities({ dndStrategy: 'html5' })).toEqual({
            html5: true,
            pointer: false,
            pointerHandlesMouse: false,
        });
    });

    test('disableDnd overrides every strategy', () => {
        const expected = {
            html5: false,
            pointer: false,
            pointerHandlesMouse: false,
        };
        expect(
            resolveDndCapabilities({ disableDnd: true, dndStrategy: 'auto' })
        ).toEqual(expected);
        expect(
            resolveDndCapabilities({ disableDnd: true, dndStrategy: 'pointer' })
        ).toEqual(expected);
        expect(
            resolveDndCapabilities({ disableDnd: true, dndStrategy: 'html5' })
        ).toEqual(expected);
    });

    test('pointerHandlesMouse never true without pointer being true', () => {
        // Property-style invariant check across every shape.
        for (const dndStrategy of [
            'auto',
            'pointer',
            'html5',
            undefined,
        ] as const) {
            for (const disableDnd of [false, true]) {
                const caps = resolveDndCapabilities({
                    dndStrategy,
                    disableDnd,
                });
                if (caps.pointerHandlesMouse) {
                    expect(caps.pointer).toBe(true);
                }
            }
        }
    });
});

describe('PROPERTY_KEYS_DOCKVIEW', () => {
    test('includes nonce so framework wrappers (React, Vue) auto-forward it', () => {
        expect(PROPERTY_KEYS_DOCKVIEW).toContain('nonce');
    });
});
