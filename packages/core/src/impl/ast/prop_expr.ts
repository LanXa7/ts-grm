import { EntityProp } from "../entity_prop";
import { AbstractNumExpr } from "./num_expr";
import { AbstractStrExpr } from "./str_expr";
import { AbstractDtExpr } from "./dt_expr";
import { ArgumentError } from "@/error/common";
import { AbstractEntityTable } from "../entity_table";
import { Visitor } from "./visitor";

export interface PropExprContract {
    readonly table: AbstractEntityTable,
    readonly prop: EntityProp
}

export function createTableProp(table: AbstractEntityTable, prop: EntityProp) {
    if (prop.scalarType == null) {
        throw new ArgumentError(
            `Cannot create table prop for "${
                prop.toString()
            }" which is not scalar property`
        );
    }
    switch (prop.scalarType) {
        case "I8":
        case "I16":
        case "I32":
        case "I64":
        case "NUM":
        case "F32":
        case "F64":
            return new PropNumExpr(table, prop);
        case "STR":
            return new PropStrExpr(table, prop);
        case "DATE":
            return new PropDtExpr(table, prop);
        default:
            throw new ArgumentError(
            `Cannot create table prop for "${
                prop.toString()
            }" whose scalar type is ${prop.scalarType}`
        );
    }
}

// class PropExpr<T> extends AbstractExpr<T> implements TableProp {

//     constructor(
//         readonly prop: EntityProp,
//         readonly table: EntityTable<any>,
//     ) {
//         super();
//     }
// }

class PropNumExpr<T extends string | number> extends AbstractNumExpr<T> implements PropExprContract {

    constructor(
        readonly table: AbstractEntityTable,
        readonly prop: EntityProp
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitTablePropExpr(this);
    }
}

class PropStrExpr extends AbstractStrExpr implements PropExprContract {

    constructor(
        readonly table: AbstractEntityTable,
        readonly prop: EntityProp
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitTablePropExpr(this);
    }
}

class PropDtExpr extends AbstractDtExpr implements PropExprContract {
    
    constructor(
        readonly table: AbstractEntityTable,
        readonly prop: EntityProp
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitTablePropExpr(this);
    }
}