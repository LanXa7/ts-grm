export function capitalize(str: string): string {
    if (str.length === 0) {
        return str;
    }
    const firstChar = String.fromCodePoint(str.codePointAt(0)!);
    const rest = str.slice(firstChar.length);
    return firstChar.toUpperCase() + rest;
}

export function acceptsNullOrUndefined(schema: any): boolean {
    const standard = schema['~standard'];
    if (!standard) {
        return false
    };
    const resNull = standard.validate(null);
    const resUndefined = standard.validate(undefined);
    const allowsNull = !('issues' in resNull);
    const allowsUndefined = !('issues' in resUndefined);
    return allowsNull || allowsUndefined;
}
