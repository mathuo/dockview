import {
    DockviewModule,
    ModuleMissingError,
    ModuleRegistry,
    requireService,
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

describe('requireService', () => {
    test('returns the service when present', () => {
        expect(requireService({ x: 1 }, 'M')).toEqual({ x: 1 });
    });

    test('throws ModuleMissingError when undefined', () => {
        expect(() => requireService(undefined, 'M')).toThrow(
            ModuleMissingError
        );
        expect(() =>
            requireService(undefined, 'M', 'install dockview-pro')
        ).toThrow(/dockview-pro/);
    });
});
