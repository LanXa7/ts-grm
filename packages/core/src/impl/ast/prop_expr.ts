import { AbstractExpr } from "./expr";
import { EntityProp } from "../entity_prop";
import { AbstractNumExpr } from "./num_expr";
import { AbstractStrExpr } from "./string_expr";
import { AbstractDtExpr } from "./dt_expr";
import { EntityTable } from "@/dsl/table";
import { ArgumentError } from "@/error/common";

export interface TableProp {
    readonly table: EntityTable<any>,
    readonly prop: EntityProp
}

export function createTableProp(table: EntityTable<any>, prop: EntityProp) {
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

class PropNumExpr<T extends string | number> extends AbstractNumExpr<T> implements TableProp {

    constructor(
        readonly table: EntityTable<any>,
        readonly prop: EntityProp
    ) {
        super();
    }
}

class PropStrExpr extends AbstractStrExpr implements TableProp {

    constructor(
        readonly table: EntityTable<any>,
        readonly prop: EntityProp
    ) {
        super();
    }
}

class PropDtExpr extends AbstractDtExpr implements TableProp {
    
    constructor(
        readonly table: EntityTable<any>,
        readonly prop: EntityProp
    ) {
        super();
    }
}