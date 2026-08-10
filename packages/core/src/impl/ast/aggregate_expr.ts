import { AbstractExpr } from "./expr";
import { Visitor } from "./visitor";
import { Node } from "./node";
import { AbstractNumExpr } from "./num_expr";

export class AggregateExpr<T extends number | string> extends AbstractNumExpr<T> implements Node {

    constructor(
        readonly op: AggregatieOp,
        readonly expr: AbstractExpr<T> | undefined
    ) {
        super(
            expr instanceof AbstractNumExpr
                ? (expr as AbstractNumExpr<any>).isString
                : false
        );
    }

    accept(visitor: Visitor): void {
        visitor.visitAggregateExpr(this);
    }
}

export type AggregatieOp = "COUNT" | "SUM" | "MIN" | "MAX" | "AVG";