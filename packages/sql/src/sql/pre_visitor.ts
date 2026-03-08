import { ast, err, metadata } from "@ts-grm/core";
import { Stack } from "./stack";
import { JoinMergeScope } from "./join_merge_scope";
import { RealTable } from "./real_table";
import { SqlClientImplementor } from "@/sql_client";
import { Column } from "./fragment";

export class PreVisitor extends ast.AbstractVisitor {

    private _tableMap = new Map<metadata.AbstractEntityTable | metadata.TypedBaseTable, RealTable>();
    
    private readonly _joinMergeScopeStack =
        new Stack<JoinMergeScope>(undefined);

    private readonly _strategy: metadata.DatabaseNamingStrategy;
        
    constructor(sqlClient: SqlClientImplementor) {
        super();
        this._strategy = sqlClient.options.strategy;
    }

    get tableMap(): ReadonlyMap<metadata.AbstractEntityTable | metadata.TypedBaseTable, RealTable> {
        return this._tableMap;
    }

    visitAtomQuery(query: ast.AtomQueryContract): void {
        for (const table of query.tables) {
            this._toRealTable(table as any);
        }
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
    }

    visitTablePropExpr(expr: ast.PropExprContract): void {
        const shadow = expr.table.shadow;
        if (shadow == null) {
            this._toRealTable(expr.table);
        } else {
            this._toRealTable(shadow).baseQueryMetadata.alias(
                expr.table.anchor!.exportedName, 
                (expr.prop.toStorage(this._strategy) as any as Column).name
            );
        }
    }

    visitFetchedView(view: ast.FetchedViewContract): void {
        const shadow = view.table.shadow;
        if (shadow == null) {
            this._toRealTable(view.table); 
        } else {
            const metadata = this._toRealTable(shadow).baseQueryMetadata;
            for (const field of view.view.mapper.fields) {
                if (field.columnIndex == null) {
                    continue;
                }
                const column = field.prop.toStorage(this._strategy) as metadata.Column;
                metadata.alias(view.table.anchor!.exportedName, column.name);
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
        table: metadata.AbstractEntityTable | metadata.TypedBaseTable
    ): RealTable {
        let realTable = this._tableMap.get(table);
        if (realTable == null) {
            if (table.entity != null && table.shadow == null) {
                const anchor = (table as metadata.AbstractEntityTable).anchor;
                if (anchor != null) {
                    throw new err.ArgumentError("The argument cannot be table with shadow anchor does not have shadow");
                }
            }
            const joinOperation = table instanceof metadata.AbstractEntityTable 
                ? table.joinOperation
                : undefined;
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
        }
        return realTable;
    }
}