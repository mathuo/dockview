import { TestBed } from '@angular/core/testing';
import { Type } from '@angular/core';
import {
    ComponentRegistryService,
    ComponentResolver,
} from '../lib/utils/component-registry.service';

describe('ComponentRegistryService', () => {
    let service: ComponentRegistryService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ComponentRegistryService],
        });
        service = TestBed.inject(ComponentRegistryService);
    });

    describe('registerComponent', () => {
        it('should register a component with a valid name and reference', () => {
            const mockComponent = {} as Type<unknown>;
            service.registerComponent('testComponent', mockComponent);

            expect(service.resolveComponent('testComponent')).toBe(
                mockComponent
            );
        });

        it('should throw an error if component name or reference is not provided', () => {
            expect(() =>
                service.registerComponent('', {} as Type<unknown>)
            ).toThrow('Component and reference must be provided');
        });
    });

    describe('registerComponents', () => {
        it('should register multiple components from a record', () => {
            const components = {
                componentA: {} as Type<unknown>,
                componentB: {} as Type<unknown>,
            };

            service.registerComponents(components);

            expect(service.resolveComponent('componentA')).toBe(
                components.componentA
            );
            expect(service.resolveComponent('componentB')).toBe(
                components.componentB
            );
        });
    });

    describe('resolveComponent', () => {
        it('should return a registered component reference', () => {
            const mockComponent = {} as Type<unknown>;
            service.registerComponent('testComponent', mockComponent);

            const resolved = service.resolveComponent('testComponent');
            expect(resolved).toBe(mockComponent);
        });

        it('should throw an error if component name is not provided', () => {
            expect(() => service.resolveComponent('')).toThrow(
                'Component must be provided'
            );
        });

        it('should resolve a component dynamically through a resolver', () => {
            const dynamicComponent = {} as Type<unknown>;
            const resolver: ComponentResolver = (component) =>
                component === 'dynamicComponent' ? dynamicComponent : undefined;

            service.registerResolver(resolver);

            expect(service.resolveComponent('dynamicComponent')).toBe(
                dynamicComponent
            );
        });

        it('should fallback to static registration if no resolver matches', () => {
            const staticComponent = {} as Type<unknown>;
            service.registerComponent('staticComponent', staticComponent);

            const resolver: ComponentResolver = () => undefined;
            service.registerResolver(resolver);

            expect(service.resolveComponent('staticComponent')).toBe(
                staticComponent
            );
        });
    });

    describe('registerResolver', () => {
        it('should register a new resolver for dynamic component resolution', () => {
            const dynamicComponent = {} as Type<unknown>;
            const resolver: ComponentResolver = (component) =>
                component === 'dynamicComponent' ? dynamicComponent : undefined;

            service.registerResolver(resolver);

            expect(service.resolveComponent('dynamicComponent')).toBe(
                dynamicComponent
            );
        });
    });

    describe('unregisterResolver', () => {
        it('should unregister a resolver', () => {
            const dynamicComponent = {} as Type<unknown>;
            const resolver: ComponentResolver = (component) =>
                component === 'dynamicComponent' ? dynamicComponent : undefined;

            service.registerResolver(resolver);
            service.unregisterResolver(resolver);

            expect(
                service.resolveComponent('dynamicComponent')
            ).toBeUndefined();
        });
    });
});
