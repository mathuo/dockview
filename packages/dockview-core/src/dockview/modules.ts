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

/**
 * A dockview module declares a named feature bundle with optional services,
 * CSS dependencies, and module dependencies.
 *
 * Modules are registered at component creation time via the `modules` option
 * in `DockviewOptions`. Services declared by a module are made available
 * through the component's `ServiceCollection`.
 */
export interface DockviewModule {
    /** Unique identifier for this module (e.g. 'FloatingGroupModule') */
    moduleName: string;
    /**
     * Map of service name to service constructor.
     * These are instantiated and registered in the ServiceCollection
     * when the module is loaded.
     */
    services?: Record<string, new (...args: any[]) => any>;
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
 *
 * This will be expanded as modules are extracted in later phases.
 */
export interface ServiceCollection {
    // Phase 1+ will add optional service slots here, e.g.:
    // floatingGroupService?: IFloatingGroupService;
}

/**
 * Registry that tracks which modules have been registered for a
 * dockview component instance. Each `DockviewComponent` owns one registry.
 */
export class ModuleRegistry {
    private readonly _modules = new Map<string, DockviewModule>();
    private readonly _services: ServiceCollection = {};

    /** Read-only view of the service collection */
    get services(): Readonly<ServiceCollection> {
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

    /** Check whether a module has been registered */
    has(moduleName: string): boolean {
        return this._modules.has(moduleName);
    }

    /** Get all registered module names */
    get registeredModules(): string[] {
        return Array.from(this._modules.keys());
    }
}
