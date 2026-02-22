import { RootQuery, RootQueryProjection } from "./root_query";
import { ExpressionSubQuery, TupleSubQuery } from "./sub_query";
import { BaseQuery } from "./base-query";
import { AtLeastOne } from "./utils";
import { getQueryFactory } from "@/impl/ast/query_factory";
import { StateError } from "@/error/common";

export function unionAll<
    TProjection extends RootQueryProjection<any>
>(
    ...queries: AtLeastOne<RootQuery<TProjection>>
): RootQuery<TProjection>;

export function unionAll<TProjection>(
    ...queries: AtLeastOne<ExpressionSubQuery<TProjection>>
): ExpressionSubQuery<TProjection>;

export function unionAll<TProjection>(
    ...queries: AtLeastOne<TupleSubQuery<TProjection>>
): TupleSubQuery<TProjection>;

export function unionAll<TProjection>(
    ...queries: AtLeastOne<BaseQuery<TProjection>>
): BaseQuery<TProjection>;

export function unionAll(
    ...queries: any[]
): any {
    const query = queries[0];
    if (queries.length === 1) {
        return query;
    }
    const type = query.__type();
    const queryFactory = getQueryFactory();
    if (type.rootQuery) {
        return queryFactory.createMergedRootQuery("UNION_ALL", queries);
    }
    if (type.expressionSubQuery) {
        return queryFactory.createMergedExpressionSubQuery("UNION_ALL", queries);
    }
    if (type.tupleSubQuery) {
        return queryFactory.createMergedTupleSubQuery("UNION_ALL", queries);
    }
    if (type.baseQuery) {
        return queryFactory.createMergedBaseQuery("UNION_ALL", queries);
    }
    throw new StateError("Illegal arguments");
}

export function union<
    TProjection extends RootQueryProjection<any>
>(
    ...queries: AtLeastOne<RootQuery<TProjection>>
): RootQuery<TProjection>;

export function union<TProjection>(
    ...queries: AtLeastOne<ExpressionSubQuery<TProjection>>
): ExpressionSubQuery<TProjection>;

export function union<TProjection>(
    ...queries: AtLeastOne<TupleSubQuery<TProjection>>
): TupleSubQuery<TProjection>;

export function union<TProjection>(
    ...queries: AtLeastOne<BaseQuery<TProjection>>
): BaseQuery<TProjection>;

export function union(
    ...queries: any[]
): any {
    const query = queries[0];
    if (queries.length === 1) {
        return query;
    }
    const type = query.__type();
    const queryFactory = getQueryFactory();
    if (type.rootQuery) {
        return queryFactory.createMergedRootQuery("UNION", queries);
    }
    if (type.expressionSubQuery) {
        return queryFactory.createMergedExpressionSubQuery("UNION", queries);
    }
    if (type.tupleSubQuery) {
        return queryFactory.createMergedTupleSubQuery("UNION", queries);
    }
    if (type.baseQuery) {
        return queryFactory.createMergedBaseQuery("UNION", queries);
    }
    throw new StateError("Illegal arguments");
}

export function minus<
    TProjection extends RootQueryProjection<any>
>(
    ...queries: AtLeastOne<RootQuery<TProjection>>
): RootQuery<TProjection>;

export function minus<TProjection>(
    ...queries: AtLeastOne<ExpressionSubQuery<TProjection>>
): ExpressionSubQuery<TProjection>;

export function minus<TProjection>(
    ...queries: AtLeastOne<TupleSubQuery<TProjection>>
): TupleSubQuery<TProjection>;

export function minus<TProjection>(
    ...queries: AtLeastOne<BaseQuery<TProjection>>
): BaseQuery<TProjection>;

export function minus(
    ...queries: any[]
): any {
    const query = queries[0];
    if (queries.length === 1) {
        return query;
    }
    const type = query.__type();
    const queryFactory = getQueryFactory();
    if (type.rootQuery) {
        return queryFactory.createMergedRootQuery("MINUS", queries);
    }
    if (type.expressionSubQuery) {
        return queryFactory.createMergedExpressionSubQuery("MINUS", queries);
    }
    if (type.tupleSubQuery) {
        return queryFactory.createMergedTupleSubQuery("MINUS", queries);
    }
    if (type.baseQuery) {
        return queryFactory.createMergedBaseQuery("MINUS", queries);
    }
    throw new StateError("Illegal arguments");
}

export function intersect<
    TProjection extends RootQueryProjection<any>
>(
    ...queries: AtLeastOne<RootQuery<TProjection>>
): RootQuery<TProjection>;

export function intersect<TProjection>(
    ...queries: AtLeastOne<ExpressionSubQuery<TProjection>>
): ExpressionSubQuery<TProjection>;

export function intersect<TProjection>(
    ...queries: AtLeastOne<TupleSubQuery<TProjection>>
): TupleSubQuery<TProjection>;

export function intersect<TProjection>(
    ...queries: AtLeastOne<BaseQuery<TProjection>>
): BaseQuery<TProjection>;

export function intersect(
    ...queries: any[]
): any {
    const query = queries[0];
    if (queries.length === 1) {
        return query;
    }
    const type = query.__type();
    const queryFactory = getQueryFactory();
    if (type.rootQuery) {
        return queryFactory.createMergedRootQuery("INTERSECT", queries);
    }
    if (type.expressionSubQuery) {
        return queryFactory.createMergedExpressionSubQuery("INTERSECT", queries);
    }
    if (type.tupleSubQuery) {
        return queryFactory.createMergedTupleSubQuery("INTERSECT", queries);
    }
    if (type.baseQuery) {
        return queryFactory.createMergedBaseQuery("INTERSECT", queries);
    }
    throw new StateError("Illegal arguments");
}
