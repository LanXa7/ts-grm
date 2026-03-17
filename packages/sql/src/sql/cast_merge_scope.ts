import { metadata } from "@ts-grm/core";
import { RealTable } from "./real_table";

export class CastMergeScope {

    private readonly _tableMap = new Map<string, RealTable>();

    private readonly _nullable: boolean;

    private _tables: ReadonlyArray<RealTable> | undefined = undefined;

    constructor(
        readonly table: RealTable
    ) {
        this._nullable = table.symbol.__isNullable;
        const key = CastMergeScope._key(table.symbol.__entity!, this._nullable);
        this._tableMap.set(key, table);
    }

    get(
        symbol: metadata.AbstractEntityTable
    ): RealTable {
        const key = CastMergeScope._key(symbol.__entity, this._nullable || symbol.__isNullable);
        let table = this._tableMap.get(key);
        if (table == null) {
            table = new RealTable(symbol, undefined, this);
            this._tableMap.set(key, table);
            this._tables = undefined;
        }
        return table;
    }

    get tables(): ReadonlyArray<RealTable> {
        let tables = this._tables;
        if (tables == null) {
            const arr: Array<RealTable> = [];
            for (const table of this._tableMap.values()) {
                if (table !== this.table) {
                    arr.push(table);
                }
            }
            this._tables = tables = arr;
        }
        return tables;
    }

    private static _key(
        entity: metadata.Entity,
        nullable: boolean
    ): string {
        return `${entity.tableEntity.identity}\x1F${nullable ? "" : "n"}`;
    }
}