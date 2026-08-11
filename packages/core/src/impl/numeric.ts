export enum NumericType {
    NONE = 0,
    INTEGER = 1,
    FLOAT = 2,
    STRING = 3
}

export function mergeNumericType(
    a: NumericType,
    b: NumericType
): NumericType {
    return a > b ? a : b;
}