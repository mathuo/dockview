import { Injectable } from '@angular/core';
import { ComponentReference } from '../types';

export type ComponentResolver = (component: string) => ComponentReference | undefined;

@Injectable({ providedIn: 'root' })
export class ComponentRegistryService {
    private readonly components: Map<string, ComponentReference> = new Map();
    private readonly resolver: ComponentResolver[] = [];

    public registerResolver(resolver: ComponentResolver) {
        this.resolver.push(resolver);
    }

    public unregisterResolver(resolver: ComponentResolver) {
        this.resolver.splice(this.resolver.indexOf(resolver), 1);
    }

    public registerComponents(components: Record<string, ComponentReference>) {
        for (const [component, reference] of Object.entries(components)) {
            this.registerComponent(component, reference);
        }
    }

    public registerComponent(component: string, reference: ComponentReference) {
        if (!component || !reference) {
            throw new Error('Component and reference must be provided');
        }

        this.components.set(component, reference);
    }

    public resolveComponent(component: string): ComponentReference | undefined {
        if (!component) {
            throw new Error('Component must be provided');
        }

        return this.getComponentReference(component);
    }

    private getComponentReference(component: string): ComponentReference | undefined {
        // first, try to get dynamic reference
        for (const resolver of this.resolver) {
            const reference = resolver(component);
            if (reference) {
                return reference;
            }
        }

        // last, try to get static reference
        return this.components.get(component);
    }
}
