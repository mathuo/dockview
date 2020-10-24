export interface IRegistry {
    register<T>(name: string, value: T): void;
    get<T>(name: string): T;
}
export declare const useLayoutRegistry: () => IRegistry;
