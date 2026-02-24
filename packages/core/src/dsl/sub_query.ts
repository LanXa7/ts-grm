import { AnyModel } from "@/schema/model";
import { Expression, ExpressionLike, Predicate } from "./expression";
import { EntityTable } from "./table";
import { AtLeastOne, AtLeastTwo, ExpressionOrder } from "./utils";
import { supressUnused } from "@/utils";
import { getQueryFactory } from "@/impl/ast/query_factory";

export function subQuery<
    const TModels extends AtLeastOne<AnyModel>,
    TProjection extends SubQueryProjection<any, any> | void
>(
    ...args: [
        ...models: TModels,
        fn: (
            q: MutableSubQuery,
            ...tables: {
                [K in keyof TModels]: EntityTable<TModels[K]>
            } extends infer T ? T extends any[] ? T : never : never
        ) => TProjection
    ]
): TProjection extends SubQueryProjection<infer T, infer Kind>
    ? Kind extends "EXPRESSION"
        ? AtomExpressionSubQuery<T>
        : AtomTupleSubQuery<T>
    : TProjection extends void
        ? AtomExpressionSubQuery<Expression<number>>
    : never {
    return getQueryFactory().createAtomSubQuery(...args);
}

export function all<TExpression extends ExpressionLike>(
    subQuery: ExpressionSubQuery<TExpression>
): TExpression {
    supressUnused(subQuery);
    throw new Error();
}

export function any<TExpression extends ExpressionLike>(
    subQuery: ExpressionSubQuery<TExpression>
): TExpression {
    supressUnused(subQuery);
    throw new Error();
}

export function exists(
    subQuery: SubQueryLike
): Predicate {
    supressUnused(subQuery);
    throw new Error();
}

export function notExists(
    subQuery: SubQueryLike
): Predicate {
    supressUnused(subQuery);
    throw new Error();
}
        
export interface MutableSubQuery {

    __type(): { mutableSubQuery: true };
    
    where(
        ...predicates: ReadonlyArray<Predicate | null | undefined>
    ): this;

    orderBy(
        ...orders: ReadonlyArray<ExpressionLike | ExpressionOrder>
    ): this;

    groupBy(
        ...expressions: ReadonlyArray<ExpressionLike>
    ): this;

    having(
        ...predicates: ReadonlyArray<Predicate | null | undefined>
    ): this;

    select<
        const TExpressions extends SubQuerySelectArrArgs,
    >(
        ...expressions: TExpressions
    ): SubQueryProjection<TExpressions, "TUPLE">;

    select<TExpression extends ExpressionLike>(
        expression: TExpression
    ): SubQueryProjection<TExpression, "EXPRESSION">;
}

export type SubQueryLike = {

    __type(): { subQueryLike: true; }
}

export type ExpressionSubQuery<T> = {

    __type(): { 
        subQueryLike: true;
        expressionSubQuery: T | true; 
    };

    asValue(): T;
} & T;

export type AtomExpressionSubQuery<T> = ExpressionSubQuery<T> & {

    distinct(): AtomExpressionSubQuery<T>;
    limit(limit: number): AtomExpressionSubQuery<T>;
    offset(offset: number): AtomExpressionSubQuery<T>;
};

export type TupleSubQuery<TProjection> = {

    __type(): { 
        subQueryLike: true;
        tupleSubQuery: TProjection | true; 
    };
}

export type AtomTupleSubQuery<TProjection> = TupleSubQuery<TProjection> & {

    distinct(): AtomTupleSubQuery<TProjection>;
    limit(limit: number): AtomTupleSubQuery<TProjection>;
    offset(offset: number): AtomTupleSubQuery<TProjection>;
};

export type SubQueryProjection<T, TKind = "EXPRSSION" | "TUPLE"> = {

    __type(): { subQueryProjection: [T, TKind] | true; }
};

export type SubQuerySelectArrArgs = AtLeastTwo<ExpressionLike>;
