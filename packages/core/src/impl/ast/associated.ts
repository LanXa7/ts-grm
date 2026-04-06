import { StateError } from "@/error/common";
import { AbstractEntityTable, EntityProp } from "..";
import { AbstractPred } from "./pred";
import { Visitor } from "./visitor";
import { AbstractNumExpr } from "./num_expr";

export type AssociatedFilter =
    (table: AbstractEntityTable) => AbstractPred;

export class AssociatedPred extends AbstractPred {

    constructor(
        readonly op: "EXISTS" | "NONE" | "SOME" | "ALL",
        readonly table: AbstractEntityTable,
        readonly prop: EntityProp,
        readonly filter: AssociatedFilter
    ) {
        super();
    }

    negative(): AbstractPred {
        throw new StateError(`Associated predicate does not support "not"`);
    }

    accept(visitor: Visitor): void {
        visitor.visitAssociatedPred(this);
    }
}

export class AssociatedSizeExpr extends AbstractNumExpr<number> {

    constructor(
        readonly table: AbstractEntityTable,
        readonly prop: EntityProp,
        readonly filter: AssociatedFilter
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitAssociatedSizeExpr(this);
    }
}