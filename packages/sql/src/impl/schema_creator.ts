import { SqlClientImplementor } from "@/sql_client";
import { CascadeType, err, metadata } from "@ts-grm/core";
import { ColumnDefImpl, ForeignKeyConstraintDef, TableDef, TableDefImpl } from "./schema_def";

export async function createSchema(
    sqlClient: SqlClientImplementor
): Promise<ReadonlyArray<TableDef>> {
    const executor = new SchemaCreatorExecutor(sqlClient);
    await executor.executue();
    return Array.from(executor.tableMap.values());
}

class SchemaCreatorExecutor {

    private readonly _strategy: metadata.DatabaseNamingStrategy;

    private readonly _processedMetadatas = new Set<metadata.Entity | metadata.EntityProp>();

    readonly tableMap = new Map<metadata.Entity | metadata.EntityProp, TableDefImpl>();

    constructor(
        private readonly _sqlClient: SqlClientImplementor
    ) {
        this._strategy = _sqlClient.options.strategy;
    }

    async executue(): Promise<void> {
        const entityManager = this._sqlClient.options.entityManager;
        if (entityManager == null) {
            throw new err.StateError(
                `In order to create schema, the entityManager of sqlClient must be specified explicitly`
            );
        }
        for (const entity of await entityManager.entities()) {
            this._processEntity(entity);    
        }
        for (const entity of await entityManager.entities()) {
            for (const prop of entity.declaredPropMap.values()) {
                if (prop.mappedByProp == null && prop.storageType === "MIDDLE_TABLE") {
                    this._processMiddleTable(prop);
                }
            }    
        }
        for (const tableDefImpl of this.tableMap.values()) {
            this._addSimpleConstraints(tableDefImpl);
        }
    }

    private _processEntity(entity: metadata.Entity) {
        if (!this._isProcessable(entity)) {
            return;
        }
        let tableDefImpl = this.tableMap.get(entity.tableEntity);
        if (tableDefImpl == null) {
            tableDefImpl = new TableDefImpl(
                entity.tableEntity,
                entity.tableEntity.toTableName(this._strategy)
            );
            this.tableMap.set(entity.tableEntity, tableDefImpl);
        }
        for (const prop of entity.declaredPropMap.values()) {
            this._processProp(prop, tableDefImpl);
        }
    }

    private _processProp(
        prop: metadata.EntityProp, 
        tableDefImpl: TableDefImpl
    ) {
        const scalaProps = 
            prop.scalarType != null
                ? [prop]
            : prop.props != null
                ? Array.from(prop.flattenScalarProps.values())
            : undefined;
        if (scalaProps == null) {
            return;
        }
        const referenceProp = prop.rootProp.referenceProp;
        const targetEntity = referenceProp?.targetEntity;
        let referencedTableDef: TableDefImpl | undefined = undefined;
        if (targetEntity != null) {
            this._processEntity(targetEntity);
            referencedTableDef = this.tableMap.get(targetEntity);
        }
        let foreignKeyBuilder = 
            referencedTableDef != null
                ? new ForeignKeyBuilder(referenceProp!.cascadeType)
                : undefined; 
        for (const scalarProp of scalaProps) {
            const column = scalarProp.toStorage(this._strategy) as metadata.Column;
            const referenceColumnDef = 
                referencedTableDef != null
                    ? referencedTableDef.referencedColumnDef(column.referencedColumnName!)
                    : undefined;
            const columnDefImpl = new ColumnDefImpl(
                tableDefImpl,
                scalarProp,
                column.name,
                referenceColumnDef,
                scalarProp.scalarType!,
                (scalarProp.nullable && !scalarProp.inputNonNull) 
                    || (tableDefImpl.entity != null && tableDefImpl.entity !== scalarProp.declaringEntity),
                scalarProp.length
            );
            tableDefImpl.addColumnDef(columnDefImpl);
            if (foreignKeyBuilder != null) {
                foreignKeyBuilder.columns.push(columnDefImpl);
                foreignKeyBuilder.referencedColumns.push(referenceColumnDef!);
            }
        }
        if (foreignKeyBuilder != null) {
            tableDefImpl.addConstriantDef(foreignKeyBuilder.build());
        }
    }

