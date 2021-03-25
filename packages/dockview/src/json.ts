export function tryParseJSON(
    text: string,
    reviver?: (this: any, key: string, value: any) => any
): any | undefined;
export function tryParseJSON<T>(
    text: string,
    reviver?: (this: any, key: string, value: any) => any
): T | undefined {
    try {
        return JSON.parse(text, reviver) as T;
    } catch (err) {
        console.warn('failed to parse JSON');
        return undefined;
    }
}
