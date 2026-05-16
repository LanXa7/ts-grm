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

    private readonly _strategy: metadata.DatabaseStrategy;

    private readonly _processedMetadatas = new Set<metadata.Entity | metadata.EntityProp>();

    readonly tableMap = new Map<metadata.Entity | metadata.EntityProp, TableDefImpl>();

    constructor(
        private readonly _sqlClient: SqlClientImplementor
    ) {
        this._strategy = _sqlClient.strategy;
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
        for (const tableDefImpl of this.tableMap.values()) {
            this._addSimpleConstraints(tableDefImpl);
        }
        for (const entity of await entityManager.entities()) {
            for (const prop of entity.declaredPropMap.values()) {
                const middleEntity = prop.middleEntity;
                if (middleEntity != null && prop.mappedByProp == null) {
                    this._addMiddleEntityUniqueConstraints(middleEntity);
                }
            }
        }
    }

    private _processEntity(entity: metadata.Entity) {
        if (!this._isProcessable(entity)) {
            return;
        }
        const superEntity = entity.superEntity;
        if (superEntity != null) {
            this._processEntity(superEntity);
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
            const targetEntity = prop.targetEntity;
            if (targetEntity != null 
                && prop.mappedByProp == null
                && (
                    prop.storageType === "COLUMN" 
                    || prop.storageType === "COLUMNS" 
                    || prop.middleEntity != null
                )
            ) {
                this._processEntity(targetEntity);
            }
        }
        this._processProp(entity.idProp, tableDefImpl);
        const discriminator = entity.tableSettings.discriminator;
        if (discriminator != null) {
            tableDefImpl.addColumnDef(
                new ColumnDefImpl(
                    tableDefImpl,
                    undefined,
                    discriminator.name,
                    undefined,
                    discriminator.type === "string" ? "STR" : "I32",
                    false,
                    discriminator.type === "string"
                        ? entity.discriminatorValues.map(v => (v as string).length).reduce((a, b) => Math.max(a, b), 0)
                        : undefined,
                    undefined
                )
            );
        }
        for (const prop of entity.declaredPropMap.values()) {
            if (prop != entity.idProp && prop.referenceProp == null) {    
                this._processProp(prop, tableDefImpl);
            }
        }
        for (const prop of entity.declaredPropMap.values()) {
            if (prop != entity.idProp && prop.referenceProp != null) {    
                this._processProp(prop, tableDefImpl);
            }
        }
        for (const prop of entity.declaredPropMap.values()) {
            if (prop.middleEntity != null && prop.mappedByProp == null) {    
                this._processEntity(prop.middleEntity.entity);
            }
        }
    }

    private _processProp(
        prop: metadata.EntityProp, 
        tableDefImpl: TableDefImpl
    ) {
        if (prop.isOverride && prop.declaringEntity.tableSettings.sharedTable) {
            return;
        }
        const scalaProps = prop.scalarProps;
        if (scalaProps == null) {
            if (prop.mappedByProp == null && prop.storageType === "MIDDLE_TABLE") {
                this._processMiddleTable(prop);
            }
            return;
        }
        const referenceProp = prop.rootProp.referenceProp;
        const targetEntity = referenceProp?.targetEntity;
        let referencedTableDef: TableDefImpl | undefined = undefined;
        if (targetEntity != null) {
            referencedTableDef = this.tableMap.get(targetEntity);
        }
        let foreignKeyBuilder = 
            referencedTableDef != null
                ? new ForeignKeyBuilder(referenceProp!.cascadeType, false)
                : undefined; 
        for (const scalarProp of scalaProps) {
            const column = scalarProp.toStorage(this._strategy) as metadata.Column;
            const referenceColumnDef = 
                referencedTableDef != null
                    ? referencedTableDef.referencedColumnDef(column.referencedColumnName!)
                    : undefined;
            const condition = tableDefImpl.entity != null && tableDefImpl.entity !== scalarProp.declaringEntity;
            const columnDefImpl = new ColumnDefImpl(
                tableDefImpl,
                scalarProp,
                column.name,
                referenceColumnDef,
                scalarProp.scalarType!,
                (scalarProp.nullable && !scalarProp.inputNonNull) || condition,
                scalarProp.length,
                condition ? subEntities(scalarProp.declaringEntity) : undefined
            );
            tableDefImpl.addColumnDef(columnDefImpl);
            if (foreignKeyBuilder != null) {
                foreignKeyBuilder.add(columnDefImpl, referenceColumnDef!);
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
                prop,
                middleTable.name
            );
            this.tableMap.set(prop, tableDefImpl);
        }
        const thisForeignKeyBuilder = new ForeignKeyBuilder(prop.backCascascadeType, false);
        const targetForeignKeyBuilder = new ForeignKeyBuilder(prop.cascadeType, false);
        for (const toThisColumn of middleTable.toThisColumns) {
            const referencedColumnDef = toThisTableDefImpl.referencedColumnDef(toThisColumn.referencedColumnName!);
            const columnDefImpl = new ColumnDefImpl(
                tableDefImpl,
                prop,
                toThisColumn.name,
                referencedColumnDef,
                referencedColumnDef.type,
                referencedColumnDef.nullable,
                referencedColumnDef.length,
                undefined
            );
            tableDefImpl.addColumnDef(columnDefImpl);
            thisForeignKeyBuilder.add(columnDefImpl, referencedColumnDef);
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
                referencedColumnDef.length,
                undefined
            );
            tableDefImpl.addColumnDef(columnDefImpl);
            targetForeignKeyBuilder.add(columnDefImpl, referencedColumnDef);
        }
        tableDefImpl.addConstriantDef(thisForeignKeyBuilder.build());
        tableDefImpl.addConstriantDef(targetForeignKeyBuilder.build());
        if (prop.associationType === "ONE_TO_ONE" || prop.associationType === "MANY_TO_ONE") {
            tableDefImpl.addConstriantDef({
                kind: "UNIQUE",
                columns: thisForeignKeyBuilder.columns,
                implicit: "ASSOCIATION"
            });
        }
        if (prop.associationType === "ONE_TO_ONE" || prop.associationType === "ONE_TO_MANY") {
            tableDefImpl.addConstriantDef({
                kind: "UNIQUE",
                columns: targetForeignKeyBuilder.columns,
                implicit: "ASSOCIATION"
            });
        }
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
                columns: columnDefs,
                implicit: "MIDDLE_TABLE"
            });
            return;
        }
        const idProp = tableDefImpl.entity.idProp;
        const idColumnDefs: Array<ColumnDefImpl> = [];
        const idForeignKeyBuilder = 
            idProp.isOverride
                ? new ForeignKeyBuilder("DELETE", true)
                : undefined;
        const superEntity = idForeignKeyBuilder != null 
            ? tableDefImpl.entity.superEntity!.tableEntity :
            undefined;
        const superIdScalarProps =
            superEntity != null
                ? superEntity.idProp.scalarProps
                : undefined;
        const superTableDefImpl = 
            superEntity != null
                ? this
                    .tableMap
                    .get(superEntity.tableEntity)!
                : undefined;
        for (const columnDef of tableDefImpl.columns) {
            if (columnDef.prop?.rootProp !== idProp) {
                continue;
            }
            idColumnDefs.push(columnDef);
            if (idForeignKeyBuilder != null) {
                idForeignKeyBuilder.add(
                    columnDef,
                    superTableDefImpl!.findColumnDefByProp(
                        superIdScalarProps![columnDef.prop.scalarIndex]!
                    )
                );
            }
        }
        tableDefImpl.addConstriantDef({
            kind: "PRIMARY_KEY",
            columns: idColumnDefs,
            implicit: undefined
        });
        if (idForeignKeyBuilder != null) {
            tableDefImpl.addConstriantDef(idForeignKeyBuilder.build());
        }
        const discriminator = tableDefImpl.entity.tableSettings.discriminator;
        if (discriminator != null) {
            tableDefImpl.addConstriantDef({
                kind: "CHECK",
                column: tableDefImpl.referencedColumnDef(discriminator.name),
                values: tableDefImpl.entity.discriminatorValues,
                implicit: "POLYMORPHISM"
            });
        }
        for (const constraint of tableDefImpl.entity.uniqueConstraints) {
            const columnDefs: Array<ColumnDefImpl> = [];   
            for (const prop of constraint) {
                columnDefs.push(tableDefImpl.findColumnDefByProp(prop));
            }
            tableDefImpl.addConstriantDef({
                kind: "UNIQUE",
                columns: columnDefs,
                implicit: undefined
            });
        }
    }

    private _addMiddleEntityUniqueConstraints(middleEntity: metadata.MiddelEntity) {
        const tableDefImpl = this.tableMap.get(middleEntity.entity.tableEntity)!;
        const columnDefImpls: Array<ColumnDefImpl> = [];
        for (const prop of middleEntity.joinThisProp.referenceKeyProp!.scalarProps!) {
            columnDefImpls.push(tableDefImpl.findColumnDefByProp(prop));
        }
        for (const prop of middleEntity.joinTargetProp.referenceKeyProp!.scalarProps!) {
            columnDefImpls.push(tableDefImpl.findColumnDefByProp(prop));
        }
        tableDefImpl.addConstriantDef({
            kind: "UNIQUE",
            columns: columnDefImpls,
            implicit: "MIDDLE_ENTITY"
        });
    }
}

