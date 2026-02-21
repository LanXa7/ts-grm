import { StateError } from "@/error/common";
import { makeErr } from "../util";
import { AtLeastOne, BaseModel, BaseQuery, BaseQueryProjection, Expression, ExpressionSubQuery, MutableBaseQuery, MutableSubQuery, Table, TupleSubQuery } from "@/dsl";
import { AnyModel } from "@/schema/model";
import { SubQueryProjection } from "@/dsl/sub_query";

export interface QueryFactory {

    createSubQuery<
        const TModels extends AtLeastOne<AnyModel | BaseModel<any>>,
        TProjection extends SubQueryProjection<any, any> | void
    >(
        ...args: [
            ...models: TModels,
            fn: (
                q: MutableSubQuery,
                ...tables: {
                    [K in keyof TModels]: Table<TModels[K]>
                } extends infer T ? T extends any[] ? T : never : never
            ) => TProjection
        ]
    ): TProjection extends SubQueryProjection<infer T, infer Kind>
        ? Kind extends "EXPRESSION"
            ? ExpressionSubQuery<T>
            : TupleSubQuery<T>
        : TProjection extends void
            ? ExpressionSubQuery<Expression<number>>
        : never;
        
    createBaseQuery<
        const TModels extends AtLeastOne<AnyModel | BaseModel<any>>,
        TProjection extends BaseQueryProjection<any>
    >(
        ...args: [
            ...models: TModels,
            fn: (
                q: MutableBaseQuery,
                ...tables: {
                    [K in keyof TModels]: Table<TModels[K]>
                } extends infer T ? T extends any[] ? T : never : never
            ) => TProjection
        ]
    ): BaseQuery<TProjection>;
}

let queryFactory: QueryFactory | undefined = undefined;

export function getQueryFactory() {
    return queryFactory ?? makeErr(`No query factory, please add the dependency "tsgrm-query"`);
}

export function setQueryFactory(qf: QueryFactory) {
    if (queryFactory != null && queryFactory !== qf) {
        throw new StateError(`The query factory cannot be set twice`);
    }
    queryFactory = qf;
}