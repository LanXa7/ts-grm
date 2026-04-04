import { metadata } from "@ts-grm/core";
import { Alias, Column, Composite, Scope } from "./fragment";
import { RealTable } from "./real_table";
import { FragmentGenGenVisitor } from "./fragment_gen_visitor";
import { SqlClientImplementor } from "@/sql_client";
import { addTypeMatch } from "./utils";

export class TableFragmentCreator {

    private readonly _strategy: metadata.DatabaseNamingStrategy;

    constructor(
        private readonly _sqlClient: SqlClientImplementor,
        private readonly _createColumn: (realTable: RealTable, columnName: string) => Column,
        private readonly _cloneVisitor: () => FragmentGenGenVisitor
    ) {
        this._strategy = _sqlClient.options.strategy;
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
            this._addJoinByForeignKey(table, composite);
        } else if (table.castToEntity != null) {
            this._addJoinByInheritance(table, composite);
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
            composite
                .add(table.symbol.__entity.toTableName(this._strategy))
                .add(" ")
                .add(new Alias(table));
        } else if (table.symbol.__associationEntity != null) {
            composite
                .add(table.symbol.__associationEntity.toTableName(this._strategy))
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

    private _addJoinByForeignKey(
        table: RealTable,
        composite: Composite
    ) {
        composite
            .add("\n")
            .add(table.joinType!.toLowerCase())
            .add(" join ");
        this._addTable(table, composite);
        composite.add(" on ");
        const storage = table.joinProp!.toStorage(this._strategy) as metadata.PropStorage;
        const conditionScope = new Scope("AND");
        if (storage.kind === "COLUMN") {
            conditionScope
                .separator()
                .add(
                    this._createColumn(
                        table.parent!, 
                        table.isJoinPropInverse ? storage.referencedColumnName! : storage.name
                    )
                )
                .add(" = ")
                .add(new Alias(table))
                .add(".")
                .add(table.isJoinPropInverse ? storage.name : storage.referencedColumnName!);
        } else if (storage.kind === "COLUMNS") {
            for (const column of storage) {
                conditionScope
                    .separator()
                    .add(
                        this._createColumn(
                            table.parent!, 
                            table.isJoinPropInverse ? column.referencedColumnName! : column.name
                        )
                    )
                    .add(" = ")
                    .add(new Alias(table))
                    .add(".")
                    .add(table.isJoinPropInverse ? column.name : column.referencedColumnName!);
            }
        }
        this._addJoinFilter(table, conditionScope);
        composite.add(conditionScope);
    }

    private _addJoinByInheritance(
        table: RealTable,
        composite: Composite
    ) {
        composite
            .add("\n")
            .add(table.joinType!.toLowerCase())
            .add(" join ");
        this._addTable(table, composite);
        composite.add(" on ");
        const conditionScope = new Scope("AND");
        if (table.symbol.__entity!.ancestors.has(table.parent!.symbol.__entity!)) {
            addTypeMatch(table.parent!, table.symbol.__entity!, this._createColumn, false, conditionScope);
        }
        const parentStorage = table.parent!.symbol.__entity!.idProp.toStorage(this._strategy)!;
        const storage = table.symbol.__entity!.idProp.toStorage(this._strategy)!;
        switch (parentStorage.kind) {
            case "COLUMN":
                conditionScope
                    .separator()
                    .add(
                        this._createColumn(table.parent!, parentStorage.name)
                    )
                    .add(" = ")
                    .add(
                        this._createColumn(table!, (storage as metadata.Column).name)
                    );
                break;
            case "COLUMNS":
                for (let i = 0; i < parentStorage.length; i++) {
                    conditionScope
                        .separator()
                        .add(
                            this._createColumn(table.parent!, parentStorage[i]!.name)
                        )
                        .add(" = ")
                        .add(
                            this._createColumn(table!, (storage as metadata.Columns)[i]!.name)
                        );
                }
                break;
        }
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