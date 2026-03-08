import { AbstractNumExpr } from "./num_expr";
import { Visitor } from "./visitor";

export class ConstantExpr extends AbstractNumExpr<number> {

    constructor(
        readonly value: number
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitConstant(this.value);
    }
}