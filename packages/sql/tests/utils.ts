import { SqliteDriver } from "@/driver/sqlite_driver";
import { newSqlClient, SqlClientImplementor } from "@/sql_client";
import { EntityManager, SqlClient } from "@ts-grm/core";
import Database from "better-sqlite3";
import { expect } from "vitest";

export function useSqlClient<TImplementor extends boolean = false>(
    _?: TImplementor
): [
    TImplementor extends true 
        ? SqlClientImplementor
        : SqlClient, 
    () => void
] {
    const database = new Database(":memory:");
    const sqlClient = newSqlClient(new SqliteDriver(database), {
        entityManager: EntityManager.of(__dirname, "./model"),
        sqlLogger: {
            pretty: true
        }
    });
    return [sqlClient as SqlClientImplementor, () => { database.close(); }]
}

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

export function removeUndefined(value: any): any {
    if (value === null || typeof value !== 'object') {
        return value;
    }

    if (Array.isArray(value)) {
        return value
        .map(item => removeUndefined(item))
        .filter(item => item !== undefined);
    }

    const result: Record<string, unknown> = {};
    for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
            const val = (value as Record<string, unknown>)[key];
            if (val !== undefined) {
                result[key] = removeUndefined(val);
            }
        }
    }
    return result;
}