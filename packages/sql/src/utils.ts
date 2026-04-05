import { FilterManager } from "./cfg";

export type DeepPartial<T> = 
    T extends object
        ? {
            [P in keyof T]?: DeepPartial<T[P]>;
        }
        : T;

export function merge<T>(
    value: DeepPartial<T>, 
    defaultValue: T
): T {
    if (value == null) {
        return defaultValue;
    }
    if (value.constructor === FilterManager) {
        return value as T;
    }
    if (typeof value !== "object") {
        return value as T;
    }
    const mergedObj = { ...value } as any;
    for (const key in defaultValue) {
        mergedObj[key] = merge(mergedObj[key], defaultValue[key]);
    }
    return mergedObj as T;
}