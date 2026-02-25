import { StateError } from "@/error/common";

export function makeErr(message: string | (() => Error)): never {
    if (typeof message === "string") {
        throw new StateError(message);
    }
    throw message();
}

export function dedent(strings: TemplateStringsArray, ...values: any[]): string {
    const str = strings.reduce((result, string, i) =>
        result + string + (values[i] || ''), '');
    
    const lines = str.split('\n');
    if (lines.length === 0) return '';
    
    const minIndent = lines
        .filter(line => line.trim().length > 0)
        .reduce((min, line) => {
            const indent = line.match(/^\s*/)?.[0].length || 0;
            return Math.min(min, indent);
        }, Infinity);
    
    return lines
        .map(line => line.slice(minIndent))
        .join('\n')
        .trim();
}