import * as React from 'react';

export interface IRegistry {
    register<T>(name: string, value: T): void;
    get<T>(name: string): T;
}

class Registry implements IRegistry {
    private cache = new Map<string, any>();

    register<T>(name: string, value: T) {
        this.cache.set(name, value);
    }

    get<T>(name: string) {
        return this.cache.get(name) as T;
    }
}

const RegistryInstance = new Registry();

export const useLayoutRegistry = (): IRegistry => {
    const ref = React.useRef<IRegistry>(RegistryInstance);
    return ref.current;
};
