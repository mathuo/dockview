export type FunctionOrValue<T> = (() => T) | T;

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export interface Box {
    left: number;
    top: number;
    height: number;
    width: number;
}

export type AnchoredBox =
    ({ top: number, height: number } | { bottom: number, height: number }) &
    ({ left: number, width: number } | { right: number, width: number });