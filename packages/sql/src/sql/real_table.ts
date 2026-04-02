import { ast, dsl, err, JoinType, metadata, Predicate } from "@ts-grm/core";
import { JoinMergeScope } from "./join_merge_scope";
import { SqlBuilder } from "./sql_builder";
import { BaseQueryMetadata } from "./base_query_metadata";
import { Fragment } from "./fragment";

export class RealTable {

    private static _nextIdentity = 0;

    private _parent: RealTable | undefined = undefined;

    readonly identity = ++RealTable._nextIdentity;

    private _restrictChildMap: Map<string, RealTable> | undefined = undefined;

    private _laxChildMap: Map<string, RealTable> | undefined = undefined;

    private _joinType: JoinType | undefined;

    private _joinProp: metadata.EntityProp | metadata.AssociationProp | undefined = undefined;

    private _castToEntity: metadata.Entity | undefined = undefined;

    private _filters: Set<metadata.JoinFilter> | undefined = undefined;

    private _filterPred: ast.AbstractPred | undefined = undefined;

    private _filterPredResolved = false;

    private _alias: string | undefined = undefined;

    private _middleTableAlias: string | undefined = undefined;

    private _baseQueryMetadata: BaseQueryMetadata | undefined = undefined;

    private _exportedMap: Map<string, RealTable> | undefined = undefined;

    private _children: ReadonlyArray<RealTable> | undefined = undefined;

    cteDefinitionFragment: Fragment | undefined = undefined;

    fragment: Fragment | undefined = undefined;

    constructor(
        readonly symbol: metadata.AbstractTable,
        readonly shadow: RealTable | undefined
    ) {
        if (symbol.__joinOperation != null) {
            this._joinType = symbol.__joinOperation.joinType;
            this._joinProp = symbol.__joinOperation.joinProp;
            this._castToEntity = symbol.__joinOperation.castToEntity;
            if (symbol.__joinOperation?.filter != null) {
                let filters = this._filters;
                if (filters == null) {
                    this._filters = filters = new Set<metadata.JoinFilter>();
                }
                filters.add(symbol.__joinOperation.filter);
            }
        } else {
            this._joinType = undefined;
            this._joinProp = undefined;
            this._castToEntity = undefined;
            this._filters = undefined;
        }
    }

    get joinType(): JoinType | undefined {
        return this._joinType;
    }

    get parent(): RealTable | undefined {
        return this._parent;
    }

    get joinProp(): metadata.EntityProp | metadata.AssociationProp | undefined {
        return this._joinProp;
    }

    get castToEntity(): metadata.Entity | undefined {
        return this._castToEntity;
    }

    get filters(): ReadonlySet<metadata.JoinFilter> | undefined {
        return this._filters;
    }

