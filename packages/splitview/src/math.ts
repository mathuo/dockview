export const clamp = (value: number, min: number, max: number) => {
    if (min > max) {
        throw new Error('min >= max condition failed');
    }
    return Math.min(max, Math.max(value, min));
};

export const sequentialNumberGenerator = () => {
    let value = 1;
    return { next: () => (value++).toString() };
};
