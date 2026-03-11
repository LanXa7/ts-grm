import { ast, err, metadata } from "@ts-grm/core";
import { Stack } from "./stack";
import { JoinMergeScope } from "./join_merge_scope";
import { RealTable } from "./real_table";
import { SqlClientImplementor } from "@/sql_client";

export class PreVisitor extends ast.AbstractVisitor {

    private readonly _tableMap = new Map<metadata.AbstractTable, RealTable>();
    
    private readonly _joinMergeScopeStack =
        new Stack<JoinMergeScope>(undefined);

    private readonly _strategy: metadata.DatabaseNamingStrategy;

    private _filterProcessingTables: Array<RealTable> | undefined = undefined;
        
    constructor(sqlClient: SqlClientImplementor) {
        super();
        this._strategy = sqlClient.options.strategy;
    }

    get tableMap(): ReadonlyMap<metadata.AbstractTable, RealTable> {
        this._processFilters();
        return this._tableMap;
    }

    visitAtomQuery(query: ast.AtomQueryContract): void {
        const projection = query.projection;
        switch (projection.kind) {
            case "ROOT_SINGLE":
                (projection.selection as any as ast.Node).accept(this);
                break;
            case "ROOT_ARRAY":
                for (const selection of projection.selections) {
                    (selection as any as ast.Node).accept(this);
                }
                break;
            case "ROOT_MAP":
                for (const key in projection.selections) {
                    (projection.selections[key] as any as ast.Node).accept(this);
                }
                break;
            case "SUB_SINGLE":
                (projection.selection as any as ast.Node).accept(this);
                break;
            case "SUB_ARRAY":
                for (const selection of projection.selections) {
                    (selection as any as ast.Node).accept(this);
                }
                break;
        }
        super.visitAtomQuery(query);
        for (const table of query.tables) {
            this._toRealTable(table as any);
        }
    }

    visitTablePropExpr(expr: ast.PropExprContract): void {
        if (expr.table.__isPrev) {
            return;
        }
        const shadow = expr.table.__shadow;
        if (shadow == null) {
            this._toRealTable(expr.table);
        } else {
            this._toRealTable(shadow).baseQueryMetadata.alias(
                expr.table.__anchor!.exportedName, 
                (expr.prop.toStorage(this._strategy) as any as metadata.Column).name
            );
        }
    }

    visitFetchedView(view: ast.FetchedViewContract): void {
        const shadow = view.table.__shadow;
        if (shadow == null) {
            this._toRealTable(view.table); 
        } else {
            const metadata = this._toRealTable(shadow).baseQueryMetadata;
            for (const field of view.view.mapper.fields) {
                if (field.columnIndex == null) {
                    continue;
                }
                const column = field.prop.toStorage(this._strategy) as metadata.Column;
                metadata.alias(view.table.__anchor!.exportedName, column.name);
            }
        }
    }

    visitShadowExpr(expr: ast.ShadowExprContract): void {
        if (expr.shadow != null) {
            this
                ._toRealTable(expr.shadow)
                .baseQueryMetadata
                .alias(expr.anchor.exportedName, undefined);
        }
    }

    visitCompoundPred(pred: ast.CompoundPred): void {
        if (pred.op === "AND") {
            for (const p of pred.preds) {
                p.accept(this);
            }
        } else {
            for (const p of pred.preds) {
                using _ = this._joinMergeScopeStack.with(new JoinMergeScope());
                p.accept(this);
            }
        }
    }

    private _toRealTable(
        table: metadata.AbstractTable
    ): RealTable {
        let realTable = this._tableMap.get(table);
        if (realTable == null) {
            if (table.__shadow == null) {
                const anchor = (table as metadata.AbstractEntityTable).__anchor;
                if (anchor != null) {
                    throw new err.ArgumentError("The argument cannot be table with shadow anchor does not have shadow");
                }
            }
            const joinOperation = table.__joinOperation;
            if (joinOperation == null) {
                realTable = new RealTable(table);
            } else {
                const parentRealTable = this._toRealTable(joinOperation.parent);
                realTable = parentRealTable.child(
                    table as metadata.AbstractEntityTable, 
                    this._joinMergeScopeStack.currentOrUndefined
                );
            }
            this._tableMap.set(table, realTable);
            if (this._filterProcessingTables != null) {
                this._filterProcessingTables.push(realTable);
            }
        }
        return realTable;
    }

    private _processFilters() {
        if (this._filterProcessingTables == null) {
            this._filterProcessingTables = Array.from(this._tableMap.values());
        }
        while (this._filterProcessingTables.length != 0) {
            const arr = this._filterProcessingTables;
            this._filterProcessingTables = [];
            for (const table of arr) {
                table.filterPred?.accept(this);
            }
        }
    }
}