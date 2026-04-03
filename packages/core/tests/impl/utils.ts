import { Column, PropStorage } from "@/impl";
import { expect, JestAssertion } from "vitest";

export function expectStorage(storage: PropStorage | undefined): JestAssertion {
    if (storage == null) {
        return expect(undefined);
    }
    function columnJson(column: Column): any {
        if (column.referencedProp == null) {
            return column;
        }
        return {
            ...column,
            referencedProp: column.referencedProp.toString()
        }
    }
    const json = storage.kind === "COLUMNS"
        ? {
            kind: "COLUMNS",
            arr: storage.map(columnJson)
        }
        : storage.kind === "MIDDLE_TABLE" 
            ? {
                ...storage,
                toThisColumns: storage.toThisColumns.map(columnJson),
                toTargetColumns: storage.toTargetColumns.map(columnJson)
            }
            : columnJson(storage);
    return expect(json);
}