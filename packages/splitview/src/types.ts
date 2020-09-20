export interface Constructor<T> {
    new (): T;
}

export interface FrameworkFactory<T> {
    createComponent: (id: string, component: any) => T;
}

export type FunctionOrValue<T> = (() => T) | T;