class ForeignKeyBuilder {
    
    private readonly _columns: Array<ColumnDefImpl> = [];
    
    private readonly _referencedColumns: Array<ColumnDefImpl> = [];

    constructor(
        private readonly _cascade: CascadeType,
        private readonly _inheritance: boolean
    ) {}

    add(
        columnDefImpl: ColumnDefImpl,
        referenceColumnDefImpl: ColumnDefImpl
    ) {
        this._columns.push(columnDefImpl);
        this._referencedColumns.push(referenceColumnDefImpl);
    }

    get columns(): ReadonlyArray<ColumnDefImpl> {
        return this._columns;
    }

    build(): ForeignKeyConstraintDef {
        return {
            kind: "FOREIGN_KEY",
            columns: this._columns,
            referencedColumns: this._referencedColumns,
            cascade: this._cascade,
            implicit: this._inheritance ? "INHERITANCE" : undefined
        };
    }
}

function subEntities(
    entity: metadata.Entity
): ReadonlyArray<metadata.Entity> | undefined {
    const arr: Array<metadata.Entity> = [];
    if (entity.tableSettings.discriminatorValue != null) {
        arr.push(entity);
    }
    for (const descendant of entity.descendants) {
        if (descendant.tableSettings.discriminatorValue != null) {
            arr.push(descendant);
        }
    }
    return arr.length != 0 ? arr : undefined;
}