import { metadata } from "@ts-grm/core";
import { Alias, Column, Composite, MiddleAlias, Scope } from "./fragment";
import { RealTable } from "./real_table";
import { FragmentGenGenVisitor } from "./fragment_gen_visitor";
import { SqlClientImplementor } from "@/sql_client";

export class TableFragmentCreator {

    constructor(
        private readonly _sqlClient: SqlClientImplementor,
        private readonly _crateColumn: (realTable: RealTable, columnName: string) => Column,
        private readonly _cloneVisitor: () => FragmentGenGenVisitor
    ) {
    }

    createDefinition(table: RealTable) {
        const composite = Composite.of(
            table.symbol.__baseModel!.__toQuery(), 
            this._sqlClient,
            table.baseQueryMetadata
        );
        const wrapper = new Scope("VALUES");
        wrapper.add(composite);
        return wrapper;
    }

    createUsage(
        table: RealTable
    ): Composite {
        const composite = new Composite();
        if (table.parent == null) {
            this._addTable(table, composite);
        } else if (table.joinProp != null) {
            switch (table.joinProp.storageType) {
                case "MIDDLE_TABLE":
                    this._addJoinByMiddleTable(table, composite);
                    break;
                case "NONE":
                    this._addJoinByForeignKey(table, true, composite);
                    break;
                default:
                    this._addJoinByForeignKey(table, false, composite);
                    break;
            }
        } else {
            composite
                .add("\n")
                .add(table.joinType!.toLowerCase())
                .add(" join ");
            this._addTable(table, composite);
            composite.add(" on ");
            const scope = new Scope("AND");
            this._addJoinFilter(table, scope);
            composite.add(scope);
        }
        return composite;
    }

    private _addTable(
        table: RealTable,
        composite: Composite
    ) {
        if (table.symbol.__entity != null) {
            const entityTable = table.symbol as metadata.AbstractEntityTable;
            composite
                .add(entityTable.__entity.toTableName(this._sqlClient.options.strategy))
                .add(" ")
                .add(new Alias(table));
        } else {
            const baseTable = table.symbol as metadata.TypedBaseTable;
            if (baseTable.__isCte) {
                composite.add(new Alias(table));
            } else {
                composite.add(this.createDefinition(table));
                composite.add(" ").add(new Alias(table))
            }
        }
    }

    private _addJoinByMiddleTable(
        table: RealTable,
        composite: Composite
    ) {
        const middleTable = table.joinProp!.toStorage(this._sqlClient.options.strategy)! as metadata.MiddleTable;
        composite
            .add("\n")
            .add(table.joinType!.toLowerCase())
            .add(" join ")
            .add(middleTable.name)
            .add(" ")
            .add(new MiddleAlias(table))
            .add(" on ");
        const thisConditionScope = new Scope("AND");
        for (const column of middleTable.toThisColumns) {
            thisConditionScope
                .separator()
                .add(
                    this._crateColumn(
                        table.parent!,
                        column.referencedColumnName!
                    )
                )
                .add(" = ")
                .add(new MiddleAlias(table))
                .add(".")
                .add(column.name);
        }
        composite.add(thisConditionScope);
        composite
            .add("\n")
            .add(table.joinType!.toLowerCase())
            .add(" join ");
        this._addTable(table, composite);
        composite.add(" on ");
        const targetConditionScope = new Scope("AND");
        for (const column of middleTable.toTargetColumns) {
            targetConditionScope
                .separator()
                .add(new MiddleAlias(table))
                .add(".")
                .add(column.name)
                .add(" = ")
                .add(new Alias(table))
                .add(".")
                .add(column.referencedColumnName!);
        }
        this._addJoinFilter(table, targetConditionScope);
        composite.add(targetConditionScope);
    }

    private _addJoinByForeignKey(
        table: RealTable,
        reverse: boolean,
        composite: Composite
    ) {
        composite
            .add("\n")
            .add(table.joinType!.toLowerCase())
            .add(" join ");
        this._addTable(table, composite);
        composite.add(" on ");
        const storage = (reverse ? table.joinProp!.mappedByProp! : table.joinProp!)
            .toStorage(this._sqlClient.options.strategy) as metadata.PropStorage;
        const conditionScope = new Scope("AND");
        if (storage.kind === "COLUMN") {
            conditionScope
                .separator()
                .add(
                    this._crateColumn(
                        table.parent!, 
                        reverse ? storage.referencedColumnName! : storage.name
                    )
                )
                .add(" = ")
                .add(new Alias(table))
                .add(".")
                .add(reverse ? storage.name : storage.referencedColumnName!);
        } else if (storage.kind === "COLUMNS") {
            for (const column of storage) {
                conditionScope
                    .separator()
                    .add(
                        this._crateColumn(
                            table.parent!, 
                            reverse ? column.referencedColumnName! : column.name
                        )
                    )
                    .add(" = ")
                    .add(new Alias(table))
                    .add(".")
                    .add(reverse ? column.name : column.referencedColumnName!);
            }
        }
        this._addJoinFilter(table, conditionScope);
        composite.add(conditionScope);
    }

    private _addJoinFilter(table: RealTable, scope: Scope) {
        const pred = table.filterPred;
        if (pred == null) {
            return;
        }
        scope.separator();
        const visitor = this._cloneVisitor();
        pred.accept(visitor);
        const composite = visitor.toResult();
        if (composite.fragments!.length === 1) {
            const result = composite.fragments![0]!;
            if (result instanceof Scope && result.kind === scope.kind) {
                for (const fragment of result.fragments!) {
                    if (typeof fragment === "string") {
                        scope.add(fragment);
                    } else {
                        scope.add(fragment);
                    }
                }
                return;
            }
        }
        scope.add(composite);
    }
}