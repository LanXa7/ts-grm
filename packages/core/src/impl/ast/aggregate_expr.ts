import { AbstractExpr } from "./expr";
import { Visitor } from "./visitor";
import { Node } from "./node";
import { AbstractNumExpr } from "./num_expr";
import { NumericType } from "../numeric";

export class AggregateExpr<T extends number | string> extends AbstractNumExpr<T> implements Node {

    private readonly _numericType: NumericType;

    constructor(
        readonly op: AggregatieOp,
        readonly expr: AbstractExpr<T> | undefined
    ) {
        super();
        this._numericType = op === "COUNT"
            ? NumericType.INTEGER
            : expr!.numericType;
    }

    accept(visitor: Visitor): void {
        visitor.visitAggregateExpr(this);
    }

    override get numericType(): NumericType {
        return this._numericType;
    }
}

export type AggregatieOp = "COUNT" | "SUM" | "MIN" | "MAX" | "AVG";