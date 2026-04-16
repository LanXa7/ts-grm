import { AnyModel } from "@/schema/model";
import { Expression, ExpressionLike, Predicate } from "./expression";
import { AtLeastOne, AtLeastTwo, ExpressionOrder } from "./utils";
import { getQueryFactory } from "@/impl/ast/query_factory";
import { ExistsPred, subQueryExpr } from "@/impl/ast/sub_query_expr";
import { BaseModel } from "./base_query";
import { AnyAssociationModel } from "./association";
import { Table } from ".";

export function subQuery<
    const TModels extends AtLeastOne<AnyModel | BaseModel<any> | AnyAssociationModel>,
    TProjection extends SubQueryProjection<any, any> | void
>(
    ...args: [
        ...models: TModels,
        fn: (
            q: MutableSubQuery,
            ...tables: {
                [K in keyof TModels]: Table<TModels[K], true>
            } extends infer T ? T extends readonly any[] ? T : never : never
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
    return subQueryExpr("ALL", subQuery as any) as any;
}

export function any<TExpression extends ExpressionLike>(
    subQuery: ExpressionSubQuery<TExpression>
): TExpression {
    return subQueryExpr("ANY", subQuery as any) as any;
}

export function exists(
    subQuery: SubQueryLike
): Predicate {
    return new ExistsPred(subQuery as any, false) as Predicate;
}

export function notExists(
    subQuery: SubQueryLike
): Predicate {
    return new ExistsPred(subQuery as any, true) as Predicate;
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

export type ExpressionSubQuery<TExpression> = {

    __type(): { 
        subQueryLike: true;
        expressionSubQuery: TExpression | true; 
    };

    asValue(): TExpression;
} & TExpression;

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

export type SubQueryProjection<T, TKind = "EXPRESSION" | "TUPLE"> = {

    __type(): { subQueryProjection: [T, TKind] | true; }
};

export type SubQuerySelectArrArgs = AtLeastTwo<ExpressionLike>;
