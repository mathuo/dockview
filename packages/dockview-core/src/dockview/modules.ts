/**
 * Internal module system for dockview.
 *
 * Modules are feature bundles that register services into the dockview
 * component. This is currently an internal-only system used to refactor
 * the core component into independently-extracted features. The public
 * surface (a `modules` option, framework wrappers, opt-in registration)
 * is reserved for a future major version.
 */

import { IDisposable } from '../lifecycle';
import { IFloatingGroupService } from './floatingGroupService';
import { IPopoutWindowService } from './popoutWindowService';
import { IWatermarkService } from './watermarkService';
import { IEdgeGroupService } from './edgeGroupService';
import { IRootDropTargetService } from './rootDropTargetService';
import { IHeaderActionsService } from './headerActionsService';
import { ILiveRegionService } from './liveRegionService';
import {
    IAccessibilityService,
    IAdvancedDnDService,
    IContextMenuService,
    ITabGroupChipsService,
} from './moduleContracts';

export interface ServiceCollection {
    floatingGroupService?: IFloatingGroupService;
    popoutWindowService?: IPopoutWindowService;
    watermarkService?: IWatermarkService;
    edgeGroupService?: IEdgeGroupService;
    tabGroupChipsService?: ITabGroupChipsService;
    contextMenuService?: IContextMenuService;
    rootDropTargetService?: IRootDropTargetService;
    headerActionsService?: IHeaderActionsService;
    advancedDnDService?: IAdvancedDnDService;
    liveRegionService?: ILiveRegionService;
    accessibilityService?: IAccessibilityService;
}

export interface DockviewModule<THost = unknown> {
    moduleName: string;
    services?: Record<string, (host: THost) => unknown>;
    /**
     * Optional post-construct hook called once after the host is fully
     * constructed and all module services are instantiated. Use this to
     * subscribe to host events — the returned disposable runs at host
     * teardown. Components don't need to call into the service from event
     * handlers; the module owns its own reactivity.
     */
    init?: (host: THost, services: ServiceCollection) => IDisposable;
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
    init?: (
        host: THost,
        service: NonNullable<ServiceCollection[K]>
    ) => IDisposable;
    dependsOn?: DockviewModule<any>[];
}): DockviewModule<THost> {
    return {
        moduleName: config.name,
        services: {
            [config.serviceKey]: config.create,
        },
        init: config.init
            ? (host, services) =>
                  config.init!(
                      host,
                      services[config.serviceKey] as NonNullable<
                          ServiceCollection[K]
                      >
                  )
            : undefined,
        dependsOn: config.dependsOn,
    };
}

const _warnedMissingModule = new Set<string>();

/**
 * For tests — clears the once-per-key dedup cache used by `assertModule`.
 */
export function _resetMissingModuleWarnings(): void {
    _warnedMissingModule.clear();
}

/**
 * Returns the service if its module is registered, otherwise logs a
 * deduplicated console error and returns `undefined`. Modelled on AG Grid's
 * `assertModuleRegistered`: missing modules never throw — they degrade the
 * affected feature to a no-op so consuming applications don't crash in
 * production.
 *
 * Use at public-API entry points where the caller wants to surface which
 * module is missing. For internal/lifecycle paths, plain `?.` chaining on
 * the service slot is preferred — no log, just a silent no-op.
 */
export function assertModule<T>(
    service: T | undefined,
    moduleName: string,
    context?: string
): T | undefined {
    if (service !== undefined) {
        return service;
    }
    const key = `${moduleName}|${context ?? ''}`;
    if (_warnedMissingModule.has(key)) {
        return undefined;
    }
    _warnedMissingModule.add(key);
    const where = context ? ` for ${context}` : '';
    // eslint-disable-next-line no-console
    console.error(
        `dockview: module "${moduleName}" is not registered${where}.`
    );
    return undefined;
}

export class ModuleRegistry<THost> implements IDisposable {
    private readonly _modules = new Map<string, DockviewModule<any>>();
    private readonly _services: ServiceCollection = {};
    private readonly _initDisposables: IDisposable[] = [];

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

    postConstruct(host: THost): void {
        for (const module of this._modules.values()) {
            if (module.init) {
                this._initDisposables.push(
                    (
                        module.init as (
                            h: THost,
                            s: ServiceCollection
                        ) => IDisposable
                    )(host, this._services)
                );
            }
        }
    }

    has(moduleName: string): boolean {
        return this._modules.has(moduleName);
    }

    dispose(): void {
        // Tear down init() subscriptions first so they stop firing into
        // services that are about to be disposed.
        for (const disposable of this._initDisposables) {
            disposable.dispose();
        }
        this._initDisposables.length = 0;

        for (const service of Object.values(this._services)) {
            if (
                service !== undefined &&
                typeof (service as Partial<IDisposable>).dispose === 'function'
            ) {
                (service as IDisposable).dispose();
            }
        }
    }
}
