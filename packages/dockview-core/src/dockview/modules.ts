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
import { IPopoutWindowService } from './popoutWindowService';
import { IWatermarkService } from './watermarkService';
import { IEdgeGroupService } from './edgeGroupService';

export interface ServiceCollection {
    floatingGroupService?: IFloatingGroupService;
    popoutWindowService?: IPopoutWindowService;
    watermarkService?: IWatermarkService;
    edgeGroupService?: IEdgeGroupService;
}

export interface DockviewModule<THost = unknown> {
    moduleName: string;
    services?: Record<string, (host: THost) => unknown>;
    dependsOn?: DockviewModule<any>[];
}

/**
 * Typed helper for defining a module. Enforces that the factory's return
 * type matches the slot in ServiceCollection at compile time, replacing
 * the manual cast each module file would otherwise need.
 */
export function defineModule<K extends keyof ServiceCollection, THost>(config: {
    name: string;
    serviceKey: K;
    create: (host: THost) => NonNullable<ServiceCollection[K]>;
    dependsOn?: DockviewModule<any>[];
}): DockviewModule<THost> {
    return {
        moduleName: config.name,
        services: {
            [config.serviceKey]: config.create as (host: THost) => unknown,
        },
        dependsOn: config.dependsOn,
    };
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
    private readonly _modules = new Map<string, DockviewModule<any>>();
    private readonly _services: ServiceCollection = {};

    get services(): ServiceCollection {
        return this._services;
    }

    register<H>(module: DockviewModule<H>): void {
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