    child(
        symbol: metadata.AbstractEntityTable, 
        scope: JoinMergeScope | undefined
    ): RealTable {
        const joinOperation = symbol.__joinOperation;
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
            child = new RealTable(symbol, undefined);
            child._parent = this;
            restrictChildMap.set(restrictKey, child);
            laxChildMap.set(laxKey, child);
            this._children = undefined;
        }
        return child;
    }

    export(table: metadata.AbstractTable): RealTable {
        if (table.__shadow !== this.symbol) {
            throw new err.ArgumentError("table is not exported table of current base table");
        }
        let exportedMap = this._exportedMap;
        let realTable: RealTable | undefined = undefined;
        if (exportedMap != null) {
            realTable = exportedMap.get(table.__anchor!.exportedName);
            if (realTable != null) {
                return realTable;
            }
        } else {
            this._exportedMap = exportedMap = new Map();
        }
        realTable = new RealTable(table, this);
        exportedMap.set(table.__anchor!.exportedName, realTable);
        this._children = undefined;
        return realTable;
    }

    get children(): ReadonlyArray<RealTable> {
        let children = this._children;
        if (children == null) {
            const arr: Array<RealTable> = [];
            if (this._laxChildMap != null) {
                for (const table of this._laxChildMap.values()) {
                    arr.push(table);
                }
            }
            if (this._exportedMap != null) {
                for (const exported of this._exportedMap.values()) {
                    const laxChildMap = exported._laxChildMap;
                    if (laxChildMap != null) {
                        arr.push(...Array.from(laxChildMap.values()));
                    }
                }
            }
            this._children = children = arr;
        }
        return children;
    }

    private _mergeFilter(filter: metadata.JoinFilter | undefined) {
        if (filter != null) {
            let filters = this._filters;
            if (filters == null) {
                this._filters = filters = new Set<metadata.JoinFilter>();
            }
            filters.add(filter);
            this._filterPredResolved = false;
        }
    }

    private static _restrictKeyOf(
        symbol: metadata.AbstractEntityTable,
        joinType: JoinType | undefined
    ): string {
        return `${
            (symbol.__entity ?? symbol.__baseModel).identity
        }\x1F${
            RealTable._propKey(symbol)
        }\x1F${
            joinType ?? symbol.__joinOperation!.joinType
        }`;
    }

    private static _laxKeyOf(
        symbol: metadata.AbstractEntityTable,
        scope: JoinMergeScope | undefined
    ): string {
        return `${
            (symbol.__entity ?? symbol.__baseModel).identity
        }\x1F${
            RealTable._propKey(symbol)
        }\x1F${
            scope?.identity ?? 0
        }`;
    }

    private static _propKey(
        symbol: metadata.AbstractEntityTable
    ): string {
        const joinOperation = symbol.__joinOperation!;
        if (joinOperation.joinProp != null) {
            return joinOperation.joinProp.name;
        }
        if (joinOperation.weakJoinModel != null) {
            return `j(${joinOperation.weakJoinModel.identifier})`;
        }
        return `c(${joinOperation.castToEntity!.identity})`;
    }

    collectTables(builder: SqlBuilder, tables: Set<RealTable>) {
        if ((this.joinProp as metadata.EntityProp)?.storageType === "MIDDLE_TABLE") {
            this._middleTableAlias = builder.allocateTableAlias();
        }
        this._alias = builder.allocateTableAlias();
        tables.add(this);
        for (const child of this.children) {
            child.collectTables(builder, tables);
        }
    }

    get alias(): string {
        const alias = this._alias;
        if (alias == null) {
            return `__unknown__${this.identity}`;
            //throw new err.StateError("The table alias has not been allocated");
        }
        return alias;
    }

    get middleTableAlias(): string | undefined {
        const middleTableAlias = this._middleTableAlias;
        if (middleTableAlias == null && (this.joinProp as metadata.EntityProp)?.storageType == "MIDDLE_TABLE") {
            return `__unknown__${this.identity}`;
            //throw new err.StateError("The middle table alias has not been allocated");
        }
        return middleTableAlias;
    }

    get baseQueryMetadata(): BaseQueryMetadata {
        let metadata = this._baseQueryMetadata;
        if (metadata != null) {
            return metadata;
        }
        if (this.symbol.__baseModel == null) {
            throw new err.StateError("Cannot get base query metadata from entity metadata");
        }
        metadata = new BaseQueryMetadata(this.symbol.__isCte, this);
        this._baseQueryMetadata = metadata;
        return metadata;
    }

    get filterPred(): ast.AbstractPred | undefined {
        if (this._filterPredResolved) {
            return this._filterPred;
        }
        let predicate : Predicate | undefined = undefined;
        if (this._filters != null) {
            for (const filter of this._filters) {
                const newPredicate = filter({
                    source: this._parent?.symbol as any, 
                    target: this.symbol as any
                });
                predicate = dsl.and(predicate, newPredicate);
            }
        }
        this._filterPred = predicate as ast.AbstractPred | undefined;
        this._filterPredResolved = true;
        return this._filterPred;
    }
}
