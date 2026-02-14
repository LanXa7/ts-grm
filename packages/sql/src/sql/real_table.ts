import { AbstractEntityTable, EntityProp, err, JoinFilter, JoinType } from "@ts-grm/core";
import { JoinMergeScope } from "./join_merge_scope";
import { SqlBuilder } from "./sql_builder";

export class RealTable {

    private _restrictChildMap: Map<string, RealTable> | undefined = undefined;

    private _laxChildMap: Map<string, RealTable> | undefined = undefined;

    private _joinType: JoinType | undefined;

    private _joinProp: EntityProp | undefined = undefined;

    private _filters: Array<JoinFilter> | undefined = undefined;

    private _alias: string | undefined = undefined;

    constructor(readonly symbol: AbstractEntityTable) {
        this._joinType = symbol.joinOperation?.joinType;
        this._joinProp = symbol.joinOperation?.joinProp;
        this._filters = symbol.joinOperation?.filter != null ?
            [symbol.joinOperation.filter] :
            undefined;
    }

    get joinType(): JoinType | undefined {
        return this._joinType;
    }

    get joinProp(): EntityProp | undefined {
        return this._joinProp;
    }

    get filters(): ReadonlyArray<JoinFilter> | undefined {
        return this._filters;
    }

    child(
        symbol: AbstractEntityTable, 
        scope: JoinMergeScope | undefined
    ): RealTable {
        const joinOperation = symbol.joinOperation;
        if (joinOperation == null) {
            throw new err.ArgumentError(`symbol.joinOperation cannot be null`);
        }
        const restrictKey = RealTable._restrictKeyOf(symbol, undefined);
        let restrictChildMap = this._restrictChildMap;
        let restrictChild = restrictChildMap?.get(restrictKey);
        if (restrictChild != null) {
            restrictChild._mergeFilter(joinOperation.filter);
            return restrictChild;
        }
        if (restrictChildMap == null) {
            this._restrictChildMap = restrictChildMap = new Map();
        }
        const laxKey = RealTable._laxKeyOf(symbol, scope);
        let laxChildMap = this._laxChildMap;
        let child = laxChildMap?.get(laxKey);
        if (child != null) {
            child._mergeFilter(joinOperation.filter);
            if (child._joinType != "INNER") {
                child._joinType = "INNER";
                restrictChildMap.set(RealTable._restrictKeyOf(symbol, "INNER"), child);
            }
        } else {
            if (laxChildMap == null) {
                this._laxChildMap = laxChildMap = new Map();
            }
            child = new RealTable(symbol);
            restrictChildMap.set(restrictKey, child);
            laxChildMap.set(laxKey, child);
        }
        return child;
    }

    private _mergeFilter(filter: JoinFilter | undefined) {
        if (filter != null) {
            let filters = this._filters;
            if (filters == null) {
                this._filters = filters = [];
            }
            filters.push(filter);
        }
    }

    private static _restrictKeyOf(
        symbol: AbstractEntityTable,
        joinType: JoinType | undefined
    ): string {
        return `${
            symbol.entity.identity
        }\x1F${
            symbol.joinOperation!.joinProp?.name ?? ""
        }\x1F${
            joinType ?? symbol.joinOperation!.joinType
        }`;
    }

    private static _laxKeyOf(
        symbol: AbstractEntityTable,
        scope: JoinMergeScope | undefined
    ): string {
        return `${
            symbol.entity.identity
        }\x1F${
            symbol.joinOperation!.joinProp?.name ?? ""
        }\x1F${
            scope?.identity ?? 0
        }`;
    }

    collectTables(builder: SqlBuilder, tables: Set<RealTable>) {
        this._alias = builder.allocateTableAlias();
        tables.add(this);
        if (this._restrictChildMap != null) {
            for (const child of this._restrictChildMap.values()) {
                child.collectTables(builder, tables);
            }
        }
    }

    render(builder: SqlBuilder) {
        if (this._joinType == null) {
            builder.sql("\nfrom ").sql(this._alias!);
            return;
        }
        builder.sql("\n");
        if (this._joinType === "LEFT") {
            builder.sql("left join ");
        } else {
            builder.sql("inner join ");
        }
        builder.sql(this._alias!);
    }

    get alias(): string {
        const alias = this._alias;
        if (alias == null) {
            throw new err.StateError("The table alias has not been allocated");
        }
        return alias;
    }
}
