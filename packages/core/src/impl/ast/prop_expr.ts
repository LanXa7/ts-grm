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
    const directTable = table.__to(prop.declaringEntity);
    switch (prop.scalarType) {
        case "I8":
        case "I16":
        case "I32":
        case "I64":
        case "NUM":
        case "F32":
        case "F64":
            return new PropNumExpr(directTable, prop);
        case "STR":
            return new PropStrExpr(directTable, prop);
        case "DATE":
            return new PropDtExpr(directTable, prop);
        default:
            throw new ArgumentError(
            `Cannot create table prop for "${
                prop.toString()
            }" whose scalar type is ${prop.scalarType}`
        );
    }
}

class PropNumExpr<T extends string | number> extends AbstractNumExpr<T> implements PropExprContract {

    constructor(
        readonly table: AbstractEntityTable,
        readonly prop: EntityProp
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitPropExpr(this);
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
        visitor.visitPropExpr(this);
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
        visitor.visitPropExpr(this);
    }
}