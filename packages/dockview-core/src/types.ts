export type FunctionOrValue<T> = (() => T) | T;

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export interface Box {
    left: number;
    top: number;
    height: number;
    width: number;
}

type TopLeft = { top: number; left: number };
type TopRight = { top: number; right: number };
type BottomLeft = { bottom: number; left: number };
type BottomRight = { bottom: number; right: number };

export type AnchorPosition = TopLeft | TopRight | BottomLeft | BottomRight;
type Size = { width: number; height: number };

export type AnchoredBox = Size & AnchorPosition;