    private _processMiddleTable(
        prop: metadata.EntityProp
    ) {
        if (!this._isProcessable(prop)) {
            return;
        }
        this._processEntity(prop.declaringEntity);
        this._processEntity(prop.targetEntity!);
        const toThisTableDefImpl = this.tableMap.get(prop.declaringEntity)!;
        const toTargetTableDefImpl = this.tableMap.get(prop.targetEntity!)!;
        const middleTable = prop.toStorage(this._strategy) as metadata.MiddleTable;
        let tableDefImpl = this.tableMap.get(prop);
        if (tableDefImpl == null) {
            tableDefImpl = new TableDefImpl(
                undefined,
                middleTable.name
            );
            this.tableMap.set(prop, tableDefImpl);
        }
        const thisForeignKeyBuilder = new ForeignKeyBuilder(prop.backCascascadeType);
        const targetForeignKeyBuilder = new ForeignKeyBuilder(prop.cascadeType);
        for (const toThisColumn of middleTable.toThisColumns) {
            const referencedColumnDef = toThisTableDefImpl.referencedColumnDef(toThisColumn.referencedColumnName!);
            const columnDefImpl = new ColumnDefImpl(
                tableDefImpl,
                prop,
                toThisColumn.name,
                referencedColumnDef,
                referencedColumnDef.type,
                referencedColumnDef.nullable,
                referencedColumnDef.length
            );
            tableDefImpl.addColumnDef(columnDefImpl);
            thisForeignKeyBuilder.columns.push(columnDefImpl);
            thisForeignKeyBuilder.referencedColumns.push(referencedColumnDef);
        }
        for (const toTargetColumn of middleTable.toTargetColumns) {
            const referencedColumnDef = toTargetTableDefImpl.referencedColumnDef(toTargetColumn.referencedColumnName!);
            const columnDefImpl = new ColumnDefImpl(
                tableDefImpl,
                prop,
                toTargetColumn.name,
                referencedColumnDef,
                referencedColumnDef.type,
                referencedColumnDef.nullable,
                referencedColumnDef.length
            );
            tableDefImpl.addColumnDef(columnDefImpl);
            targetForeignKeyBuilder.columns.push(columnDefImpl);
            targetForeignKeyBuilder.referencedColumns.push(referencedColumnDef);
        }
        tableDefImpl.addConstriantDef(thisForeignKeyBuilder.build());
        tableDefImpl.addConstriantDef(targetForeignKeyBuilder.build());
    }

    private _isProcessable(
        metadata: metadata.Entity | metadata.EntityProp
    ): boolean {
        if (this._processedMetadatas.has(metadata)) {
            return false;
        }
        this._processedMetadatas.add(metadata);
        return true;
    }

    private _addSimpleConstraints(tableDefImpl: TableDefImpl) {
        if (tableDefImpl.entity == null) {
            const columnDefs: Array<ColumnDefImpl> = [];
            for (const columnDef of tableDefImpl.columns) {
                if (columnDef.referenceColumnDef != null) {
                    columnDefs.push(columnDef);
                }
            }
            tableDefImpl.addConstriantDef({
                kind: "PRIMARY_KEY",
                columns: columnDefs
            });
            return;
        }
        const idProp = tableDefImpl.entity.idProp;
        const idColumnDefs: Array<ColumnDefImpl> = [];
        for (const columnDef of tableDefImpl.columns) {
            if (columnDef.prop.rootProp.name === idProp.name) {
                idColumnDefs.push(columnDef);
            }
        }
        tableDefImpl.addConstriantDef({
            kind: "PRIMARY_KEY",
            columns: idColumnDefs
        });
        for (const constraint of tableDefImpl.entity.uniqueConstraints) {
            const columnDefs: Array<ColumnDefImpl> = [];   
            for (const prop of constraint) {
                for (const columnDef of tableDefImpl.columns) {
                    if (columnDef.prop === prop) {
                        columnDefs.push(columnDef);
                    }
                }
            }
            tableDefImpl.addConstriantDef({
                kind: "UNIQUE",
                columns: columnDefs
            });
        }
    }
}

class ForeignKeyBuilder {
    
    readonly columns: Array<ColumnDefImpl> = [];
    
    readonly referencedColumns: Array<ColumnDefImpl> = [];

    constructor(
        private readonly _cascade: CascadeType
    ) {}

    build(): ForeignKeyConstraintDef {
        return {
            kind: "FOREIGN_KEY",
            columns: this.columns,
            referencedColumns: this.referencedColumns,
            cascade: this._cascade
        };
    }
}