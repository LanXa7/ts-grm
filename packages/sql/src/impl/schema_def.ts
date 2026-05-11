import { Driver } from "@/driver/deriver";
import { CascadeType, err, metadata, ScalarType } from "@ts-grm/core";

export interface TableDef {

    readonly entity: metadata.Entity | undefined;

    readonly prop: metadata.EntityProp | undefined;

    readonly name: string;

    readonly columns: ReadonlyArray<ColumnDef>;
    
    readonly constraints: ReadonlyArray<ConstraintDef>;

    toStatements(
        driver: Driver
    ): ReadonlyArray<string>;
}

export interface ColumnDef {

    readonly declaringTable: TableDef;

    readonly prop: metadata.EntityProp | undefined;
    
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
    readonly implicit: "MIDDLE_TABLE" | undefined;
} | {
    readonly kind: "UNIQUE";
    readonly columns: ReadonlyArray<ColumnDef>;
    readonly implicit: "ASSOCIATION" | "MIDDLE_ENTITY" | undefined;
} | {
    readonly kind: "CHECK";
    readonly column: ColumnDef;
    readonly values: ReadonlyArray<string | number>;
    readonly implicit: "POLYMORPHISM" | undefined;
};

export type ForeignKeyConstraintDef = {
    readonly kind: "FOREIGN_KEY";
    readonly columns: ReadonlyArray<ColumnDef>;
    readonly referencedColumns: ReadonlyArray<ColumnDef>;
    readonly cascade: CascadeType;
    readonly implicit: "INHERITANCE" | undefined;
};

export class TableDefImpl implements TableDef {

    readonly entity: metadata.Entity | undefined;

    readonly prop: metadata.EntityProp | undefined;

    private readonly _columnMap = new Map<string, ColumnDefImpl>();

    private _columns: Array<ColumnDefImpl> | undefined = undefined;

    private readonly _simpleConstraints: Array<SimpleContraintDef> = [];

    private readonly _foreignKeyConstraints: Array<ForeignKeyConstraintDef> = [];

    private _constraints: ReadonlyArray<ConstraintDef> | undefined = undefined; 

    constructor(
        data: metadata.Entity | metadata.EntityProp,
        readonly name: string
    ) {
        this.entity = data instanceof metadata.Entity ? data : undefined;
        this.prop = this.entity == null ? data as metadata.EntityProp : undefined;
    }

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

    toStatements(
        driver: Driver
    ): ReadonlyArray<string> {
        const arr: Array<string> = [];
        const writer = new metadata.CodeWriter();
        if (this.entity != null) {
            writer
            .code("-- Entity table for \"")
            .code(this.entity.name)
            .code("\"")
            .newLine();
        }
        if (this.prop != null) {
            writer
            .code("-- Middle table for \"")
            .code(this.prop.toString())
            .code("\"")
            .newLine();
        }
        writer.code("create table ").code(this.name).scope({kind: "PARENTHESES", multiline: true}, () => {
            for (const columnDef of this.columns) {
                appendTo(columnDef, driver, writer);
            }
        });
        arr.push(writer.toString());
        let index = 0;
        for (const constraint of this._simpleConstraints) {
            arr.push(constraintToSql(constraint, ++index, this));
        }
        for (const constraint of this._foreignKeyConstraints) {
            arr.push(constraintToSql(constraint, ++index, this));
        }
        return arr;
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
                        cascade: c.cascade,
                        implicit: c.implicit
                    }
                    : c.kind === "CHECK"
                        ? {
                            kind: c.kind,
                            column: c.column.name,
                            values: c.values,
                            implicit: c.implicit
                        }
                        : { 
                            kind: c.kind, 
                            columns: c.columns.map(c => c.name),
                            implicit: c.implicit
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

function appendTo(
    columnDef: ColumnDef, 
    driver: Driver,
    writer: metadata.CodeWriter
) {
    writer.separator();
    if (columnDef.when != null) {
        const entity = columnDef.declaringTable.entity!;
        const prop = columnDef.prop!;
        const derivedEntity = prop.declaringEntity;
        writer.code(`\n-- When the "${
            entity.tableSettings.discriminator!.name
        }" is "${
            derivedEntity.tableSettings.discriminatorValue
        }"`);
        if (!prop.nullable || prop.inputNonNull) {
            writer.code("\n-- The implicit nullity in the derived table is non-null\n")
        }
    }
    writer
        .code(columnDef.name)
        .code(" ")
        .code(driver.typeName(columnDef))
        .code(columnDef.nullable ? " null" : " not null");
}

function constraintToSql(
    constraint: ConstraintDef,
    order: number,
    declaringTable: TableDef
): string {
    const writer = new metadata.CodeWriter();
    switch (constraint.kind) {
        case "PRIMARY_KEY":
            if (constraint.implicit === "MIDDLE_TABLE") {
                writer.code("-- Implicit primary key constraint for middle table").newLine();
            }
            break;
        case "UNIQUE":
            if (constraint.implicit === "MIDDLE_ENTITY") {
                writer.code("-- Implicit unique constraint for middle table").newLine();
            }
            break;
        case "CHECK":
            if (constraint.implicit === "POLYMORPHISM") {
                writer.code("-- Implicit check constraint for polymorphism").newLine();
            }
            break;
        case "FOREIGN_KEY":
            if (constraint.implicit === "INHERITANCE") {
                writer.code("-- Implicit foreign key constraint for inheritance").newLine();
            }
            break;
    }
    writer.code("alter table ").code(declaringTable.name)
        .code("\n    add constraint ").code(`${declaringTable.name}_constraint_${order}`);
    switch (constraint.kind) {
        case "PRIMARY_KEY":
            writer.code("\n        primary key");
            writer.scope({kind: "PARENTHESES", multiline: false}, () => {
                for (const columnDef of constraint.columns) {
                    writer.separator().code(columnDef.name);
                }
            });
            break;
        case "UNIQUE":
            writer.code("\n        unique");
            writer.scope({kind: "PARENTHESES", multiline: false}, () => {
                for (const columnDef of constraint.columns) {
                    writer.separator().code(columnDef.name);
                }
            });
            break;
        case "CHECK":
            writer.code("\n        check(");
            writer.code(constraint.column.name).code(" in");
            writer.scope({kind: "PARENTHESES", multiline: false}, () => {
                for (const value of constraint.values) {
                    writer.separator();
                    if (typeof value === "number") {
                        writer.code(value.toString());
                    } else {
                        writer.code("'").code(value).code("'");
                    }
                }
            });
            writer.code(")");
            break;
        case "FOREIGN_KEY":
            writer.code("\n        foreign key");
            writer.scope({kind: "PARENTHESES", multiline: false}, () => {
                for (const columnDef of constraint.columns) {
                    writer.separator().code(columnDef.name);
                }
            });
            writer
            .code("\n            references ")
            .code(constraint.referencedColumns[0]!.declaringTable.name);
            writer.scope({kind: "PARENTHESES", multiline: false}, () => {
                for (const columnDef of constraint.referencedColumns) {
                    writer.separator().code(columnDef.name);
                }
            });
            switch (constraint.cascade) {
                case "DELETE":
                    writer.code("\n                on delete cascade");
                    break;
                case "SET_NULL":
                    writer.code("\n                on delete set null");
                    break;
            }
            break;
    }
    return writer.toString();
}