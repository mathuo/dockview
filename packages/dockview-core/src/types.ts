export interface FrameworkFactory<T> {
    createComponent: (id: string, componentId: string, component: any) => T;
}

export function isBooleanValue(value: any): value is boolean {
    return typeof value === 'boolean';
}

export type FunctionOrValue<T> = (() => T) | T;

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
