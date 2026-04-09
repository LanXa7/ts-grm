import { ExpressionLike, Predicate, TupleSubQuery } from "@/dsl";
import { ExprTuple, ExprTupleMatchable } from "@/dsl/tuple";
import { AtLeastTwo } from "@/dsl/utils";
import { Node } from "./node";
import { AbstractPred } from "./pred";
import { AbstractExpr } from "./expr";
import { Visitor } from "./visitor";
import { getInternalFactory } from "./internal_factory";
import { QueryContract } from "./query";

export class ExprTupleImpl<
    TExpressions extends AtLeastTwo<ExpressionLike>
> implements ExprTuple<TExpressions>, Node, TupleContract {

    __type(): { exprTuple: TExpressions | true } {
        return { exprTuple: true };
    }

    constructor(
        readonly exprs: ReadonlyArray<AbstractExpr<any>>
    ) {}

    eq(tuple: ExprTupleMatchable<TExpressions>): Predicate {
        return new TupleCmpPred("=", this, toTuple(tuple)) as Predicate;
    }

    ne(tuple: ExprTupleMatchable<TExpressions>): Predicate {
        return new TupleCmpPred("<>", this, toTuple(tuple)) as Predicate;
    }

    in(...tuples: ReadonlyArray<ExprTupleMatchable<TExpressions>>): Predicate {
        return new TupleInCollectionPred(
            this, 
            tuples.map(tuple => toTuple(tuple)),
            false
        ) as Predicate;
    }

    inSubQuery(subQuery: TupleSubQuery<TExpressions>): Predicate {
        return new TupleInSubQueryPred(
            this,
            subQuery as any,
            false
        ) as Predicate;
    }

    notIn(...tuples: ReadonlyArray<ExprTupleMatchable<TExpressions>>): Predicate {
        return new TupleInCollectionPred(
            this, 
            tuples.map(tuple => toTuple(tuple)),
            true
        ) as Predicate;
    }

    notInSubQuery(subQuery: TupleSubQuery<TExpressions>): Predicate {
        return new TupleInSubQueryPred(
            this,
            subQuery as any,
            true
        ) as Predicate;
    }

    accept(visitor: Visitor): void {
        visitor.visitTuple(this);
    }
}

export interface TupleContract extends Node {

    readonly exprs: ReadonlyArray<AbstractExpr<any>>;
}

export function toTuple<
    TExpressions extends AtLeastTwo<ExpressionLike> 
>(
    matchable: ExprTupleMatchable<TExpressions>
): ExprTupleImpl<TExpressions> {
    if (!Array.isArray(matchable)) {
        return matchable as ExprTupleImpl<TExpressions>;
    }
    const arr = matchable.map((v: any) => {
        if (v instanceof AbstractExpr) {
            return v;
        }
        return getInternalFactory().createLiteral(v);
    });
    return new ExprTupleImpl<TExpressions>(arr);
}

export class TupleCmpPred extends AbstractPred {

    constructor(
        readonly op: "=" | "<>",
        readonly leftTuple: TupleContract,
        readonly rightTuple: TupleContract
    ) {
        super();
    }

    negative(): AbstractPred {
        return new TupleCmpPred(
            this.op === "=" ? "<>" : "=",
            this.leftTuple,
            this.rightTuple
        );
    }

    accept(visitor: Visitor): void {
        visitor.visitTupleCmpPred(this);
    }
}

export class TupleInCollectionPred extends AbstractPred {

    constructor(
        readonly tuple: TupleContract,
        readonly tuples: ReadonlyArray<TupleContract>,
        readonly neg: boolean = false
    ) {
        super();
    }

    negative(): AbstractPred {
        return new TupleInCollectionPred(
            this.tuple,
            this.tuples,
            !this.neg
        );
    }

    accept(visitor: Visitor): void {
        visitor.visitTupleInCollectionPred(this);
    }
}

export class TupleInSubQueryPred extends AbstractPred {

    constructor(
        readonly tuple: TupleContract,
        readonly subQuery: QueryContract,
        readonly neg: boolean = false
    ) {
        super();
    }

    negative(): AbstractPred {
        return new TupleInSubQueryPred(
            this.tuple,
            this.subQuery,
            !this.neg
        );
    }

    accept(visitor: Visitor): void {
        visitor.visitTupleInSubQueryPred(this);
    }
}