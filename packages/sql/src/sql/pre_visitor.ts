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
        
    constructor(
        private readonly _sqlClient: SqlClientImplementor
    ) {
        super();
        this._strategy = _sqlClient.options.strategy;
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
            case "BASE":
                for (const key in projection.args) {
                    const value = projection.args[key];
                    if (value instanceof ast.AbstractExpr) {
                        value.accept(this);
                    }
                }
                break;
        }
        super.visitAtomQuery(query);
        for (const table of query.tables) {
            this._toRealTable(table as any);
        }
    }

    visitPropExpr(expr: ast.PropExprContract): void {
        if (expr.table.__isPrev) {
            return;
        }
        let table: metadata.AbstractTable = expr.table;
        let prop = expr.prop;
        let column: metadata.Column;
        if (this._sqlClient.isDirectAssociatedKey(expr)) {
            table = table.__joinOperation!.parent;
            column = expr.table.__joinOperation!.joinProp!.sub(prop.subPath).toStorage(this._strategy) as metadata.Column;
        } else {
            if (!prop.isMiddleTableProp) {
                table = (table as metadata.AbstractEntityTable).__to(
                    (prop as metadata.EntityProp).declaringEntity
                );
            }
            column = prop.toStorage(this._strategy) as metadata.Column;
        }
        const shadow = this._toRealTable(table).shadow;
        if (shadow != null) {
            shadow.baseQueryMetadata.alias(
                expr.table.__anchor!.exportedName, 
                column.name
            );
        }
    }

    visitIsPred(pred: ast.IsPred): void {
        const shadow = this._toRealTable(pred.table).shadow;
        if (shadow != null) {
            shadow.baseQueryMetadata.alias(
                pred.table.__anchor!.exportedName, 
                pred.table.__entity.tableSettings.discriminator!.name
            )
        }
    }

    visitFetchedView(view: ast.FetchedViewContract): void {
        const shadow = this._toRealTable(view.table).shadow;
        for (const field of view.view.mapper.fields) {
            if (field.columnIndex == null) {
                continue;
            }
            this._toRealTable(view.table.__to(field.prop.declaringEntity));
            if (shadow != null) {
                const column = field.prop.toStorage(this._strategy) as metadata.Column;
                shadow.baseQueryMetadata.alias(view.table.__anchor!.exportedName, column.name);
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
        let realTable = this._tableMap.get(table.__prototype);
        if (realTable == null) {
            if (table.__shadow == null) {
                const anchor = (table as metadata.AbstractEntityTable).__anchor;
                if (anchor != null) {
                    throw new err.ArgumentError("The argument cannot be table with shadow anchor does not have shadow");
                }
            }
            if (table.__shadow != null) {
                const shadowRealTable = this._toRealTable(table.__shadow);
                this._tableMap.set(table.__shadow.__prototype, shadowRealTable);
                if (this._filterProcessingTables != null) {
                    this._filterProcessingTables.push(shadowRealTable);
                }
                realTable = shadowRealTable.export(table);
            } else {
                const joinOperation = table.__joinOperation;
                if (joinOperation == null) {
                    realTable = new RealTable(table, undefined);
                } else {
                    const parentRealTable = this._toRealTable(joinOperation.parent);   
                    realTable = parentRealTable.child(
                        table, 
                        this._joinMergeScopeStack.currentOrUndefined
                    );
                }
            }
            this._tableMap.set(table.__prototype, realTable);
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
                this._processFilter(table);
            }
        }
    }

    private _processFilter(table: RealTable) {
        table.filterPred?.accept(this);
        if (table.parent?.shadow == null) {
            return;
        }
        if (table.joinProp != null) {
            switch (table.joinProp.storageType) {
                case "MIDDLE_TABLE":
                    this._processMiddleTable(table);
                    break;
                case "NONE":
                    this._processForeignKey(table, true);
                    break;
                default:
                    this._processForeignKey(table, false);
                    break;
            }
        } else if (table.castToEntity != null) {
            this._processInheritance(table);
        }
    }

    private _processMiddleTable(table: RealTable) {
        const middleTable = (table.joinProp as metadata.EntityProp)!.toStorage(this._strategy)! as metadata.MiddleTable;
        const exportedName = table.parent!.symbol.__anchor!.exportedName;
        for (const column of middleTable.toThisColumns) {
            table.parent!.shadow!.baseQueryMetadata.alias(exportedName, column.referencedColumnName!);
        }
    }

    private _processForeignKey(table: RealTable, reverse: boolean) {
        const storage = (reverse ? (table.joinProp as metadata.EntityProp)!.mappedByProp! : (table.joinProp as metadata.EntityProp)!)
            .toStorage(this._strategy) as metadata.PropStorage;
        const exportedName = table.parent!.symbol.__anchor!.exportedName;
        if (storage.kind === "COLUMN") {
            table.parent!.shadow!.baseQueryMetadata.alias(
                exportedName, 
                reverse ? storage.referencedColumnName! : storage.name
            );
        } else if (storage.kind === "COLUMNS") {
            for (const column of storage) {
                table.parent!.shadow!.baseQueryMetadata.alias(
                    exportedName, 
                    reverse ? column.referencedColumnName! : column.name
                );
            }
        }
    }

    private _processInheritance(table: RealTable) {
        const parentTable = table.parent!;
        if (table.symbol.__entity!.ancestors.has(parentTable.symbol.__entity!)) {
            const exportedName = parentTable.symbol.__anchor!.exportedName;
            parentTable.shadow!.baseQueryMetadata.alias(
                exportedName, 
                parentTable.symbol.__entity!.tableSettings.discriminator!.name
            );
        }
    }
}