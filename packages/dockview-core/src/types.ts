export type FunctionOrValue<T> = (() => T) | T;

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export interface Box {
    left: number;
    top: number;
    height: number;
    width: number;
}
