import { AnyModel, spi } from "@ts-grm/core";
import { BaseModelImpl } from "./abstract_base_query_impl";

export function toTables(
    args: ReadonlyArray<any>
): ReadonlyArray<spi.AbstractTable> {
    const tables: Array<spi.AbstractTable> = [];
    for (let i = 0; i < args.length - 1; i++) {
        const model = args[i];
        const table = model instanceof BaseModelImpl
            ? spi.createTypedBaseTable(model, undefined)
            : spi.Entity.of(model as AnyModel).table(undefined);
        tables.push(table);
    }
    return tables;
}
