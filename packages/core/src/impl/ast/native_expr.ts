import { AbstractExpr } from "./expr";
import { AbstractNumExpr } from "./num_expr";
import { Visitor } from "./visitor";

export interface NativeExprContract {

    readonly sql: string;
}

export class NativeExpr<T> extends AbstractExpr<T> implements NativeExprContract {

    accept(visitor: Visitor): void {
        visitor.visitNativeExpr(this);
    }

    constructor(
        readonly sql: string
    ) {
        super();
    }
}

export class NativeNumExpr<T extends string | number> extends AbstractNumExpr<T> implements NativeExprContract {

    accept(visitor: Visitor): void {
        visitor.visitNativeExpr(this);
    }

    constructor(
        readonly sql: string
    ) {
        super();
    }
}