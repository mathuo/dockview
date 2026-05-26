import {
    DockviewModule,
    ModuleRegistry,
    _resetMissingModuleWarnings,
    assertModule,
} from '../../dockview/modules';

describe('ModuleRegistry', () => {
    test('register + initialize creates services via factory with host', () => {
        const host = { tag: 'host' };
        const created: unknown[] = [];

        const mod: DockviewModule<typeof host> = {
            moduleName: 'A',
            services: {
                a: (h) => {
                    created.push(h);
                    return { name: 'a' };
                },
            },
        };

        const registry = new ModuleRegistry<typeof host>();
        registry.register(mod as DockviewModule<unknown>);
        registry.initialize(host);

        expect(created).toEqual([host]);
        expect((registry.services as any).a).toEqual({ name: 'a' });
    });

    test('duplicate registrations by moduleName are ignored', () => {
        const registry = new ModuleRegistry<unknown>();
        const calls: string[] = [];

        registry.register({
            moduleName: 'X',
            services: { x: () => calls.push('first') },
        });
        registry.register({
            moduleName: 'X',
            services: { x: () => calls.push('second') },
        });

        registry.initialize({});
        expect(calls).toEqual(['first']);
    });

    test('dispose tears down init() subscriptions before disposing services', () => {
        const order: string[] = [];
        const registry = new ModuleRegistry<unknown>();

        registry.register({
            moduleName: 'M',
            services: {
                m: () => ({
                    dispose: () => order.push('service.dispose'),
                }),
            },
            init: () => ({
                dispose: () => order.push('init.dispose'),
            }),
        });

        registry.initialize({});
        registry.postConstruct({});
        registry.dispose();

        expect(order).toEqual(['init.dispose', 'service.dispose']);
    });

    test('dispose tolerates services without a dispose method', () => {
        const registry = new ModuleRegistry<unknown>();

        registry.register({
            moduleName: 'PlainValue',
            services: { v: () => ({ value: 42 }) },
        });

        registry.initialize({});
        expect(() => registry.dispose()).not.toThrow();
    });

    test('dependsOn is registered depth-first before the dependent', () => {
        const order: string[] = [];
        const registry = new ModuleRegistry<unknown>();

        const dep: DockviewModule<unknown> = {
            moduleName: 'Dep',
            services: { dep: () => order.push('Dep') },
        };
        const root: DockviewModule<unknown> = {
            moduleName: 'Root',
            services: { root: () => order.push('Root') },
            dependsOn: [dep],
        };

        registry.register(root);
        registry.initialize({});

        expect(order).toEqual(['Dep', 'Root']);
        expect(registry.has('Dep')).toBe(true);
        expect(registry.has('Root')).toBe(true);
    });
});

describe('assertModule', () => {
    let consoleError: jest.SpyInstance;

    beforeEach(() => {
        _resetMissingModuleWarnings();
        consoleError = jest
            .spyOn(console, 'error')
            .mockImplementation(() => undefined);
    });

    afterEach(() => {
        consoleError.mockRestore();
    });

    test('returns the service when present and does not log', () => {
        expect(assertModule({ x: 1 }, 'M')).toEqual({ x: 1 });
        expect(consoleError).not.toHaveBeenCalled();
    });

    test('returns undefined and logs once when module missing', () => {
        expect(assertModule(undefined, 'PopoutWindow')).toBeUndefined();
        expect(assertModule(undefined, 'PopoutWindow')).toBeUndefined();
        expect(consoleError).toHaveBeenCalledTimes(1);
        expect(consoleError.mock.calls[0][0]).toMatch(/PopoutWindow/);
        expect(consoleError.mock.calls[0][0]).toMatch(/not registered/);
    });

    test('dedup key includes context so different call sites each warn once', () => {
        assertModule(undefined, 'PopoutWindow', 'api.addPopoutGroup');
        assertModule(undefined, 'PopoutWindow', 'api.addPopoutGroup');
        assertModule(undefined, 'PopoutWindow', 'api.popoutRestorationPromise');
        expect(consoleError).toHaveBeenCalledTimes(2);
        expect(consoleError.mock.calls[0][0]).toMatch(
            /for api\.addPopoutGroup/
        );
        expect(consoleError.mock.calls[1][0]).toMatch(
            /for api\.popoutRestorationPromise/
        );
    });
});
