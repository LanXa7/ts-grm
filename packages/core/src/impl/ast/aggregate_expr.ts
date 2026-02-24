import { AbstractExpr, Visitor } from ".";
import { Node } from "./node";
import { AbstractNumExpr } from "./num_expr";

export class AggregateExpr<T extends number | string> extends AbstractNumExpr<T> implements Node {

    constructor(
        readonly op: AggregatieOp,
        readonly expr: AbstractExpr<T> | undefined
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitAggregateExpr(this);
    }
}

export type AggregatieOp = "COUNT" | "SUM" | "MIN" | "MAX" | "AVG";