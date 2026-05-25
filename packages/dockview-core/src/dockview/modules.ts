/**
 * Internal module system for dockview.
 *
 * Modules are feature bundles that register services into the dockview
 * component. This is currently an internal-only system used to refactor
 * the core component into independently-extracted features. The public
 * surface (a `modules` option, framework wrappers, opt-in registration)
 * is reserved for a future major version.
 */

import { IFloatingGroupService } from './floatingGroupService';

export interface DockviewModule<THost = unknown> {
    moduleName: string;
    services?: Record<string, (host: THost) => unknown>;
    dependsOn?: DockviewModule<THost>[];
}

export interface ServiceCollection {
    floatingGroupService?: IFloatingGroupService;
}

export class ModuleMissingError extends Error {
    constructor(moduleName: string, hint?: string) {
        const tail = hint ? ` ${hint}` : '';
        super(`Dockview module "${moduleName}" is not registered.${tail}`);
        this.name = 'ModuleMissingError';
        Object.setPrototypeOf(this, ModuleMissingError.prototype);
    }
}

export function requireService<T>(
    service: T | undefined,
    moduleName: string,
    hint?: string
): T {
    if (service === undefined) {
        throw new ModuleMissingError(moduleName, hint);
    }
    return service;
}

export class ModuleRegistry<THost> {
    // Stored loosely; the THost generic is enforced at initialize() time only,
    // because AllModules is declared in this file and cannot statically reference
    // the DockviewComponent host type without creating a circular import.
    private readonly _modules = new Map<string, DockviewModule<unknown>>();
    private readonly _services: ServiceCollection = {};

    get services(): ServiceCollection {
        return this._services;
    }

    register(module: DockviewModule<unknown>): void {
        if (this._modules.has(module.moduleName)) {
            return;
        }
        if (module.dependsOn) {
            for (const dep of module.dependsOn) {
                this.register(dep);
            }
        }
        this._modules.set(module.moduleName, module);
    }

    initialize(host: THost): void {
        for (const module of this._modules.values()) {
            if (!module.services) {
                continue;
            }
            for (const [name, factory] of Object.entries(module.services)) {
                (this._services as Record<string, unknown>)[name] = (
                    factory as (h: THost) => unknown
                )(host);
            }
        }
    }

    has(moduleName: string): boolean {
        return this._modules.has(moduleName);
    }
}

/**
 * Internal registry of all built-in modules. Not exported from the package.
 * The DockviewComponent registers this list at construction time.
 */
import { FloatingGroupModule } from './floatingGroupModule';

export const AllModules: DockviewModule<unknown>[] = [
    FloatingGroupModule as DockviewModule<unknown>,
];
