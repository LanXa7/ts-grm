import { AnyModel, metadata } from "@ts-grm/core";
import { BaseModelImpl } from "./abstract_base_query_impl";

export function toTables(
    args: ReadonlyArray<any>
): ReadonlyArray<metadata.AbstractTable> {
    const tables: Array<metadata.AbstractTable> = [];
    for (let i = 0; i < args.length - 1; i++) {
        const model = args[i];
        const table = model instanceof BaseModelImpl
            ? metadata.createTypedBaseTable(model)
            : metadata.Entity.of(model as AnyModel).table(undefined);
        tables.push(table);
    }
    return tables;
}