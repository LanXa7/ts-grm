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

    readonly when: ReadonlyArray<metadata.Entity> | undefined;
}

export type ConstraintDef = SimpleContraintDef | ForeignKeyConstraintDef;

export type SimpleContraintDef = {
    readonly kind: "PRIMARY_KEY" | "INDEX";
    readonly columns: ReadonlyArray<ColumnDef>;
} | {
    readonly kind: "UNIQUE";
    readonly columns: ReadonlyArray<ColumnDef>;
    readonly implicit: "ASSOCIATION" | "MIDDLE_ENEITY" | undefined;
} | {
    readonly kind: "CHECK";
    readonly column: ColumnDef;
    readonly values: ReadonlyArray<string | number>;
};

export type ForeignKeyConstraintDef = {
    readonly kind: "FOREIGN_KEY";
    readonly columns: ReadonlyArray<ColumnDef>;
    readonly referencedColumns: ReadonlyArray<ColumnDef>;
    readonly cascade: CascadeType;
    readonly implicit: "INHERITANCE" | undefined;
};

export class TableDefImpl implements TableDef {

    private readonly _columnMap = new Map<string, ColumnDefImpl>();

    private _columns: Array<ColumnDefImpl> | undefined = undefined;

    private readonly _simpleConstraints: Array<SimpleContraintDef> = [];

    private readonly _foreignKeyConstraints: Array<ForeignKeyConstraintDef> = [];

    private _constraints: ReadonlyArray<ConstraintDef> | undefined = undefined; 

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
        let constraints = this._constraints;
        if (constraints == null) {
            const arr: Array<ConstraintDef> = [];
            arr.push(...this._simpleConstraints);
            arr.push(...this._foreignKeyConstraints);
            this._constraints = constraints = arr;
        }
        return constraints;
    }

    addColumnDef(column: ColumnDefImpl) {
        this._columnMap.set(column.name, column);
        this._columns = undefined;
    }

    addConstriantDef(constraint: ConstraintDef) {
        this._constraints = undefined;
        if (constraint.kind === "FOREIGN_KEY") {
            this._foreignKeyConstraints.push(constraint);
        } else {
            this._simpleConstraints.push(constraint);
        }
    }

    referencedColumnDef(name: string): ColumnDefImpl {
        const columnDef = this._columnMap.get(name);
        if (columnDef == null) {
            throw new err.StateError(`There is no referenced column name "${name}" in referenced table "${this.name}"`);
        }
        return columnDef;
    }

    findColumnDefByProp(prop: metadata.EntityProp): ColumnDefImpl {
        for (const columnDef of this._columnMap.values()) {
            if (columnDef.prop === prop) {
                return columnDef;
            }
        }
        throw new err.StateError(`There is no property "${prop.toString()}" in the table "${this.name}"`);
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
                    : c.kind === "CHECK"
                        ? {
                            kind: c.kind,
                            column: c.column.name,
                            values: c.values
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
        readonly prop: metadata.EntityProp | undefined,
        readonly name: string,
        readonly referenceColumnDef: ColumnDefImpl | undefined,
        readonly type: ScalarType,
        readonly nullable: boolean,
        readonly length: number | undefined,
        readonly when: ReadonlyArray<metadata.Entity> | undefined
    ) {}

    toJSON(): any {
        return {
            name: this.name,
            referenceName: this.referenceColumnDef?.name,
            type: this.type,
            nullable: this.nullable,
            length: this.length,
            when: this.when?.map(e => e.tableSettings.discriminatorValue!)
        };
    }
}