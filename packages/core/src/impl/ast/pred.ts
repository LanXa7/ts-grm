import { LikeMode } from "@/dsl";
import { AbstractExpr } from "./expr";
import { ArgumentError } from "@/error/common";

export abstract class AbstractPred extends AbstractExpr<boolean> {

    abstract negative(): AbstractPred;
}

export class CmpPred extends AbstractPred {

    constructor(
        readonly op: CmpOp,
        readonly left: AbstractExpr<any>,
        readonly right: AbstractExpr<any>
    ) {
        super();
    }

    negative(): CmpPred {
        return new CmpPred(
            negativeCmpOp(this.op), 
            this.left, 
            this.right
        );
    }
}

export type CmpOp = "=" | "<>" | "<" | "<=" | ">" | ">=";

function negativeCmpOp(op: CmpOp): CmpOp {
    switch (op) {
        case "=":
            return "<>";
        case "<>":
            return "=";
        case "<":
            return ">=";
        case "<=":
            return ">";
        case ">":
            return "<=";
        case ">=":
            return "<";
    }
}

export class LikePred extends AbstractPred {

    constructor(
        readonly expr: AbstractExpr<string>,
        readonly value: string,
        readonly mode: LikeMode,
        readonly sensitive: boolean,
        readonly neg: boolean = false
    ) {
        super();
    }

    negative(): LikePred {
        return new LikePred(
            this.expr,
            this.value,
            this.mode,
            this.sensitive,
            !this.neg
        );
    }
}

export class NullityPred extends AbstractPred {

    constructor(
        readonly expr: AbstractExpr<any>,
        readonly neg: boolean = false
    ) {
        super();
    }

    negative(): NullityPred {
        return new NullityPred(this.expr, !this.neg);
    }
}

export class InCollectionPred<T> extends AbstractPred {

    constructor(
        readonly expr: AbstractExpr<T>,
        readonly values: ReadonlyArray<T | AbstractExpr<T>>,
        readonly neg: boolean = false
    ) {
        super();
    }

    negative(): InCollectionPred<T> {
        return new InCollectionPred(
            this.expr,
            this.values,
            !this.neg
        );
    }
}
