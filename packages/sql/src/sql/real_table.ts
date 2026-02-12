import { AbstractEntityTable, ast, EntityProp, err, JoinFilter, JoinType } from "@ts-grm/core";
import { JoinMergeScope } from "./join_merge_scope";

export class RealTable {

    private _childMap: Map<string, RealTable> | undefined = undefined;

    private _joinType: JoinType | undefined;

    private _joinProp: EntityProp | undefined = undefined;

    private _filters: Array<JoinFilter> | undefined = undefined;

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
            throw new err.ArgumentError(`symbol.joinOperation cannot`);
        }
        const key = RealTable.keyOf(symbol, scope);
        let childMap = this._childMap;
        let child = childMap?.get(key);
        if (child != null) {
            if (child._joinType !== joinOperation!.joinType) {
                child._joinType = "INNER";
            }
            if (joinOperation?.filter != null) {
                let filters = this._filters;
                if (filters == null) {
                    this._filters = filters = [];
                }
                filters.push(joinOperation.filter);
            }
        } else {
            if (childMap == null) {
                this._childMap = childMap = new Map();
            }
            child = new RealTable(symbol);
            childMap.set(key, child);
        }
        return child;
    }

    private static keyOf(
        symbol: AbstractEntityTable,
        scope: JoinMergeScope | undefined
    ): string {
        return `${
            symbol.entity.idKey
        }\x1F${
            symbol.joinOperation?.joinProp?.name ?? ""
        }\x1F${
            scope?.identity ?? 0
        }`;
    }
}
