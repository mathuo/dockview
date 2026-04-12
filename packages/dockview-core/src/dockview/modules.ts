/**
 * Module system for dockview.
 *
 * Modules are feature bundles that register services into the dockview
 * component. This allows features to be independently included or excluded,
 * enabling tree-shaking and a clean split between community and enterprise
 * packages.
 *
 * @see {@link DockviewModule} for the module contract
 * @see {@link ModuleRegistry} for runtime registration
 */

import { IFloatingGroupService } from './floatingGroupService';

/**
 * A dockview module declares a named feature bundle with optional services,
 * CSS dependencies, and module dependencies.
 *
 * Modules are registered at component creation time via the `modules` option
 * in `DockviewOptions`. Services declared by a module are made available
 * through the component's `ServiceCollection`.
 */
export interface DockviewModule {
    /** Unique identifier for this module (e.g. 'FloatingGroup') */
    moduleName: string;
    /**
     * Map of service name to service factory function.
     * Each factory receives the host component and returns a service instance.
     * The returned service is registered in the ServiceCollection.
     */
    services?: Record<string, (host: any) => any>;
    /** CSS file paths that this module requires */
    css?: string[];
    /** Other modules that must be registered before this one */
    dependsOn?: DockviewModule[];
}

/**
 * Optional service slots that modules can fill.
 *
 * Core code accesses these via optional chaining (`services.floatingGroupService?.doThing()`).
 * Slots are populated at runtime when the corresponding module is registered.
 */
export interface ServiceCollection {
    floatingGroupService?: IFloatingGroupService;
}

/**
 * Registry that tracks which modules have been registered for a
 * dockview component instance. Each `DockviewComponent` owns one registry.
 */
export class ModuleRegistry {
    private readonly _modules = new Map<string, DockviewModule>();
    private readonly _services: ServiceCollection = {};

    /** Read-only view of the service collection */
    get services(): ServiceCollection {
        return this._services;
    }

    /**
     * Register a module and all of its transitive dependencies.
     * Duplicate registrations (by moduleName) are silently ignored.
     */
    register(module: DockviewModule): void {
        if (this._modules.has(module.moduleName)) {
            return;
        }

        // Register dependencies first (depth-first)
        if (module.dependsOn) {
            for (const dep of module.dependsOn) {
                this.register(dep);
            }
        }

        this._modules.set(module.moduleName, module);
    }

    /**
     * Initialize all registered modules by creating their service instances.
     * Must be called after all modules are registered and before the component
     * is used. The host is passed to service factory functions.
     */
    initialize(host: any): void {
        for (const module of this._modules.values()) {
            if (module.services) {
                for (const [name, factory] of Object.entries(module.services)) {
                    (this._services as any)[name] = factory(host);
                }
            }
        }
    }

    /** Check whether a module has been registered */
    has(moduleName: string): boolean {
        return this._modules.has(moduleName);
    }

    /** Get all registered module names */
    get registeredModules(): string[] {
        return Array.from(this._modules.keys());
    }
}
