import { ExpressionLike, Predicate } from "@/dsl/expression";
import { TupleSubQuery } from "@/dsl/sub_query";
import { ExprTuple, ExprTupleMatchable, NullitylessExpressions } from "@/dsl/tuple";
import { AtLeastTwo } from "@/dsl/utils";
import { Node } from "./node";
import { AbstractPred } from "./pred";
import { AbstractExpr } from "./expr";
import { Visitor } from "./visitor";
import { getInternalFactory } from "./internal_factory";
import { QueryContract } from "./query";
import { ScalarProvider } from "@/schema/scalar";

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

    inSubQuery(subQuery: TupleSubQuery<NullitylessExpressions<TExpressions>>): Predicate {
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

    notInSubQuery(subQuery: TupleSubQuery<NullitylessExpressions<TExpressions>>): Predicate {
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

    private _providers: ReadonlyArray<ScalarProvider<any, any> | undefined> | undefined = undefined;

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

    get providers(): ReadonlyArray<ScalarProvider<any, any> | undefined> {
        let providers = this._providers;
        if (providers == null) {
            const span = this.tuple.exprs.length;
            const providerArr: Array<ScalarProvider<any, any> | undefined> = [];
            for (let i = 0; i < span; i++) {
                const expr = this.tuple.exprs[i]!;
                const provider = expr.scalarProvider;
                if (provider) {
                    providerArr[i] = provider;
                }
            }
            this._providers = providers = providerArr;
        }
        return providers;
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