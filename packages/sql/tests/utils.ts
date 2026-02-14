import { expect } from "vitest";

export function expectCode(actual: string, expected: string) {
    const normalizedExpected = normalizeCode(expected);
    expect(actual).toEqual(normalizedExpected);
}

function normalizeCode(code: string): string {

    const lines = code.split('\n');
    let startIndex = 0;
    let endIndex = lines.length - 1;
    while (startIndex <= endIndex && lines[startIndex]!.trim() === '') {
        startIndex++;
    }
    while (endIndex >= startIndex && lines[endIndex]!.trim() === '') {
        endIndex--;
    }
    const trimmedLines = lines.slice(startIndex, endIndex + 1);
    if (trimmedLines.length === 0) {
        return '';
    }

    const firstLine = trimmedLines[0]!;
    const baseIndentMatch = firstLine.match(/^(\s*)/);
    const baseIndent = baseIndentMatch ? baseIndentMatch[1]!.length : 0;
    const normalizedLines = trimmedLines.map(line => {
        if (line.trim() === '') {
            return '';
        }
        return line.slice(baseIndent);
    });
    return normalizedLines.join('\n');
}