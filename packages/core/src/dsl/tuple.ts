import { Expression, ExpressionLike, Predicate } from "./expression"
import { TupleSubQuery } from "./sub_query";
import { AtLeastTwo } from "./utils";
import { ExprTupleImpl } from "@/impl/ast/tuple";

export function tuple<
    const TExpressions extends AtLeastTwo<ExpressionLike>
>(
    ...expressions: TExpressions
): ExprTuple<TExpressions> {
    return new ExprTupleImpl(expressions as any);
}

export interface ExprTuple<TExpressions extends ExpressionLike[]> {

    __type(): { exprTuple: TExpressions | true }

    eq(tuple: ExprTupleMatchable<TExpressions>): Predicate;

    ne(tuple: ExprTupleMatchable<TExpressions>): Predicate;

    in(...tuples: ReadonlyArray<ExprTupleMatchable<TExpressions>>): Predicate;

    inSubQuery(subQuery: TupleSubQuery<TExpressions>): Predicate;

    notIn(...tuples: ReadonlyArray<ExprTupleMatchable<TExpressions>>): Predicate;

    notInSubQuery(subQuery: TupleSubQuery<TExpressions>): Predicate;
}

export type ExprTupleMatchable<TExpressions extends ExpressionLike[]> =
    ExprTuple<TExpressions> 
    | {
        readonly [K in keyof TExpressions]: 
            TExpressions[K] extends Expression<infer T>
            ? NonNullable<T> | Expression<NonNullable<T>>
            : never
    };