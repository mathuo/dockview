export interface Constructor<T> {
    new (): T;
}

export interface FrameworkFactory<T> {
    createComponent: (id: string, componentId: string, component: any) => T;
}

export type FunctionOrValue<T> = (() => T) | T;

export interface ICommonView {
    id: string;
}
