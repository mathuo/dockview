export const clamp = (value: number, min: number, max: number): number => {
    if (min > max) {
        throw new Error(`${min} > ${max} is an invalid condition`);
    }
    return Math.min(max, Math.max(value, min));
};

export const sequentialNumberGenerator = (): { next: () => string } => {
    let value = 1;
    return { next: () => (value++).toString() };
};

export const range = (from: number, to?: number): number[] => {
    const result: number[] = [];

    if (typeof to !== 'number') {
        to = from;
        from = 0;
    }

    if (from <= to) {
        for (let i = from; i < to; i++) {
            result.push(i);
        }
    } else {
        for (let i = from; i > to; i--) {
            result.push(i);
        }
    }

    return result;
};
