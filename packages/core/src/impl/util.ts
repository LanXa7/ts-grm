export function capitalize(str: string): string {
    if (str.length === 0) {
        return str;
    }
    const firstChar = String.fromCodePoint(str.codePointAt(0)!);
    const rest = str.slice(firstChar.length);
    return firstChar.toUpperCase() + rest;
}
