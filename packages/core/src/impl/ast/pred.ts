import { Expression } from "@/dsl";
import { AbstractExpr } from "./expr";
import { Visitor } from "./visitor";
import { QueryContract } from "./query";

export abstract class AbstractPred extends AbstractExpr<boolean> {

    abstract negative(): AbstractPred;
}

export class CmpPred extends AbstractPred {

    constructor(
        readonly op: CmpOp,
        readonly leftExpr: AbstractExpr<any>,
        readonly rightExpr: AbstractExpr<any>
    ) {
        super();
    }

    negative(): CmpPred {
        return new CmpPred(
            negativeCmpOp(this.op), 
            this.leftExpr, 
            this.rightExpr
        );
    }

    accept(visitor: Visitor): void {
        visitor.visitCmpPred(this);
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

export class BetweenPred extends AbstractPred {

    constructor(
        readonly expr: AbstractExpr<any>,
        readonly minExpr: AbstractExpr<any>,
        readonly maxExpr: AbstractExpr<any>,
        readonly neg: boolean = false
    ) {
        super();
    }

    negative(): AbstractPred {
        return new BetweenPred(
            this.expr,
            this.minExpr,
            this.maxExpr,
            !this.neg
        )
    }

    accept(visitor: Visitor): void {
        visitor.visitBetweenPred(this);
    }
}

export class LikePred extends AbstractPred {

    constructor(
        readonly expr: AbstractExpr<string>,
        readonly pattern: AbstractExpr<string>,
        readonly insensitive: boolean,
        readonly neg: boolean = false
    ) {
        super();
    }

    negative(): LikePred {
        return new LikePred(
            this.expr,
            this.pattern,
            this.insensitive,
            !this.neg
        );
    }

    accept(visitor: Visitor): void {
        visitor.visitLikePred(this);
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

    accept(visitor: Visitor): void {
        visitor.visitNullityPred(this);
    }
}

export class InCollectionPred<T> extends AbstractPred {

    constructor(
        readonly expr: AbstractExpr<T>,
        readonly values: ReadonlyArray<AbstractExpr<T>>,
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

    accept(visitor: Visitor): void {
        visitor.visitInCollectionPred(this);
    }
}

export class InSubQueryPred extends AbstractPred {

    constructor(
        readonly expr: AbstractExpr<any>,
        readonly subQuery: QueryContract,
        readonly neg: boolean = false
    ) {
        super();
    }

    negative(): AbstractPred {
        return new InSubQueryPred(
            this.expr,
            this.subQuery,
            !this.neg
        );
    }

    accept(visitor: Visitor): void {
        visitor.visitInSubQueryPred(this);
    }
}

export class CompoundPred extends AbstractPred {

    constructor(
        readonly op: CompoundOp,
        readonly preds: ReadonlyArray<AbstractPred>
    ) {
        super();
    }

    negative(): AbstractPred {
        const newOp = this.op === "AND" ? "OR" : "AND";
        const newPreds = this.preds.map(pred => pred.negative());
        return new CompoundPred(newOp, newPreds);
    }

    static of(op: CompoundOp, exprs: ReadonlyArray<Expression<boolean> | null | undefined>): AbstractPred | undefined {
        if (exprs == null) {
            return undefined;
        }
        const preds: Array<AbstractPred> = [];
        for (const expr of exprs) {
            if (expr instanceof CompoundPred) {
                if (expr.op === op) {
                    preds.push(...expr.preds);
                } else {
                    preds.push(expr);
                }
            } else if (expr instanceof AbstractPred) {
                preds.push(expr);
            } else if (expr instanceof AbstractExpr) {
                preds.push(expr.eq(true) as AbstractPred);
            }
        }
        switch (preds.length) {
            case 0:
                return undefined;
            case 1:
                return preds[0];
            default:
                return new CompoundPred(op, preds);
        }
    }

    accept(visitor: Visitor): void {
        visitor.visitCompoundPred(this);
    }
}

export type CompoundOp = "AND" | "OR";