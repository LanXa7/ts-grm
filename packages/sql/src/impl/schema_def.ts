import { CascadeType, err, metadata, ScalarType } from "@ts-grm/core";

export interface TableDef {

    readonly name: string;

    readonly columns: ReadonlyArray<ColumnDef>;
    
    readonly constraints: ReadonlyArray<ConstraintDef>;
}

export interface ColumnDef {

    readonly declaringTable: TableDef;
    
    readonly name: string;

    readonly type: ScalarType;

    readonly nullable: boolean;

    readonly length: number | undefined;
}

export type ConstraintDef = SimpleContraintDef | ForeignKeyConstraintDef;

export type SimpleContraintDef = {
    readonly kind: "PRIMARY_KEY" | "UNIQUE" | "INDEX";
    readonly columns: ReadonlyArray<ColumnDef>;
};

export type ForeignKeyConstraintDef = {
    readonly kind: "FOREIGN_KEY";
    readonly columns: ReadonlyArray<ColumnDef>;
    readonly referencedColumns: ReadonlyArray<ColumnDef>;
    readonly cascade: CascadeType;
};

export class TableDefImpl implements TableDef {

    private readonly _columnMap = new Map<string, ColumnDefImpl>();

    private _columns: Array<ColumnDefImpl> | undefined = undefined;

    private readonly _constraints: Array<ConstraintDef> = []; 

    constructor(
        readonly entity: metadata.Entity | undefined,
        readonly name: string
    ) {}

    get columns(): ReadonlyArray<ColumnDefImpl> {
        let columns = this._columns;
        if (columns == null) {
            this._columns = columns = Array.from(this._columnMap.values());
        }
        return columns;
    }

    get constraints(): ReadonlyArray<ConstraintDef> {
        return this._constraints;
    }

    addColumnDef(column: ColumnDefImpl) {
        this._columnMap.set(column.name, column);
        this._columns = undefined;
    }

    addConstriantDef(constraint: ConstraintDef) {
        this._constraints.push(constraint);
    }

    referencedColumnDef(name: string): ColumnDefImpl {
        const columnDef = this._columnMap.get(name);
        if (columnDef == null) {
            throw new err.StateError(`There is no referenced column name "${name}" in referenced table "${this.name}"`);
        }
        return columnDef;
    }

    toJSON(): any {
        return {
            name: this.name,
            columns: this.columns.map(c => c.toJSON()),
            constraints: this.constraints.map(
                c => c.kind === "FOREIGN_KEY"
                    ? { 
                        kind: c.kind, 
                        columns: c.columns.map(c => c.name),
                        referencedColumns: c.referencedColumns.map(c => c.name),
                        cascade: c.cascade
                    }
                    : { 
                        kind: c.kind, 
                        columns: c.columns.map(c => c.name) 
                    }
            )
        };
    }
}

export class ColumnDefImpl implements ColumnDef {

    constructor(
        readonly declaringTable: TableDefImpl,
        readonly prop: metadata.EntityProp,
        readonly name: string,
        readonly referenceColumnDef: ColumnDefImpl | undefined,
        readonly type: ScalarType,
        readonly nullable: boolean,
        readonly length: number | undefined
    ) {}

    toJSON(): any {
        return {
            name: this.name,
            referenceName: this.referenceColumnDef?.name,
            type: this.type,
            nullable: this.nullable,
            length: this.length
        };
    }
}