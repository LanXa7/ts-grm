import { ValueExprContract } from "./literal";
import { AbstractNumExpr } from "./num_expr";
import { Visitor } from "./visitor";

export class ConstantExpr extends AbstractNumExpr<number> implements ValueExprContract {

    constructor(
        readonly value: number
    ) {
        super();
    }

    get isConstant(): true {
        return true;
    }

    override get isValueExpr(): true {
        return true;
    }

    accept(visitor: Visitor): void {
        visitor.visitConstant(this.value);
    }
}