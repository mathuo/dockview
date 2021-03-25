export function debounce<T extends Function>(cb: T, wait: number) {
    let timeout: any;

    const callable = (...args: any) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => cb(...args), wait);
    };
    return <T>(<any>callable);
}
