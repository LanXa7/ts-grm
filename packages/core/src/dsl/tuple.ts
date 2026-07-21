import { Expression, ExpressionLike, Predicate, TypedExpressionItf } from "./expression"
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

export interface ExprTuple<TExpressions extends ReadonlyArray<ExpressionLike>> {

    __type(): { exprTuple: TExpressions | true }

    eq(tuple: ExprTupleMatchable<TExpressions>): Predicate;

    ne(tuple: ExprTupleMatchable<TExpressions>): Predicate;

    in(...tuples: ReadonlyArray<ExprTupleMatchable<TExpressions>>): Predicate;

    inSubQuery(
        subQuery: TupleSubQuery<
            NullitylessExpressions<TExpressions>
        >
    ): Predicate;

    notIn(...tuples: ReadonlyArray<ExprTupleMatchable<TExpressions>>): Predicate;

    notInSubQuery(
        subQuery: TupleSubQuery<
            NullitylessExpressions<TExpressions>
        >
    ): Predicate;
}

export type ExprTupleMatchable<TExpressions extends ReadonlyArray<ExpressionLike>> =
    ExprTuple<
        NullitylessExpressions<TExpressions>
    >
    | {
        readonly [K in keyof TExpressions]: 
            TExpressions[K] extends Expression<infer T, infer As>
            ? NonNullable<T> | Expression<NonNullable<T>, As>
            : never
    };

export type NullitylessExpressions<TExpressions> =
    {
        readonly [K in keyof TExpressions]: 
            TExpressions[K] extends TypedExpressionItf<infer T, infer As>
                ? TypedExpressionItf<T, As>
                : TExpressions[K];
    }